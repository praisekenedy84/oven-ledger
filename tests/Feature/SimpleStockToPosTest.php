<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\BranchFinishedGoodsStock;
use App\Models\BranchRawMaterialStock;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RawMaterialStockMovement;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\Tenant;
use App\Models\TenantFeatureFlag;
use App\Models\User;
use App\Services\BusinessSizeProfile;
use App\Services\FeatureGate;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SimpleStockToPosTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        if (tenancy()->initialized) {
            tenancy()->end();
        }

        parent::tearDown();

        foreach (glob(database_path('tenant*')) ?: [] as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
    }

    public function test_small_bakery_can_add_finished_goods_straight_to_the_pos_shelf(): void
    {
        [$tenant, $user, $productId] = $this->provisionedSmallBakery();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.receive'), [
                'product_id' => $productId,
                'quantity' => 20,
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pos/Index')
                ->where('products.0.id', $productId)
                ->where('products.0.quantity_on_hand', 20)
            );
    }

    public function test_adding_shelf_stock_deducts_recipe_ingredients(): void
    {
        [$tenant, $user, $productId, $flourId] = $this->provisionedSmallBakeryWithRecipe();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.receive'), [
                'product_id' => $productId,
                'quantity' => 10,
            ])
            ->assertSessionHas('success');

        $tenant->run(function () use ($productId, $flourId) {
            $this->assertSame(10.0, (float) BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->sum('quantity_on_hand'));

            // Recipe: 2kg flour per 10 yield → 10 units uses 2kg; started with 25 → 23 left
            $this->assertSame(23.0, (float) BranchRawMaterialStock::query()
                ->where('raw_material_id', $flourId)
                ->value('quantity_on_hand'));

            $this->assertTrue(
                RawMaterialStockMovement::query()
                    ->where('raw_material_id', $flourId)
                    ->where('type', RawMaterialStockMovement::TYPE_PRODUCTION)
                    ->where('reference_type', 'shelf_intake')
                    ->exists()
            );
        });
    }

    public function test_adding_shelf_stock_again_increments_the_same_row(): void
    {
        [$tenant, $user, $productId] = $this->provisionedSmallBakery();

        $session = [InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()];

        $this->actingAs($user)
            ->withSession($session)
            ->post(route('tenant.inventory.receive'), [
                'product_id' => $productId,
                'quantity' => 10,
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession($session)
            ->post(route('tenant.inventory.receive'), [
                'product_id' => $productId,
                'quantity' => 5,
            ])
            ->assertSessionHas('success');

        $tenant->run(function () use ($productId) {
            $rows = BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->get();

            $this->assertCount(1, $rows);
            $this->assertSame(15.0, (float) $rows->first()->quantity_on_hand);
        });
    }

    public function test_shelf_reorder_threshold_drives_inventory_low_status(): void
    {
        [$tenant, $user, $productId] = $this->provisionedSmallBakery();

        $tenant->run(function () use ($productId) {
            Product::query()->whereKey($productId)->update(['reorder_threshold' => 12]);
            $branchId = \App\Models\Branch::query()->where('name', 'Main Branch')->value('id');

            BranchFinishedGoodsStock::query()->create([
                'branch_id' => $branchId,
                'product_id' => $productId,
                'quantity_on_hand' => 10,
                'batch_reference' => 'SHELF-TEST-0001',
            ]);
        });

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Inventory/Index')
                ->where('finishedGoodsStock.0.product_id', $productId)
                ->where('finishedGoodsStock.0.quantity_on_hand', 10)
                ->where('finishedGoodsStock.0.reorder_threshold', 12)
                ->where('finishedGoodsStock.0.is_low', true)
            );
    }

    public function test_production_routes_are_blocked_for_small_bakeries(): void
    {
        [$tenant, $user] = $this->provisionedSmallBakery();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.production-batches.index'))
            ->assertForbidden();
    }

    public function test_medium_bakeries_cannot_use_direct_shelf_intake(): void
    {
        [$tenant, $user, $productId] = $this->provisionedSmallBakery();

        app(BusinessSizeProfile::class)->apply($tenant, Tenant::SIZE_MEDIUM);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.receive'), [
                'product_id' => $productId,
                'quantity' => 5,
            ])
            ->assertForbidden();
    }

    public function test_setting_business_size_to_small_disables_production_module(): void
    {
        $suffix = uniqid();
        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Size Flip Bakery',
            'owner_name' => 'Owner',
            'owner_username' => 'size_flip_'.$suffix,
            'owner_email' => "size.flip.{$suffix}@example.test",
            'owner_password' => 'password',
            'max_branches' => 1,
            'business_size' => Tenant::SIZE_MEDIUM,
        ]);

        $this->assertTrue(
            TenantFeatureFlag::query()
                ->where('tenant_id', $tenant->id)
                ->where('feature_key', 'production_module')
                ->value('enabled')
        );

        app(BusinessSizeProfile::class)->apply($tenant, Tenant::SIZE_SMALL);

        $tenant->refresh();
        app(FeatureGate::class)->forget($tenant->id);

        $this->assertSame(Tenant::SIZE_SMALL, $tenant->business_size);
        $this->assertFalse(
            TenantFeatureFlag::query()
                ->where('tenant_id', $tenant->id)
                ->where('feature_key', 'production_module')
                ->value('enabled')
        );
    }

    /**
     * @return array{0: Tenant, 1: User, 2: int}
     */
    protected function provisionedSmallBakery(): array
    {
        $suffix = uniqid();
        $email = "amina.simple.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Simple Shelf Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_simple_'.$suffix,
            'owner_email' => $email,
            'owner_password' => 'password',
            'max_branches' => 1,
            'business_size' => Tenant::SIZE_SMALL,
        ]);

        $productId = $tenant->run(function () {
            $product = Product::query()->create([
                'name' => 'Counter bread',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'category' => 'Bread',
                'is_active' => true,
            ]);

            Recipe::query()->create([
                'product_id' => $product->id,
                'expected_yield' => 16,
            ]);

            return $product->id;
        });

        $user = $tenant->run(
            fn () => User::query()->where('email', $email)->firstOrFail()
        );

        return [$tenant, $user, $productId];
    }

    /**
     * @return array{0: Tenant, 1: User, 2: int, 3: int}
     */
    protected function provisionedSmallBakeryWithRecipe(): array
    {
        [$tenant, $user, $productId] = $this->provisionedSmallBakery();

        $flourId = $tenant->run(function () use ($productId) {
            $flour = RawMaterial::query()->create([
                'name' => 'Flour',
                'unit_of_measure' => 'kg',
                'unit_cost' => 2000,
                'reorder_threshold' => 5,
            ]);

            $recipe = Recipe::query()->where('product_id', $productId)->firstOrFail();
            $recipe->update(['expected_yield' => 10]);

            RecipeIngredient::query()->create([
                'recipe_id' => $recipe->id,
                'raw_material_id' => $flour->id,
                'quantity' => 2,
                'unit' => 'kg',
            ]);

            $branchId = \App\Models\Branch::query()->where('name', 'Main Branch')->value('id');

            BranchRawMaterialStock::query()->create([
                'branch_id' => $branchId,
                'raw_material_id' => $flour->id,
                'quantity_on_hand' => 25,
            ]);

            return $flour->id;
        });

        return [$tenant, $user, $productId, $flourId];
    }
}
