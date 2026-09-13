<?php

namespace App\Services;

use App\Models\BranchFinishedGoodsStock;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleCorrection
{
    public function __construct(
        protected CustomerLedger $ledger,
    ) {}

    public function void(Order $order, User $actor, string $reason): Order
    {
        $reason = trim($reason);

        if ($reason === '') {
            throw ValidationException::withMessages([
                'reason' => 'Add a short reason so the void can be audited.',
            ]);
        }

        return DB::transaction(function () use ($order, $actor, $reason) {
            $order = Order::query()
                ->with(['items', 'customer', 'ledgerEntries'])
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($order->isVoided()) {
                throw ValidationException::withMessages([
                    'order' => 'This sale is already voided.',
                ]);
            }

            if ($order->stock_deducted) {
                $this->restoreStock($order);
                $order->stock_deducted = false;
            }

            $this->reverseAccountCharges($order, $reason);

            $order->fill([
                'status' => 'voided',
                'voided_by' => $actor->id,
                'voided_at' => now(),
                'void_reason' => $reason,
            ])->save();

            return $order->fresh(['soldBy', 'voidedBy', 'customer', 'items.product']);
        });
    }

    protected function restoreStock(Order $order): void
    {
        foreach ($order->items as $item) {
            $quantity = (float) $item->quantity;
            $stock = BranchFinishedGoodsStock::query()
                ->where('branch_id', $order->branch_id)
                ->where('product_id', $item->product_id)
                ->lockForUpdate()
                ->first();

            if ($stock) {
                $stock->increment('quantity_on_hand', $quantity);

                continue;
            }

            BranchFinishedGoodsStock::query()->create([
                'branch_id' => $order->branch_id,
                'product_id' => $item->product_id,
                'quantity_on_hand' => $quantity,
            ]);
        }
    }

    protected function reverseAccountCharges(Order $order, string $reason): void
    {
        if (! $order->customer_id) {
            return;
        }

        $charged = (float) $order->ledgerEntries
            ->where('type', 'charge')
            ->sum('amount');
        $alreadyReversed = (float) $order->ledgerEntries
            ->where('type', 'reversal')
            ->sum('amount');
        $amount = round($charged - $alreadyReversed, 2);

        if ($amount <= 0.009) {
            return;
        }

        $this->ledger->recordReversal(
            $order->customer,
            $amount,
            (int) $order->branch_id,
            $order->id,
            'Void of sale #'.$order->id.': '.$reason,
        );
    }
}
