<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionBatch extends Model
{
    protected $fillable = [
        'branch_id',
        'product_id',
        'recipe_id',
        'batch_number',
        'planned_quantity',
        'actual_quantity',
        'status',
        'produced_at',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'planned_quantity' => 'decimal:3',
            'actual_quantity' => 'decimal:3',
            'produced_at' => 'datetime',
            'expiry_date' => 'date',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function canTransitionTo(string $status): bool
    {
        $transitions = [
            'planned' => ['baking'],
            'baking' => ['cooling'],
            'cooling' => ['ready'],
            'ready' => ['dispatched'],
            'dispatched' => [],
        ];

        return in_array($status, $transitions[$this->status] ?? [], true);
    }

    public function isComplete(): bool
    {
        return in_array($this->status, ['ready', 'dispatched'], true);
    }
}
