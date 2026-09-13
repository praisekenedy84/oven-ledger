<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalReceipt extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'tra_receipt_number',
        'fiscal_payload',
        'issued_at',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_payload' => 'array',
            'issued_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
