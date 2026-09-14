<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperatingExpense extends Model
{
    public const CATEGORIES = [
        'rent' => 'Rent',
        'utilities' => 'Electricity, water, gas',
        'salaries' => 'Staff pay',
        'transport' => 'Transport',
        'fees' => 'Fees and licences',
        'packaging' => 'Packaging',
        'marketing' => 'Marketing',
        'maintenance' => 'Repairs and maintenance',
        'other' => 'Other',
    ];

    protected $fillable = [
        'branch_id',
        'category',
        'payee',
        'amount',
        'incurred_at',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'incurred_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function categoryLabel(?string $category): string
    {
        return self::CATEGORIES[$category] ?? 'Other';
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function categoryOptions(): array
    {
        return collect(self::CATEGORIES)
            ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
            ->values()
            ->all();
    }
}
