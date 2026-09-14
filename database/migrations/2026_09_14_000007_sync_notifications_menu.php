<?php

declare(strict_types=1);

use App\Models\MenuItem;
use App\Models\TenantMenuAvailability;
use App\Support\MenuCatalog;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(MenuCatalog::class)->sync();

        $notifications = MenuItem::query()->where('key', 'tenant.notifications')->first();
        $dashboard = MenuItem::query()->where('key', 'tenant.dashboard')->first();

        if (! $notifications) {
            return;
        }

        $tenantIds = TenantMenuAvailability::query()->distinct()->pluck('tenant_id');

        foreach ($tenantIds as $tenantId) {
            $dashboardAvailable = $dashboard
                ? TenantMenuAvailability::query()
                    ->where('tenant_id', $tenantId)
                    ->where('menu_item_id', $dashboard->id)
                    ->where('available', true)
                    ->exists()
                : true;

            TenantMenuAvailability::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'menu_item_id' => $notifications->id,
                ],
                [
                    'available' => $dashboardAvailable,
                ]
            );
        }
    }

    public function down(): void
    {
        $notifications = MenuItem::query()->where('key', 'tenant.notifications')->first();

        if (! $notifications) {
            return;
        }

        TenantMenuAvailability::query()->where('menu_item_id', $notifications->id)->delete();
        $notifications->delete();
    }
};
