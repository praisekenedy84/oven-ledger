<?php

declare(strict_types=1);

use App\Models\Tenant;
use App\Models\TenantFeatureFlag;
use App\Support\MenuCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('business_size', 16)->default('medium')->after('max_branches');
        });

        app(MenuCatalog::class)->sync();

        $tenantIds = Tenant::query()->pluck('id');

        foreach ($tenantIds as $tenantId) {
            TenantFeatureFlag::query()->firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'feature_key' => 'production_module',
                ],
                [
                    'enabled' => true,
                ]
            );
        }
    }

    public function down(): void
    {
        TenantFeatureFlag::query()->where('feature_key', 'production_module')->delete();

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('business_size');
        });
    }
};
