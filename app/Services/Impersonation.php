<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Middleware\InitializeTenancyBySession;
use App\Models\PlatformAdmin;
use App\Models\PlatformAuditLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Impersonation
{
    public const SESSION_KEY = 'impersonation';

    public function isActive(?Request $request = null): bool
    {
        $request ??= request();

        return $request->hasSession() && $request->session()->has(self::SESSION_KEY);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function current(?Request $request = null): ?array
    {
        $request ??= request();

        if (! $request->hasSession()) {
            return null;
        }

        $payload = $request->session()->get(self::SESSION_KEY);

        return is_array($payload) ? $payload : null;
    }

    public function start(Request $request, Tenant $tenant, User $user, PlatformAdmin $admin): void
    {
        Auth::guard('web')->login($user);
        Auth::shouldUse('web');

        $request->session()->forget(CurrentBranch::SESSION_KEY);
        $request->session()->put(
            InitializeTenancyBySession::SESSION_KEY,
            $tenant->getTenantKey(),
        );
        $request->session()->put(self::SESSION_KEY, [
            'platform_admin_id' => $admin->id,
            'platform_admin_name' => $admin->name,
            'tenant_id' => $tenant->getTenantKey(),
            'tenant_name' => $tenant->name,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'user_username' => $user->username,
        ]);
        $request->session()->regenerate();

        $this->audit($admin->id, 'tenant.user_impersonated', $tenant, [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'user_username' => $user->username,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function stop(Request $request): ?array
    {
        $payload = $this->current($request);

        $this->forgetWebGuard($request);
        $request->session()->forget([
            InitializeTenancyBySession::SESSION_KEY,
            CurrentBranch::SESSION_KEY,
            self::SESSION_KEY,
        ]);

        if (tenancy()->initialized) {
            tenancy()->end();
        }

        if (Auth::guard('platform')->check()) {
            Auth::shouldUse('platform');
        }

        if ($payload) {
            $this->audit(
                $payload['platform_admin_id'] ?? Auth::guard('platform')->id(),
                'tenant.user_impersonation_stopped',
                $payload['tenant_id'] ?? null,
                [
                    'user_id' => $payload['user_id'] ?? null,
                    'user_name' => $payload['user_name'] ?? null,
                    'user_email' => $payload['user_email'] ?? null,
                    'user_username' => $payload['user_username'] ?? null,
                ],
            );
        }

        return $payload;
    }

    public function stopRedirect(Request $request): RedirectResponse
    {
        $payload = $this->stop($request);
        $name = $payload['user_name'] ?? 'that user';

        if ($payload && Auth::guard('platform')->check()) {
            return redirect()
                ->route('platform.tenants.show', $payload['tenant_id'])
                ->with('success', 'Stopped impersonating '.$name.'.');
        }

        return redirect()
            ->route('platform.login')
            ->with('status', 'Impersonation ended. Sign in to the platform console to continue.');
    }

    /**
     * Drop the web guard session without loading the tenant user from the
     * central connection (the users table does not exist there).
     */
    protected function forgetWebGuard(Request $request): void
    {
        $guard = Auth::guard('web');

        $request->session()->forget($guard->getName());
        $request->session()->forget('password_hash_web');
        $guard->forgetUser();
    }

    protected function audit(?int $adminId, string $action, Tenant|string|null $tenant, array $meta): void
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->getTenantKey() : $tenant;

        PlatformAuditLog::create([
            'platform_admin_id' => $adminId,
            'action' => $action,
            'target_type' => Tenant::class,
            'target_id' => $tenantId,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }
}
