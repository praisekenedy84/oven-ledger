<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'unit_of_measure',
        'category',
        'product_category_id',
        'cost_price',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'cost_price' => 'decimal:2',
        ];
    }

    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function recipe(): HasOne
    {
        return $this->hasOne(Recipe::class);
    }

    public function priceLists(): HasMany
    {
        return $this->hasMany(PriceList::class);
    }

    public function finishedGoodsStock(): HasMany
    {
        return $this->hasMany(BranchFinishedGoodsStock::class);
    }

    public function isProduced(): bool
    {
        return $this->type === 'produced';
    }

    public function isTrading(): bool
    {
        return $this->type === 'trading';
    }

    public function isHardware(): bool
    {
        return $this->productCategory?->isHardware() ?? $this->isTrading();
    }

    public function requiresRecipe(): bool
    {
        return ! $this->isHardware();
    }
}
