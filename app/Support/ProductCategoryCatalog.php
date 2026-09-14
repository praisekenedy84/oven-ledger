<?php

namespace App\Support;

use App\Models\ProductCategory;

class ProductCategoryCatalog
{
    /**
     * @return list<array{name: string, slug: string, kind: string, sort_order: int}>
     */
    public static function defaults(): array
    {
        return [
            ['name' => 'Bread', 'slug' => 'bread', 'kind' => ProductCategory::KIND_PRODUCED, 'sort_order' => 1],
            ['name' => 'Pastry', 'slug' => 'pastry', 'kind' => ProductCategory::KIND_PRODUCED, 'sort_order' => 2],
            ['name' => 'Savoury', 'slug' => 'savoury', 'kind' => ProductCategory::KIND_PRODUCED, 'sort_order' => 3],
            ['name' => 'Cake', 'slug' => 'cake', 'kind' => ProductCategory::KIND_PRODUCED, 'sort_order' => 4],
            ['name' => 'Custom', 'slug' => 'custom', 'kind' => ProductCategory::KIND_PRODUCED, 'sort_order' => 5],
            ['name' => 'Snack', 'slug' => 'snack', 'kind' => ProductCategory::KIND_PRODUCED, 'sort_order' => 6],
            ['name' => 'Packaging', 'slug' => 'packaging', 'kind' => ProductCategory::KIND_HARDWARE, 'sort_order' => 10],
            ['name' => 'Tools', 'slug' => 'tools', 'kind' => ProductCategory::KIND_HARDWARE, 'sort_order' => 11],
            ['name' => 'Hardware', 'slug' => 'hardware', 'kind' => ProductCategory::KIND_HARDWARE, 'sort_order' => 12],
        ];
    }

    public static function seed(): void
    {
        foreach (self::defaults() as $row) {
            ProductCategory::query()->firstOrCreate(
                ['slug' => $row['slug']],
                [...$row, 'is_system' => true]
            );
        }
    }
}
