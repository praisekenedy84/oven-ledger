<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Impersonation;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DenyAccountChangesWhileImpersonating
{
    public function __construct(
        protected Impersonation $impersonation,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->impersonation->isActive($request)) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'You cannot change this account while impersonating.',
            ], 403);
        }

        return back()->with('error', 'You cannot change this account while impersonating.');
    }
}
