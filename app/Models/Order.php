<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'branch_id',
        'customer_id',
        'channel',
        'status',
        'deposit_amount',
        'due_date',
        'total_amount',
        'is_pre_order',
        'fulfillment_type',
        'requested_fulfillment_at',
        'delivery_address_id',
        'created_by',
        'voided_by',
        'voided_at',
        'void_reason',
        'stock_deducted',
    ];

    protected function casts(): array
    {
        return [
            'deposit_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'due_date' => 'date',
            'is_pre_order' => 'boolean',
            'requested_fulfillment_at' => 'datetime',
            'voided_at' => 'datetime',
            'stock_deducted' => 'boolean',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function deliveryAddress(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'delivery_address_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function fiscalReceipt(): HasOne
    {
        return $this->hasOne(FiscalReceipt::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(CustomerLedgerEntry::class);
    }

    public function soldBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function isVoided(): bool
    {
        return $this->status === 'voided' || $this->voided_at !== null;
    }

    public function toTicketArray(): array
    {
        $this->loadMissing(['soldBy:id,name', 'voidedBy:id,name', 'customer:id,name', 'items.product:id,name']);

        return [
            'id' => $this->id,
            'created_at' => $this->created_at,
            'channel' => $this->channel,
            'status' => $this->status,
            'total_amount' => (float) $this->total_amount,
            'is_pre_order' => (bool) $this->is_pre_order,
            'void_reason' => $this->void_reason,
            'voided_at' => $this->voided_at,
            'cashier' => $this->soldBy?->only(['id', 'name']),
            'voided_by' => $this->voidedBy?->only(['id', 'name']),
            'customer' => $this->customer?->only(['id', 'name']),
            'items' => $this->items->map(fn (OrderItem $item) => [
                'name' => $item->product?->name ?? 'Item',
                'quantity' => (float) $item->quantity,
            ])->values()->all(),
        ];
    }
}
