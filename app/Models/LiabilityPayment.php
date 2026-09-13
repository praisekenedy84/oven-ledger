<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiabilityPayment extends Model
{
    protected $fillable = [
        'business_liability_id',
        'amount',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function liability(): BelongsTo
    {
        return $this->belongsTo(BusinessLiability::class, 'business_liability_id');
    }
}
