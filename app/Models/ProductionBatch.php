<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class ProductionBatch extends Model
{
    protected $fillable = [
        'branch_id',
        'product_id',
        'recipe_id',
        'batch_number',
        'planned_quantity',
        'actual_quantity',
        'status',
        'produced_at',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'planned_quantity' => 'decimal:3',
            'actual_quantity' => 'decimal:3',
            'produced_at' => 'datetime',
            'expiry_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $batch): void {
            if (filled($batch->batch_number)) {
                return;
            }

            $batch->batch_number = static::generateBatchNumber();
        });
    }

    public static function generateBatchNumber(): string
    {
        $prefix = 'PB-'.now()->format('Ymd').'-';

        return DB::transaction(function () use ($prefix) {
            $latest = static::query()
                ->where('batch_number', 'like', $prefix.'%')
                ->lockForUpdate()
                ->orderByDesc('batch_number')
                ->value('batch_number');

            return static::nextNumberAfter($prefix, is_string($latest) ? $latest : null);
        });
    }

    public static function nextNumberAfter(string $prefix, ?string $latest): string
    {
        $sequence = 1;

        if ($latest !== null && preg_match('/-(\d+)$/', $latest, $matches) === 1) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function canTransitionTo(string $status): bool
    {
        $transitions = [
            'planned' => ['baking'],
            'baking' => ['cooling'],
            'cooling' => ['ready'],
            'ready' => ['dispatched'],
            'dispatched' => [],
        ];

        return in_array($status, $transitions[$this->status] ?? [], true);
    }

    public function isComplete(): bool
    {
        return in_array($this->status, ['ready', 'dispatched'], true);
    }
}
