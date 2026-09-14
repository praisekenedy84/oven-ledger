<?php

namespace Database\Seeders;

use App\Models\PlatformAdmin;
use App\Models\PlatformPermission;
use App\Models\PlatformRole;
use App\Support\MenuCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['key' => 'tenants.view', 'label' => 'View tenants', 'group' => 'tenants'],
            ['key' => 'tenants.manage', 'label' => 'Manage tenants', 'group' => 'tenants'],
            ['key' => 'tenants.impersonate', 'label' => 'Impersonate tenant users', 'group' => 'tenants'],
            ['key' => 'feature_flags.manage', 'label' => 'Manage feature flags', 'group' => 'features'],
            ['key' => 'branches.suspend', 'label' => 'Suspend branches', 'group' => 'branches'],
            ['key' => 'roles.manage', 'label' => 'Manage platform roles', 'group' => 'roles'],
            ['key' => 'audit.view', 'label' => 'View audit log', 'group' => 'audit'],
        ];

        foreach ($permissions as $permission) {
            PlatformPermission::query()->firstOrCreate(
                ['key' => $permission['key']],
                $permission
            );
        }

        $role = PlatformRole::query()->firstOrCreate(
            ['name' => 'Super Admin'],
            ['is_default' => true]
        );

        $role->permissions()->sync(PlatformPermission::pluck('id'));

        $admin = PlatformAdmin::query()->firstOrCreate(
            ['email' => 'admin@mernet.co.tz'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
            ]
        );

        $admin->roles()->syncWithoutDetaching([$role->id]);

        app(MenuCatalog::class)->sync();
    }
}
