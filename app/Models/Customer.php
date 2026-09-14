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

    /**
     * @return array{total_owed: float, customers_owing: int, by_type: array<string, float>}
     */
    public static function receivablesSummary(): array
    {
        $byType = [
            'retail' => 0.0,
            'wholesale' => 0.0,
            'restaurant' => 0.0,
        ];

        $owing = static::query()
            ->withOutstandingBalance()
            ->get()
            ->filter(fn (self $customer) => (float) ($customer->outstanding_balance ?? 0) > 0.009);

        foreach ($owing as $customer) {
            $type = $customer->type;
            $amount = (float) $customer->outstanding_balance;
            $byType[$type] = round(($byType[$type] ?? 0) + $amount, 2);
        }

        return [
            'total_owed' => round($owing->sum(fn (self $customer) => (float) $customer->outstanding_balance), 2),
            'customers_owing' => $owing->count(),
            'by_type' => $byType,
        ];
    }
}
