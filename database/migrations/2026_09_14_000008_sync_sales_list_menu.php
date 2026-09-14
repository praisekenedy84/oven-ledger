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

        $salesList = MenuItem::query()->where('key', 'tenant.sales.list')->first();
        $salesParent = MenuItem::query()->where('key', 'tenant.sales')->first();

        if (! $salesList) {
            return;
        }

        $tenantIds = TenantMenuAvailability::query()->distinct()->pluck('tenant_id');

        foreach ($tenantIds as $tenantId) {
            $parentAvailable = $salesParent
                ? TenantMenuAvailability::query()
                    ->where('tenant_id', $tenantId)
                    ->where('menu_item_id', $salesParent->id)
                    ->where('available', true)
                    ->exists()
                : true;

            TenantMenuAvailability::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'menu_item_id' => $salesList->id,
                ],
                [
                    'available' => $parentAvailable,
                ]
            );
        }
    }

    public function down(): void
    {
        $salesList = MenuItem::query()->where('key', 'tenant.sales.list')->first();

        if (! $salesList) {
            return;
        }

        TenantMenuAvailability::query()->where('menu_item_id', $salesList->id)->delete();
        $salesList->delete();
    }
};
