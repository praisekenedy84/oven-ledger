<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\BranchRawMaterialStock;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\RawMaterial;
use App\Models\RawMaterialStockMovement;
use App\Models\Recipe;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RawMaterialRestockTest extends TestCase
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

    public function test_creating_raw_material_with_current_stock_sets_opening_balance(): void
    {
        [$tenant, $user] = $this->provisionedBakery(withMaterial: false);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.raw-materials.store'), [
                'name' => 'Sugar',
                'unit_of_measure' => 'kg',
                'reorder_threshold' => 2,
                'unit_cost' => 2500,
                'current_stock' => 12.5,
            ])
            ->assertSessionHas('success', 'Raw material created.');

        $tenant->run(function () {
            $material = RawMaterial::query()->where('name', 'Sugar')->first();
            $this->assertNotNull($material);

            $this->assertSame(12.5, (float) BranchRawMaterialStock::query()
                ->where('raw_material_id', $material->id)
                ->value('quantity_on_hand'));

            $movement = RawMaterialStockMovement::query()
                ->where('raw_material_id', $material->id)
                ->first();

            $this->assertNotNull($movement);
            $this->assertSame('opening', $movement->type);
            $this->assertSame(12.5, (float) $movement->quantity);
            $this->assertSame(12.5, (float) $movement->quantity_after);
            $this->assertSame(2500.0, (float) $movement->unit_cost);
            $this->assertSame('Opening balance', $movement->notes);
        });
    }

    public function test_creating_raw_material_without_current_stock_leaves_zero_on_hand(): void
    {
        [$tenant, $user] = $this->provisionedBakery(withMaterial: false);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.raw-materials.store'), [
                'name' => 'Yeast',
                'unit_of_measure' => 'kg',
                'reorder_threshold' => 1,
                'unit_cost' => 8000,
            ])
            ->assertSessionHas('success', 'Raw material created.');

        $tenant->run(function () {
            $material = RawMaterial::query()->where('name', 'Yeast')->first();
            $this->assertNotNull($material);

            $this->assertFalse(
                BranchRawMaterialStock::query()->where('raw_material_id', $material->id)->exists()
            );
            $this->assertFalse(
                RawMaterialStockMovement::query()->where('raw_material_id', $material->id)->exists()
            );
        });
    }

    public function test_restock_increases_on_hand_and_writes_a_movement(): void
    {
        [$tenant, $user, $flourId] = $this->provisionedBakery();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.restock'), [
                'raw_material_id' => $flourId,
                'quantity' => 25,
                'unit_cost' => 1900,
                'notes' => 'Azam mill delivery',
            ])
            ->assertSessionHas('success', 'Raw material restocked.');

        $tenant->run(function () use ($flourId) {
            $this->assertSame(25.0, (float) BranchRawMaterialStock::query()
                ->where('raw_material_id', $flourId)
                ->value('quantity_on_hand'));

            $movement = RawMaterialStockMovement::query()
                ->where('raw_material_id', $flourId)
                ->first();

            $this->assertNotNull($movement);
            $this->assertSame('restock', $movement->type);
            $this->assertSame(25.0, (float) $movement->quantity);
            $this->assertSame(25.0, (float) $movement->quantity_after);
            $this->assertSame(1900.0, (float) $movement->unit_cost);
            $this->assertSame('Azam mill delivery', $movement->notes);
            $this->assertSame(1900.0, (float) RawMaterial::query()->find($flourId)->unit_cost);
        });
    }

    public function test_second_restock_keeps_a_running_balance(): void
    {
        [$tenant, $user, $flourId] = $this->provisionedBakery();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.restock'), [
                'raw_material_id' => $flourId,
                'quantity' => 10,
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.restock'), [
                'raw_material_id' => $flourId,
                'quantity' => 4,
            ])
            ->assertSessionHas('success');

        $tenant->run(function () use ($flourId) {
            $this->assertSame(14.0, (float) BranchRawMaterialStock::query()
                ->where('raw_material_id', $flourId)
                ->value('quantity_on_hand'));

            $this->assertSame(
                [10.0, 14.0],
                RawMaterialStockMovement::query()
                    ->where('raw_material_id', $flourId)
                    ->orderBy('id')
                    ->pluck('quantity_after')
                    ->map(fn ($value) => (float) $value)
                    ->all()
            );
        });
    }

    public function test_production_writes_a_usage_movement(): void
    {
        [$tenant, $user, $flourId, $productId] = $this->provisionedBakery(withProduct: true);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.restock'), [
                'raw_material_id' => $flourId,
                'quantity' => 20,
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.production-batches.store'), [
                'product_id' => $productId,
                'planned_quantity' => 16,
            ])
            ->assertSessionHas('success');

        $batchId = $tenant->run(
            fn () => ProductionBatch::query()->where('product_id', $productId)->value('id')
        );

        foreach (['baking', 'cooling', 'ready'] as $status) {
            $this->actingAs($user)
                ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
                ->patch(route('tenant.production-batches.transition', $batchId), [
                    'status' => $status,
                    'actual_quantity' => 16,
                ])
                ->assertSessionHas('success');
        }

        $tenant->run(function () use ($flourId) {
            $this->assertSame(10.0, (float) BranchRawMaterialStock::query()
                ->where('raw_material_id', $flourId)
                ->value('quantity_on_hand'));

            $usage = RawMaterialStockMovement::query()
                ->where('raw_material_id', $flourId)
                ->where('type', 'production')
                ->first();

            $this->assertNotNull($usage);
            $this->assertSame(-10.0, (float) $usage->quantity);
            $this->assertSame(10.0, (float) $usage->quantity_after);
        });
    }

    public function test_raw_waste_cannot_exceed_on_hand(): void
    {
        [$tenant, $user, $flourId] = $this->provisionedBakery();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.restock'), [
                'raw_material_id' => $flourId,
                'quantity' => 2,
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->from(route('tenant.inventory.index'))
            ->post(route('tenant.inventory.raw-waste'), [
                'raw_material_id' => $flourId,
                'quantity' => 5,
                'reason' => 'spillage',
            ])
            ->assertSessionHasErrors('quantity');

        $tenant->run(function () use ($flourId) {
            $this->assertSame(2.0, (float) BranchRawMaterialStock::query()
                ->where('raw_material_id', $flourId)
                ->value('quantity_on_hand'));
        });
    }

    public function test_inventory_and_material_pages_show_the_lifecycle(): void
    {
        [$tenant, $user, $flourId] = $this->provisionedBakery();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.inventory.restock'), [
                'raw_material_id' => $flourId,
                'quantity' => 8,
                'notes' => 'Morning delivery',
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Inventory/Index')
                ->where('movements.data.0.type', 'restock')
                ->where('movements.data.0.notes', 'Morning delivery')
                ->where('rawMaterialStock.0.quantity_on_hand', fn ($qty) => abs((float) $qty - 8) < 0.001)
            );

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.raw-materials.show', $flourId))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('RawMaterials/Show')
                ->where('rawMaterial.quantity_on_hand', 8)
                ->where('movements.data.0.notes', 'Morning delivery')
            );
    }

    /**
     * @return array{0: Tenant, 1: User, 2?: int, 3?: int}
     */
    protected function provisionedBakery(bool $withProduct = false, bool $withMaterial = true): array
    {
        $suffix = uniqid();
        $email = "amina.rawstock.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Raw Stock Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_rawstock_'.$suffix,
            'owner_email' => $email,
            'owner_password' => 'password',
            'max_branches' => 1,
        ]);

        $ids = $tenant->run(function () use ($withProduct, $withMaterial) {
            if (! $withMaterial) {
                return [];
            }

            $flour = RawMaterial::query()->create([
                'name' => 'Wheat flour',
                'unit_of_measure' => 'kg',
                'reorder_threshold' => 5,
                'unit_cost' => 1800,
            ]);

            if (! $withProduct) {
                return [$flour->id];
            }

            $product = Product::query()->create([
                'name' => 'Brown bread',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'category' => 'Bread',
                'is_active' => true,
            ]);

            $recipe = Recipe::query()->create([
                'product_id' => $product->id,
                'expected_yield' => 16,
            ]);

            $recipe->ingredients()->create([
                'raw_material_id' => $flour->id,
                'quantity' => 10,
                'unit' => 'kg',
            ]);

            return [$flour->id, $product->id];
        });

        $user = $tenant->run(
            fn () => User::query()->where('email', $email)->firstOrFail()
        );

        return [$tenant, $user, ...$ids];
    }
}
