<?php

namespace App\Services;

use App\Models\BranchRawMaterialStock;
use App\Models\ProductionBatch;
use App\Models\RawMaterial;
use App\Models\RawMaterialStockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RawMaterialInventory
{
    public function restock(
        int $branchId,
        int $rawMaterialId,
        float $quantity,
        ?float $unitCost = null,
        ?string $notes = null,
        $occurredAt = null,
    ): RawMaterialStockMovement {
        $quantity = round($quantity, 3);

        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Restock quantity must be greater than zero.',
            ]);
        }

        return $this->apply(
            branchId: $branchId,
            rawMaterialId: $rawMaterialId,
            type: RawMaterialStockMovement::TYPE_RESTOCK,
            signedQuantity: $quantity,
            unitCost: $unitCost,
            notes: $notes,
            occurredAt: $occurredAt,
            allowNegative: false,
        );
    }

    public function openingBalance(
        int $branchId,
        int $rawMaterialId,
        float $quantity,
        ?float $unitCost = null,
        ?string $notes = null,
        $occurredAt = null,
    ): RawMaterialStockMovement {
        $quantity = round($quantity, 3);

        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'current_stock' => 'Current stock must be greater than zero when provided.',
            ]);
        }

        return $this->apply(
            branchId: $branchId,
            rawMaterialId: $rawMaterialId,
            type: RawMaterialStockMovement::TYPE_OPENING,
            signedQuantity: $quantity,
            unitCost: $unitCost,
            notes: $notes ?? 'Opening balance',
            occurredAt: $occurredAt,
            allowNegative: false,
        );
    }

    public function consumeForBatch(ProductionBatch $batch, int $rawMaterialId, float $quantity): ?RawMaterialStockMovement
    {
        $quantity = round($quantity, 3);

        if ($quantity <= 0) {
            return null;
        }

        $alreadyRecorded = RawMaterialStockMovement::query()
            ->where('branch_id', $batch->branch_id)
            ->where('raw_material_id', $rawMaterialId)
            ->where('type', RawMaterialStockMovement::TYPE_PRODUCTION)
            ->where('reference_type', 'production_batch')
            ->where('reference_id', $batch->id)
            ->exists();

        if ($alreadyRecorded) {
            return null;
        }

        $productName = $batch->product?->name;
        $notes = $productName
            ? "Used in {$batch->batch_number} ({$productName})"
            : "Used in {$batch->batch_number}";

        return $this->apply(
            branchId: $batch->branch_id,
            rawMaterialId: $rawMaterialId,
            type: RawMaterialStockMovement::TYPE_PRODUCTION,
            signedQuantity: -$quantity,
            notes: $notes,
            occurredAt: $batch->produced_at,
            referenceType: 'production_batch',
            referenceId: $batch->id,
            allowNegative: true,
        );
    }

    public function consumeForShelfIntake(
        int $branchId,
        int $rawMaterialId,
        float $quantity,
        string $shelfReference,
        ?string $productName = null,
    ): ?RawMaterialStockMovement {
        $quantity = round($quantity, 3);

        if ($quantity <= 0) {
            return null;
        }

        $notes = $productName
            ? "Used for shelf intake {$shelfReference} ({$productName})"
            : "Used for shelf intake {$shelfReference}";

        return $this->apply(
            branchId: $branchId,
            rawMaterialId: $rawMaterialId,
            type: RawMaterialStockMovement::TYPE_PRODUCTION,
            signedQuantity: -$quantity,
            notes: $notes,
            occurredAt: now(),
            referenceType: 'shelf_intake',
            referenceId: null,
            allowNegative: true,
        );
    }

    public function writeOff(
        int $branchId,
        int $rawMaterialId,
        float $quantity,
        string $reason,
        ?string $notes = null,
        $occurredAt = null,
    ): RawMaterialStockMovement {
        $quantity = round($quantity, 3);

        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Waste quantity must be greater than zero.',
            ]);
        }

        $reasonLabel = str_replace('_', ' ', $reason);
        $combinedNotes = trim($reasonLabel.($notes ? ': '.$notes : ''));

        return $this->apply(
            branchId: $branchId,
            rawMaterialId: $rawMaterialId,
            type: RawMaterialStockMovement::TYPE_WASTE,
            signedQuantity: -$quantity,
            notes: $combinedNotes !== '' ? $combinedNotes : $reasonLabel,
            occurredAt: $occurredAt,
            allowNegative: false,
        );
    }

    protected function apply(
        int $branchId,
        int $rawMaterialId,
        string $type,
        float $signedQuantity,
        ?float $unitCost = null,
        ?string $notes = null,
        $occurredAt = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        bool $allowNegative = true,
    ): RawMaterialStockMovement {
        return DB::transaction(function () use (
            $branchId,
            $rawMaterialId,
            $type,
            $signedQuantity,
            $unitCost,
            $notes,
            $occurredAt,
            $referenceType,
            $referenceId,
            $allowNegative,
        ) {
            $stock = BranchRawMaterialStock::query()->firstOrCreate(
                [
                    'branch_id' => $branchId,
                    'raw_material_id' => $rawMaterialId,
                ],
                ['quantity_on_hand' => 0],
            );

            $stock = BranchRawMaterialStock::query()
                ->whereKey($stock->id)
                ->lockForUpdate()
                ->firstOrFail();

            $onHand = round((float) $stock->quantity_on_hand, 3);
            $after = round($onHand + $signedQuantity, 3);

            if (! $allowNegative && $after < -0.0005) {
                throw ValidationException::withMessages([
                    'quantity' => 'Only '.$onHand.' is on hand for this material.',
                ]);
            }

            $stock->forceFill(['quantity_on_hand' => $after])->save();

            if ($type === RawMaterialStockMovement::TYPE_RESTOCK && $unitCost !== null) {
                RawMaterial::query()->whereKey($rawMaterialId)->update([
                    'unit_cost' => round($unitCost, 2),
                ]);
            }

            return RawMaterialStockMovement::query()->create([
                'branch_id' => $branchId,
                'raw_material_id' => $rawMaterialId,
                'type' => $type,
                'quantity' => $signedQuantity,
                'quantity_after' => $after,
                'unit_cost' => $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
                'occurred_at' => $occurredAt ?? now(),
            ]);
        });
    }
}
