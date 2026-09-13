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
        $legacy = MenuItem::query()->where('key', 'tenant.clients')->first();

        if ($legacy) {
            $legacy->update([
                'key' => 'tenant.customers',
                'label' => 'Customers',
                'route_name' => 'tenant.customers.index',
                'feature_key' => null,
            ]);
        }

        app(MenuCatalog::class)->sync();

        $sales = MenuItem::query()->where('key', 'tenant.sales')->first();
        $debts = MenuItem::query()->where('key', 'tenant.debts')->first();

        if (! $debts) {
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
                    'menu_item_id' => $debts->id,
                ],
                [
                    'available' => $salesAvailable,
                ]
            );
        }
    }

    public function down(): void
    {
        $customers = MenuItem::query()->where('key', 'tenant.customers')->first();

        if ($customers) {
            $customers->update([
                'key' => 'tenant.clients',
                'label' => 'Clients',
                'route_name' => 'tenant.clients.index',
                'feature_key' => 'wholesale_module',
            ]);
        }
    }
};
