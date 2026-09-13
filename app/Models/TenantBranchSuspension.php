<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class TenantBranchSuspension extends Model
{
    use CentralConnection;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'suspended',
        'reason',
        'suspended_by_platform_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'branch_id' => 'integer',
            'suspended' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function suspendedBy(): BelongsTo
    {
        return $this->belongsTo(PlatformAdmin::class, 'suspended_by_platform_admin_id');
    }
}
