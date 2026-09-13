<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $guard = $request->is('platform', 'platform/*') ? 'platform' : 'web';
        $user = Auth::guard($guard)->user();

        if (! $user || ! method_exists($user, 'hasPermission') || ! $user->hasPermission($permission)) {
            abort(403, 'You do not have permission to do that.');
        }

        return $next($request);
    }
}
