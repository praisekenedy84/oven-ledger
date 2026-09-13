<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BusinessLiabilityController;
use App\Http\Controllers\CustomerAddressController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerLedgerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OwnerTransactionController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductionBatchController;
use App\Http\Controllers\RawMaterialController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StaffController;
use App\Http\Middleware\EnsureBranchNotSuspended;
use App\Http\Middleware\EnsureSessionTenantMatchesUser;
use App\Http\Middleware\EnsureTenantActive;
use App\Http\Middleware\InitializeTenancyBySession;
use App\Http\Middleware\SetCurrentBranch;
use Illuminate\Support\Facades\Route;

/*
| Shared-domain tenancy: all tenants use the same host. Guest login does not
| initialize tenancy; authenticated routes resolve the tenant from the session
| set at login (see TenantUserDirectory + InitializeTenancyBySession).
*/

Route::middleware('web')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
        Route::post('login', [AuthenticatedSessionController::class, 'store']);
    });

    Route::middleware([
        InitializeTenancyBySession::class,
        'auth',
        EnsureSessionTenantMatchesUser::class,
        EnsureTenantActive::class,
        SetCurrentBranch::class,
        EnsureBranchNotSuspended::class,
    ])->group(function () {
        Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
        Route::put('password', [PasswordController::class, 'update'])->name('password.update');

        Route::get('/dashboard', [DashboardController::class, 'index'])->name('tenant.dashboard');

        Route::resource('products', ProductController::class)->names('tenant.products');
        Route::resource('raw-materials', RawMaterialController::class)->only(['index', 'store', 'update'])->names('tenant.raw-materials');
        Route::resource('recipes', RecipeController::class)->only(['index', 'store', 'show'])->names('tenant.recipes');

        Route::get('production-batches', [ProductionBatchController::class, 'index'])->name('tenant.production-batches.index');
        Route::post('production-batches', [ProductionBatchController::class, 'store'])->name('tenant.production-batches.store');
        Route::patch('production-batches/{productionBatch}/transition', [ProductionBatchController::class, 'transition'])->name('tenant.production-batches.transition');

        Route::get('inventory', [InventoryController::class, 'index'])->name('tenant.inventory.index');
        Route::post('inventory/waste', [InventoryController::class, 'logWaste'])->name('tenant.inventory.waste');

        Route::get('pos', [PosController::class, 'index'])->name('tenant.pos.index');
        Route::post('pos', [PosController::class, 'store'])->name('tenant.pos.store');
        Route::get('pos/tickets', [PosController::class, 'tickets'])->name('tenant.pos.tickets');

        Route::resource('customers', CustomerController::class)->only(['index', 'store', 'show', 'update'])
            ->names('tenant.customers');
        Route::post('customers/{customer}/addresses', [CustomerAddressController::class, 'store'])
            ->name('tenant.customers.addresses.store');
        Route::put('customers/{customer}/addresses/{address}', [CustomerAddressController::class, 'update'])
            ->name('tenant.customers.addresses.update');
        Route::delete('customers/{customer}/addresses/{address}', [CustomerAddressController::class, 'destroy'])
            ->name('tenant.customers.addresses.destroy');
        Route::post('customers/{customer}/payments', [CustomerLedgerController::class, 'store'])
            ->name('tenant.customers.payments.store');

        Route::patch('orders/{order}/fulfill', [OrderController::class, 'fulfill'])
            ->name('tenant.orders.fulfill');
        Route::post('orders/{order}/void', [OrderController::class, 'void'])
            ->middleware('permission:pos.refund')
            ->name('tenant.orders.void');

        Route::get('debts', [BusinessLiabilityController::class, 'index'])->name('tenant.debts.index');
        Route::post('debts', [BusinessLiabilityController::class, 'store'])->name('tenant.debts.store');
        Route::post('debts/{liability}/payments', [BusinessLiabilityController::class, 'storePayment'])
            ->name('tenant.debts.payments.store');
        Route::post('owner-transactions', [OwnerTransactionController::class, 'store'])
            ->name('tenant.owner-transactions.store');

        Route::get('reports', [ReportController::class, 'index'])->name('tenant.reports.index');

        Route::get('branches', [BranchController::class, 'index'])->name('tenant.branches.index');
        Route::post('branches', [BranchController::class, 'store'])->name('tenant.branches.store');

        Route::get('staff', [StaffController::class, 'index'])->name('tenant.staff.index');
        Route::post('staff', [StaffController::class, 'store'])->name('tenant.staff.store');

        Route::middleware('permission:roles.manage')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->name('tenant.roles.index');
            Route::post('roles', [RoleController::class, 'store'])->name('tenant.roles.store');
            Route::put('roles/sync', [RoleController::class, 'sync'])->name('tenant.roles.sync');
            Route::patch('roles/{role}', [RoleController::class, 'update'])->name('tenant.roles.update');
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('tenant.roles.destroy');
        });
    });
});
