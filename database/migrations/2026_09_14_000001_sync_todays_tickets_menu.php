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

        $tickets = MenuItem::query()->where('key', 'tenant.pos.tickets')->first();
        $pos = MenuItem::query()->where('key', 'tenant.pos')->first();

        if (! $tickets) {
            return;
        }

        $tenantIds = TenantMenuAvailability::query()->distinct()->pluck('tenant_id');

        foreach ($tenantIds as $tenantId) {
            $posAvailable = $pos
                ? TenantMenuAvailability::query()
                    ->where('tenant_id', $tenantId)
                    ->where('menu_item_id', $pos->id)
                    ->where('available', true)
                    ->exists()
                : true;

            TenantMenuAvailability::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'menu_item_id' => $tickets->id,
                ],
                [
                    'available' => $posAvailable,
                ]
            );
        }
    }

    public function down(): void
    {
        $tickets = MenuItem::query()->where('key', 'tenant.pos.tickets')->first();

        if (! $tickets) {
            return;
        }

        TenantMenuAvailability::query()->where('menu_item_id', $tickets->id)->delete();
        $tickets->delete();
    }
};
