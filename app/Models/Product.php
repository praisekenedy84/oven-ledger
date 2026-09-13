<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
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
}
