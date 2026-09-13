<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenants = App\Models\Tenant::all();
$directory = app(App\Services\TenantUserDirectory::class);

foreach ($tenants as $t) {
    echo "Tenant: {$t->id} | {$t->name} | status={$t->status} | owner={$t->owner_email}\n";

    $entries = App\Models\TenantUser::query()->where('tenant_id', $t->id)->get();
    foreach ($entries as $entry) {
        echo "  Directory: {$entry->email}\n";
    }

    try {
        $t->run(function () {
            echo '  Users: '.App\Models\User::count()."\n";
            foreach (App\Models\User::all() as $u) {
                echo "    - {$u->email}\n";
            }
            echo '  Branches: '.App\Models\Branch::count()."\n";
            echo '  Roles: '.App\Models\Role::count()."\n";
        });
    } catch (Throwable $e) {
        echo '  ERROR: '.$e->getMessage()."\n";
    }
}
