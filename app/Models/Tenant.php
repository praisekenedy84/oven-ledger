<?php

declare(strict_types=1);

namespace App\Models;

use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $fillable = [
        'id',
        'name',
        'owner_name',
        'owner_email',
        'owner_phone',
        'status',
        'max_branches',
        'created_by_platform_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'max_branches' => 'integer',
            'created_by_platform_admin_id' => 'integer',
        ];
    }

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'owner_name',
            'owner_email',
            'owner_phone',
            'status',
            'max_branches',
            'created_by_platform_admin_id',
            'created_at',
            'updated_at',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function featureFlags()
    {
        return $this->hasMany(TenantFeatureFlag::class, 'tenant_id');
    }

    public function branchSuspensions()
    {
        return $this->hasMany(TenantBranchSuspension::class, 'tenant_id');
    }

    public function menuAvailability()
    {
        return $this->hasMany(TenantMenuAvailability::class, 'tenant_id');
    }
}
