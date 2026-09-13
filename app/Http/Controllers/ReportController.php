<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BusinessLiability;
use App\Models\Customer;
use App\Models\CustomerLedgerEntry;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CurrentBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
    ) {}

    public function index(Request $request): Response
    {
        $branchId = $request->input('branch_id', $this->currentBranch->id());

        $salesByChannel = Order::query()
            ->select('channel', DB::raw('SUM(total_amount) as total'))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'completed')
            ->groupBy('channel')
            ->get();

        $salesByProductType = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select('products.type', DB::raw('SUM(order_items.line_total) as total'))
            ->when($branchId, fn ($q) => $q->where('orders.branch_id', $branchId))
            ->where('orders.status', 'completed')
            ->groupBy('products.type')
            ->get();

        $receivables = Customer::query()
            ->withSum(['ledgerEntries as charged' => fn ($q) => $q->where('type', 'charge')], 'amount')
            ->withSum(['ledgerEntries as paid' => fn ($q) => $q->where('type', 'payment')], 'amount')
            ->get()
            ->map(function (Customer $customer) {
                $outstanding = round(((float) $customer->charged) - ((float) $customer->paid), 2);

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'type' => $customer->type,
                    'outstanding' => $outstanding,
                ];
            })
            ->filter(fn (array $row) => $row['outstanding'] > 0.009)
            ->sortByDesc('outstanding')
            ->values()
            ->take(10);

        return Inertia::render('Reports/Index', [
            'salesByChannel' => $salesByChannel,
            'salesByProductType' => $salesByProductType,
            'receivables' => $receivables,
            'payablesOpen' => (float) BusinessLiability::query()->where('status', 'open')->sum('balance_remaining'),
            'receivablesTotal' => (float) CustomerLedgerEntry::query()
                ->selectRaw("COALESCE(SUM(CASE WHEN type = 'charge' THEN amount ELSE -amount END), 0) as total")
                ->value('total'),
            'preOrdersPending' => Order::query()
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->where('is_pre_order', true)
                ->where('status', 'pending')
                ->count(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'branch_id' => $branchId,
            ],
        ]);
    }
}
