<?php

declare(strict_types=1);

use App\Models\MenuItem;
use App\Models\Role;
use App\Models\RoleMenuVisibility;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $capitalId = MenuItem::query()->where('key', 'tenant.capital')->value('id');
        $debtsId = MenuItem::query()->where('key', 'tenant.debts')->value('id');

        if (! $capitalId) {
            return;
        }

        $roleIds = Role::query()
            ->whereIn('name', ['owner', 'branch_manager'])
            ->pluck('id');

        if ($debtsId) {
            $roleIds = $roleIds->merge(
                RoleMenuVisibility::query()
                    ->where('menu_item_id', $debtsId)
                    ->where('visible', true)
                    ->pluck('role_id')
            );
        }

        foreach ($roleIds->unique() as $roleId) {
            RoleMenuVisibility::query()->updateOrInsert(
                [
                    'role_id' => $roleId,
                    'menu_item_id' => $capitalId,
                ],
                ['visible' => true]
            );
        }
    }

    public function down(): void
    {
        $capitalId = MenuItem::query()->where('key', 'tenant.capital')->value('id');

        if (! $capitalId) {
            return;
        }

        RoleMenuVisibility::query()->where('menu_item_id', $capitalId)->delete();
    }
};
