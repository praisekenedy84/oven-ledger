<?php

namespace App\Services;

use App\Models\BranchFinishedGoodsStock;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinishedGoodsInventory
{
    public function __construct(
        protected RawMaterialInventory $rawMaterials,
    ) {}

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

    /**
     * Aggregated shelf rows for the inventory screen (one line per product).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function shelfSnapshot(?int $branchId): Collection
    {
        return BranchFinishedGoodsStock::query()
            ->with('product:id,name,type,unit_of_measure,reorder_threshold')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('id')
            ->get()
            ->groupBy('product_id')
            ->map(function (Collection $rows) {
                /** @var BranchFinishedGoodsStock $first */
                $first = $rows->first();
                $quantity = round((float) $rows->sum(fn (BranchFinishedGoodsStock $row) => (float) $row->quantity_on_hand), 3);
                $threshold = $first->product?->reorder_threshold;
                $thresholdValue = $threshold === null ? null : (float) $threshold;

                return [
                    'id' => $first->id,
                    'product_id' => $first->product_id,
                    'quantity_on_hand' => $quantity,
                    'product' => $first->product,
                    'reorder_threshold' => $thresholdValue,
                    'is_low' => $this->isBelowReorder($quantity, $thresholdValue),
                ];
            })
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function lowStockAlerts(?int $branchId, int $limit = 8): Collection
    {
        return $this->shelfSnapshot($branchId)
            ->filter(fn (array $row) => $row['is_low'])
            ->sortBy('quantity_on_hand')
            ->take($limit)
            ->values()
            ->map(fn (array $row) => [
                'id' => 'fg-'.$row['id'],
                'kind' => 'finished',
                'name' => $row['product']?->name,
                'quantity' => $row['quantity_on_hand'],
                'unit' => $row['product']?->unit_of_measure,
                'threshold' => $row['reorder_threshold'],
            ]);
    }

    public function isBelowReorder(float $quantityOnHand, ?float $reorderThreshold): bool
    {
        if ($reorderThreshold === null) {
            return $quantityOnHand <= 0;
        }

        return $quantityOnHand <= $reorderThreshold;
    }

    /**
     * Put finished goods on the shelf without a production batch (small bakeries).
     * Uses the product recipe to deduct raw materials so P&amp;L stays honest.
     * Adds to the existing shelf row for this product instead of creating a duplicate.
     */
    public function receive(int $branchId, int $productId, float $quantity, ?string $notes = null): BranchFinishedGoodsStock
    {
        $quantity = round($quantity, 3);

        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Quantity must be greater than zero.',
            ]);
        }

        return DB::transaction(function () use ($branchId, $productId, $quantity, $notes) {
            $product = Product::query()
                ->with(['recipe.ingredients'])
                ->lockForUpdate()
                ->findOrFail($productId);

            $reference = $this->nextShelfReference($branchId);

            $this->deductRecipeIngredients($branchId, $product, $quantity, $reference);

            $rows = BranchFinishedGoodsStock::query()
                ->where('branch_id', $branchId)
                ->where('product_id', $product->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($rows->isEmpty()) {
                return BranchFinishedGoodsStock::query()->create([
                    'branch_id' => $branchId,
                    'product_id' => $product->id,
                    'quantity_on_hand' => $quantity,
                    'batch_reference' => $reference,
                ]);
            }

            /** @var BranchFinishedGoodsStock $primary */
            $primary = $rows->first();
            $mergedExtras = (float) $rows->slice(1)->sum(fn (BranchFinishedGoodsStock $row) => (float) $row->quantity_on_hand);

            foreach ($rows->slice(1) as $extra) {
                $extra->delete();
            }

            $primary->forceFill([
                'quantity_on_hand' => round((float) $primary->quantity_on_hand + $mergedExtras + $quantity, 3),
                'batch_reference' => $reference,
            ])->save();

            return $primary->fresh();
        });
    }

    protected function deductRecipeIngredients(int $branchId, Product $product, float $yieldQuantity, string $reference): void
    {
        $recipe = $product->recipe;
        $recipeYield = (float) ($recipe?->expected_yield ?? 0);

        if (! $recipe || $recipeYield <= 0) {
            return;
        }

        $scaleFactor = $yieldQuantity / $recipeYield;

        foreach ($recipe->ingredients as $ingredient) {
            $this->rawMaterials->consumeForShelfIntake(
                $branchId,
                (int) $ingredient->raw_material_id,
                (float) $ingredient->quantity * $scaleFactor,
                $reference,
                $product->name,
            );
        }
    }

    protected function nextShelfReference(int $branchId): string
    {
        $prefix = 'SHELF-'.now()->format('Ymd').'-';

        $latest = BranchFinishedGoodsStock::query()
            ->where('branch_id', $branchId)
            ->where('batch_reference', 'like', $prefix.'%')
            ->orderByDesc('batch_reference')
            ->value('batch_reference');

        $sequence = 1;

        if (is_string($latest) && preg_match('/-(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
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
