<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantFeatureFlag;
use Illuminate\Support\Facades\Cache;

class FeatureGate
{
    public function enabled(string $featureKey, ?string $tenantId = null): bool
    {
        $tenantId = $tenantId ?? tenant('id');

        if (! $tenantId) {
            return false;
        }

        return Cache::remember(
            "tenant:{$tenantId}:feature:{$featureKey}",
            now()->addMinutes(5),
            function () use ($tenantId, $featureKey) {
                return tenancy()->central(function () use ($tenantId, $featureKey) {
                    return TenantFeatureFlag::query()
                        ->where('tenant_id', $tenantId)
                        ->where('feature_key', $featureKey)
                        ->value('enabled') ?? false;
                });
            }
        );
    }

    public function all(?string $tenantId = null): array
    {
        $tenantId = $tenantId ?? tenant('id');

        if (! $tenantId) {
            return [];
        }

        return Cache::remember(
            "tenant:{$tenantId}:features",
            now()->addMinutes(5),
            function () use ($tenantId) {
                return tenancy()->central(function () use ($tenantId) {
                    return TenantFeatureFlag::query()
                        ->where('tenant_id', $tenantId)
                        ->pluck('enabled', 'feature_key')
                        ->toArray();
                });
            }
        );
    }

    public function forget(string $tenantId): void
    {
        Cache::forget("tenant:{$tenantId}:features");

        foreach (config('ovenledger.feature_keys', []) as $featureKey) {
            Cache::forget("tenant:{$tenantId}:feature:{$featureKey}");
        }
    }

    public function tenantIsActive(?Tenant $tenant = null): bool
    {
        $tenant = $tenant ?? tenant();

        if (! $tenant instanceof Tenant) {
            return false;
        }

        return $tenant->isActive();
    }
}
