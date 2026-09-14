<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\User;
use App\Services\CustomerLedger;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerReceivablesSummaryTest extends TestCase
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

    public function test_customers_index_summarises_total_money_owed_to_the_bakery(): void
    {
        [$tenant, $user] = $this->provisionedOwner();

        $tenant->run(function () {
            $branchId = Branch::query()->value('id');
            $ledger = app(CustomerLedger::class);

            $hotel = Customer::query()->create([
                'name' => 'Sea View Hotel',
                'type' => 'wholesale',
                'credit_limit' => 500000,
                'is_active' => true,
            ]);
            $walkIn = Customer::query()->create([
                'name' => 'Mama Asha',
                'type' => 'retail',
                'credit_limit' => 500000,
                'is_active' => true,
            ]);
            Customer::query()->create([
                'name' => 'Settled Cafe',
                'type' => 'restaurant',
                'credit_limit' => 500000,
                'is_active' => true,
            ]);

            $ledger->recordCharge($hotel, 80000, $branchId);
            $ledger->recordCharge($walkIn, 15000, $branchId);
            $ledger->recordCharge($walkIn, 5000, $branchId);
        });

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.customers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customers/Index')
                ->where('totals.total_owed', 100000)
                ->where('totals.customers_owing', 2)
                ->where('totals.by_type.wholesale', 80000)
                ->where('totals.by_type.retail', 20000)
                ->where('totals.by_type.restaurant', 0)
            );
    }

    /**
     * @return array{0: \App\Models\Tenant, 1: User}
     */
    protected function provisionedOwner(): array
    {
        $suffix = uniqid();
        $email = "amina.customers.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Customer Debt Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_customers_'.$suffix,
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
