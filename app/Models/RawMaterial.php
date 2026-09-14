<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterial extends Model
{
    protected $fillable = [
        'name',
        'unit_of_measure',
        'reorder_threshold',
        'unit_cost',
    ];

    protected function casts(): array
    {
        return [
            'reorder_threshold' => 'decimal:3',
            'unit_cost' => 'decimal:2',
        ];
    }

    public function branchStock(): HasMany
    {
        return $this->hasMany(BranchRawMaterialStock::class);
    }

    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(RawMaterialStockMovement::class);
    }
}
