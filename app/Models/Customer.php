<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'type',
        'tin_number',
        'credit_limit',
        'payment_terms',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(CustomerLedgerEntry::class);
    }

    public function outstandingBalance(): float
    {
        $latest = $this->ledgerEntries()
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->first();

        return round((float) ($latest?->balance_after ?? 0), 2);
    }

    public function scopeWithOutstandingBalance(Builder $query): Builder
    {
        if ($query->getQuery()->columns === null) {
            $query->select('customers.*');
        }

        return $query->addSelect([
            'outstanding_balance' => CustomerLedgerEntry::query()
                ->select('balance_after')
                ->whereColumn('customer_id', 'customers.id')
                ->orderByDesc('entry_date')
                ->orderByDesc('id')
                ->limit(1),
        ]);
    }
}
