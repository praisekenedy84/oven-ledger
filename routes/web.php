<?php

declare(strict_types=1);

use App\Http\Controllers\ContactController;
use App\Http\Controllers\Platform\AuditLogController;
use App\Http\Controllers\Platform\Auth\LoginController as PlatformLoginController;
use App\Http\Controllers\Platform\DashboardController as PlatformDashboardController;
use App\Http\Controllers\Platform\ImpersonationController;
use App\Http\Controllers\Platform\RoleController as PlatformRoleController;
use App\Http\Controllers\Platform\TenantController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\EnsureSessionTenantMatchesUser;
use App\Http\Middleware\InitializeTenancyBySession;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::post('/contact', [ContactController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.store');

Route::prefix('platform')->name('platform.')->group(function () {
    Route::middleware('guest:platform')->group(function () {
        Route::get('login', [PlatformLoginController::class, 'create'])->name('login');
        Route::post('login', [PlatformLoginController::class, 'store'])->name('login.store');
    });

    Route::middleware('auth:platform')->group(function () {
        Route::post('logout', [PlatformLoginController::class, 'destroy'])->name('logout');
        Route::get('dashboard', [PlatformDashboardController::class, 'index'])->name('dashboard');

        Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
        Route::get('tenants/create', [TenantController::class, 'create'])->name('tenants.create');
        Route::post('tenants', [TenantController::class, 'store'])->name('tenants.store');
        Route::get('tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
        Route::patch('tenants/{tenant}/max-branches', [TenantController::class, 'updateMaxBranches'])->name('tenants.max-branches');
        Route::patch('tenants/{tenant}/business-size', [TenantController::class, 'updateBusinessSize'])->name('tenants.business-size');
        Route::patch('tenants/{tenant}/features', [TenantController::class, 'toggleFeature'])->name('tenants.features');
        Route::post('tenants/{tenant}/suspend', [TenantController::class, 'suspend'])->name('tenants.suspend');
        Route::post('tenants/{tenant}/reactivate', [TenantController::class, 'reactivate'])->name('tenants.reactivate');
        Route::post('tenants/{tenant}/impersonate', [ImpersonationController::class, 'store'])
            ->middleware('permission:tenants.impersonate')
            ->name('tenants.impersonate');

        Route::get('audit-log', [AuditLogController::class, 'index'])->name('audit.index');

        Route::middleware('permission:roles.manage')->group(function () {
            Route::get('roles', [PlatformRoleController::class, 'index'])->name('roles.index');
            Route::post('roles', [PlatformRoleController::class, 'store'])->name('roles.store');
            Route::put('roles/sync', [PlatformRoleController::class, 'sync'])->name('roles.sync');
            Route::patch('roles/{role}', [PlatformRoleController::class, 'update'])->name('roles.update');
            Route::delete('roles/{role}', [PlatformRoleController::class, 'destroy'])->name('roles.destroy');
        });

        Route::middleware('permission:tenants.manage')->group(function () {
            Route::put('tenants/{tenant}/menus', [TenantController::class, 'updateMenuAvailability'])->name('tenants.menus');
        });
    });
});

Route::post('/impersonation/stop', [ImpersonationController::class, 'destroy'])
    ->name('impersonation.stop');

Route::middleware([
    InitializeTenancyBySession::class,
    'auth:web',
    EnsureSessionTenantMatchesUser::class,
])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])
        ->middleware('impersonation.protect')
        ->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->middleware('impersonation.protect')
        ->name('profile.destroy');
});
