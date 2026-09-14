<?php

declare(strict_types=1);

use App\Models\MenuItem;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleMenuVisibility;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('operating_expenses')) {
            Schema::create('operating_expenses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
                $table->string('category');
                $table->string('payee');
                $table->decimal('amount', 15, 2);
                $table->timestamp('incurred_at');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['incurred_at', 'category']);
            });
        }

        $permission = Permission::query()->firstOrCreate(
            ['key' => 'expenses.manage'],
            ['label' => 'Manage shop expenses', 'group' => 'expenses']
        );

        Role::query()
            ->whereIn('name', ['owner', 'branch_manager'])
            ->get()
            ->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permission->id]));

        $menuId = MenuItem::query()->where('key', 'tenant.expenses')->value('id');
        $salesId = MenuItem::query()->where('key', 'tenant.sales')->value('id');

        if (! $menuId) {
            return;
        }

        $roleIds = Role::query()
            ->whereIn('name', ['owner', 'branch_manager'])
            ->pluck('id');

        if ($salesId) {
            $roleIds = $roleIds->merge(
                RoleMenuVisibility::query()
                    ->where('menu_item_id', $salesId)
                    ->where('visible', true)
                    ->pluck('role_id')
            );
        }

        foreach ($roleIds->unique() as $roleId) {
            RoleMenuVisibility::query()->updateOrInsert(
                [
                    'role_id' => $roleId,
                    'menu_item_id' => $menuId,
                ],
                ['visible' => true]
            );
        }
    }

    public function down(): void
    {
        $menuId = MenuItem::query()->where('key', 'tenant.expenses')->value('id');

        if ($menuId) {
            RoleMenuVisibility::query()->where('menu_item_id', $menuId)->delete();
        }

        $permission = Permission::query()->where('key', 'expenses.manage')->first();

        if ($permission) {
            $permission->roles()->detach();
            $permission->delete();
        }

        Schema::dropIfExists('operating_expenses');
    }
};
