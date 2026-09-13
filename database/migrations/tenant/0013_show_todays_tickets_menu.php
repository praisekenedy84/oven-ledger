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
        $ticketsId = MenuItem::query()->where('key', 'tenant.pos.tickets')->value('id');
        $posId = MenuItem::query()->where('key', 'tenant.pos')->value('id');

        if (! $ticketsId) {
            return;
        }

        $roleIds = Role::query()
            ->whereIn('name', ['owner', 'branch_manager', 'cashier'])
            ->pluck('id');

        if ($posId) {
            $roleIds = $roleIds->merge(
                RoleMenuVisibility::query()
                    ->where('menu_item_id', $posId)
                    ->where('visible', true)
                    ->pluck('role_id')
            );
        }

        foreach ($roleIds->unique() as $roleId) {
            RoleMenuVisibility::query()->updateOrInsert(
                [
                    'role_id' => $roleId,
                    'menu_item_id' => $ticketsId,
                ],
                ['visible' => true]
            );
        }
    }

    public function down(): void
    {
        $ticketsId = MenuItem::query()->where('key', 'tenant.pos.tickets')->value('id');

        if (! $ticketsId) {
            return;
        }

        RoleMenuVisibility::query()->where('menu_item_id', $ticketsId)->delete();
    }
};
