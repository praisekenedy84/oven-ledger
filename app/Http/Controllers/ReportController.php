<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BusinessLiability;
use App\Models\Customer;
use App\Models\CustomerLedgerEntry;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CurrentBranch;
use Carbon\Carbon;
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
        $dateFrom = $this->parseDate($request->input('date_from'), now()->subDays(6)->toDateString());
        $dateTo = $this->parseDate($request->input('date_to'), now()->toDateString());
        $staffUserId = $request->input('staff_user_id');
        $staffUserId = $staffUserId === '' || $staffUserId === null ? null : (int) $staffUserId;

        $from = Carbon::parse($dateFrom)->startOfDay();
        $to = Carbon::parse($dateTo)->endOfDay();

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

        $salesByStaff = Order::query()
            ->leftJoin('users', 'users.id', '=', 'orders.created_by')
            ->select(
                'orders.created_by as user_id',
                DB::raw("COALESCE(users.name, 'Unassigned') as name"),
                DB::raw("SUM(CASE WHEN orders.status = 'completed' THEN 1 ELSE 0 END) as tickets"),
                DB::raw("SUM(CASE WHEN orders.status = 'completed' THEN orders.total_amount ELSE 0 END) as total"),
                DB::raw("SUM(CASE WHEN orders.status = 'voided' THEN 1 ELSE 0 END) as voided_tickets"),
                DB::raw("SUM(CASE WHEN orders.status = 'voided' THEN orders.total_amount ELSE 0 END) as voided_total"),
            )
            ->when($branchId, fn ($q) => $q->where('orders.branch_id', $branchId))
            ->whereIn('orders.status', ['completed', 'voided'])
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('orders.created_by', 'users.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'user_id' => $row->user_id ? (int) $row->user_id : null,
                'name' => $row->name,
                'tickets' => (int) $row->tickets,
                'total' => round((float) $row->total, 2),
                'voided_tickets' => (int) $row->voided_tickets,
                'voided_total' => round((float) $row->voided_total, 2),
            ]);

        $tickets = Order::query()
            ->with(['soldBy:id,name', 'voidedBy:id,name', 'customer:id,name', 'items.product:id,name'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($staffUserId !== null, function ($q) use ($staffUserId) {
                $staffUserId === 0
                    ? $q->whereNull('created_by')
                    : $q->where('created_by', $staffUserId);
            })
            ->whereIn('status', ['completed', 'voided', 'pending'])
            ->whereBetween('created_at', [$from, $to])
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Order $order) => $order->toTicketArray());

        $receivableRows = CustomerLedgerEntry::query()
            ->select('customer_id')
            ->selectRaw("SUM(CASE WHEN type = 'charge' THEN amount ELSE -amount END) as outstanding")
            ->groupBy('customer_id')
            ->havingRaw("SUM(CASE WHEN type = 'charge' THEN amount ELSE -amount END) > 0.009")
            ->orderByDesc('outstanding')
            ->limit(10)
            ->get();

        $receivableCustomers = Customer::query()
            ->whereIn('id', $receivableRows->pluck('customer_id'))
            ->get(['id', 'name', 'type'])
            ->keyBy('id');

        $receivables = $receivableRows->map(function (CustomerLedgerEntry $row) use ($receivableCustomers) {
            $customer = $receivableCustomers->get($row->customer_id);

            return [
                'id' => $row->customer_id,
                'name' => $customer?->name ?? 'Customer',
                'type' => $customer?->type ?? 'retail',
                'outstanding' => round((float) $row->outstanding, 2),
            ];
        });

        return Inertia::render('Reports/Index', [
            'salesByChannel' => $salesByChannel,
            'salesByProductType' => $salesByProductType,
            'salesByStaff' => $salesByStaff,
            'tickets' => $tickets,
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
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'staff_user_id' => $staffUserId,
            ],
        ]);
    }

    protected function parseDate(mixed $value, string $fallback): string
    {
        if (! is_string($value) || trim($value) === '') {
            return $fallback;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return $fallback;
        }
    }
}
