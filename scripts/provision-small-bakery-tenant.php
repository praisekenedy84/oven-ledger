<?php

use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Services\TenantProvisioner;
use Database\Seeders\SmallBakeryDemoSeeder;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$admin = PlatformAdmin::query()->first();
$ownerEmail = 'owner@small.bakery.test';

$tenant = Tenant::query()
    ->where('owner_email', $ownerEmail)
    ->orWhere('name', 'Mama Neema Breads')
    ->first();

if ($tenant) {
    echo "Tenant already exists: {$tenant->id} ({$tenant->name})\n";

    if ($tenant->business_size !== Tenant::SIZE_SMALL) {
        app(\App\Services\BusinessSizeProfile::class)->apply(
            $tenant,
            Tenant::SIZE_SMALL,
            $admin?->id,
        );
        echo "Updated bakery size to small.\n";
    }
} else {
    $tenant = app(TenantProvisioner::class)->provision([
        'name' => 'Mama Neema Breads',
        'owner_name' => 'Neema Mushi',
        'owner_username' => 'small_owner',
        'owner_email' => $ownerEmail,
        'owner_phone' => '255714000100',
        'owner_password' => 'password',
        'max_branches' => 1,
        'business_size' => Tenant::SIZE_SMALL,
    ], $admin?->id);

    echo "Created small bakery tenant {$tenant->id}\n";
}

$tenant->run(function () {
    $seeder = new SmallBakeryDemoSeeder;
    $seeder->setContainer(app());
    $seeder->run();
});

echo "Small bakery demo data seeded.\n";
echo "Logins (shared URL /login), password for all: password\n";
echo "  small_owner / owner@small.bakery.test     Neema Mushi (owner)\n";
echo "  small_cashier / cashier@small.bakery.test  Asha Juma (cashier)\n";
echo "Production is off — add finished goods from Inventory → Add to shelf.\n";
