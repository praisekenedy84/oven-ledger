<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Branch;
use App\Models\BranchFinishedGoodsStock;
use App\Models\Order;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleReceiptTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_flashes_receipt_summary_and_receipt_routes_work(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [5]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->from(route('tenant.pos.index'))
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 2))
            ->assertRedirect(route('tenant.pos.index'))
            ->assertSessionHas('success')
            ->assertSessionHas('last_sale.id')
            ->assertSessionHas('last_sale.pdf_url')
            ->assertSessionHas('last_sale.thermal_url')
            ->assertSessionHas('last_sale.preview_url');

        $orderId = $tenant->run(fn () => Order::query()->value('id'));

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.receipt.preview', $orderId))
            ->assertOk()
            ->assertSee('Sale receipt', false)
            ->assertSee('#'.$orderId, false)
            ->assertSee('White loaf', false);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.receipt.preview', ['order' => $orderId, 'layout' => 'thermal']))
            ->assertOk()
            ->assertSee('White loaf', false);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.receipt.pdf', $orderId))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $download = $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.receipt.pdf', ['order' => $orderId, 'download' => 1]))
            ->assertOk();

        $this->assertStringContainsString(
            'attachment',
            strtolower((string) $download->headers->get('content-disposition')),
        );

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.receipt.thermal-pdf', $orderId))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.pos.receipt.thermal', $orderId))
            ->assertOk()
            ->assertSee('SALE RECEIPT', false)
            ->assertSee('#'.$orderId, false)
            ->assertSee('White loaf', false);
    }

    /**
     * @return array{0: \App\Models\Tenant, 1: User}
     */
    protected function provisionedOwner(): array
    {
        $suffix = uniqid();
        $email = "amina.receipt.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Receipt Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_receipt_'.$suffix,
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
