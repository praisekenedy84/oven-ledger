<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    protected $fillable = [
        'product_id',
        'expected_yield',
    ];

    protected function casts(): array
    {
        return [
            'expected_yield' => 'decimal:3',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function productionBatches(): HasMany
    {
        return $this->hasMany(ProductionBatch::class);
    }

    /**
     * @param  array<int, array{raw_material_id: mixed, quantity: mixed, unit: string}>  $ingredients
     */
    public function syncIngredients(array $ingredients): void
    {
        $this->ingredients()->delete();

        foreach ($ingredients as $ingredient) {
            $this->ingredients()->create([
                'raw_material_id' => $ingredient['raw_material_id'],
                'quantity' => $ingredient['quantity'],
                'unit' => $ingredient['unit'],
            ]);
        }
    }
}
