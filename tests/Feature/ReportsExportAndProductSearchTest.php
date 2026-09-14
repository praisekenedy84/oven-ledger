<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OwnerTransaction;
use App\Models\Product;
use App\Models\ShopSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportsExportAndProductSearchTest extends TestCase
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

    public function test_product_search_limits_sales_and_trend_to_matching_items(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $this->seedSoldProducts($tenant, $user);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.reports.index', [
                'date_from' => now()->toDateString(),
                'date_to' => now()->toDateString(),
                'product_search' => 'mandazi',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Reports/Index')
                ->has('salesByProduct', 1)
                ->where('salesByProduct.0.name', 'Coconut mandazi')
                ->where('filters.product_search', 'mandazi')
                ->has('productTrend')
                ->has('expenseBreakdown.lines')
            );
    }

    public function test_sales_and_expenses_export_as_pdf_and_excel(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $this->seedSoldProducts($tenant, $user);

        $tenant->run(function () {
            ShopSetting::current()->update(['shop_name' => 'Kariakoo Oven']);
            OwnerTransaction::query()->create([
                'type' => 'drawing',
                'amount' => 15000,
                'transacted_at' => now(),
                'notes' => 'Owner took cash',
            ]);
        });

        $session = [InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()];
        $query = [
            'date_from' => now()->toDateString(),
            'date_to' => now()->toDateString(),
            'product_search' => 'mandazi',
        ];

        $salesPdf = $this->actingAs($user)->withSession($session)->get(route('tenant.reports.export', [
            ...$query,
            'kind' => 'sales',
            'format' => 'pdf',
        ]));
        $salesPdf->assertOk();
        $salesPdf->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $salesPdf->getContent());
        $salesPdf->assertDownload('sales-kariakoo-oven-'.$query['date_from'].'-to-'.$query['date_to'].'.pdf');

        $salesExcel = $this->actingAs($user)->withSession($session)->get(route('tenant.reports.export', [
            ...$query,
            'kind' => 'sales',
            'format' => 'xlsx',
        ]));
        $salesExcel->assertOk();
        $salesExcel->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringStartsWith('PK', $salesExcel->streamedContent());

        $expensesPdf = $this->actingAs($user)->withSession($session)->get(route('tenant.reports.export', [
            ...$query,
            'kind' => 'expenses',
            'format' => 'pdf',
        ]));
        $expensesPdf->assertOk();
        $this->assertStringStartsWith('%PDF', $expensesPdf->getContent());

        $expensesExcel = $this->actingAs($user)->withSession($session)->get(route('tenant.reports.export', [
            ...$query,
            'kind' => 'expenses',
            'format' => 'xlsx',
        ]));
        $expensesExcel->assertOk();
        $this->assertStringStartsWith('PK', $expensesExcel->streamedContent());
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    protected function provisionedOwner(): array
    {
        $suffix = uniqid();
        $email = "amina.reports.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Reports Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_reports_'.$suffix,
            'owner_email' => $email,
            'owner_password' => 'password',
            'max_branches' => 1,
        ]);

        $user = $tenant->run(
            fn () => User::query()->where('email', $email)->firstOrFail()
        );

        return [$tenant, $user];
    }

    protected function seedSoldProducts($tenant, User $user): void
    {
        $tenant->run(function () use ($user) {
            $branch = Branch::query()->where('name', 'Main Branch')->firstOrFail();

            $mandazi = Product::query()->create([
                'name' => 'Coconut mandazi',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'category' => 'bites',
                'is_active' => true,
            ]);

            $loaf = Product::query()->create([
                'name' => 'White loaf',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'category' => 'bread',
                'is_active' => true,
            ]);

            $order = Order::query()->create([
                'branch_id' => $branch->id,
                'channel' => 'retail',
                'status' => 'completed',
                'total_amount' => 11000,
                'created_by' => $user->id,
                'is_pre_order' => false,
            ]);

            OrderItem::query()->create([
                'order_id' => $order->id,
                'product_id' => $mandazi->id,
                'quantity' => 4,
                'unit_price' => 1500,
                'line_total' => 6000,
            ]);

            OrderItem::query()->create([
                'order_id' => $order->id,
                'product_id' => $loaf->id,
                'quantity' => 1,
                'unit_price' => 5000,
                'line_total' => 5000,
            ]);
        });
    }
}
