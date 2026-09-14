<?php

namespace App\Services;

use App\Models\PlatformAuditLog;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantFeatureFlag;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantProvisioner
{
    public function __construct(
        protected FeatureGate $featureGate,
        protected TenantUserDirectory $userDirectory,
    ) {}

    public function provision(array $data, ?int $platformAdminId = null): Tenant
    {
        $businessSize = $data['business_size'] ?? Tenant::SIZE_MEDIUM;
        $sizePresets = app(BusinessSizeProfile::class)->presetFlags($businessSize);
        $featureFlags = array_merge(
            $sizePresets,
            $data['feature_flags'] ?? [],
        );

        $tenant = Tenant::create([
            'id' => $data['id'] ?? (string) Str::uuid(),
            'name' => $data['name'],
            'owner_name' => $data['owner_name'],
            'owner_email' => $data['owner_email'],
            'owner_phone' => $data['owner_phone'] ?? null,
            'status' => 'active',
            'max_branches' => $data['max_branches'] ?? 1,
            'business_size' => $businessSize,
            'created_by_platform_admin_id' => $platformAdminId,
        ]);

        $this->seedFeatureFlags($tenant, $platformAdminId, $featureFlags);

        $username = null;

        $tenant->run(function () use ($data, &$username) {
            $username = $this->createOwnerUser($data);
        });

        $this->userDirectory->register(
            $data['owner_email'],
            $tenant->id,
            $username,
        );

        if ($platformAdminId) {
            PlatformAuditLog::create([
                'platform_admin_id' => $platformAdminId,
                'action' => 'tenant.created',
                'target_type' => Tenant::class,
                'target_id' => $tenant->id,
                'meta' => [
                    'name' => $tenant->name,
                    'owner_email' => $data['owner_email'],
                ],
                'created_at' => now(),
            ]);
        }

        return $tenant->fresh();
    }

    protected function seedFeatureFlags(Tenant $tenant, ?int $platformAdminId, array $overrides): void
    {
        $defaults = config('ovenledger.default_feature_flags', []);

        foreach (config('ovenledger.feature_keys', []) as $featureKey) {
            TenantFeatureFlag::create([
                'tenant_id' => $tenant->id,
                'feature_key' => $featureKey,
                'enabled' => $overrides[$featureKey] ?? ($defaults[$featureKey] ?? false),
                'updated_by_platform_admin_id' => $platformAdminId,
            ]);
        }
    }

    protected function createOwnerUser(array $data): ?string
    {
        $ownerRole = Role::query()->where('name', 'owner')->first();

        if (! $ownerRole) {
            return null;
        }

        $username = $data['owner_username']
            ?? Str::slug(Str::before($data['owner_email'], '@'), '_');
        $username = $username !== '' ? $username : 'owner';

        $user = User::create([
            'name' => $data['owner_name'],
            'username' => $username,
            'email' => $data['owner_email'],
            'password' => Hash::make($data['owner_password'] ?? Str::random(16)),
            'email_verified_at' => now(),
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'role_id' => $ownerRole->id,
            'branch_id' => null,
        ]);

        $mainBranch = \App\Models\Branch::query()->where('name', 'Main Branch')->first();

        if ($mainBranch) {
            $user->branches()->attach($mainBranch->id);
        }

        return $username;
    }
}
