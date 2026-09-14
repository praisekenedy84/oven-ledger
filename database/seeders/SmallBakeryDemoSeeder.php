<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchFinishedGoodsStock;
use App\Models\BranchRawMaterialStock;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OwnerTransaction;
use App\Models\Payment;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\RawMaterial;
use App\Models\RawMaterialStockMovement;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\Role;
use App\Models\ShopSetting;
use App\Models\User;
use App\Models\UserRole;
use App\Services\FinishedGoodsInventory;
use App\Services\TenantUserDirectory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Compact single-counter bakery: no production batches, shelf intake for POS.
 */
class SmallBakeryDemoSeeder extends Seeder
{
    /** @var array<string, RawMaterial> */
    protected array $materials = [];

    /** @var array<string, Product> */
    protected array $products = [];

    protected Branch $branch;

    public function run(): void
    {
        $this->branch = Branch::query()->firstOrCreate(
            ['name' => 'Main Branch'],
            [
                'address' => 'Morogoro Road, Magomeni, Dar es Salaam',
                'phone' => '255714000100',
                'is_active' => true,
            ]
        );

        $this->seedShop();
        $this->seedStaff();
        $this->seedCatalog();
        $this->seedRawMaterials();
        $this->seedShelfStock();
        $this->seedCustomersAndSales();
        $this->seedCapital();

        $this->command?->info('Small bakery demo data is ready.');
    }

    protected function seedShop(): void
    {
        $shop = ShopSetting::current();
        $shop->fill([
            'shop_name' => 'Mama Neema Breads',
        ])->save();
    }

    protected function seedStaff(): void
    {
        $roles = Role::query()->pluck('id', 'name');
        $directory = app(TenantUserDirectory::class);
        $tenantId = tenant()?->getTenantKey();

        $staff = [
            [
                'email' => 'owner@small.bakery.test',
                'username' => 'small_owner',
                'name' => 'Neema Mushi',
                'role' => 'owner',
            ],
            [
                'email' => 'cashier@small.bakery.test',
                'username' => 'small_cashier',
                'name' => 'Asha Juma',
                'role' => 'cashier',
            ],
        ];

        foreach ($staff as $row) {
            $user = User::query()->updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'username' => $row['username'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );

            $roleId = $roles[$row['role']] ?? null;

            if ($roleId) {
                UserRole::query()->updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'role_id' => $roleId,
                        'branch_id' => null,
                    ],
                    []
                );
            }

            $user->branches()->syncWithoutDetaching([$this->branch->id]);

            if ($tenantId) {
                $directory->register($row['email'], $tenantId, $row['username']);
            }
        }
    }

    protected function seedCatalog(): void
    {
        $materials = [
            'Wheat flour' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 10, 'unit_cost' => 1800],
            'Sugar' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 5, 'unit_cost' => 2800],
            'Yeast' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 1, 'unit_cost' => 12000],
            'Cooking oil' => ['unit_of_measure' => 'L', 'reorder_threshold' => 4, 'unit_cost' => 4500],
            'Salt' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 1, 'unit_cost' => 800],
            'Eggs' => ['unit_of_measure' => 'pcs', 'reorder_threshold' => 20, 'unit_cost' => 400],
            'Butter' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 2, 'unit_cost' => 14000],
            'Milk' => ['unit_of_measure' => 'L', 'reorder_threshold' => 4, 'unit_cost' => 2500],
        ];

        foreach ($materials as $name => $attrs) {
            $this->materials[$name] = RawMaterial::query()->updateOrCreate(
                ['name' => $name],
                $attrs
            );
        }

        $products = [
            'White loaf' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Bread'],
            'Mandazi' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Pastry'],
            'Chapati' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Bread'],
            'Queen cake' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Cake'],
            'Doughnut' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Pastry'],
        ];

        $categories = ProductCategory::query()
            ->get()
            ->keyBy(fn (ProductCategory $category) => mb_strtolower($category->name));

        foreach ($products as $name => $attrs) {
            $category = $categories->get(mb_strtolower((string) ($attrs['category'] ?? '')));

            $payload = [
                ...$attrs,
                'is_active' => true,
                'product_category_id' => $category?->id,
                'category' => $category?->name ?? ($attrs['category'] ?? null),
                'type' => $category?->productType() ?? $attrs['type'],
            ];

            $this->products[$name] = Product::query()->updateOrCreate(
                ['name' => $name],
                $payload
            );
        }

        $prices = [
            'White loaf' => ['retail' => 2000, 'wholesale' => 1600, 'restaurant' => 1500],
            'Mandazi' => ['retail' => 500, 'wholesale' => 400, 'restaurant' => 400],
            'Chapati' => ['retail' => 700, 'wholesale' => 500, 'restaurant' => 500],
            'Queen cake' => ['retail' => 1500, 'wholesale' => 1200, 'restaurant' => 1200],
            'Doughnut' => ['retail' => 800, 'wholesale' => 650, 'restaurant' => 650],
        ];

        foreach ($prices as $productName => $channels) {
            foreach ($channels as $channel => $price) {
                PriceList::query()->updateOrCreate(
                    [
                        'product_id' => $this->products[$productName]->id,
                        'channel' => $channel,
                    ],
                    ['price' => $price]
                );
            }
        }

        $recipes = [
            'White loaf' => [
                'expected_yield' => 20,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 10, 'unit' => 'kg'],
                    ['material' => 'Yeast', 'quantity' => 0.15, 'unit' => 'kg'],
                    ['material' => 'Sugar', 'quantity' => 0.4, 'unit' => 'kg'],
                    ['material' => 'Salt', 'quantity' => 0.15, 'unit' => 'kg'],
                    ['material' => 'Cooking oil', 'quantity' => 0.3, 'unit' => 'L'],
                ],
            ],
            'Mandazi' => [
                'expected_yield' => 40,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 2, 'unit' => 'kg'],
                    ['material' => 'Sugar', 'quantity' => 0.5, 'unit' => 'kg'],
                    ['material' => 'Yeast', 'quantity' => 0.05, 'unit' => 'kg'],
                    ['material' => 'Eggs', 'quantity' => 2, 'unit' => 'pcs'],
                    ['material' => 'Cooking oil', 'quantity' => 0.8, 'unit' => 'L'],
                ],
            ],
            'Chapati' => [
                'expected_yield' => 25,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 2, 'unit' => 'kg'],
                    ['material' => 'Cooking oil', 'quantity' => 0.25, 'unit' => 'L'],
                    ['material' => 'Salt', 'quantity' => 0.03, 'unit' => 'kg'],
                ],
            ],
            'Queen cake' => [
                'expected_yield' => 24,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 1.2, 'unit' => 'kg'],
                    ['material' => 'Sugar', 'quantity' => 0.8, 'unit' => 'kg'],
                    ['material' => 'Butter', 'quantity' => 0.4, 'unit' => 'kg'],
                    ['material' => 'Eggs', 'quantity' => 8, 'unit' => 'pcs'],
                    ['material' => 'Milk', 'quantity' => 0.4, 'unit' => 'L'],
                ],
            ],
            'Doughnut' => [
                'expected_yield' => 30,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 2, 'unit' => 'kg'],
                    ['material' => 'Sugar', 'quantity' => 0.4, 'unit' => 'kg'],
                    ['material' => 'Yeast', 'quantity' => 0.06, 'unit' => 'kg'],
                    ['material' => 'Milk', 'quantity' => 0.5, 'unit' => 'L'],
                    ['material' => 'Cooking oil', 'quantity' => 1, 'unit' => 'L'],
                ],
            ],
        ];

        foreach ($recipes as $productName => $recipeData) {
            $recipe = Recipe::query()->updateOrCreate(
                ['product_id' => $this->products[$productName]->id],
                ['expected_yield' => $recipeData['expected_yield']]
            );

            foreach ($recipeData['ingredients'] as $ingredient) {
                RecipeIngredient::query()->updateOrCreate(
                    [
                        'recipe_id' => $recipe->id,
                        'raw_material_id' => $this->materials[$ingredient['material']]->id,
                    ],
                    [
                        'quantity' => $ingredient['quantity'],
                        'unit' => $ingredient['unit'],
                    ]
                );
            }
        }
    }

    protected function seedRawMaterials(): void
    {
        $opening = [
            'Wheat flour' => 80,
            'Sugar' => 25,
            'Yeast' => 3,
            'Cooking oil' => 20,
            'Salt' => 5,
            'Eggs' => 120,
            'Butter' => 8,
            'Milk' => 15,
        ];

        foreach ($opening as $name => $qty) {
            $material = $this->materials[$name];

            BranchRawMaterialStock::query()->updateOrCreate(
                [
                    'branch_id' => $this->branch->id,
                    'raw_material_id' => $material->id,
                ],
                ['quantity_on_hand' => $qty]
            );

            $hasHistory = RawMaterialStockMovement::query()
                ->where('branch_id', $this->branch->id)
                ->where('raw_material_id', $material->id)
                ->exists();

            if (! $hasHistory) {
                RawMaterialStockMovement::query()->create([
                    'branch_id' => $this->branch->id,
                    'raw_material_id' => $material->id,
                    'type' => RawMaterialStockMovement::TYPE_OPENING,
                    'quantity' => $qty,
                    'quantity_after' => $qty,
                    'unit_cost' => $material->unit_cost,
                    'notes' => 'Opening balance',
                    'occurred_at' => now()->subDays(3),
                ]);
            }
        }
    }

    protected function seedShelfStock(): void
    {
        if (BranchFinishedGoodsStock::query()->where('branch_id', $this->branch->id)->exists()) {
            return;
        }

        $inventory = app(FinishedGoodsInventory::class);

        $morningBake = [
            'White loaf' => 24,
            'Mandazi' => 40,
            'Chapati' => 25,
            'Queen cake' => 18,
            'Doughnut' => 20,
        ];

        foreach ($morningBake as $name => $qty) {
            $inventory->receive(
                $this->branch->id,
                $this->products[$name]->id,
                $qty,
                'Morning bake — seeded shelf intake',
            );
        }
    }

    protected function seedCustomersAndSales(): void
    {
        Customer::query()->firstOrCreate(
            ['phone' => '255715111222'],
            [
                'name' => 'Fatuma Ally',
                'email' => 'fatuma@example.test',
                'type' => 'retail',
                'credit_limit' => 20000,
                'payment_terms' => 'Pay on collection',
                'is_active' => true,
            ]
        );

        if (Order::query()->exists()) {
            return;
        }

        $cashier = User::query()->where('email', 'cashier@small.bakery.test')->first()
            ?? User::query()->where('email', 'owner@small.bakery.test')->first();

        foreach ([
            [
                'when' => now()->subDays(1)->setTime(8, 15),
                'items' => [
                    ['product' => 'White loaf', 'qty' => 4],
                    ['product' => 'Mandazi', 'qty' => 10],
                ],
            ],
            [
                'when' => now()->subDays(1)->setTime(12, 40),
                'items' => [
                    ['product' => 'Chapati', 'qty' => 6],
                    ['product' => 'Queen cake', 'qty' => 4],
                ],
            ],
            [
                'when' => now()->setTime(9, 5),
                'items' => [
                    ['product' => 'Doughnut', 'qty' => 8],
                    ['product' => 'White loaf', 'qty' => 2],
                ],
            ],
        ] as $sale) {
            $this->createCashSale($sale['when'], $sale['items'], $cashier?->id);
        }
    }

    /**
     * @param  list<array{product: string, qty: float|int}>  $items
     */
    protected function createCashSale($when, array $items, ?int $cashierId): void
    {
        $lines = [];
        $total = 0.0;

        foreach ($items as $item) {
            $product = $this->products[$item['product']];
            $unitPrice = (float) PriceList::query()
                ->where('product_id', $product->id)
                ->where('channel', 'retail')
                ->value('price');
            $qty = (float) $item['qty'];
            $lineTotal = round($unitPrice * $qty, 2);
            $total += $lineTotal;
            $lines[] = [
                'product' => $product,
                'qty' => $qty,
                'unit_price' => $unitPrice,
                'line_total' => $lineTotal,
            ];
        }

        $order = new Order([
            'branch_id' => $this->branch->id,
            'created_by' => $cashierId,
            'channel' => 'retail',
            'status' => 'completed',
            'fulfillment_type' => 'walk_in',
            'total_amount' => $total,
            'is_pre_order' => false,
            'stock_deducted' => true,
        ]);
        $order->created_at = $when;
        $order->updated_at = $when;
        $order->save();

        foreach ($lines as $line) {
            OrderItem::query()->create([
                'order_id' => $order->id,
                'product_id' => $line['product']->id,
                'quantity' => $line['qty'],
                'unit_price' => $line['unit_price'],
                'line_total' => $line['line_total'],
            ]);

            $stock = BranchFinishedGoodsStock::query()
                ->where('branch_id', $this->branch->id)
                ->where('product_id', $line['product']->id)
                ->orderBy('id')
                ->first();

            $stock?->decrement('quantity_on_hand', $line['qty']);
        }

        Payment::query()->create([
            'order_id' => $order->id,
            'method' => 'cash',
            'amount' => $total,
            'paid_at' => $when,
        ]);
    }

    protected function seedCapital(): void
    {
        if (OwnerTransaction::query()->exists()) {
            return;
        }

        OwnerTransaction::query()->create([
            'type' => 'capital_injection',
            'amount' => 1500000,
            'transacted_at' => now()->subDays(10),
            'notes' => 'Opening capital for Mama Neema Breads.',
        ]);
    }
}
