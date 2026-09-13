<?php

/**
 * Backfill central tenant_users from existing tenant owner emails and
 * any users found in each tenant database.
 */

use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantUserDirectory;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$directory = app(TenantUserDirectory::class);
$registered = 0;

foreach (Tenant::query()->cursor() as $tenant) {
    if ($tenant->owner_email) {
        $directory->register($tenant->owner_email, $tenant->id);
        $registered++;
        echo "Owner: {$tenant->owner_email} -> {$tenant->id}\n";
    }

    $tenant->run(function () use ($directory, $tenant, &$registered) {
        foreach (User::query()->cursor() as $user) {
            $directory->register($user->email, $tenant->id);
            $registered++;
            echo "User:  {$user->email} -> {$tenant->id}\n";
        }
    });
}

echo "Done. Registered/updated {$registered} directory entries.\n";
