<?php

declare(strict_types=1);

use App\Models\MenuItem;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Role;
use App\Models\RoleMenuVisibility;
use App\Models\ShopSetting;
use App\Support\ProductCategoryCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_categories')) {
            Schema::create('product_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('kind');
                $table->boolean('is_system')->default(false);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        ProductCategoryCatalog::seed();

        if (Schema::hasTable('products') && ! Schema::hasColumn('products', 'product_category_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('product_category_id')
                    ->nullable()
                    ->constrained('product_categories')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasColumn('products', 'product_category_id')) {
            $this->mapExistingProductCategories();
        }

        if (! Schema::hasTable('shop_settings')) {
            Schema::create('shop_settings', function (Blueprint $table) {
                $table->id();
                $table->string('shop_name')->nullable();
                $table->string('logo_path')->nullable();
                $table->string('primary_color', 7)->default(ShopSetting::DEFAULT_PRIMARY);
                $table->string('accent_color', 7)->default(ShopSetting::DEFAULT_ACCENT);
                $table->timestamps();
            });
        }

        ShopSetting::query()->firstOrCreate([], [
            'primary_color' => ShopSetting::DEFAULT_PRIMARY,
            'accent_color' => ShopSetting::DEFAULT_ACCENT,
        ]);

        $this->deduplicateRecipes();

        if (Schema::hasTable('recipes') && ! Schema::hasIndex('recipes', 'recipes_product_id_unique')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->unique('product_id', 'recipes_product_id_unique');
            });
        }

        $permission = Permission::query()->firstOrCreate(
            ['key' => 'shop.manage'],
            ['label' => 'Manage shop settings', 'group' => 'settings']
        );

        foreach (Role::query()->whereIn('name', ['owner', 'branch_manager'])->get() as $role) {
            $role->permissions()->syncWithoutDetaching([$permission->id]);
        }

        $shopMenuId = MenuItem::query()->where('key', 'tenant.shop')->value('id');

        if ($shopMenuId) {
            foreach (Role::query()->whereIn('name', ['owner', 'branch_manager'])->get() as $role) {
                RoleMenuVisibility::query()->updateOrInsert(
                    [
                        'role_id' => $role->id,
                        'menu_item_id' => $shopMenuId,
                    ],
                    ['visible' => true]
                );
            }
        }
    }

    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropUnique('recipes_product_id_unique');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_category_id');
        });

        Schema::dropIfExists('shop_settings');
        Schema::dropIfExists('product_categories');
    }

    protected function mapExistingProductCategories(): void
    {
        $categories = ProductCategory::query()->get()->keyBy(fn (ProductCategory $category) => mb_strtolower($category->name));

        Product::query()->each(function (Product $product) use ($categories): void {
            $name = mb_strtolower((string) $product->category);
            $match = $categories->get($name);

            if (! $match && $product->type === 'trading') {
                $match = $categories->get('hardware') ?? $categories->get('tools');
            }

            if (! $match && $product->type === 'produced') {
                $match = $categories->get('bread');
            }

            if (! $match) {
                return;
            }

            $product->forceFill([
                'product_category_id' => $match->id,
                'category' => $match->name,
                'type' => $match->productType(),
            ])->save();
        });
    }

    protected function deduplicateRecipes(): void
    {
        $duplicateProductIds = DB::table('recipes')
            ->select('product_id')
            ->groupBy('product_id')
            ->havingRaw('count(*) > 1')
            ->pluck('product_id');

        foreach ($duplicateProductIds as $productId) {
            $ids = DB::table('recipes')
                ->where('product_id', $productId)
                ->orderBy('id')
                ->pluck('id');

            $keepId = $ids->shift();

            if ($ids->isEmpty()) {
                continue;
            }

            DB::table('production_batches')
                ->whereIn('recipe_id', $ids)
                ->update(['recipe_id' => $keepId]);

            DB::table('recipe_ingredients')->whereIn('recipe_id', $ids)->delete();
            DB::table('recipes')->whereIn('id', $ids)->delete();
        }
    }
};
