<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchFinishedGoodsStock;
use App\Models\BranchRawMaterialStock;
use App\Models\BusinessLiability;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\LiabilityPayment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OwnerTransaction;
use App\Models\Payment;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\RawMaterial;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\Role;
use App\Models\StockTransfer;
use App\Models\Supplier;
use App\Models\User;
use App\Models\UserRole;
use App\Models\ProductCategory;
use App\Models\WasteLog;
use App\Services\CustomerLedger;
use App\Services\TenantUserDirectory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    /** @var array<string, Branch> */
    protected array $branches = [];

    /** @var array<string, RawMaterial> */
    protected array $materials = [];

    /** @var array<string, Product> */
    protected array $products = [];

    /** @var array<string, Customer> */
    protected array $customers = [];

    /** @var array<string, CustomerAddress> */
    protected array $addresses = [];

    /** @var array<string, User> */
    protected array $staff = [];

    public function run(): void
    {
        $this->seedBranches();
        $this->seedStaff();
        $this->seedCatalog();
        $this->seedStock();
        $this->seedCustomers();
        $this->seedProcurement();
        $this->seedProduction();
        $this->seedTransfersAndWaste();
        $this->seedSalesAndLedger();
        $this->seedDebts();

        $this->command?->info('Demo bakery data is ready.');
    }

    protected function seedBranches(): void
    {
        $definitions = [
            'Main Branch' => [
                'address' => 'Uhuru Street, Kariakoo, Dar es Salaam',
                'phone' => '255222180100',
            ],
            'Masaki Counter' => [
                'address' => 'Haile Selassie Road, Masaki, Dar es Salaam',
                'phone' => '255222180200',
            ],
            'Mlimani Kiosk' => [
                'address' => 'Mlimani City Mall, Sam Nujoma Road, Dar es Salaam',
                'phone' => '255222180300',
            ],
        ];

        foreach ($definitions as $name => $attrs) {
            $this->branches[$name] = Branch::query()->updateOrCreate(
                ['name' => $name],
                [...$attrs, 'is_active' => true]
            );
        }
    }

    protected function seedStaff(): void
    {
        $roles = Role::query()->pluck('id', 'name');
        $directory = app(TenantUserDirectory::class);
        $tenantId = tenant()?->getTenantKey();
        $allBranchIds = collect($this->branches)->pluck('id')->all();

        $staff = [
            [
                'email' => 'owner@demo.test',
                'username' => 'owner',
                'name' => 'Amina Owner',
                'role' => 'owner',
                'branches' => $allBranchIds,
            ],
            [
                'email' => 'manager@demo.test',
                'username' => 'manager',
                'name' => 'Juma Mkude',
                'role' => 'branch_manager',
                'branches' => [
                    $this->branches['Masaki Counter']->id,
                    $this->branches['Mlimani Kiosk']->id,
                ],
            ],
            [
                'email' => 'cashier@demo.test',
                'username' => 'cashier',
                'name' => 'Neema Ally',
                'role' => 'cashier',
                'branches' => [$this->branches['Main Branch']->id],
            ],
            [
                'email' => 'baker@demo.test',
                'username' => 'baker',
                'name' => 'Baraka Mushi',
                'role' => 'production_staff',
                'branches' => [$this->branches['Main Branch']->id],
            ],
        ];

        foreach ($staff as $row) {
            $user = User::query()->firstOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'username' => $row['username'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );

            if (! filled($user->username)) {
                $user->update(['username' => $row['username']]);
            }

            $roleId = $roles[$row['role']] ?? null;

            if ($roleId) {
                UserRole::query()->firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'role_id' => $roleId,
                        'branch_id' => null,
                    ]
                );
            }

            $user->branches()->syncWithoutDetaching($row['branches']);
            $this->staff[$row['role']] = $user;

            if ($tenantId) {
                $directory->register($row['email'], $tenantId, $user->username);
            }
        }
    }

    protected function seedCatalog(): void
    {
        $materials = [
            'Wheat flour' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 25, 'unit_cost' => 1800],
            'Sugar' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 10, 'unit_cost' => 2800],
            'Yeast' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 2, 'unit_cost' => 12000],
            'Butter' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 5, 'unit_cost' => 14000],
            'Eggs' => ['unit_of_measure' => 'pcs', 'reorder_threshold' => 30, 'unit_cost' => 400],
            'Milk' => ['unit_of_measure' => 'L', 'reorder_threshold' => 8, 'unit_cost' => 2500],
            'Cooking oil' => ['unit_of_measure' => 'L', 'reorder_threshold' => 8, 'unit_cost' => 4500],
            'Salt' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 2, 'unit_cost' => 800],
            'Baking powder' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 1, 'unit_cost' => 8000],
            'Minced beef' => ['unit_of_measure' => 'kg', 'reorder_threshold' => 4, 'unit_cost' => 14000],
        ];

        foreach ($materials as $name => $attrs) {
            $this->materials[$name] = RawMaterial::query()->firstOrCreate(
                ['name' => $name],
                $attrs
            );
            $this->materials[$name]->fill($attrs)->save();
        }

        $products = [
            'White loaf' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Bread'],
            'Brown loaf' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Bread'],
            'Mandazi' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Pastry'],
            'Samosa' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Savoury'],
            'Chapati' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Bread'],
            'Queen cake' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Cake'],
            'Doughnut' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Pastry'],
            'Sausage roll' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Savoury'],
            'Cookie pack' => ['type' => 'produced', 'unit_of_measure' => 'pack', 'category' => 'Snack'],
            'Birthday cake' => ['type' => 'produced', 'unit_of_measure' => 'pcs', 'category' => 'Custom'],
            'Cake box' => ['type' => 'trading', 'unit_of_measure' => 'pcs', 'category' => 'Packaging', 'cost_price' => 600],
            'Rolling pin' => ['type' => 'trading', 'unit_of_measure' => 'pcs', 'category' => 'Tools', 'cost_price' => 5000],
            'Baking tray' => ['type' => 'trading', 'unit_of_measure' => 'pcs', 'category' => 'Tools', 'cost_price' => 9000],
            'Piping bag' => ['type' => 'trading', 'unit_of_measure' => 'pcs', 'category' => 'Tools', 'cost_price' => 1800],
        ];

        $categories = ProductCategory::query()->get()->keyBy(fn (ProductCategory $category) => mb_strtolower($category->name));

        foreach ($products as $name => $attrs) {
            $category = $categories->get(mb_strtolower((string) ($attrs['category'] ?? '')));

            $payload = [
                ...$attrs,
                'is_active' => true,
                'product_category_id' => $category?->id,
                'category' => $category?->name ?? ($attrs['category'] ?? null),
                'type' => $category?->productType() ?? $attrs['type'],
            ];

            $this->products[$name] = Product::query()->firstOrCreate(
                ['name' => $name],
                $payload
            );
            $this->products[$name]->fill($payload)->save();
        }

        $prices = [
            'White loaf' => ['retail' => 2000, 'wholesale' => 1600, 'restaurant' => 1500],
            'Brown loaf' => ['retail' => 2500, 'wholesale' => 2000, 'restaurant' => 1800],
            'Mandazi' => ['retail' => 500, 'wholesale' => 400, 'restaurant' => 400],
            'Samosa' => ['retail' => 1000, 'wholesale' => 800, 'restaurant' => 800],
            'Chapati' => ['retail' => 700, 'wholesale' => 500, 'restaurant' => 500],
            'Queen cake' => ['retail' => 1500, 'wholesale' => 1200, 'restaurant' => 1200],
            'Doughnut' => ['retail' => 800, 'wholesale' => 650, 'restaurant' => 650],
            'Sausage roll' => ['retail' => 1500, 'wholesale' => 1200, 'restaurant' => 1200],
            'Cookie pack' => ['retail' => 3000, 'wholesale' => 2400, 'restaurant' => 2400],
            'Birthday cake' => ['retail' => 45000, 'wholesale' => 42000, 'restaurant' => 42000],
            'Cake box' => ['retail' => 1500, 'wholesale' => 1200, 'restaurant' => 1200],
            'Rolling pin' => ['retail' => 8000, 'wholesale' => 7000, 'restaurant' => 7000],
            'Baking tray' => ['retail' => 15000, 'wholesale' => 13000, 'restaurant' => 13000],
            'Piping bag' => ['retail' => 3500, 'wholesale' => 3000, 'restaurant' => 3000],
        ];

        foreach ($prices as $productName => $channels) {
            foreach ($channels as $channel => $price) {
                PriceList::query()->firstOrCreate(
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
            'Brown loaf' => [
                'expected_yield' => 16,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 9, 'unit' => 'kg'],
                    ['material' => 'Yeast', 'quantity' => 0.12, 'unit' => 'kg'],
                    ['material' => 'Sugar', 'quantity' => 0.3, 'unit' => 'kg'],
                    ['material' => 'Salt', 'quantity' => 0.12, 'unit' => 'kg'],
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
            'Samosa' => [
                'expected_yield' => 30,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 1.5, 'unit' => 'kg'],
                    ['material' => 'Minced beef', 'quantity' => 1.2, 'unit' => 'kg'],
                    ['material' => 'Cooking oil', 'quantity' => 0.6, 'unit' => 'L'],
                    ['material' => 'Salt', 'quantity' => 0.04, 'unit' => 'kg'],
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
                    ['material' => 'Baking powder', 'quantity' => 0.03, 'unit' => 'kg'],
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
            'Sausage roll' => [
                'expected_yield' => 20,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 1.5, 'unit' => 'kg'],
                    ['material' => 'Butter', 'quantity' => 0.4, 'unit' => 'kg'],
                    ['material' => 'Minced beef', 'quantity' => 0.8, 'unit' => 'kg'],
                    ['material' => 'Eggs', 'quantity' => 2, 'unit' => 'pcs'],
                ],
            ],
            'Cookie pack' => [
                'expected_yield' => 12,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 1, 'unit' => 'kg'],
                    ['material' => 'Sugar', 'quantity' => 0.4, 'unit' => 'kg'],
                    ['material' => 'Butter', 'quantity' => 0.35, 'unit' => 'kg'],
                    ['material' => 'Eggs', 'quantity' => 2, 'unit' => 'pcs'],
                ],
            ],
            'Birthday cake' => [
                'expected_yield' => 1,
                'ingredients' => [
                    ['material' => 'Wheat flour', 'quantity' => 0.8, 'unit' => 'kg'],
                    ['material' => 'Sugar', 'quantity' => 0.6, 'unit' => 'kg'],
                    ['material' => 'Butter', 'quantity' => 0.4, 'unit' => 'kg'],
                    ['material' => 'Eggs', 'quantity' => 6, 'unit' => 'pcs'],
                    ['material' => 'Milk', 'quantity' => 0.3, 'unit' => 'L'],
                ],
            ],
        ];

        foreach ($recipes as $productName => $recipeData) {
            $recipe = Recipe::query()->firstOrCreate(
                ['product_id' => $this->products[$productName]->id],
                ['expected_yield' => $recipeData['expected_yield']]
            );

            foreach ($recipeData['ingredients'] as $ingredient) {
                RecipeIngredient::query()->firstOrCreate(
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

    protected function seedStock(): void
    {
        $main = $this->branches['Main Branch'];
        $masaki = $this->branches['Masaki Counter'];
        $mlimani = $this->branches['Mlimani Kiosk'];

        $rawByBranch = [
            $main->id => [
                'Wheat flour' => 18,
                'Sugar' => 22,
                'Yeast' => 1.2,
                'Butter' => 8,
                'Eggs' => 96,
                'Milk' => 14,
                'Cooking oil' => 20,
                'Salt' => 6,
                'Baking powder' => 2.5,
                'Minced beef' => 6,
            ],
            $masaki->id => [
                'Wheat flour' => 8,
                'Sugar' => 6,
                'Yeast' => 0.8,
                'Butter' => 2,
                'Eggs' => 24,
                'Milk' => 4,
                'Cooking oil' => 6,
                'Salt' => 2,
                'Baking powder' => 0.6,
                'Minced beef' => 2,
            ],
            $mlimani->id => [
                'Wheat flour' => 4,
                'Sugar' => 3,
                'Yeast' => 0.4,
                'Cooking oil' => 3,
                'Salt' => 1,
            ],
        ];

        foreach ($rawByBranch as $branchId => $rows) {
            foreach ($rows as $name => $qty) {
                BranchRawMaterialStock::query()->updateOrCreate(
                    [
                        'branch_id' => $branchId,
                        'raw_material_id' => $this->materials[$name]->id,
                    ],
                    ['quantity_on_hand' => $qty]
                );
            }
        }

        $finishedByBranch = [
            $main->id => [
                'White loaf' => 42,
                'Brown loaf' => 18,
                'Mandazi' => 60,
                'Samosa' => 36,
                'Chapati' => 28,
                'Queen cake' => 20,
                'Doughnut' => 24,
                'Sausage roll' => 16,
                'Cookie pack' => 4,
                'Birthday cake' => 1,
                'Cake box' => 40,
                'Rolling pin' => 6,
                'Baking tray' => 4,
                'Piping bag' => 12,
            ],
            $masaki->id => [
                'White loaf' => 16,
                'Mandazi' => 24,
                'Samosa' => 18,
                'Queen cake' => 8,
                'Doughnut' => 10,
                'Cookie pack' => 6,
                'Cake box' => 10,
            ],
            $mlimani->id => [
                'White loaf' => 8,
                'Mandazi' => 16,
                'Samosa' => 12,
                'Chapati' => 10,
                'Cookie pack' => 3,
            ],
        ];

        foreach ($finishedByBranch as $branchId => $rows) {
            foreach ($rows as $name => $qty) {
                BranchFinishedGoodsStock::query()->updateOrCreate(
                    [
                        'branch_id' => $branchId,
                        'product_id' => $this->products[$name]->id,
                    ],
                    [
                        'quantity_on_hand' => $qty,
                        'batch_reference' => 'SEED-'.strtoupper(substr($name, 0, 3)),
                    ]
                );
            }
        }
    }

    protected function seedCustomers(): void
    {
        $definitions = [
            'Fatma Hassan' => [
                'phone' => '255754111001',
                'email' => 'fatma.hassan@example.com',
                'type' => 'retail',
                'credit_limit' => 20000,
                'payment_terms' => 'Pay on collection',
            ],
            'John Kimaro' => [
                'phone' => '255715222003',
                'email' => null,
                'type' => 'retail',
                'credit_limit' => 30000,
                'payment_terms' => 'Weekly',
            ],
            'Shoppers Supermarket' => [
                'phone' => '255222450110',
                'email' => 'accounts@shoppers.example',
                'type' => 'wholesale',
                'tin_number' => '100-111-222',
                'credit_limit' => 800000,
                'payment_terms' => 'Net 14',
            ],
            'Mwenge Mini Market' => [
                'phone' => '255754333008',
                'email' => 'orders@mwenge-mini.example',
                'type' => 'wholesale',
                'tin_number' => '100-222-333',
                'credit_limit' => 250000,
                'payment_terms' => 'Net 7',
            ],
            'The Waterfront' => [
                'phone' => '255222600440',
                'email' => 'kitchen@waterfront.example',
                'type' => 'restaurant',
                'tin_number' => '100-444-555',
                'credit_limit' => 500000,
                'payment_terms' => 'Net 7',
            ],
            'Cafe Amani' => [
                'phone' => '255713555019',
                'email' => 'hello@cafeamani.example',
                'type' => 'restaurant',
                'tin_number' => '100-666-777',
                'credit_limit' => 200000,
                'payment_terms' => 'Weekly statement',
            ],
        ];

        foreach ($definitions as $name => $attrs) {
            $this->customers[$name] = Customer::query()->updateOrCreate(
                ['name' => $name],
                [...$attrs, 'is_active' => true]
            );
        }

        $addresses = [
            'Fatma Hassan' => [
                'Home' => [
                    'address_text' => 'House 14, Mikocheni B, Dar es Salaam',
                    'phone' => '255754111001',
                    'notes' => 'Call on arrival. Gate on the left.',
                ],
            ],
            'Shoppers Supermarket' => [
                'Receiving bay' => [
                    'address_text' => 'Shoppers Mikocheni, Old Bagamoyo Road',
                    'phone' => '255222450110',
                    'notes' => 'Deliver before 07:30. Ask for storekeeper Rashid.',
                ],
            ],
            'Mwenge Mini Market' => [
                'Store' => [
                    'address_text' => 'Mwenge bus stand, opposite TTCL',
                    'phone' => '255754333008',
                    'notes' => null,
                ],
            ],
            'The Waterfront' => [
                'Restaurant kitchen' => [
                    'address_text' => 'Msasani Peninsula, Yacht Club road',
                    'phone' => '255222600440',
                    'notes' => 'Use the staff entrance behind the terrace.',
                ],
            ],
            'Cafe Amani' => [
                'Counter' => [
                    'address_text' => 'Slipway, Msasani',
                    'phone' => '255713555019',
                    'notes' => 'Morning pastry drop only.',
                ],
            ],
        ];

        foreach ($addresses as $customerName => $rows) {
            foreach ($rows as $label => $attrs) {
                $this->addresses[$customerName.':'.$label] = CustomerAddress::query()->firstOrCreate(
                    [
                        'customer_id' => $this->customers[$customerName]->id,
                        'label' => $label,
                    ],
                    $attrs
                );
            }
        }
    }

    protected function seedProcurement(): void
    {
        $flourMill = Supplier::query()->firstOrCreate(
            ['name' => 'Bakhresa Food Products'],
            ['phone' => '255222110200', 'contact_person' => 'Salim Juma']
        );
        $dairy = Supplier::query()->firstOrCreate(
            ['name' => 'Tanga Fresh'],
            ['phone' => '255272644100', 'contact_person' => 'Grace Shirima']
        );
        $tools = Supplier::query()->firstOrCreate(
            ['name' => 'Dar Bakeware'],
            ['phone' => '255754880012', 'contact_person' => 'Peter Nyerere']
        );

        if (PurchaseOrder::query()->exists()) {
            return;
        }

        $received = PurchaseOrder::query()->create([
            'supplier_id' => $flourMill->id,
            'branch_id' => $this->branches['Main Branch']->id,
            'status' => 'received',
            'ordered_at' => now()->subDays(6)->setTime(10, 0),
            'received_at' => now()->subDays(4)->setTime(14, 30),
        ]);
        PurchaseOrderItem::query()->create([
            'purchase_order_id' => $received->id,
            'raw_material_id' => $this->materials['Wheat flour']->id,
            'quantity' => 200,
            'unit_cost' => 1800,
        ]);
        PurchaseOrderItem::query()->create([
            'purchase_order_id' => $received->id,
            'raw_material_id' => $this->materials['Yeast']->id,
            'quantity' => 10,
            'unit_cost' => 8500,
        ]);

        $open = PurchaseOrder::query()->create([
            'supplier_id' => $dairy->id,
            'branch_id' => $this->branches['Main Branch']->id,
            'status' => 'ordered',
            'ordered_at' => now()->subDay()->setTime(9, 0),
        ]);
        PurchaseOrderItem::query()->create([
            'purchase_order_id' => $open->id,
            'raw_material_id' => $this->materials['Milk']->id,
            'quantity' => 40,
            'unit_cost' => 2500,
        ]);
        PurchaseOrderItem::query()->create([
            'purchase_order_id' => $open->id,
            'raw_material_id' => $this->materials['Butter']->id,
            'quantity' => 15,
            'unit_cost' => 14000,
        ]);

        $draft = PurchaseOrder::query()->create([
            'supplier_id' => $tools->id,
            'branch_id' => $this->branches['Masaki Counter']->id,
            'status' => 'draft',
        ]);
        PurchaseOrderItem::query()->create([
            'purchase_order_id' => $draft->id,
            'product_id' => $this->products['Baking tray']->id,
            'quantity' => 8,
            'unit_cost' => 11000,
        ]);
        PurchaseOrderItem::query()->create([
            'purchase_order_id' => $draft->id,
            'product_id' => $this->products['Cake box']->id,
            'quantity' => 100,
            'unit_cost' => 900,
        ]);
    }

    protected function seedProduction(): void
    {
        if (ProductionBatch::query()->exists()) {
            return;
        }

        $main = $this->branches['Main Branch'];
        $masaki = $this->branches['Masaki Counter'];

        $this->createBatch($main, 'White loaf', 'planned', 40, now()->addHours(2), 'OL-WHT-001');
        $this->createBatch($main, 'White loaf', 'baking', 40, now()->subMinutes(40), 'OL-WHT-002');
        $this->createBatch($main, 'Mandazi', 'cooling', 80, now()->subHours(2), 'OL-MAN-001');
        $this->createBatch($main, 'Birthday cake', 'planned', 1, now()->addHours(6), 'OL-CAK-001');
        $this->createBatch($masaki, 'Samosa', 'ready', 30, now()->subHours(1), 'OL-SAM-001', now()->addDay());
        $this->createBatch($main, 'Queen cake', 'ready', 24, now()->subHours(3), 'OL-QUE-001', now()->addDays(2));
        $this->createBatch($main, 'Brown loaf', 'dispatched', 16, now()->subDay(), 'OL-BRN-001', now()->addDay());
    }

    protected function createBatch(
        Branch $branch,
        string $productName,
        string $status,
        float $planned,
        Carbon $when,
        string $batchNumber,
        ?Carbon $expiry = null,
    ): void {
        $product = $this->products[$productName];
        $recipe = Recipe::query()->where('product_id', $product->id)->firstOrFail();

        $batch = ProductionBatch::query()->create([
            'branch_id' => $branch->id,
            'product_id' => $product->id,
            'recipe_id' => $recipe->id,
            'batch_number' => $batchNumber,
            'planned_quantity' => $planned,
            'actual_quantity' => in_array($status, ['ready', 'dispatched'], true) ? $planned : null,
            'status' => $status,
            'produced_at' => in_array($status, ['ready', 'dispatched'], true) ? $when : null,
            'expiry_date' => $expiry?->toDateString(),
        ]);
        $batch->forceFill([
            'created_at' => $when,
            'updated_at' => $when,
        ])->save();
    }

    protected function seedTransfersAndWaste(): void
    {
        if (! StockTransfer::query()->exists()) {
            StockTransfer::query()->create([
                'from_branch_id' => $this->branches['Main Branch']->id,
                'to_branch_id' => $this->branches['Masaki Counter']->id,
                'product_id' => $this->products['White loaf']->id,
                'quantity' => 20,
                'status' => 'received',
                'dispatched_at' => now()->subDay()->setTime(6, 10),
                'received_at' => now()->subDay()->setTime(7, 5),
            ]);
            StockTransfer::query()->create([
                'from_branch_id' => $this->branches['Main Branch']->id,
                'to_branch_id' => $this->branches['Mlimani Kiosk']->id,
                'product_id' => $this->products['Mandazi']->id,
                'quantity' => 30,
                'status' => 'dispatched',
                'dispatched_at' => now()->subHours(2),
            ]);
        }

        if (! WasteLog::query()->exists()) {
            WasteLog::query()->create([
                'branch_id' => $this->branches['Main Branch']->id,
                'product_id' => $this->products['White loaf']->id,
                'quantity' => 4,
                'reason' => 'expired',
                'logged_at' => now()->subDay()->setTime(20, 15),
            ]);
            WasteLog::query()->create([
                'branch_id' => $this->branches['Masaki Counter']->id,
                'product_id' => $this->products['Samosa']->id,
                'quantity' => 3,
                'reason' => 'damaged',
                'logged_at' => now()->subHours(5),
            ]);
            WasteLog::query()->create([
                'branch_id' => $this->branches['Mlimani Kiosk']->id,
                'product_id' => $this->products['Mandazi']->id,
                'quantity' => 6,
                'reason' => 'given_away',
                'logged_at' => now()->subHours(8),
            ]);
        }
    }

    protected function seedSalesAndLedger(): void
    {
        if (Order::query()->exists()) {
            return;
        }

        $ledger = app(CustomerLedger::class);
        $main = $this->branches['Main Branch'];
        $masaki = $this->branches['Masaki Counter'];
        $mlimani = $this->branches['Mlimani Kiosk'];

        foreach (range(6, 0) as $daysAgo) {
            $morning = now()->subDays($daysAgo)->setTime(8, 20);
            $midday = now()->subDays($daysAgo)->setTime(12, 40);
            $evening = now()->subDays($daysAgo)->setTime(17, 10);

            $this->createSale(
                $main,
                'retail',
                $morning,
                [
                    ['product' => 'White loaf', 'qty' => 8 + $daysAgo],
                    ['product' => 'Mandazi', 'qty' => 20],
                    ['product' => 'Queen cake', 'qty' => 6],
                ],
                [['method' => 'cash', 'amount' => null]],
                ['cashier' => 'cashier'],
            );
            $this->createSale(
                $masaki,
                'retail',
                $midday,
                [
                    ['product' => 'Samosa', 'qty' => 12],
                    ['product' => 'Doughnut', 'qty' => 8],
                    ['product' => 'Cookie pack', 'qty' => 2],
                ],
                [['method' => 'mobile_money', 'amount' => null, 'provider' => 'M-Pesa']],
                ['cashier' => 'branch_manager'],
            );
            $this->createSale(
                $mlimani,
                'retail',
                $evening,
                [
                    ['product' => 'Chapati', 'qty' => 10],
                    ['product' => 'Sausage roll', 'qty' => 4],
                ],
                [['method' => 'card', 'amount' => null]],
                ['cashier' => 'branch_manager'],
            );
        }

        $this->createSale(
            $main,
            'retail',
            now()->subDays(2)->setTime(15, 0),
            [
                ['product' => 'Cake box', 'qty' => 6],
                ['product' => 'Piping bag', 'qty' => 2],
                ['product' => 'Rolling pin', 'qty' => 1],
            ],
            [['method' => 'cash', 'amount' => null]],
        );

        $shoppersCharge = $this->createSale(
            $main,
            'wholesale',
            now()->subDays(45)->setTime(6, 30),
            [
                ['product' => 'White loaf', 'qty' => 80],
                ['product' => 'Brown loaf', 'qty' => 20],
            ],
            [['method' => 'credit_account', 'amount' => null]],
            [
                'customer' => 'Shoppers Supermarket',
                'fulfillment' => 'delivery',
                'address' => 'Shoppers Supermarket:Receiving bay',
            ],
        );
        $ledger->recordCharge(
            $this->customers['Shoppers Supermarket'],
            (float) $shoppersCharge->total_amount,
            $main->id,
            $shoppersCharge->id,
            'Standing bread order',
            $shoppersCharge->created_at,
        );
        $ledger->recordPayment(
            $this->customers['Shoppers Supermarket'],
            20000,
            $main->id,
            $shoppersCharge->id,
            'Partial M-Pesa',
            now()->subDays(30)->setTime(11, 0),
        );

        $shoppersRecent = $this->createSale(
            $main,
            'wholesale',
            now()->subDays(4)->setTime(6, 20),
            [
                ['product' => 'White loaf', 'qty' => 60],
                ['product' => 'Mandazi', 'qty' => 40],
            ],
            [
                ['method' => 'mobile_money', 'amount' => 40000, 'provider' => 'M-Pesa'],
                ['method' => 'credit_account', 'amount' => null],
            ],
            [
                'customer' => 'Shoppers Supermarket',
                'fulfillment' => 'delivery',
                'address' => 'Shoppers Supermarket:Receiving bay',
            ],
        );
        $credit = $this->creditAmount($shoppersRecent);
        if ($credit > 0) {
            $ledger->recordCharge(
                $this->customers['Shoppers Supermarket'],
                $credit,
                $main->id,
                $shoppersRecent->id,
                'Sale #'.$shoppersRecent->id,
                $shoppersRecent->created_at,
            );
        }

        $this->createSale(
            $main,
            'wholesale',
            now()->addDay()->setTime(6, 30),
            [
                ['product' => 'White loaf', 'qty' => 70],
                ['product' => 'Brown loaf', 'qty' => 20],
            ],
            [['method' => 'mobile_money', 'amount' => 40000, 'provider' => 'Airtel']],
            [
                'customer' => 'Shoppers Supermarket',
                'preOrder' => true,
                'status' => 'pending',
                'fulfillment' => 'delivery',
                'address' => 'Shoppers Supermarket:Receiving bay',
                'requestedAt' => now()->addDay()->setTime(6, 30),
            ],
        );

        $mini = $this->createSale(
            $main,
            'wholesale',
            now()->subDays(8)->setTime(7, 0),
            [
                ['product' => 'White loaf', 'qty' => 30],
                ['product' => 'Samosa', 'qty' => 20],
            ],
            [['method' => 'credit_account', 'amount' => null]],
            [
                'customer' => 'Mwenge Mini Market',
                'fulfillment' => 'delivery',
                'address' => 'Mwenge Mini Market:Store',
            ],
        );
        $ledger->recordCharge(
            $this->customers['Mwenge Mini Market'],
            (float) $mini->total_amount,
            $main->id,
            $mini->id,
            'Weekly supply',
            $mini->created_at,
        );

        $waterfrontOld = $this->createSale(
            $main,
            'restaurant',
            now()->subDays(70)->setTime(5, 45),
            [
                ['product' => 'White loaf', 'qty' => 40],
                ['product' => 'Chapati', 'qty' => 40],
                ['product' => 'Sausage roll', 'qty' => 20],
            ],
            [['method' => 'credit_account', 'amount' => null]],
            [
                'customer' => 'The Waterfront',
                'fulfillment' => 'delivery',
                'address' => 'The Waterfront:Restaurant kitchen',
            ],
        );
        $ledger->recordCharge(
            $this->customers['The Waterfront'],
            (float) $waterfrontOld->total_amount,
            $main->id,
            $waterfrontOld->id,
            'July breakfast contract',
            $waterfrontOld->created_at,
        );

        $this->createSale(
            $main,
            'restaurant',
            now()->subHours(2),
            [
                ['product' => 'White loaf', 'qty' => 24],
                ['product' => 'Queen cake', 'qty' => 12],
            ],
            [['method' => 'cash', 'amount' => 20000]],
            [
                'customer' => 'The Waterfront',
                'preOrder' => true,
                'status' => 'pending',
                'fulfillment' => 'delivery',
                'address' => 'The Waterfront:Restaurant kitchen',
                'requestedAt' => now()->addDay()->setTime(6, 0),
                'deposit' => 20000,
            ],
        );

        $this->createSale(
            $masaki,
            'restaurant',
            now()->subDays(1)->setTime(7, 15),
            [
                ['product' => 'Mandazi', 'qty' => 30],
                ['product' => 'Doughnut', 'qty' => 20],
            ],
            [['method' => 'card', 'amount' => null]],
            [
                'customer' => 'Cafe Amani',
                'fulfillment' => 'delivery',
                'address' => 'Cafe Amani:Counter',
            ],
        );

        $john = $this->createSale(
            $main,
            'retail',
            now()->subDays(40)->setTime(16, 20),
            [
                ['product' => 'Cookie pack', 'qty' => 5],
            ],
            [['method' => 'credit_account', 'amount' => null]],
            ['customer' => 'John Kimaro'],
        );
        $ledger->recordCharge(
            $this->customers['John Kimaro'],
            (float) $john->total_amount,
            $main->id,
            $john->id,
            'Office snack tray',
            $john->created_at,
        );

        $fatma = $this->createSale(
            $main,
            'retail',
            now()->subHours(6),
            [
                ['product' => 'White loaf', 'qty' => 4],
            ],
            [['method' => 'credit_account', 'amount' => null]],
            [
                'customer' => 'Fatma Hassan',
                'fulfillment' => 'delivery',
                'address' => 'Fatma Hassan:Home',
            ],
        );
        $ledger->recordCharge(
            $this->customers['Fatma Hassan'],
            (float) $fatma->total_amount,
            $main->id,
            $fatma->id,
            'Sale #'.$fatma->id,
            $fatma->created_at,
        );

        $this->createSale(
            $main,
            'custom',
            now()->addDays(2)->setTime(10, 0),
            [
                ['product' => 'Birthday cake', 'qty' => 1],
                ['product' => 'Cake box', 'qty' => 1],
            ],
            [['method' => 'mobile_money', 'amount' => 20000, 'provider' => 'M-Pesa']],
            [
                'customer' => 'Fatma Hassan',
                'preOrder' => true,
                'status' => 'pending',
                'fulfillment' => 'pickup',
                'requestedAt' => now()->addDays(2)->setTime(10, 0),
                'deposit' => 20000,
            ],
        );
    }

    /**
     * @param  list<array{product: string, qty: float|int}>  $items
     * @param  list<array{method: string, amount: float|int|null, provider?: string}>  $payments
     * @param  array{customer?: string, preOrder?: bool, status?: string, fulfillment?: string, address?: string, requestedAt?: Carbon, deposit?: float|int, cashier?: string}  $options
     */
    protected function createSale(
        Branch $branch,
        string $channel,
        Carbon $soldAt,
        array $items,
        array $payments,
        array $options = [],
    ): Order {
        $priceChannel = $channel === 'custom' ? 'retail' : $channel;
        $lineItems = [];
        $total = 0.0;

        foreach ($items as $item) {
            if ($item['qty'] <= 0) {
                continue;
            }

            $price = (float) PriceList::query()
                ->where('product_id', $this->products[$item['product']]->id)
                ->where('channel', $priceChannel)
                ->value('price');
            $lineTotal = round($price * (float) $item['qty'], 2);
            $total = round($total + $lineTotal, 2);
            $lineItems[] = [
                'product' => $item['product'],
                'qty' => $item['qty'],
                'price' => $price,
                'line_total' => $lineTotal,
            ];
        }

        $isPreOrder = (bool) ($options['preOrder'] ?? false);
        $fulfillment = $options['fulfillment'] ?? 'pickup';
        $customer = isset($options['customer']) ? $this->customers[$options['customer']] : null;
        $address = isset($options['address']) ? $this->addresses[$options['address']] : null;

        $cashierKey = $options['cashier'] ?? ($channel === 'retail' ? 'cashier' : 'owner');
        if ($branch->name !== 'Main Branch' && ($options['cashier'] ?? null) === null && $channel !== 'retail') {
            $cashierKey = 'branch_manager';
        }

        $order = new Order([
            'branch_id' => $branch->id,
            'created_by' => $this->staff[$cashierKey]->id ?? $this->staff['owner']->id ?? null,
            'customer_id' => $customer?->id,
            'channel' => $channel,
            'status' => $options['status'] ?? 'completed',
            'deposit_amount' => $isPreOrder ? ($options['deposit'] ?? collect($payments)->sum(fn ($p) => $p['amount'] ?? 0)) : null,
            'due_date' => isset($options['requestedAt']) ? $options['requestedAt']->toDateString() : null,
            'total_amount' => $total,
            'is_pre_order' => $isPreOrder,
            'fulfillment_type' => $fulfillment,
            'requested_fulfillment_at' => $options['requestedAt'] ?? null,
            'delivery_address_id' => $address?->id,
        ]);
        $order->created_at = $soldAt;
        $order->updated_at = $soldAt;
        $order->save();

        foreach ($lineItems as $line) {
            OrderItem::query()->create([
                'order_id' => $order->id,
                'product_id' => $this->products[$line['product']]->id,
                'quantity' => $line['qty'],
                'unit_price' => $line['price'],
                'line_total' => $line['line_total'],
            ]);
        }

        $allocated = 0.0;
        $pendingCredit = null;

        foreach ($payments as $payment) {
            $amount = $payment['amount'];

            if ($amount === null) {
                $amount = round($total - $allocated, 2);
            }

            $amount = round((float) $amount, 2);

            if ($payment['method'] === 'credit_account' && $amount <= 0) {
                $pendingCredit = $payment;
                continue;
            }

            Payment::query()->create([
                'order_id' => $order->id,
                'method' => $payment['method'],
                'amount' => $amount,
                'provider' => $payment['provider'] ?? null,
                'paid_at' => $soldAt,
            ]);
            $allocated = round($allocated + $amount, 2);
        }

        $shortfall = round($total - $allocated, 2);

        if ($shortfall > 0.009 && ($pendingCredit || collect($payments)->contains(fn ($p) => $p['method'] === 'credit_account'))) {
            Payment::query()->create([
                'order_id' => $order->id,
                'method' => 'credit_account',
                'amount' => $shortfall,
                'paid_at' => $soldAt,
            ]);
        }

        return $order->fresh(['items', 'payments']);
    }

    protected function creditAmount(Order $order): float
    {
        return round((float) $order->payments
            ->where('method', 'credit_account')
            ->sum('amount'), 2);
    }

    protected function seedDebts(): void
    {
        $flour = BusinessLiability::query()->firstOrCreate(
            ['creditor_name' => 'Bakhresa Food Products'],
            [
                'branch_id' => $this->branches['Main Branch']->id,
                'type' => 'supplier_credit',
                'original_amount' => 450000,
                'balance_remaining' => 300000,
                'due_date' => now()->addDays(12)->toDateString(),
                'status' => 'open',
                'notes' => 'August flour and yeast invoice.',
            ]
        );
        LiabilityPayment::query()->firstOrCreate(
            [
                'business_liability_id' => $flour->id,
                'notes' => 'First instalment via NMB.',
            ],
            [
                'amount' => 150000,
                'paid_at' => now()->subDays(5)->setTime(11, 20),
            ]
        );

        BusinessLiability::query()->firstOrCreate(
            ['creditor_name' => 'NMB Bank — oven loan'],
            [
                'branch_id' => null,
                'type' => 'loan',
                'original_amount' => 3500000,
                'balance_remaining' => 2800000,
                'due_date' => now()->addMonths(8)->toDateString(),
                'status' => 'open',
                'notes' => 'Deck oven financed over 18 months.',
            ]
        );

        $settled = BusinessLiability::query()->firstOrCreate(
            ['creditor_name' => 'Masaki shopfitters'],
            [
                'branch_id' => $this->branches['Masaki Counter']->id,
                'type' => 'other',
                'original_amount' => 180000,
                'balance_remaining' => 0,
                'due_date' => now()->subDays(10)->toDateString(),
                'status' => 'settled',
                'notes' => 'Counter joinery for the Masaki outlet.',
            ]
        );
        LiabilityPayment::query()->firstOrCreate(
            [
                'business_liability_id' => $settled->id,
                'notes' => 'Paid in full.',
            ],
            [
                'amount' => 180000,
                'paid_at' => now()->subDays(3)->setTime(9, 0),
            ]
        );

        $ownerRows = [
            [
                'type' => 'capital_injection',
                'amount' => 5000000,
                'transacted_at' => now()->subMonths(3)->setTime(10, 0),
                'notes' => 'Opening capital for Kariakoo bakery.',
            ],
            [
                'type' => 'capital_injection',
                'amount' => 800000,
                'transacted_at' => now()->subMonth()->setTime(14, 0),
                'notes' => 'Working capital for Masaki counter.',
            ],
            [
                'type' => 'drawing',
                'amount' => 250000,
                'transacted_at' => now()->subDays(9)->setTime(16, 0),
                'notes' => 'Owner drawing — school fees.',
            ],
        ];

        foreach ($ownerRows as $row) {
            OwnerTransaction::query()->firstOrCreate(
                ['notes' => $row['notes']],
                $row
            );
        }
    }
}
