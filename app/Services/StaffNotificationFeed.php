<?php

namespace App\Services;

use App\Models\BranchRawMaterialStock;
use App\Models\BusinessLiability;
use App\Models\Customer;
use App\Models\CustomerLedgerEntry;
use App\Models\Order;
use App\Models\ProductionBatch;
use App\Models\StaffNotificationRead;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class StaffNotificationFeed
{
    public function __construct(
        protected CurrentBranch $currentBranch,
        protected FinishedGoodsInventory $finishedGoodsInventory,
    ) {}

    /**
     * @return array{items: list<array<string, mixed>>, unread_count: int}
     */
    public function forCurrentBranch(?int $limit = 40): array
    {
        $branchId = $this->currentBranch->id();
        $user = Auth::user();
        $readKeys = $this->readKeysFor($user);
        $rawItems = $this->cachedFeedItems($branchId, $limit);

        $items = collect($rawItems)
            ->map(function (array $item) use ($readKeys) {
                $item['is_read'] = isset($readKeys[$item['id']]);

                return $item;
            })
            ->all();

        return [
            'items' => $items,
            'unread_count' => collect($items)->where('is_read', false)->count(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function cachedFeedItems(?int $branchId, int $limit): array
    {
        $tenantId = tenant('id');
        $resolver = function () use ($branchId, $limit) {
            return collect()
                ->merge($this->preOrderReminders($branchId))
                ->merge($this->productionAlerts($branchId))
                ->merge($this->stockAlerts($branchId))
                ->merge($this->debtAlerts($branchId))
                ->merge($this->receivableAlerts())
                ->sortByDesc(fn (array $item) => $item['sort_at'])
                ->values()
                ->take($limit)
                ->map(function (array $item) {
                    unset($item['sort_at']);

                    return $item;
                })
                ->all();
        };

        if (! $tenantId) {
            return $resolver();
        }

        return Cache::remember(
            "tenant:{$tenantId}:staff_feed:".($branchId ?? 'all').":{$limit}",
            now()->addSeconds(45),
            $resolver,
        );
    }

    public function forget(?int $branchId = null, ?string $tenantId = null): void
    {
        $tenantId = $tenantId ?? tenant('id');

        if (! $tenantId) {
            return;
        }

        $branchId ??= $this->currentBranch->id();

        foreach ([12, 40, 80] as $limit) {
            Cache::forget("tenant:{$tenantId}:staff_feed:".($branchId ?? 'all').":{$limit}");
            Cache::forget("tenant:{$tenantId}:staff_feed:all:{$limit}");
        }
    }

    public function markAsRead(User $user, string $notificationKey): void
    {
        $key = trim($notificationKey);
        if ($key === '') {
            return;
        }

        StaffNotificationRead::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'notification_key' => $key,
            ],
            [
                'read_at' => now(),
            ],
        );
    }

    /**
     * @param  list<string>  $notificationKeys
     */
    public function markManyAsRead(User $user, array $notificationKeys): int
    {
        $keys = collect($notificationKeys)
            ->map(fn ($key) => trim((string) $key))
            ->filter()
            ->unique()
            ->values();

        if ($keys->isEmpty()) {
            return 0;
        }

        $now = now();
        foreach ($keys as $key) {
            StaffNotificationRead::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'notification_key' => $key,
                ],
                [
                    'read_at' => $now,
                ],
            );
        }

        return $keys->count();
    }

    public function markAllCurrentAsRead(?int $limit = 80): int
    {
        $user = Auth::user();
        if (! $user) {
            return 0;
        }

        $feed = $this->forCurrentBranch($limit);
        $unreadKeys = collect($feed['items'])
            ->where('is_read', false)
            ->pluck('id')
            ->all();

        return $this->markManyAsRead($user, $unreadKeys);
    }

    /**
     * @return array<string, true>
     */
    protected function readKeysFor(?User $user): array
    {
        if (! $user) {
            return [];
        }

        return StaffNotificationRead::query()
            ->where('user_id', $user->id)
            ->pluck('notification_key')
            ->flip()
            ->map(fn () => true)
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function preOrderReminders(?int $branchId): array
    {
        $now = now();

        return Order::query()
            ->with(['customer:id,name', 'items.product:id,name'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'pending')
            ->where(function ($q) {
                $q->where('is_pre_order', true)
                    ->orWhereNotNull('requested_fulfillment_at')
                    ->orWhereNotNull('due_date');
            })
            ->orderByRaw('COALESCE(requested_fulfillment_at, due_date, created_at) asc')
            ->limit(12)
            ->get()
            ->map(function (Order $order) use ($now) {
                $dueAt = $order->requested_fulfillment_at
                    ?? ($order->due_date ? Carbon::parse($order->due_date)->endOfDay() : $order->created_at);
                $overdue = $dueAt && $dueAt->lte($now);
                $customer = $order->customer?->name ?? 'Walk-in';
                $itemNames = $order->items
                    ->take(2)
                    ->map(fn ($item) => $item->product?->name ?? 'Item')
                    ->filter()
                    ->implode(', ');

                return [
                    'id' => 'preorder-'.$order->id,
                    'kind' => $overdue ? 'alert' : 'reminder',
                    'category' => 'pre_order',
                    'title' => $overdue
                        ? "Pre-order #{$order->id} is due"
                        : "Pre-order #{$order->id} waiting",
                    'body' => trim($customer.($itemNames !== '' ? " · {$itemNames}" : '').' — mark sold or void'),
                    'href' => route('tenant.pos.tickets', ['all' => 1], false),
                    'action_label' => 'Open tickets',
                    'sort_at' => ($overdue ? '9' : '7').($dueAt?->timestamp ?? 0),
                    'meta' => [
                        'order_id' => $order->id,
                        'status' => $order->status,
                        'due_at' => $dueAt?->toIso8601String(),
                    ],
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function productionAlerts(?int $branchId): array
    {
        return ProductionBatch::query()
            ->with('product:id,name')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereIn('status', ['cooling', 'ready'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (ProductionBatch $batch) {
                $ready = $batch->status === 'ready';

                return [
                    'id' => 'batch-'.$batch->id,
                    'kind' => $ready ? 'update' : 'reminder',
                    'category' => 'production',
                    'title' => $ready
                        ? ($batch->product?->name ?? 'Batch').' is ready'
                        : ($batch->product?->name ?? 'Batch').' is cooling',
                    'body' => $ready
                        ? 'Update the batch status or move it to shelf stock.'
                        : 'Keep an eye on cooling — mark ready when it is done.',
                    'href' => route('tenant.production-batches.index', [], false),
                    'action_label' => 'Open production',
                    'sort_at' => ($ready ? '8' : '6').$batch->updated_at?->timestamp,
                    'meta' => [
                        'batch_id' => $batch->id,
                        'status' => $batch->status,
                    ],
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function stockAlerts(?int $branchId): array
    {
        $raw = BranchRawMaterialStock::query()
            ->select('branch_raw_material_stock.*')
            ->join('raw_materials', 'raw_materials.id', '=', 'branch_raw_material_stock.raw_material_id')
            ->with('rawMaterial:id,name,unit_of_measure,reorder_threshold')
            ->when($branchId, fn ($q) => $q->where('branch_raw_material_stock.branch_id', $branchId))
            ->whereRaw('branch_raw_material_stock.quantity_on_hand <= COALESCE(raw_materials.reorder_threshold, 0)')
            ->orderBy('branch_raw_material_stock.quantity_on_hand')
            ->limit(8)
            ->get()
            ->map(function (BranchRawMaterialStock $row) {
                $name = $row->rawMaterial?->name ?? 'Raw material';
                $qty = (float) $row->quantity_on_hand;
                $unit = $row->rawMaterial?->unit_of_measure ?? '';

                return [
                    'id' => 'raw-stock-'.$row->id,
                    'kind' => 'alert',
                    'category' => 'inventory',
                    'title' => "{$name} is low",
                    'body' => trim("{$qty} {$unit} left — restock before the next bake"),
                    'href' => route('tenant.inventory.index', [], false),
                    'action_label' => 'Open inventory',
                    'sort_at' => '8'.(int) max(0, 100000 - ($qty * 1000)),
                    'meta' => [
                        'raw_material_id' => $row->raw_material_id,
                        'quantity' => $qty,
                    ],
                ];
            })
            ->values();

        $finished = $this->finishedGoodsInventory
            ->lowStockAlerts($branchId)
            ->map(function (array $row) {
                $name = $row['name'] ?? 'Finished good';
                $qty = (float) ($row['quantity'] ?? 0);
                $unit = $row['unit'] ?? '';
                $threshold = $row['threshold'];
                $why = $threshold === null
                    ? 'out of stock'
                    : "at or below your reorder line of {$threshold}";

                return [
                    'id' => 'fg-stock-'.str_replace('fg-', '', (string) ($row['id'] ?? $name)),
                    'kind' => 'alert',
                    'category' => 'inventory',
                    'title' => "{$name} shelf is low",
                    'body' => trim("{$qty} {$unit} on hand — {$why}"),
                    'href' => route('tenant.inventory.index', [], false),
                    'action_label' => 'Open inventory',
                    'sort_at' => '8'.(int) max(0, 100000 - ($qty * 1000)),
                    'meta' => [
                        'quantity' => $qty,
                        'threshold' => $threshold,
                    ],
                ];
            })
            ->values();

        return collect($raw)->merge($finished)->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function debtAlerts(?int $branchId): array
    {
        return BusinessLiability::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'open')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', now()->addDays(3))
            ->orderBy('due_date')
            ->limit(8)
            ->get()
            ->map(function (BusinessLiability $liability) {
                $overdue = $liability->due_date && $liability->due_date->lte(now()->startOfDay());

                return [
                    'id' => 'debt-'.$liability->id,
                    'kind' => $overdue ? 'alert' : 'reminder',
                    'category' => 'debts',
                    'title' => $overdue
                        ? "Payable due: {$liability->creditor_name}"
                        : "Payable coming due: {$liability->creditor_name}",
                    'body' => 'Balance '.number_format((float) $liability->balance_remaining, 0).' — review debts',
                    'href' => route('tenant.debts.index', [], false),
                    'action_label' => 'Open debts',
                    'sort_at' => ($overdue ? '8' : '6').($liability->due_date?->timestamp ?? 0),
                    'meta' => [
                        'liability_id' => $liability->id,
                        'due_date' => $liability->due_date?->toDateString(),
                    ],
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function receivableAlerts(): array
    {
        $rows = CustomerLedgerEntry::query()
            ->select('customer_id')
            ->selectRaw("SUM(CASE WHEN type = 'charge' THEN amount ELSE -amount END) as outstanding")
            ->groupBy('customer_id')
            ->havingRaw("SUM(CASE WHEN type = 'charge' THEN amount ELSE -amount END) > 0.009")
            ->orderByDesc('outstanding')
            ->limit(6)
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $customers = Customer::query()
            ->whereIn('id', $rows->pluck('customer_id'))
            ->get(['id', 'name'])
            ->keyBy('id');

        return $rows->map(function (CustomerLedgerEntry $row) use ($customers) {
            $customer = $customers->get($row->customer_id);
            $balance = round((float) $row->outstanding, 2);

            return [
                'id' => 'receivable-'.$row->customer_id,
                'kind' => 'reminder',
                'category' => 'customers',
                'title' => ($customer?->name ?? 'Customer').' still owes',
                'body' => number_format($balance, 0).' outstanding — collect or check the ledger',
                'href' => route('tenant.customers.show', $row->customer_id, false),
                'action_label' => 'Open customer',
                'sort_at' => '5'.(int) ($balance * 100),
                'meta' => [
                    'customer_id' => $row->customer_id,
                    'balance' => $balance,
                ],
            ];
        })->all();
    }
}
