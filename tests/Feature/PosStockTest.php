<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Branch;
use App\Models\BranchFinishedGoodsStock;
use App\Models\Order;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PosStockTest extends TestCase
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

    public function test_pos_shows_on_hand_quantity_to_staff(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [3, 17]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pos/Index')
                ->has('products', 1)
                ->where('products.0.id', $productId)
                ->where('products.0.quantity_on_hand', 20)
            );
    }

    public function test_selling_fewer_than_on_hand_leaves_the_rest_in_stock(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [20]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->from(route('tenant.pos.index'))
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 3))
            ->assertRedirect(route('tenant.pos.index'))
            ->assertSessionHas('success');

        $tenant->run(function () use ($productId) {
            $this->assertSame(17.0, (float) BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->sum('quantity_on_hand'));
            $this->assertSame(1, Order::query()->count());
            $this->assertTrue(Order::query()->first()->stock_deducted);
        });
    }

    public function test_sale_cannot_exceed_shelf_stock(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [4]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->from(route('tenant.pos.index'))
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 5))
            ->assertRedirect(route('tenant.pos.index'))
            ->assertSessionHasErrors(['items']);

        $tenant->run(function () use ($productId) {
            $this->assertSame(4.0, (float) BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->sum('quantity_on_hand'));
            $this->assertSame(0, Order::query()->count());
        });
    }

    public function test_walk_in_sale_is_blocked_when_product_is_out_of_stock(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [0]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->from(route('tenant.pos.index'))
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 1))
            ->assertRedirect(route('tenant.pos.index'))
            ->assertSessionHasErrors(['items']);

        $tenant->run(function () {
            $this->assertSame(0, Order::query()->count());
        });
    }

    public function test_partial_sale_takes_from_earliest_stock_row_first(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [3, 10]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 5))
            ->assertSessionHas('success');

        $tenant->run(function () use ($productId) {
            $rows = BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->orderBy('id')
                ->get()
                ->map(fn (BranchFinishedGoodsStock $row) => (float) $row->quantity_on_hand)
                ->all();

            $this->assertSame([0.0, 8.0], $rows);
        });
    }

    public function test_pre_order_does_not_take_walk_in_stock_until_fulfilled(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [10]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 3, [
                'is_pre_order' => true,
                'requested_fulfillment_at' => now()->addDay()->toDateTimeString(),
            ]))
            ->assertSessionHas('success', 'Pre-order recorded.');

        $orderId = $tenant->run(function () use ($productId) {
            $this->assertSame(10.0, (float) BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->sum('quantity_on_hand'));

            $order = Order::query()->first();
            $this->assertTrue($order->is_pre_order);
            $this->assertSame('pending', $order->status);
            $this->assertFalse($order->stock_deducted);

            return $order->id;
        });

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->patch(route('tenant.orders.fulfill', $orderId))
            ->assertSessionHas('success', 'Order marked as fulfilled.');

        $tenant->run(function () use ($productId) {
            $this->assertSame(7.0, (float) BranchFinishedGoodsStock::query()
                ->where('product_id', $productId)
                ->sum('quantity_on_hand'));
            $this->assertTrue(Order::query()->first()->stock_deducted);
        });
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    protected function provisionedOwner(): array
    {
        $suffix = uniqid();
        $email = "amina.pos.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'POS Stock Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_pos_'.$suffix,
            'owner_email' => $email,
            'owner_password' => 'password',
            'max_branches' => 1,
        ]);

        $user = $tenant->run(
            fn () => User::query()->where('email', $email)->firstOrFail()
        );

        return [$tenant, $user];
    }

    /**
     * @param  list<float|int>  $quantities
     */
    protected function seedSellableProduct($tenant, array $quantities): int
    {
        return $tenant->run(function () use ($quantities) {
            $branch = Branch::query()->where('name', 'Main Branch')->firstOrFail();

            $product = Product::query()->create([
                'name' => 'White loaf',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'category' => 'bread',
                'is_active' => true,
            ]);

            PriceList::query()->create([
                'product_id' => $product->id,
                'channel' => 'retail',
                'price' => 2000,
            ]);

            foreach ($quantities as $quantity) {
                BranchFinishedGoodsStock::query()->create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'quantity_on_hand' => $quantity,
                ]);
            }

            return $product->id;
        });
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salePayload(int $productId, float $quantity, array $overrides = []): array
    {
        $total = 2000 * $quantity;

        return array_merge([
            'channel' => 'retail',
            'customer_id' => null,
            'is_pre_order' => false,
            'fulfillment_type' => 'pickup',
            'items' => [
                ['product_id' => $productId, 'quantity' => $quantity],
            ],
            'payments' => [
                ['method' => 'cash', 'amount' => $total],
            ],
        ], $overrides);
    }
}
