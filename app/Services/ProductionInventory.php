<?php

namespace App\Services;

use App\Models\BranchFinishedGoodsStock;
use App\Models\ProductionBatch;
use Illuminate\Support\Facades\DB;

class ProductionInventory
{
    public function __construct(
        protected RawMaterialInventory $rawMaterials,
    ) {}

    public function postCompletedBatch(ProductionBatch $batch): void
    {
        DB::transaction(function () use ($batch) {
            $batch = ProductionBatch::query()
                ->with(['recipe.ingredients', 'product:id,name'])
                ->lockForUpdate()
                ->findOrFail($batch->id);

            if (! $batch->isComplete() || $this->alreadyPosted($batch)) {
                return;
            }

            $yieldQuantity = (float) ($batch->actual_quantity ?: $batch->planned_quantity);

            if ($yieldQuantity <= 0) {
                return;
            }

            $this->deductIngredients($batch, $yieldQuantity);

            BranchFinishedGoodsStock::query()->create([
                'branch_id' => $batch->branch_id,
                'product_id' => $batch->product_id,
                'quantity_on_hand' => $yieldQuantity,
                'batch_reference' => $batch->batch_number,
            ]);
        });
    }

    public function postOutstanding(?int $branchId = null): void
    {
        ProductionBatch::query()
            ->whereIn('status', ['ready', 'dispatched'])
            ->where('batch_number', 'like', 'PB-%')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('id')
            ->get()
            ->each(fn (ProductionBatch $batch) => $this->postCompletedBatch($batch));
    }

    public function alreadyPosted(ProductionBatch $batch): bool
    {
        return BranchFinishedGoodsStock::query()
            ->where('branch_id', $batch->branch_id)
            ->where('product_id', $batch->product_id)
            ->where('batch_reference', $batch->batch_number)
            ->exists();
    }

    protected function deductIngredients(ProductionBatch $batch, float $yieldQuantity): void
    {
        $recipeYield = (float) ($batch->recipe?->expected_yield ?? 0);

        if ($recipeYield <= 0 || $batch->recipe === null) {
            return;
        }

        $scaleFactor = $yieldQuantity / $recipeYield;

        foreach ($batch->recipe->ingredients as $ingredient) {
            $this->rawMaterials->consumeForBatch(
                $batch,
                $ingredient->raw_material_id,
                (float) $ingredient->quantity * $scaleFactor,
            );
        }
    }
}
