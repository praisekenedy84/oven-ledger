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
        $operationsId = MenuItem::query()->where('key', 'tenant.operations')->value('id');
        $cashier = Role::query()->where('name', 'cashier')->first();

        if (! $operationsId || ! $cashier) {
            return;
        }

        RoleMenuVisibility::query()->updateOrInsert(
            [
                'role_id' => $cashier->id,
                'menu_item_id' => $operationsId,
            ],
            ['visible' => false]
        );
    }

    public function down(): void
    {
        $operationsId = MenuItem::query()->where('key', 'tenant.operations')->value('id');
        $cashier = Role::query()->where('name', 'cashier')->first();

        if (! $operationsId || ! $cashier) {
            return;
        }

        RoleMenuVisibility::query()->updateOrInsert(
            [
                'role_id' => $cashier->id,
                'menu_item_id' => $operationsId,
            ],
            ['visible' => true]
        );
    }
};
