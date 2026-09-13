<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WasteLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'branch_id',
        'product_id',
        'quantity',
        'reason',
        'logged_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'logged_at' => 'datetime',
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
