<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Http\Middleware\InitializeTenancyBySession;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;
use Stancl\Tenancy\Contracts\TenantCouldNotBeIdentifiedException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Recover from shared-domain tenancy/session failures with a login redirect
 * instead of a blank page or unhandled 500.
 */
class TenancySessionRecovery
{
    public static function matches(Throwable $e): bool
    {
        if ($e instanceof TenantCouldNotBeIdentifiedException) {
            return true;
        }

        if ($e instanceof RuntimeException && str_contains($e->getMessage(), 'Session store not set')) {
            return true;
        }

        if ($e instanceof QueryException) {
            $message = $e->getMessage();

            return str_contains($message, 'relation "users" does not exist')
                || str_contains($message, "relation 'users' does not exist")
                || str_contains($message, 'no such table: users');
        }

        return false;
    }

    public static function respond(Request $request, Throwable $e): Response
    {
        report($e);

        if ($request->hasSession()) {
            $request->session()->forget(InitializeTenancyBySession::SESSION_KEY);
            $request->session()->forget(Auth::guard('web')->getName());
            $request->session()->forget('password_hash_web');
        }

        if (function_exists('tenancy') && tenancy()->initialized) {
            tenancy()->end();
        }

        Auth::guard('web')->forgetUser();

        $loginRoute = $request->is('platform', 'platform/*') ? 'platform.login' : 'login';

        return redirect()->guest(route($loginRoute))
            ->with('status', 'Your session could not be restored. Please log in again.');
    }
}
