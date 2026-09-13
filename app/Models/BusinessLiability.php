<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessLiability extends Model
{
    protected $fillable = [
        'branch_id',
        'type',
        'creditor_name',
        'original_amount',
        'balance_remaining',
        'due_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'original_amount' => 'decimal:2',
            'balance_remaining' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(LiabilityPayment::class);
    }
}
