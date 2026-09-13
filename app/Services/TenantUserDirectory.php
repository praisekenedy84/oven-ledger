<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Str;

class TenantUserDirectory
{
    public function register(string $email, string $tenantId): TenantUser
    {
        return TenantUser::query()->updateOrCreate(
            ['email' => $this->normalizeEmail($email)],
            ['tenant_id' => $tenantId],
        );
    }

    public function findTenantByEmail(string $email): ?Tenant
    {
        $entry = TenantUser::query()
            ->where('email', $this->normalizeEmail($email))
            ->first();

        if (! $entry) {
            return null;
        }

        return tenancy()->find($entry->tenant_id);
    }

    public function tenantIdForEmail(string $email): ?string
    {
        return TenantUser::query()
            ->where('email', $this->normalizeEmail($email))
            ->value('tenant_id');
    }

    public function forget(string $email): void
    {
        TenantUser::query()
            ->where('email', $this->normalizeEmail($email))
            ->delete();
    }

    public function normalizeEmail(string $email): string
    {
        return Str::lower(trim($email));
    }
}
