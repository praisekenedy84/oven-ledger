<?php

namespace App\Http\Controllers;

use App\Models\BranchFinishedGoodsStock;
use App\Models\BranchRawMaterialStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionBatch;
use App\Services\CurrentBranch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
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
            ->with('rawMaterial:id,name,unit_of_measure,reorder_threshold')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get()
            ->filter(function (BranchRawMaterialStock $row) {
                $threshold = $row->rawMaterial?->reorder_threshold;
                if ($threshold === null) {
                    return (float) $row->quantity_on_hand <= 0;
                }

                return (float) $row->quantity_on_hand <= (float) $threshold;
            })
            ->map(fn (BranchRawMaterialStock $row) => [
                'id' => 'raw-'.$row->id,
                'kind' => 'raw',
                'name' => $row->rawMaterial?->name,
                'quantity' => $row->quantity_on_hand,
                'unit' => $row->rawMaterial?->unit_of_measure,
                'threshold' => $row->rawMaterial?->reorder_threshold,
            ])
            ->values();

        $finishedAlerts = BranchFinishedGoodsStock::query()
            ->with('product:id,name,type,unit_of_measure')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('quantity_on_hand', '<=', 8)
            ->get()
            ->map(fn (BranchFinishedGoodsStock $row) => [
                'id' => 'fg-'.$row->id,
                'kind' => 'finished',
                'name' => $row->product?->name,
                'quantity' => $row->quantity_on_hand,
                'unit' => $row->product?->unit_of_measure,
                'threshold' => 8,
            ]);

        $wholesaleDue = Order::query()
            ->with(['customer:id,name,type'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereIn('channel', ['wholesale', 'restaurant'])
            ->where('status', '!=', 'completed')
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

        $dailyRows = Order::query()
            ->select(DB::raw('DATE(created_at) as day'), 'channel', DB::raw('SUM(total_amount) as total'))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'completed')
            ->where('created_at', '>=', $weekStart)
            ->groupBy('day', 'channel')
            ->get();

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
            'series' => collect($seriesKeys)->map(function (string $label, string $key) use ($days, $dailyRows, $dailyTools) {
                return [
                    'key' => $key,
                    'label' => $label,
                    'values' => $days->map(function (string $day) use ($key, $dailyRows, $dailyTools) {
                        if ($key === 'tools') {
                            return (float) ($dailyTools[$day] ?? 0);
                        }

                        return (float) ($dailyRows->firstWhere(
                            fn ($row) => Carbon::parse($row->day)->toDateString() === $day && $row->channel === $key,
                        )?->total ?? 0);
                    })->all(),
                ];
            })->values()->all(),
        ];

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
        ]);
    }
}
