<?php

namespace App\Http\Middleware;

use App\Services\FeatureGate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureEnabled
{
    public function __construct(
        protected FeatureGate $featureGate,
    ) {}

    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        if (! $this->featureGate->enabled($featureKey)) {
            abort(403, 'This feature is not enabled for your account.');
        }

        return $next($request);
    }
}
