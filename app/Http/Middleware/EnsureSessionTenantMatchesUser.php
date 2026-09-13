<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\TenantUserDirectory;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deny and force re-login when the session tenant does not match the
 * authenticated user's directory membership.
 */
class EnsureSessionTenantMatchesUser
{
    public function __construct(
        protected TenantUserDirectory $directory,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $expectedTenantId = $this->directory->tenantIdForEmail($user->email);
        $sessionTenantId = $request->session()->get(InitializeTenancyBySession::SESSION_KEY);
        $currentTenantId = tenant()?->getTenantKey();

        $mismatch = ! $expectedTenantId
            || $expectedTenantId !== $sessionTenantId
            || $expectedTenantId !== $currentTenantId;

        if ($mismatch) {
            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Tenant session mismatch. Please log in again.',
                ], 403);
            }

            return redirect()->route('login')
                ->with('status', 'Your session was invalid. Please log in again.');
        }

        return $next($request);
    }
}