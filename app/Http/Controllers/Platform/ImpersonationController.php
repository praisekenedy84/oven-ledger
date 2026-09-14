<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Impersonation;
use App\Services\TenantUserDirectory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    public function __construct(
        protected Impersonation $impersonation,
        protected TenantUserDirectory $directory,
    ) {}

    public function store(Request $request, Tenant $tenant): RedirectResponse
    {
        if ($tenant->isSuspended()) {
            return back()->with('error', 'Cannot impersonate a user on a suspended tenant.');
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer'],
        ]);

        $admin = Auth::guard('platform')->user();
        $userId = (int) $validated['user_id'];

        $result = $tenant->run(function () use ($request, $tenant, $userId, $admin) {
            $user = User::query()->find($userId);

            if (! $user) {
                return ['error' => 'missing'];
            }

            $directoryTenantId = tenancy()->central(
                fn () => $this->directory->tenantIdForEmail($user->email)
            );

            if ($directoryTenantId !== $tenant->getTenantKey()) {
                return ['error' => 'directory'];
            }

            $this->impersonation->start($request, $tenant, $user, $admin);

            return ['name' => $user->name];
        });

        if (($result['error'] ?? null) === 'missing') {
            return back()->with('error', 'That user was not found on this tenant.');
        }

        if (($result['error'] ?? null) === 'directory') {
            return back()->with('error', 'That user is not registered in the tenant login directory.');
        }

        return redirect()
            ->route('tenant.dashboard')
            ->with('success', 'You are now viewing the bakery as '.$result['name'].'.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        if (! $this->impersonation->isActive($request)) {
            return Auth::guard('platform')->check()
                ? redirect()->route('platform.dashboard')
                : redirect()->route('platform.login');
        }

        return $this->impersonation->stopRedirect($request);
    }
}
