<?php

namespace Tests\Feature;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\RawMaterial;
use App\Models\Recipe;
use App\Models\ShopSetting;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatalogAndShopSettingsTest extends TestCase
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

    public function test_categories_are_pre_seeded_and_owner_can_add_one(): void
    {
        [$tenant, $user] = $this->provisionedOwner();

        $slugs = $tenant->run(
            fn () => ProductCategory::query()->orderBy('slug')->pluck('slug')->all()
        );

        $this->assertContains('bread', $slugs);
        $this->assertContains('hardware', $slugs);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.shop.categories.store'), [
                'name' => 'Drinks',
                'kind' => 'produced',
            ])
            ->assertRedirect();

        $exists = $tenant->run(
            fn () => ProductCategory::query()->where('name', 'Drinks')->where('kind', 'produced')->exists()
        );

        $this->assertTrue($exists);
    }

    public function test_baked_product_requires_a_recipe_and_hardware_does_not(): void
    {
        [$tenant, $user] = $this->provisionedOwner();

        [$breadId, $hardwareId, $flourId] = $tenant->run(function () {
            $flour = RawMaterial::query()->create([
                'name' => 'Wheat flour',
                'unit_of_measure' => 'kg',
                'reorder_threshold' => 1,
                'unit_cost' => 1800,
            ]);

            return [
                ProductCategory::query()->where('slug', 'bread')->value('id'),
                ProductCategory::query()->where('slug', 'hardware')->value('id'),
                $flour->id,
            ];
        });

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->from(route('tenant.products.create'))
            ->post(route('tenant.products.store'), [
                'name' => 'White loaf',
                'product_category_id' => $breadId,
                'unit_of_measure' => 'pcs',
                'is_active' => true,
            ])
            ->assertRedirect(route('tenant.products.create'))
            ->assertSessionHasErrors(['expected_yield', 'ingredients']);

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.products.store'), [
                'name' => 'White loaf',
                'product_category_id' => $breadId,
                'unit_of_measure' => 'pcs',
                'is_active' => true,
                'expected_yield' => 20,
                'ingredients' => [
                    ['raw_material_id' => $flourId, 'quantity' => 10, 'unit' => 'kg'],
                ],
                'prices' => ['retail' => 2000],
            ])
            ->assertRedirect(route('tenant.products.index'));

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.products.store'), [
                'name' => 'Rolling pin',
                'product_category_id' => $hardwareId,
                'unit_of_measure' => 'pcs',
                'cost_price' => 5000,
                'is_active' => true,
                'prices' => ['retail' => 8000],
            ])
            ->assertRedirect(route('tenant.products.index'));

        $tenant->run(function () {
            $loaf = Product::query()->where('name', 'White loaf')->firstOrFail();
            $pin = Product::query()->where('name', 'Rolling pin')->firstOrFail();

            $this->assertSame('produced', $loaf->type);
            $this->assertTrue($loaf->recipe()->exists());
            $this->assertSame('trading', $pin->type);
            $this->assertFalse($pin->recipe()->exists());
        });
    }

    public function test_production_uses_the_product_recipe_automatically(): void
    {
        [$tenant, $user] = $this->provisionedOwner();

        $productId = $tenant->run(function () {
            $product = Product::query()->create([
                'name' => 'Mandazi',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'is_active' => true,
            ]);

            Recipe::query()->create([
                'product_id' => $product->id,
                'expected_yield' => 40,
            ]);

            return $product->id;
        });

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.production-batches.store'), [
                'product_id' => $productId,
                'planned_quantity' => 40,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');
    }

    public function test_owner_can_save_shop_branding(): void
    {
        Storage::fake('public');

        [$tenant, $user] = $this->provisionedOwner();

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->post(route('tenant.shop.update'), [
                'shop_name' => 'Kariakoo Oven',
                'primary_color' => '#7A1F2C',
                'accent_color' => '#D4A017',
                'logo' => UploadedFile::fake()->image('mark.png', 80, 80),
            ])
            ->assertRedirect();

        $tenant->run(function () {
            $settings = ShopSetting::current();

            $this->assertSame('Kariakoo Oven', $settings->shop_name);
            $this->assertSame('#7A1F2C', $settings->primary_color);
            $this->assertNotNull($settings->logo_path);
            Storage::disk('public')->assertExists($settings->logo_path);
        });
    }

    public function test_products_index_can_be_searched_by_name_and_category(): void
    {
        [$tenant, $user] = $this->provisionedOwner();

        $tenant->run(function () {
            $bread = ProductCategory::query()->where('slug', 'bread')->firstOrFail();
            $hardware = ProductCategory::query()->where('slug', 'hardware')->firstOrFail();

            Product::query()->create([
                'name' => 'Mandazi',
                'type' => 'produced',
                'unit_of_measure' => 'pcs',
                'category' => $bread->name,
                'product_category_id' => $bread->id,
                'is_active' => true,
            ]);

            Product::query()->create([
                'name' => 'Rolling pin',
                'type' => 'trading',
                'unit_of_measure' => 'pcs',
                'category' => $hardware->name,
                'product_category_id' => $hardware->id,
                'cost_price' => 5000,
                'is_active' => true,
            ]);
        });

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.products.index', ['search' => 'manda']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Products/Index')
                ->where('filters.search', 'manda')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Mandazi'));

        $this->actingAs($user)
            ->withSession([InitializeTenancyBySession::SESSION_KEY => $tenant->getTenantKey()])
            ->get(route('tenant.products.index', ['search' => 'hardware']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Products/Index')
                ->where('filters.search', 'hardware')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Rolling pin'));
    }

    /**
     * @return array{0: \App\Models\Tenant, 1: User}
     */
    protected function provisionedOwner(): array
    {
        $suffix = uniqid();
        $email = "amina.catalog.{$suffix}@example.test";

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Catalog Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_catalog_'.$suffix,
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
