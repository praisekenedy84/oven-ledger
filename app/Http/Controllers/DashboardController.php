<?php

namespace App\Http\Controllers;

use App\Models\BranchRawMaterialStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionBatch;
use App\Services\BusinessReport;
use App\Services\CurrentBranch;
use App\Services\FinishedGoodsInventory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
        protected BusinessReport $reports,
        protected FinishedGoodsInventory $finishedGoodsInventory,
    ) {}

    public function index(): Response
    {
        $branchId = $this->currentBranch->id();
        $weekStart = now()->subDays(6)->startOfDay();

        $todayBatches = ProductionBatch::query()
            ->with('product:id,name,type')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereIn('status', ['planned', 'baking', 'cooling', 'ready'])
            ->orderByRaw("CASE status WHEN 'baking' THEN 1 WHEN 'cooling' THEN 2 WHEN 'ready' THEN 3 ELSE 4 END")
            ->latest()
            ->limit(8)
            ->get();

        $rawAlerts = BranchRawMaterialStock::query()
            ->select('branch_raw_material_stock.*')
            ->join('raw_materials', 'raw_materials.id', '=', 'branch_raw_material_stock.raw_material_id')
            ->with('rawMaterial:id,name,unit_of_measure,reorder_threshold')
            ->when($branchId, fn ($q) => $q->where('branch_raw_material_stock.branch_id', $branchId))
            ->whereRaw('branch_raw_material_stock.quantity_on_hand <= COALESCE(raw_materials.reorder_threshold, 0)')
            ->orderBy('branch_raw_material_stock.quantity_on_hand')
            ->limit(8)
            ->get()
            ->map(fn (BranchRawMaterialStock $row) => [
                'id' => 'raw-'.$row->id,
                'kind' => 'raw',
                'name' => $row->rawMaterial?->name,
                'quantity' => $row->quantity_on_hand,
                'unit' => $row->rawMaterial?->unit_of_measure,
                'threshold' => $row->rawMaterial?->reorder_threshold,
            ])
            ->values();

        $finishedAlerts = $this->finishedGoodsInventory->lowStockAlerts($branchId);

        $wholesaleDue = Order::query()
            ->with(['customer:id,name,type'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereIn('channel', ['wholesale', 'restaurant'])
            ->whereNotIn('status', ['completed', 'voided'])
            ->where(function ($q) {
                $q->whereDate('requested_fulfillment_at', '<=', now()->addDay())
                    ->orWhereDate('due_date', '<=', now()->addDay())
                    ->orWhere(fn ($inner) => $inner->where('is_pre_order', true)->where('status', 'pending'));
            })
            ->orderByRaw('COALESCE(requested_fulfillment_at, due_date, created_at) asc')
            ->limit(8)
            ->get();

        $channelTotals = Order::query()
            ->select('channel', DB::raw('SUM(total_amount) as total'))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'completed')
            ->where('created_at', '>=', $weekStart)
            ->groupBy('channel')
            ->pluck('total', 'channel');

        $toolsTotal = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->when($branchId, fn ($q) => $q->where('orders.branch_id', $branchId))
            ->where('orders.status', 'completed')
            ->where('orders.created_at', '>=', $weekStart)
            ->where('products.type', 'trading')
            ->sum('order_items.line_total');

        $days = collect(range(0, 6))->map(fn (int $i) => now()->subDays(6 - $i)->toDateString());

        $dailyLookup = [];
        Order::query()
            ->select(DB::raw('DATE(created_at) as day'), 'channel', DB::raw('SUM(total_amount) as total'))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'completed')
            ->where('created_at', '>=', $weekStart)
            ->groupBy('day', 'channel')
            ->get()
            ->each(function ($row) use (&$dailyLookup) {
                $day = Carbon::parse($row->day)->toDateString();
                $dailyLookup[$day][$row->channel] = (float) $row->total;
            });

        $dailyTools = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select(DB::raw('DATE(orders.created_at) as day'), DB::raw('SUM(order_items.line_total) as total'))
            ->when($branchId, fn ($q) => $q->where('orders.branch_id', $branchId))
            ->where('orders.status', 'completed')
            ->where('orders.created_at', '>=', $weekStart)
            ->where('products.type', 'trading')
            ->groupBy('day')
            ->get()
            ->mapWithKeys(fn ($row) => [Carbon::parse($row->day)->toDateString() => (float) $row->total]);

        $seriesKeys = [
            'retail' => 'Retail',
            'wholesale' => 'Wholesale',
            'restaurant' => 'Restaurant',
            'tools' => 'Tools',
        ];

        $salesTrend = [
            'labels' => $days->map(fn (string $day) => Carbon::parse($day)->format('D'))->all(),
            'series' => collect($seriesKeys)->map(function (string $label, string $key) use ($days, $dailyLookup, $dailyTools) {
                return [
                    'key' => $key,
                    'label' => $label,
                    'values' => $days->map(function (string $day) use ($key, $dailyLookup, $dailyTools) {
                        if ($key === 'tools') {
                            return (float) ($dailyTools[$day] ?? 0);
                        }

                        return (float) ($dailyLookup[$day][$key] ?? 0);
                    })->all(),
                ];
            })->values()->all(),
        ];

        $productSales = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select(
                'products.id',
                'products.name',
                'products.type',
                'products.unit_of_measure',
                DB::raw('SUM(order_items.quantity) as quantity'),
                DB::raw('SUM(order_items.line_total) as revenue'),
            )
            ->when($branchId, fn ($q) => $q->where('orders.branch_id', $branchId))
            ->where('orders.status', 'completed')
            ->where('orders.created_at', '>=', $weekStart)
            ->groupBy('products.id', 'products.name', 'products.type', 'products.unit_of_measure')
            ->orderByDesc('quantity')
            ->get();

        $topSellers = $productSales->take(5);
        $otherSellers = $productSales->slice(5);
        $bestSellingProducts = $topSellers
            ->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'type' => $row->type,
                'unit' => $row->unit_of_measure,
                'quantity' => (float) $row->quantity,
                'revenue' => (float) $row->revenue,
                'is_other' => false,
            ])
            ->values();

        if ($otherSellers->isNotEmpty()) {
            $bestSellingProducts->push([
                'id' => 'other',
                'name' => 'Other products',
                'type' => null,
                'unit' => null,
                'quantity' => (float) $otherSellers->sum('quantity'),
                'revenue' => (float) $otherSellers->sum('revenue'),
                'is_other' => true,
            ]);
        }

        return Inertia::render('Dashboard', [
            'currentBranch' => $this->currentBranch->branch(),
            'todayBatches' => $todayBatches,
            'lowStock' => $rawAlerts->concat($finishedAlerts)->take(8)->values(),
            'wholesaleDue' => $wholesaleDue,
            'salesByChannel' => [
                ['channel' => 'retail', 'label' => 'Retail', 'total' => (float) ($channelTotals['retail'] ?? 0)],
                ['channel' => 'wholesale', 'label' => 'Wholesale', 'total' => (float) ($channelTotals['wholesale'] ?? 0)],
                ['channel' => 'restaurant', 'label' => 'Restaurant', 'total' => (float) ($channelTotals['restaurant'] ?? 0)],
                ['channel' => 'tools', 'label' => 'Tools', 'total' => (float) $toolsTotal],
            ],
            'salesTrend' => $salesTrend,
            'bestSellingProducts' => $bestSellingProducts,
            'bestSellingSummary' => [
                'total_quantity' => (float) $productSales->sum('quantity'),
                'total_revenue' => (float) $productSales->sum('revenue'),
                'product_count' => $productSales->count(),
            ],
            'economics' => $this->reports->statement($weekStart, now(), $branchId),
        ]);
    }
}
