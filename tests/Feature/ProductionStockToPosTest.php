<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Branch;
use App\Models\BranchFinishedGoodsStock;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\Recipe;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductionStockToPosTest extends TestCase
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

    public function test_marking_a_batch_ready_puts_the_product_on_the_pos_shelf(): void
    {
        [$tenant, $user, $productId] = $this->provisionedBakery();

        $batchId = $this->scheduleBatch($tenant, $user, $productId, 12);

        $this->walkTo($user, $tenant, $batchId, ['baking', 'cooling', 'ready'], 12);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pos/Index')
                ->where('products.0.id', $productId)
                ->where('products.0.quantity_on_hand', 12)
            );
    }

    public function test_dispatching_after_ready_does_not_double_count_stock(): void
    {
        [$tenant, $user, $productId] = $this->provisionedBakery();
        $batchId = $this->scheduleBatch($tenant, $user, $productId, 12);

        $this->walkTo($user, $tenant, $batchId, ['baking', 'cooling', 'ready', 'dispatched'], 12);

        $tenant->run(function () use ($productId) {
            $this->assertSame(12.0, (float) BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->sum('quantity_on_hand'));
            $this->assertSame(1, BranchFinishedGoodsStock::query()->where('product_id', $productId)->count());
        });
    }

    public function test_pos_puts_already_dispatched_bread_on_the_shelf(): void
    {
        [$tenant, $user, $productId] = $this->provisionedBakery();

        $tenant->run(function () use ($productId) {
            $branch = Branch::query()->where('name', 'Main Branch')->firstOrFail();
            $recipeId = Recipe::query()->where('product_id', $productId)->value('id');

            ProductionBatch::query()->create([
                'branch_id' => $branch->id,
                'product_id' => $productId,
                'recipe_id' => $recipeId,
                'planned_quantity' => 16,
                'actual_quantity' => 16,
                'status' => 'dispatched',
                'produced_at' => now(),
            ]);
        });

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.0.quantity_on_hand', 16)
            );

        $tenant->run(function () use ($productId) {
            $this->assertTrue(
                BranchFinishedGoodsStock::query()
                    ->where('product_id', $productId)
                    ->where('quantity_on_hand', 16)
                    ->exists()
            );
        });
    }

    /**
     * @return array{0: Tenant, 1: User, 2: int}
     */
    protected function provisionedBakery(): array
    {
        $suffix = uniqid();
        $email = "amina.prodpos.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Production POS Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_prodpos_'.$suffix,
            'owner_email' => $email,
            'owner_password' => 'password',
            'max_branches' => 1,
        ]);

        $productId = $tenant->run(function () {
            $product = Product::query()->create([
                'name' => 'Brown bread',
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

    protected function scheduleBatch($tenant, User $user, int $productId, float $quantity): int
    {
        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.production-batches.store'), [
                'product_id' => $productId,
                'planned_quantity' => $quantity,
            ])
            ->assertSessionHas('success');

        return $tenant->run(
            fn () => ProductionBatch::query()->where('product_id', $productId)->value('id')
        );
    }

    /**
     * @param  list<string>  $statuses
     */
    protected function walkTo(User $user, $tenant, int $batchId, array $statuses, float $quantity): void
    {
        foreach ($statuses as $status) {
            $this->actingAs($user)
                ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
                ->patch(route('tenant.production-batches.transition', $batchId), [
                    'status' => $status,
                    'actual_quantity' => $quantity,
                ])
                ->assertSessionHas('success', 'Batch status updated.');
        }
    }
}
