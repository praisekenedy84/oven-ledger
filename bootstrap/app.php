<?php

use App\Exceptions\TenancySessionRecovery;
use App\Http\Middleware\BootstrapTenancyFromSession;
use App\Http\Middleware\EnsureBranchNotSuspended;
use App\Http\Middleware\EnsureFeatureEnabled;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureTenantActive;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetCurrentBranch;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('platform', 'platform/*')
            ? route('platform.login')
            : route('login'));

        $middleware->redirectUsersTo(fn (Request $request) => $request->is('platform', 'platform/*')
            ? route('platform.dashboard')
            : route('tenant.dashboard'));

        // After StartSession, before Inertia share / route auth middleware,
        // so Auth::user() hits the tenant DB instead of central.
        $middleware->web(append: [
            BootstrapTenancyFromSession::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'tenant.active' => EnsureTenantActive::class,
            'branch.not_suspended' => EnsureBranchNotSuspended::class,
            'feature.enabled' => EnsureFeatureEnabled::class,
            'branch.set' => SetCurrentBranch::class,
            'permission' => EnsurePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->expectsJson() && TenancySessionRecovery::matches($e)) {
                return TenancySessionRecovery::respond($request, $e);
            }

            return null;
        });

        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            if ($response->getStatusCode() === 419) {
                $loginRoute = $request->is('platform/*') ? 'platform.login' : 'login';

                return redirect()->guest(route($loginRoute))
                    ->with('status', 'Your session has expired, please log in again.');
            }

            return $response;
        });
    })->create();
