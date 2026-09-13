<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class TenantUserDirectory
{
    public function register(
        string $email,
        string $tenantId,
        ?string $username = null,
        ?string $previousEmail = null,
    ): TenantUser {
        $email = $this->normalizeEmail($email);
        $username = filled($username) ? $this->normalizeUsername($username) : null;

        $entry = null;

        if (filled($previousEmail)) {
            $entry = TenantUser::query()
                ->where('email', $this->normalizeEmail($previousEmail))
                ->first();
        }

        if (! $entry) {
            $entry = TenantUser::query()->where('email', $email)->first();
        }

        $attributes = [
            'email' => $email,
            'tenant_id' => $tenantId,
        ];

        if ($username !== null) {
            $attributes['username'] = $username;
        }

        if ($entry) {
            $entry->update($attributes);

            return $entry->fresh();
        }

        return TenantUser::query()->create($attributes);
    }

    public function findTenantByLogin(string $login): ?Tenant
    {
        $login = trim($login);

        if ($login === '') {
            return null;
        }

        if (str_contains($login, '@')) {
            return $this->findTenantByEmail($login);
        }

        return $this->findTenantByUsername($login);
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

    public function findTenantByUsername(string $username): ?Tenant
    {
        $entry = TenantUser::query()
            ->where('username', $this->normalizeUsername($username))
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

    public function normalizeUsername(string $username): string
    {
        return Str::lower(trim($username));
    }

    /**
     * @return array<int, mixed>
     */
    public function usernameRules(?int $ignoreUserId = null, ?string $ignoreEmail = null): array
    {
        $uniqueUsers = Rule::unique('users', 'username');

        if ($ignoreUserId) {
            $uniqueUsers->ignore($ignoreUserId);
        }

        return [
            'required',
            ...$this->usernameFormatRules(),
            $uniqueUsers,
            $this->uniqueDirectoryUsername($ignoreEmail),
        ];
    }

    /**
     * @return array<int, string>
     */
    public function usernameFormatRules(): array
    {
        return [
            'string',
            'min:3',
            'max:50',
            'lowercase',
            'alpha_dash',
        ];
    }

    public function uniqueDirectoryUsername(?string $ignoreEmail = null): Unique
    {
        $unique = Rule::unique('tenant_users', 'username')
            ->connection(config('tenancy.database.central_connection'));

        if (filled($ignoreEmail)) {
            $unique->ignore($this->normalizeEmail($ignoreEmail), 'email');
        }

        return $unique;
    }
}
