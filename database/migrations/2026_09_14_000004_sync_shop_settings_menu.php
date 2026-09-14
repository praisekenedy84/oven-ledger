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

        $shop = MenuItem::query()->where('key', 'tenant.shop')->first();
        $settings = MenuItem::query()->where('key', 'tenant.settings')->first();

        if (! $shop) {
            return;
        }

        $tenantIds = TenantMenuAvailability::query()->distinct()->pluck('tenant_id');

        foreach ($tenantIds as $tenantId) {
            $settingsAvailable = $settings
                ? TenantMenuAvailability::query()
                    ->where('tenant_id', $tenantId)
                    ->where('menu_item_id', $settings->id)
                    ->where('available', true)
                    ->exists()
                : true;

            TenantMenuAvailability::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'menu_item_id' => $shop->id,
                ],
                [
                    'available' => $settingsAvailable,
                ]
            );
        }
    }

    public function down(): void
    {
        $shop = MenuItem::query()->where('key', 'tenant.shop')->first();

        if (! $shop) {
            return;
        }

        TenantMenuAvailability::query()->where('menu_item_id', $shop->id)->delete();
        $shop->delete();
    }
};
