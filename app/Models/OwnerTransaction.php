<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerTransaction extends Model
{
    protected $fillable = [
        'type',
        'amount',
        'transacted_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'transacted_at' => 'datetime',
        ];
    }
}
