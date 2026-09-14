<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\FinishedGoodsInventory;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DecrementFinishedGoodsOnSale implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $orderId,
    ) {}

    public function handle(FinishedGoodsInventory $inventory): void
    {
        $order = Order::query()->find($this->orderId);

        if (! $order) {
            return;
        }

        $inventory->deductForOrder($order);
    }
}
