<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ProductCategory extends Model
{
    public const KIND_PRODUCED = 'produced';

    public const KIND_HARDWARE = 'hardware';

    protected $fillable = [
        'name',
        'slug',
        'kind',
        'is_system',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $category): void {
            if (blank($category->slug)) {
                $category->slug = static::uniqueSlug($category->name);
            }
        });
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function isHardware(): bool
    {
        return $this->kind === self::KIND_HARDWARE;
    }

    public function isProduced(): bool
    {
        return $this->kind === self::KIND_PRODUCED;
    }

    public function productType(): string
    {
        return $this->isHardware() ? 'trading' : 'produced';
    }

    public static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $suffix = 2;

        while (static::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
