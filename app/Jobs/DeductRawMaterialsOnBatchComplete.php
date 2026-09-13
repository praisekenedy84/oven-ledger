<?php

namespace App\Jobs;

use App\Models\BranchFinishedGoodsStock;
use App\Models\BranchRawMaterialStock;
use App\Models\ProductionBatch;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class DeductRawMaterialsOnBatchComplete implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $batchId,
    ) {}

    public function handle(): void
    {
        DB::transaction(function () {
            $batch = ProductionBatch::query()
                ->with(['recipe.ingredients'])
                ->lockForUpdate()
                ->findOrFail($this->batchId);

            if (! in_array($batch->status, ['ready', 'dispatched'], true)) {
                return;
            }

            $yieldQuantity = (float) ($batch->actual_quantity ?: $batch->planned_quantity);
            $recipeYield = (float) $batch->recipe->expected_yield;

            if ($recipeYield <= 0) {
                return;
            }

            $scaleFactor = $yieldQuantity / $recipeYield;

            foreach ($batch->recipe->ingredients as $ingredient) {
                $deductQty = (float) $ingredient->quantity * $scaleFactor;

                $stock = BranchRawMaterialStock::query()
                    ->where('branch_id', $batch->branch_id)
                    ->where('raw_material_id', $ingredient->raw_material_id)
                    ->lockForUpdate()
                    ->first();

                if ($stock) {
                    $stock->decrement('quantity_on_hand', $deductQty);
                }
            }

            BranchFinishedGoodsStock::query()->create([
                'branch_id' => $batch->branch_id,
                'product_id' => $batch->product_id,
                'quantity_on_hand' => $yieldQuantity,
                'batch_reference' => $batch->batch_number,
            ]);
        });
    }
}
