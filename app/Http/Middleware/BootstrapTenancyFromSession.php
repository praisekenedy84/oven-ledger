<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Soft-initialize tenancy when the session already has a tenant_id.
 *
 * Shared-domain auth stores the tenant user in the web guard, but the users
 * table only exists on the tenant connection. Without this, guest/Inertia
 * routes call Auth::user() against the central DB and fail with
 * "relation users does not exist".
 */
class BootstrapTenancyFromSession
{
    public function handle(Request $request, Closure $next): Response
    {
        // Platform console stays on the central connection.
        if ($request->is('platform', 'platform/*')) {
            return $next($request);
        }

        if (! $request->hasSession() || tenancy()->initialized) {
            return $next($request);
        }

        $tenantId = $request->session()->get(InitializeTenancyBySession::SESSION_KEY);

        if ($tenantId) {
            $tenant = tenancy()->find($tenantId);

            if ($tenant) {
                tenancy()->initialize($tenant);

                return $next($request);
            }

            $request->session()->forget(InitializeTenancyBySession::SESSION_KEY);
            $this->forgetWebGuardSession($request);
        } elseif ($request->session()->has(Auth::guard('web')->getName())) {
            // Auth id present but no tenant — cannot resolve users safely.
            $this->forgetWebGuardSession($request);
        }

        return $next($request);
    }

    /**
     * Drop the web guard session without calling Auth::logout(), which would
     * try to load the user from the central connection first.
     */
    protected function forgetWebGuardSession(Request $request): void
    {
        $guard = Auth::guard('web');

        $request->session()->forget($guard->getName());
        $request->session()->forget('password_hash_web');
        $guard->forgetUser();
    }
}
