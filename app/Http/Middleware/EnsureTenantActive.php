<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\FeatureGate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantActive
{
    public function __construct(
        protected FeatureGate $featureGate,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $tenant = tenant();

        if (! $tenant instanceof Tenant) {
            abort(404);
        }

        if ($tenant->isSuspended()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Account suspended — contact support.',
                ], 403);
            }

            abort(403, 'Account suspended — contact support.');
        }

        return $next($request);
    }
}
