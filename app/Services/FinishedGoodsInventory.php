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
            ->select('branch_finished_goods_stock.product_id')
            ->selectRaw('MIN(branch_finished_goods_stock.id) as id')
            ->selectRaw('COALESCE(SUM(branch_finished_goods_stock.quantity_on_hand), 0) as quantity_on_hand')
            ->join('products', 'products.id', '=', 'branch_finished_goods_stock.product_id')
            ->addSelect([
                'products.name as product_name',
                'products.type as product_type',
                'products.unit_of_measure as product_unit',
                'products.reorder_threshold',
            ])
            ->when($branchId, fn ($q) => $q->where('branch_finished_goods_stock.branch_id', $branchId))
            ->groupBy(
                'branch_finished_goods_stock.product_id',
                'products.name',
                'products.type',
                'products.unit_of_measure',
                'products.reorder_threshold',
            )
            ->orderBy('products.name')
            ->get()
            ->map(function ($row) {
                $quantity = round((float) $row->quantity_on_hand, 3);
                $threshold = $row->reorder_threshold;
                $thresholdValue = $threshold === null ? null : (float) $threshold;

                return [
                    'id' => (int) $row->id,
                    'product_id' => (int) $row->product_id,
                    'quantity_on_hand' => $quantity,
                    'product' => (object) [
                        'id' => (int) $row->product_id,
                        'name' => $row->product_name,
                        'type' => $row->product_type,
                        'unit_of_measure' => $row->product_unit,
                        'reorder_threshold' => $thresholdValue,
                    ],
                    'reorder_threshold' => $thresholdValue,
                    'is_low' => $this->isBelowReorder($quantity, $thresholdValue),
                ];
            });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function lowStockAlerts(?int $branchId, int $limit = 8): Collection
    {
        return BranchFinishedGoodsStock::query()
            ->select('branch_finished_goods_stock.product_id')
            ->selectRaw('MIN(branch_finished_goods_stock.id) as id')
            ->selectRaw('COALESCE(SUM(branch_finished_goods_stock.quantity_on_hand), 0) as quantity_on_hand')
            ->join('products', 'products.id', '=', 'branch_finished_goods_stock.product_id')
            ->addSelect([
                'products.name',
                'products.unit_of_measure',
                'products.reorder_threshold',
            ])
            ->when($branchId, fn ($q) => $q->where('branch_finished_goods_stock.branch_id', $branchId))
            ->groupBy(
                'branch_finished_goods_stock.product_id',
                'products.name',
                'products.unit_of_measure',
                'products.reorder_threshold',
            )
            ->havingRaw('(
                (products.reorder_threshold IS NULL AND COALESCE(SUM(branch_finished_goods_stock.quantity_on_hand), 0) <= 0)
                OR (products.reorder_threshold IS NOT NULL AND COALESCE(SUM(branch_finished_goods_stock.quantity_on_hand), 0) <= products.reorder_threshold)
            )')
            ->orderBy('quantity_on_hand')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => 'fg-'.(int) $row->id,
                'kind' => 'finished',
                'name' => $row->name,
                'quantity' => round((float) $row->quantity_on_hand, 3),
                'unit' => $row->unit_of_measure,
                'threshold' => $row->reorder_threshold === null ? null : (float) $row->reorder_threshold,
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
        if ($requestedByProduct === []) {
            return;
        }

        $onHand = $this->quantitiesOnHand($branchId);
        $errors = [];

        foreach ($requestedByProduct as $productId => $requested) {
            $available = (float) ($onHand[(int) $productId] ?? 0);

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
