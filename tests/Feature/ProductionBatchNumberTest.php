<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\Recipe;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ProductionBatchNumberTest extends TestCase
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

    public function test_store_assigns_sequential_daily_batch_numbers(): void
    {
        Carbon::setTestNow('2026-09-14 08:30:00');

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Batch Number Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_batches',
            'owner_email' => 'amina.batches@example.test',
            'owner_password' => 'password',
            'max_branches' => 1,
        ]);

        $productId = $tenant->run(function () {
            $product = Product::query()->create([
                'name' => 'White loaf',
                'type' => 'produced',
                'unit_of_measure' => 'loaf',
                'category' => 'bread',
                'is_active' => true,
            ]);

            $recipe = Recipe::query()->create([
                'product_id' => $product->id,
                'expected_yield' => 40,
            ]);

            return $product->id;
        });

        $user = $tenant->run(
            fn () => User::query()->where('email', 'amina.batches@example.test')->firstOrFail()
        );

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.production-batches.store'), [
                'product_id' => $productId,
                'planned_quantity' => 40,
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Production batch PB-20260914-0001 scheduled.');

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.production-batches.store'), [
                'product_id' => $productId,
                'planned_quantity' => 24,
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Production batch PB-20260914-0002 scheduled.');

        $numbers = $tenant->run(
            fn () => ProductionBatch::query()->orderBy('id')->pluck('batch_number')->all()
        );

        $this->assertSame(['PB-20260914-0001', 'PB-20260914-0002'], $numbers);
    }
}
