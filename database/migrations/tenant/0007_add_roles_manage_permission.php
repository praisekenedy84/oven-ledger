<?php

declare(strict_types=1);

use App\Models\MenuItem;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleMenuVisibility;
use App\Services\TenantAccessCatalog;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::query()->firstOrCreate(
            ['key' => 'roles.manage'],
            [
                'label' => 'Manage roles and menus',
                'group' => 'staff',
            ]
        );

        $owner = Role::query()->where('name', 'owner')->first();

        if ($owner) {
            $owner->permissions()->syncWithoutDetaching([$permission->id]);
        }

        app(TenantAccessCatalog::class)->seedDefaultMenuVisibility();

        $roleMenu = MenuItem::query()->where('key', 'tenant.roles')->first();
        $settingsMenu = MenuItem::query()->where('key', 'tenant.settings')->first();

        if ($owner && $roleMenu) {
            foreach (array_filter([$settingsMenu?->id, $roleMenu->id]) as $menuItemId) {
                RoleMenuVisibility::query()->updateOrInsert(
                    [
                        'role_id' => $owner->id,
                        'menu_item_id' => $menuItemId,
                    ],
                    ['visible' => true]
                );
            }
        }
    }

    public function down(): void
    {
        Permission::query()->where('key', 'roles.manage')->delete();
    }
};
