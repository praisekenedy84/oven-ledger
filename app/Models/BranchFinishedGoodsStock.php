<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchFinishedGoodsStock extends Model
{
    protected $table = 'branch_finished_goods_stock';

    protected $fillable = [
        'branch_id',
        'product_id',
        'quantity_on_hand',
        'batch_reference',
    ];

    protected function casts(): array
    {
        return [
            'quantity_on_hand' => 'decimal:3',
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
}
