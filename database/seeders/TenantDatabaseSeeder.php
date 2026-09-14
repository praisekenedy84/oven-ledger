<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Permission;
use App\Models\Role;
use App\Models\ShopSetting;
use App\Services\TenantAccessCatalog;
use App\Support\ProductCategoryCatalog;
use Illuminate\Database\Seeder;

class TenantDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['key' => 'pos.sell', 'label' => 'Take sales', 'group' => 'pos'],
            ['key' => 'pos.refund', 'label' => 'Issue refunds', 'group' => 'pos'],
            ['key' => 'inventory.view', 'label' => 'View inventory', 'group' => 'inventory'],
            ['key' => 'inventory.transfer', 'label' => 'Transfer stock', 'group' => 'inventory'],
            ['key' => 'production.manage', 'label' => 'Manage production', 'group' => 'production'],
            ['key' => 'reports.view_own_branch', 'label' => 'View own branch reports', 'group' => 'reports'],
            ['key' => 'reports.view_all_branches', 'label' => 'View all branch reports', 'group' => 'reports'],
            ['key' => 'wholesale.manage_clients', 'label' => 'Manage wholesale clients', 'group' => 'wholesale'],
            ['key' => 'customers.manage', 'label' => 'Manage customers', 'group' => 'customers'],
            ['key' => 'debts.manage', 'label' => 'Manage business debts', 'group' => 'debts'],
            ['key' => 'expenses.manage', 'label' => 'Manage shop expenses', 'group' => 'expenses'],
            ['key' => 'staff.manage', 'label' => 'Manage staff', 'group' => 'staff'],
            ['key' => 'roles.manage', 'label' => 'Manage roles and menus', 'group' => 'staff'],
            ['key' => 'branches.manage', 'label' => 'Manage branches', 'group' => 'branches'],
            ['key' => 'catalog.manage', 'label' => 'Manage catalog', 'group' => 'catalog'],
            ['key' => 'shop.manage', 'label' => 'Manage shop settings', 'group' => 'settings'],
        ];

        foreach ($permissions as $permission) {
            Permission::query()->firstOrCreate(
                ['key' => $permission['key']],
                $permission
            );
        }

        $allPermissionIds = Permission::pluck('id');

        $roles = [
            'owner' => $allPermissionIds->all(),
            'branch_manager' => Permission::whereIn('key', [
                'pos.sell', 'pos.refund', 'inventory.view', 'inventory.transfer',
                'production.manage', 'reports.view_own_branch', 'wholesale.manage_clients',
                'customers.manage', 'debts.manage', 'expenses.manage', 'staff.manage', 'catalog.manage', 'shop.manage',
            ])->pluck('id')->all(),
            'cashier' => Permission::whereIn('key', ['pos.sell'])->pluck('id')->all(),
            'production_staff' => Permission::whereIn('key', [
                'production.manage', 'inventory.view',
            ])->pluck('id')->all(),
        ];

        foreach ($roles as $name => $permissionIds) {
            $role = Role::query()->firstOrCreate(
                ['name' => $name],
                ['is_default' => true]
            );

            $role->permissions()->sync($permissionIds);
        }

        app(TenantAccessCatalog::class)->seedDefaultMenuVisibility();

        ProductCategoryCatalog::seed();
        ShopSetting::current();

        Branch::query()->firstOrCreate(
            ['name' => 'Main Branch'],
            [
                'address' => null,
                'phone' => null,
                'is_active' => true,
            ]
        );
    }
}
