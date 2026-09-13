<?php

use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantUserDirectory;
use Illuminate\Support\Facades\Hash;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ownerEmail = 'owner@demo.test';

$tenant = Tenant::query()
    ->where('owner_email', $ownerEmail)
    ->orWhere('name', 'Demo Bakery')
    ->firstOrFail();

$username = 'owner';

$tenant->run(function () use ($ownerEmail, $username) {
    $user = User::query()->orderBy('id')->first();
    $user->update([
        'email' => $ownerEmail,
        'username' => $username,
        'password' => Hash::make('password'),
    ]);
    echo "Updated owner to {$user->fresh()->email} / {$user->fresh()->username} / password\n";
});

app(TenantUserDirectory::class)->register($ownerEmail, $tenant->id, $username);

echo "Registered {$ownerEmail} in central tenant user directory for tenant {$tenant->id}\n";
