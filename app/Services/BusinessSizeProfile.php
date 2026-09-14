<?php

namespace App\Services;

use App\Models\PlatformAuditLog;
use App\Models\Tenant;
use App\Models\TenantFeatureFlag;
use Illuminate\Validation\ValidationException;

class BusinessSizeProfile
{
    public function __construct(
        protected FeatureGate $featureGate,
    ) {}

    /**
     * @return list<string>
     */
    public function sizes(): array
    {
        return config('ovenledger.business_sizes', [
            Tenant::SIZE_SMALL,
            Tenant::SIZE_MEDIUM,
            Tenant::SIZE_LARGE,
        ]);
    }

    /**
     * @return array<string, bool>
     */
    public function presetFlags(string $size): array
    {
        $presets = config('ovenledger.business_size_presets', []);

        return $presets[$size] ?? [];
    }

    /**
     * Apply bakery size and merge its feature presets onto the tenant.
     *
     * @param  array<string, bool>|null  $flagOverrides  Optional overrides after the size preset
     */
    public function apply(Tenant $tenant, string $size, ?int $platformAdminId = null, ?array $flagOverrides = null): Tenant
    {
        if (! in_array($size, $this->sizes(), true)) {
            throw ValidationException::withMessages([
                'business_size' => 'Choose a valid bakery size.',
            ]);
        }

        $tenant->update(['business_size' => $size]);

        $flags = $this->presetFlags($size);

        if ($flagOverrides !== null) {
            foreach ($flagOverrides as $key => $enabled) {
                if (in_array($key, config('ovenledger.feature_keys', []), true)) {
                    $flags[$key] = (bool) $enabled;
                }
            }
        }

        foreach ($flags as $featureKey => $enabled) {
            TenantFeatureFlag::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'feature_key' => $featureKey,
                ],
                [
                    'enabled' => (bool) $enabled,
                    'updated_by_platform_admin_id' => $platformAdminId,
                ]
            );
        }

        $this->featureGate->forget($tenant->id);

        if ($platformAdminId) {
            PlatformAuditLog::create([
                'platform_admin_id' => $platformAdminId,
                'action' => 'tenant.business_size_updated',
                'target_type' => Tenant::class,
                'target_id' => $tenant->id,
                'meta' => [
                    'business_size' => $size,
                    'applied_flags' => $flags,
                ],
                'created_at' => now(),
            ]);
        }

        return $tenant->fresh(['featureFlags']);
    }
}
