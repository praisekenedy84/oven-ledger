<?php

namespace App\Services;

use App\Models\BranchFinishedGoodsStock;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class FinishedGoodsInventory
{
    public const LOW_STOCK_THRESHOLD = 8;

    /**
     * @return array<int, float>
     */
    public function quantitiesOnHand(?int $branchId): array
    {
        if (! $branchId) {
            return [];
        }

        return BranchFinishedGoodsStock::query()
            ->where('branch_id', $branchId)
            ->selectRaw('product_id, COALESCE(SUM(quantity_on_hand), 0) as quantity_on_hand')
            ->groupBy('product_id')
            ->pluck('quantity_on_hand', 'product_id')
            ->map(fn ($quantity) => (float) $quantity)
            ->all();
    }

    public function quantityOnHand(int $branchId, int $productId): float
    {
        return (float) BranchFinishedGoodsStock::query()
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->sum('quantity_on_hand');
    }

    public function deductForOrder(Order $order): void
    {
        $order = Order::query()
            ->with('items')
            ->lockForUpdate()
            ->findOrFail($order->id);

        if ($order->isVoided() || $order->stock_deducted || $order->status !== 'completed') {
            return;
        }

        $requested = $this->requestedQuantities($order->items);
        $this->take($order->branch_id, $requested);

        $order->forceFill(['stock_deducted' => true])->save();
    }

    /**
     * @param  array<int, float>  $requestedByProduct
     */
    public function assertAvailable(int $branchId, array $requestedByProduct): void
    {
        $errors = [];

        foreach ($requestedByProduct as $productId => $requested) {
            $available = $this->quantityOnHand($branchId, (int) $productId);

            try {
                $this->assertQuantityAvailable((int) $productId, $requested, $available);
            } catch (ValidationException $exception) {
                $errors[] = $exception->errors()['items'][0] ?? $exception->getMessage();
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'items' => implode(' ', $errors),
            ]);
        }
    }

    /**
     * @param  iterable<int, object{product_id?: mixed, quantity?: mixed}>  $items
     * @return array<int, float>
     */
    public function requestedQuantities(iterable $items): array
    {
        $requested = [];

        foreach ($items as $item) {
            $productId = (int) (is_array($item) ? $item['product_id'] : $item->product_id);
            $quantity = (float) (is_array($item) ? $item['quantity'] : $item->quantity);
            $requested[$productId] = ($requested[$productId] ?? 0) + $quantity;
        }

        return $requested;
    }

    /**
     * @param  array<int, float>  $requestedByProduct
     */
    protected function take(int $branchId, array $requestedByProduct): void
    {
        foreach ($requestedByProduct as $productId => $remaining) {
            $rows = BranchFinishedGoodsStock::query()
                ->where('branch_id', $branchId)
                ->where('product_id', $productId)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $available = (float) $rows->sum(fn (BranchFinishedGoodsStock $row) => max(0, (float) $row->quantity_on_hand));
            $this->assertQuantityAvailable((int) $productId, $remaining, $available);

            foreach ($rows as $row) {
                if ($remaining <= 0.0005) {
                    break;
                }

                $onHand = (float) $row->quantity_on_hand;

                if ($onHand <= 0) {
                    continue;
                }

                $take = min($onHand, $remaining);
                $row->decrement('quantity_on_hand', $take);
                $remaining -= $take;
            }
        }
    }

    protected function assertQuantityAvailable(int $productId, float $requested, float $available): void
    {
        $name = $this->productName($productId);

        if ($available <= 0.0005) {
            throw ValidationException::withMessages([
                'items' => $name.' is out of stock.',
            ]);
        }

        if ($requested - $available > 0.0005) {
            throw ValidationException::withMessages([
                'items' => $name.': only '.$this->formatQuantity($available).' left on the shelf.',
            ]);
        }
    }

    protected function productName(int $productId): string
    {
        return Product::query()->where('id', $productId)->value('name') ?? 'This product';
    }

    protected function formatQuantity(float $quantity): string
    {
        $formatted = rtrim(rtrim(number_format($quantity, 3, '.', ''), '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }
}
