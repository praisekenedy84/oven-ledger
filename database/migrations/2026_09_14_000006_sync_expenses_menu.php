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

        $expenses = MenuItem::query()->where('key', 'tenant.expenses')->first();
        $sales = MenuItem::query()->where('key', 'tenant.sales')->first();

        if (! $expenses) {
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
                    'menu_item_id' => $expenses->id,
                ],
                [
                    'available' => $salesAvailable,
                ]
            );
        }
    }

    public function down(): void
    {
        $expenses = MenuItem::query()->where('key', 'tenant.expenses')->first();

        if (! $expenses) {
            return;
        }

        TenantMenuAvailability::query()->where('menu_item_id', $expenses->id)->delete();
        $expenses->delete();
    }
};
