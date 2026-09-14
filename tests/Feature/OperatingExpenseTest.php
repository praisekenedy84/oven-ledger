<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\MenuItem;
use App\Models\OperatingExpense;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OperatingExpenseTest extends TestCase
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

    public function test_owner_can_record_rent_and_see_it_on_expenses_and_reports(): void
    {
        [$tenant, $user] = $this->provisionedOwner();
        $session = [InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()];

        $this->actingAs($user)
            ->withSession($session)
            ->get(route('tenant.expenses.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Expenses/Index')
                ->has('categories')
                ->where('totals.this_month', 0)
            );

        $this->actingAs($user)
            ->withSession($session)
            ->from(route('tenant.expenses.index'))
            ->post(route('tenant.expenses.store'), [
                'category' => 'rent',
                'payee' => 'Kariakoo landlord',
                'amount' => 450000,
                'incurred_at' => now()->toDateString(),
                'notes' => 'September shop rent',
            ])
            ->assertRedirect(route('tenant.expenses.index'))
            ->assertSessionHas('success');

        $tenant->run(function () {
            $this->assertSame(1, OperatingExpense::query()->count());
            $this->assertSame('rent', OperatingExpense::query()->first()->category);
            $this->assertSame(450000.0, (float) OperatingExpense::query()->first()->amount);
        });

        $this->actingAs($user)
            ->withSession($session)
            ->get(route('tenant.reports.index', [
                'date_from' => now()->toDateString(),
                'date_to' => now()->toDateString(),
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('profitLoss.operating_expenses', 450000)
                ->has('expenseBreakdown.lines')
            );
    }

    public function test_expenses_menu_item_is_nested_under_sales(): void
    {
        $item = MenuItem::query()->where('key', 'tenant.expenses')->first();

        $this->assertNotNull($item);
        $this->assertSame('tenant.expenses.index', $item->route_name);
        $this->assertSame(
            'tenant.sales',
            MenuItem::query()->where('id', $item->parent_id)->value('key')
        );
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    protected function provisionedOwner(): array
    {
        $suffix = uniqid();
        $email = "amina.expenses.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Expenses Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_expenses_'.$suffix,
            'owner_email' => $email,
            'owner_password' => 'password',
            'max_branches' => 1,
        ]);

        $user = $tenant->run(
            fn () => User::query()->where('email', $email)->firstOrFail()
        );

        return [$tenant, $user];
    }
}
