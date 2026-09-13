<?php

use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Services\TenantProvisioner;
use Database\Seeders\DemoDataSeeder;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$admin = PlatformAdmin::query()->first();
$ownerEmail = 'owner@demo.test';

$tenant = Tenant::query()
    ->where('owner_email', $ownerEmail)
    ->orWhere('name', 'Demo Bakery')
    ->first();

if ($tenant) {
    echo "Tenant already exists: {$tenant->id} ({$tenant->name})\n";
} else {
    $tenant = app(TenantProvisioner::class)->provision([
        'name' => 'Demo Bakery',
        'owner_name' => 'Amina Owner',
        'owner_username' => 'owner',
        'owner_email' => $ownerEmail,
        'owner_phone' => '255700000000',
        'owner_password' => 'password',
        'max_branches' => 3,
        'feature_flags' => [
            'wholesale_module' => true,
            'restaurant_module' => true,
            'trading_goods_module' => true,
            'custom_orders_module' => true,
            'multi_branch' => true,
            'inter_branch_transfers' => true,
            'tra_fiscalization' => false,
        ],
    ], $admin?->id);

    echo "Created tenant {$tenant->id}\n";
}

$tenant->run(function () {
    $seeder = new DemoDataSeeder;
    $seeder->setContainer(app());
    $seeder->run();
});

echo "Demo data seeded.\n";
echo "Logins (shared URL /login), password for all: password\n";
echo "  owner / owner@demo.test     Amina Owner (all branches)\n";
echo "  manager / manager@demo.test Juma Mkude (Masaki + Mlimani)\n";
echo "  cashier / cashier@demo.test Neema Ally (Main Branch)\n";
echo "  baker / baker@demo.test     Baraka Mushi (Main Branch production)\n";
