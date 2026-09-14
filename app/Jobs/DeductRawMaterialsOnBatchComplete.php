<?php

namespace App\Jobs;

use App\Models\ProductionBatch;
use App\Services\ProductionInventory;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeductRawMaterialsOnBatchComplete implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $batchId,
    ) {}

    public function handle(ProductionInventory $inventory): void
    {
        $batch = ProductionBatch::query()->find($this->batchId);

        if (! $batch) {
            return;
        }

        $inventory->postCompletedBatch($batch);
    }
}
