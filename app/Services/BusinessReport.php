<?php

namespace App\Services;

use App\Models\LiabilityPayment;
use App\Models\OperatingExpense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OwnerTransaction;
use App\Models\Payment;
use App\Models\WasteLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BusinessReport
{
    public function __construct(
        protected CatalogEconomics $economics,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function statement(Carbon $from, Carbon $to, ?int $branchId = null): array
    {
        $unitCosts = $this->economics->unitCostMap();
        $items = $this->soldItemsByProduct($from, $to, $branchId);

        $revenue = 0.0;
        $cogs = 0.0;

        foreach ($items as $item) {
            $revenue += (float) $item->line_total;
            $cogs += ($unitCosts[$item->product_id] ?? 0) * (float) $item->quantity;
        }

        $wasteCost = $this->wasteCost($from, $to, $branchId, $unitCosts);
        $operatingExpenses = $this->operatingExpenseTotal($from, $to, $branchId);
        $cashCollected = $this->collectedByMethod($from, $to, $branchId, credit: false);
        $creditSales = $this->collectedByMethod($from, $to, $branchId, credit: true);
        $debtPayments = $this->debtPayments($from, $to);
        $periodOwner = $this->ownerTotals($from, $to);
        $lifetimeOwner = $this->ownerTotals();

        $cogs = round($cogs, 2);
        $revenue = round($revenue, 2);
        $grossProfit = round($revenue - $cogs, 2);
        $operatingProfit = round($revenue - $cogs - $wasteCost - $operatingExpenses, 2);

        return [
            'revenue' => $revenue,
            'ingredient_cost' => $cogs,
            'waste_cost' => $wasteCost,
            'operating_expenses' => $operatingExpenses,
            'gross_profit' => $grossProfit,
            'profit' => $operatingProfit,
            'is_profit' => $operatingProfit > 0.009,
            'is_loss' => $operatingProfit < -0.009,
            'cash_collected' => $cashCollected,
            'credit_sales' => $creditSales,
            'debt_payments' => $debtPayments,
            'capital_in_period' => $periodOwner['capital_in'],
            'drawings_period' => $periodOwner['drawings'],
            'capital_in' => $lifetimeOwner['capital_in'],
            'drawings' => $lifetimeOwner['drawings'],
            'capital_remaining' => round($lifetimeOwner['capital_in'] - $lifetimeOwner['drawings'], 2),
            'money_used' => round($cogs + $wasteCost + $operatingExpenses + $debtPayments + $periodOwner['drawings'], 2),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function dailySales(Carbon $from, Carbon $to, ?int $branchId = null): array
    {
        $unitCosts = $this->economics->unitCostMap();
        $days = $this->eachDay($from, $to);

        $sales = Order::query()
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as revenue")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tickets")
            ->selectRaw("SUM(CASE WHEN status = 'voided' THEN total_amount ELSE 0 END) as voided_total")
            ->selectRaw("SUM(CASE WHEN status = 'voided' THEN 1 ELSE 0 END) as voided_tickets")
            ->selectRaw("SUM(CASE WHEN status = 'completed' AND channel = 'retail' THEN total_amount ELSE 0 END) as retail")
            ->selectRaw("SUM(CASE WHEN status = 'completed' AND channel = 'wholesale' THEN total_amount ELSE 0 END) as wholesale")
            ->selectRaw("SUM(CASE WHEN status = 'completed' AND channel = 'restaurant' THEN total_amount ELSE 0 END) as restaurant")
            ->selectRaw("SUM(CASE WHEN status = 'completed' AND channel = 'custom' THEN total_amount ELSE 0 END) as custom")
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereIn('status', ['completed', 'voided'])
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => Carbon::parse($row->day)->toDateString());

        $cogsByDay = [];
        foreach ($this->soldItemsByDay($from, $to, $branchId) as $item) {
            $day = Carbon::parse($item->sold_on)->toDateString();
            $cogsByDay[$day] = ($cogsByDay[$day] ?? 0) + ($unitCosts[$item->product_id] ?? 0) * (float) $item->quantity;
        }

        $wasteByDay = [];
        foreach ($this->wasteRows($from, $to, $branchId) as $row) {
            $day = Carbon::parse($row->logged_at)->toDateString();
            $wasteByDay[$day] = ($wasteByDay[$day] ?? 0) + ($unitCosts[$row->product_id] ?? 0) * (float) $row->quantity;
        }

        $tenderByDay = Payment::query()
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->selectRaw('DATE(COALESCE(payments.paid_at, orders.created_at)) as day')
            ->selectRaw("SUM(CASE WHEN payments.method = 'credit_account' THEN payments.amount ELSE 0 END) as credit")
            ->selectRaw("SUM(CASE WHEN payments.method <> 'credit_account' THEN payments.amount ELSE 0 END) as cash")
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => Carbon::parse($row->day)->toDateString());

        $debtsByDay = $this->sumByDay(
            LiabilityPayment::query()
                ->selectRaw('DATE(paid_at) as day')
                ->selectRaw('SUM(amount) as total')
                ->whereBetween('paid_at', [$from, $to])
                ->groupBy('day')
                ->get()
        );

        $drawingsByDay = $this->sumByDay(
            OwnerTransaction::query()
                ->selectRaw('DATE(transacted_at) as day')
                ->selectRaw('SUM(amount) as total')
                ->where('type', 'drawing')
                ->whereBetween('transacted_at', [$from, $to])
                ->groupBy('day')
                ->get()
        );

        $shopCostsByDay = $this->sumByDay(
            OperatingExpense::query()
                ->selectRaw('DATE(incurred_at) as day')
                ->selectRaw('SUM(amount) as total')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->whereBetween('incurred_at', [$from, $to])
                ->groupBy('day')
                ->get()
        );

        return $days->map(function (string $day) use ($sales, $cogsByDay, $wasteByDay, $tenderByDay, $debtsByDay, $drawingsByDay, $shopCostsByDay) {
            $row = $sales->get($day);
            $tender = $tenderByDay->get($day);
            $revenue = round((float) ($row?->revenue ?? 0), 2);
            $cogs = round((float) ($cogsByDay[$day] ?? 0), 2);
            $waste = round((float) ($wasteByDay[$day] ?? 0), 2);
            $debts = round((float) ($debtsByDay[$day] ?? 0), 2);
            $drawings = round((float) ($drawingsByDay[$day] ?? 0), 2);
            $shopCosts = round((float) ($shopCostsByDay[$day] ?? 0), 2);
            $profit = round($revenue - $cogs - $waste - $shopCosts, 2);
            $outflow = round($cogs + $waste + $debts + $drawings + $shopCosts, 2);

            return [
                'date' => $day,
                'tickets' => (int) ($row?->tickets ?? 0),
                'revenue' => $revenue,
                'voided_tickets' => (int) ($row?->voided_tickets ?? 0),
                'voided_total' => round((float) ($row?->voided_total ?? 0), 2),
                'retail' => round((float) ($row?->retail ?? 0), 2),
                'wholesale' => round((float) ($row?->wholesale ?? 0), 2),
                'restaurant' => round((float) ($row?->restaurant ?? 0), 2),
                'custom' => round((float) ($row?->custom ?? 0), 2),
                'cash' => round((float) ($tender?->cash ?? 0), 2),
                'credit' => round((float) ($tender?->credit ?? 0), 2),
                'ingredient_cost' => $cogs,
                'waste_cost' => $waste,
                'operating_expenses' => $shopCosts,
                'debt_payments' => $debts,
                'drawings' => $drawings,
                'outflow' => $outflow,
                'profit' => $profit,
                'is_loss' => $profit < -0.009,
            ];
        })->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function productSales(Carbon $from, Carbon $to, ?int $branchId = null, ?string $search = null, ?int $productId = null): array
    {
        $unitCosts = $this->economics->unitCostMap();

        return $this->productSalesQuery($from, $to, $branchId, $search, $productId)
            ->select(
                'products.id',
                'products.name',
                'products.type',
                'products.unit_of_measure',
                DB::raw('SUM(order_items.quantity) as quantity'),
                DB::raw('SUM(order_items.line_total) as revenue'),
            )
            ->groupBy('products.id', 'products.name', 'products.type', 'products.unit_of_measure')
            ->orderByDesc('revenue')
            ->limit(80)
            ->get()
            ->map(function ($row) use ($unitCosts) {
                $quantity = (float) $row->quantity;
                $revenue = round((float) $row->revenue, 2);
                $cost = round(($unitCosts[$row->id] ?? 0) * $quantity, 2);

                return [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'type' => $row->type,
                    'unit' => $row->unit_of_measure,
                    'quantity' => $quantity,
                    'revenue' => $revenue,
                    'cost' => $cost,
                    'profit' => round($revenue - $cost, 2),
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function productDailyTrend(Carbon $from, Carbon $to, ?int $branchId = null, ?string $search = null, ?int $productId = null): array
    {
        $byDay = $this->productSalesQuery($from, $to, $branchId, $search, $productId)
            ->selectRaw('DATE(orders.created_at) as day')
            ->selectRaw('SUM(order_items.line_total) as revenue')
            ->selectRaw('SUM(order_items.quantity) as quantity')
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($row) => Carbon::parse($row->day)->toDateString());

        return $this->eachDay($from, $to)->map(function (string $day) use ($byDay) {
            $row = $byDay->get($day);

            return [
                'date' => $day,
                'revenue' => round((float) ($row?->revenue ?? 0), 2),
                'quantity' => (float) ($row?->quantity ?? 0),
            ];
        })->all();
    }

    /**
     * @param  array<string, mixed>  $statement
     * @param  list<array<string, mixed>>  $daily
     * @return array<string, mixed>
     */
    public function expenseBreakdown(array $statement, array $daily): array
    {
        $lines = [
            [
                'key' => 'ingredient_cost',
                'label' => 'Ingredient and stock cost',
                'amount' => $statement['ingredient_cost'],
            ],
            [
                'key' => 'waste_cost',
                'label' => 'Waste write-off',
                'amount' => $statement['waste_cost'],
            ],
            [
                'key' => 'operating_expenses',
                'label' => 'Rent, fees, and other shop costs',
                'amount' => $statement['operating_expenses'] ?? 0,
            ],
            [
                'key' => 'debt_payments',
                'label' => 'Paid to creditors',
                'amount' => $statement['debt_payments'],
            ],
            [
                'key' => 'drawings',
                'label' => 'Owner drawings',
                'amount' => $statement['drawings_period'],
            ],
        ];

        return [
            'lines' => $lines,
            'total' => $statement['money_used'],
            'daily' => collect($daily)->map(fn (array $day) => [
                'date' => $day['date'],
                'ingredient_cost' => $day['ingredient_cost'],
                'waste_cost' => $day['waste_cost'],
                'operating_expenses' => $day['operating_expenses'] ?? 0,
                'debt_payments' => $day['debt_payments'],
                'drawings' => $day['drawings'],
                'total' => $day['outflow'],
            ])->all(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function operatingExpenseEntries(Carbon $from, Carbon $to, ?int $branchId = null): array
    {
        return OperatingExpense::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('incurred_at', [$from, $to])
            ->orderByDesc('incurred_at')
            ->get()
            ->map(fn (OperatingExpense $row) => [
                'date' => $row->incurred_at?->toDateString(),
                'category' => $row->category,
                'label' => OperatingExpense::categoryLabel($row->category),
                'payee' => $row->payee,
                'amount' => round((float) $row->amount, 2),
                'notes' => $row->notes,
            ])
            ->all();
    }

    protected function productSalesQuery(
        Carbon $from,
        Carbon $to,
        ?int $branchId,
        ?string $search,
        ?int $productId,
    ) {
        $needle = trim((string) $search);

        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$from, $to])
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->when($productId, fn ($query) => $query->where('products.id', $productId))
            ->when($needle !== '', function ($query) use ($needle) {
                $query->whereRaw('LOWER(products.name) LIKE ?', ['%'.mb_strtolower($needle).'%']);
            });
    }

    /**
     * @param  Collection<int, object>  $rows
     * @return array<string, float>
     */
    protected function sumByDay(Collection $rows): array
    {
        $totals = [];

        foreach ($rows as $row) {
            $day = Carbon::parse($row->day)->toDateString();
            $totals[$day] = (float) $row->total;
        }

        return $totals;
    }

    /**
     * Aggregated sold lines by product (smaller than raw line items).
     *
     * @return Collection<int, object>
     */
    protected function soldItemsByProduct(Carbon $from, Carbon $to, ?int $branchId): Collection
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$from, $to])
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->groupBy('order_items.product_id')
            ->get([
                'order_items.product_id',
                DB::raw('SUM(order_items.quantity) as quantity'),
                DB::raw('SUM(order_items.line_total) as line_total'),
            ]);
    }

    /**
     * Aggregated sold lines by product and day.
     *
     * @return Collection<int, object>
     */
    protected function soldItemsByDay(Carbon $from, Carbon $to, ?int $branchId): Collection
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$from, $to])
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->groupByRaw('order_items.product_id, DATE(orders.created_at)')
            ->get([
                'order_items.product_id',
                DB::raw('SUM(order_items.quantity) as quantity'),
                DB::raw('DATE(orders.created_at) as sold_on'),
            ]);
    }

    /**
     * @param  array<int, float>  $unitCosts
     */
    protected function wasteCost(Carbon $from, Carbon $to, ?int $branchId, array $unitCosts): float
    {
        $total = 0.0;

        foreach ($this->wasteRows($from, $to, $branchId) as $row) {
            $total += ($unitCosts[$row->product_id] ?? 0) * (float) $row->quantity;
        }

        return round($total, 2);
    }

    /**
     * @return Collection<int, WasteLog>
     */
    protected function wasteRows(Carbon $from, Carbon $to, ?int $branchId): Collection
    {
        return WasteLog::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('logged_at', [$from, $to])
            ->get(['product_id', 'quantity', 'logged_at']);
    }

    protected function operatingExpenseTotal(Carbon $from, Carbon $to, ?int $branchId): float
    {
        return round((float) OperatingExpense::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('incurred_at', [$from, $to])
            ->sum('amount'), 2);
    }

    protected function collectedByMethod(Carbon $from, Carbon $to, ?int $branchId, bool $credit): float
    {
        $query = Payment::query()
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$from, $to])
            ->when($branchId, fn ($q) => $q->where('orders.branch_id', $branchId));

        $query = $credit
            ? $query->where('payments.method', 'credit_account')
            : $query->where('payments.method', '<>', 'credit_account');

        return round((float) $query->sum('payments.amount'), 2);
    }

    protected function debtPayments(Carbon $from, Carbon $to): float
    {
        return round((float) LiabilityPayment::query()
            ->whereBetween('paid_at', [$from, $to])
            ->sum('amount'), 2);
    }

    /**
     * @return array{capital_in: float, drawings: float}
     */
    protected function ownerTotals(?Carbon $from = null, ?Carbon $to = null): array
    {
        $row = OwnerTransaction::query()
            ->when($from && $to, fn ($query) => $query->whereBetween('transacted_at', [$from, $to]))
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'capital_injection' THEN amount ELSE 0 END), 0) as capital_in,
                COALESCE(SUM(CASE WHEN type = 'drawing' THEN amount ELSE 0 END), 0) as drawings
            ")
            ->first();

        return [
            'capital_in' => (float) ($row?->capital_in ?? 0),
            'drawings' => (float) ($row?->drawings ?? 0),
        ];
    }

    /**
     * @return Collection<int, string>
     */
    protected function eachDay(Carbon $from, Carbon $to): Collection
    {
        $days = collect();
        $cursor = $from->copy()->startOfDay();
        $end = $to->copy()->startOfDay();

        while ($cursor->lte($end)) {
            $days->push($cursor->toDateString());
            $cursor->addDay();
        }

        return $days;
    }
}
