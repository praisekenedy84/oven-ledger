<?php

declare(strict_types=1);

use App\Models\PlatformPermission;
use App\Models\PlatformRole;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $permission = PlatformPermission::query()->firstOrCreate(
            ['key' => 'tenants.impersonate'],
            [
                'label' => 'Impersonate tenant users',
                'group' => 'tenants',
            ]
        );

        $role = PlatformRole::query()->where('is_default', true)->first();

        if ($role) {
            $role->permissions()->syncWithoutDetaching([$permission->id]);
        }
    }

    public function down(): void
    {
        $permission = PlatformPermission::query()
            ->where('key', 'tenants.impersonate')
            ->first();

        if (! $permission) {
            return;
        }

        $permission->roles()->detach();
        $permission->delete();
    }
};
