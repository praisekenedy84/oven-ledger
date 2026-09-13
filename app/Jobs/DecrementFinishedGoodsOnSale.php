<?php

namespace App\Jobs;

use App\Models\BranchFinishedGoodsStock;
use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class DecrementFinishedGoodsOnSale implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $orderId,
    ) {}

    public function handle(): void
    {
        DB::transaction(function () {
            $order = Order::query()
                ->with('items')
                ->lockForUpdate()
                ->findOrFail($this->orderId);

            foreach ($order->items as $item) {
                $stock = BranchFinishedGoodsStock::query()
                    ->where('branch_id', $order->branch_id)
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($stock) {
                    $stock->decrement('quantity_on_hand', (float) $item->quantity);
                }
            }
        });
    }
}
