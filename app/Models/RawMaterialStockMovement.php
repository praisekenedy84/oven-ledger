<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawMaterialStockMovement extends Model
{
    public const TYPE_RESTOCK = 'restock';

    public const TYPE_PRODUCTION = 'production';

    public const TYPE_WASTE = 'waste';

    public const TYPE_OPENING = 'opening';

    protected $fillable = [
        'branch_id',
        'raw_material_id',
        'type',
        'quantity',
        'quantity_after',
        'unit_cost',
        'reference_type',
        'reference_id',
        'notes',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'quantity_after' => 'decimal:3',
            'unit_cost' => 'decimal:2',
            'occurred_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
