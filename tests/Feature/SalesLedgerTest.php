<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Branch;
use App\Models\BranchFinishedGoodsStock;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SalesLedgerTest extends TestCase
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

    public function test_sales_page_lists_completed_sales_and_filters_by_staff(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [20]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 2))
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.sales.index', [
                'date_from' => now()->toDateString(),
                'date_to' => now()->toDateString(),
                'status' => 'completed',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Sales/Index')
                ->where('summary.period_count', 1)
                ->where('summary.today_count', 1)
                ->has('sales.data', 1)
                ->where('sales.data.0.status', 'completed')
                ->where('sales.data.0.cashier.name', $user->name));

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.sales.index', [
                'date_from' => now()->toDateString(),
                'date_to' => now()->toDateString(),
                'staff_search' => 'nobody-matching',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Sales/Index')
                ->has('sales.data', 0)
                ->where('summary.period_count', 0));
    }

    public function test_sales_ledger_can_be_exported_as_pdf_and_excel(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $productId = $this->seedSellableProduct($tenant, [10]);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.pos.store'), $this->salePayload($productId, 1))
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.sales.export', [
                'format' => 'pdf',
                'date_from' => now()->toDateString(),
                'date_to' => now()->toDateString(),
            ]))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.sales.export', [
                'format' => 'xlsx',
                'date_from' => now()->toDateString(),
                'date_to' => now()->toDateString(),
            ]))
            ->assertOk();
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    protected function provisionedOwner(): array
    {
        $suffix = uniqid();
        $email = "amina.sales.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Sales Ledger Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_sales_'.$suffix,
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
                'name' => 'Mandazi',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'category' => 'bread',
                'is_active' => true,
            ]);

            PriceList::query()->create([
                'product_id' => $product->id,
                'channel' => 'retail',
                'price' => 1500,
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

    protected function salePayload(int $productId, float $quantity, array $overrides = []): array
    {
        return array_merge([
            'channel' => 'retail',
            'customer_id' => null,
            'is_pre_order' => false,
            'fulfillment_type' => 'pickup',
            'items' => [
                ['product_id' => $productId, 'quantity' => $quantity],
            ],
            'payments' => [
                ['method' => 'cash', 'amount' => 1500 * $quantity],
            ],
        ], $overrides);
    }
}
