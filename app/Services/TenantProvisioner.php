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
        $tenant = Tenant::create([
            'id' => $data['id'] ?? (string) Str::uuid(),
            'name' => $data['name'],
            'owner_name' => $data['owner_name'],
            'owner_email' => $data['owner_email'],
            'owner_phone' => $data['owner_phone'] ?? null,
            'status' => 'active',
            'max_branches' => $data['max_branches'] ?? 1,
            'created_by_platform_admin_id' => $platformAdminId,
        ]);

        $this->seedFeatureFlags($tenant, $platformAdminId, $data['feature_flags'] ?? []);

        $tenant->run(function () use ($data) {
            $this->createOwnerUser($data);
        });

        $this->userDirectory->register($data['owner_email'], $tenant->id);

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

    protected function createOwnerUser(array $data): void
    {
        $ownerRole = Role::query()->where('name', 'owner')->first();

        if (! $ownerRole) {
            return;
        }

        $user = User::create([
            'name' => $data['owner_name'],
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
    }
}
