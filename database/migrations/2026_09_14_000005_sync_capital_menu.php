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

        $capital = MenuItem::query()->where('key', 'tenant.capital')->first();
        $sales = MenuItem::query()->where('key', 'tenant.sales')->first();

        if (! $capital) {
            return;
        }

        $tenantIds = TenantMenuAvailability::query()->distinct()->pluck('tenant_id');

        foreach ($tenantIds as $tenantId) {
            $salesAvailable = $sales
                ? TenantMenuAvailability::query()
                    ->where('tenant_id', $tenantId)
                    ->where('menu_item_id', $sales->id)
                    ->where('available', true)
                    ->exists()
                : true;

            TenantMenuAvailability::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'menu_item_id' => $capital->id,
                ],
                [
                    'available' => $salesAvailable,
                ]
            );
        }
    }

    public function down(): void
    {
        $capital = MenuItem::query()->where('key', 'tenant.capital')->first();

        if (! $capital) {
            return;
        }

        TenantMenuAvailability::query()->where('menu_item_id', $capital->id)->delete();
        $capital->delete();
    }
};
