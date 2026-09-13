<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancyBySession
{
    public const SESSION_KEY = 'tenant_id';

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->hasSession()) {
            return $this->deny($request);
        }

        $tenantId = $request->session()->get(self::SESSION_KEY);

        if (! $tenantId) {
            return $this->deny($request);
        }

        $tenant = tenancy()->find($tenantId);

        if (! $tenant) {
            $request->session()->forget(self::SESSION_KEY);

            return $this->deny($request);
        }

        tenancy()->initialize($tenant);

        return $next($request);
    }

    protected function deny(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return redirect()->guest(route('login'));
    }
}
