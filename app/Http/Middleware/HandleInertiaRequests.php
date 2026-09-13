<?php

namespace App\Http\Middleware;

use App\Models\MenuItem;
use App\Models\RoleMenuVisibility;
use App\Models\TenantBranchSuspension;
use App\Models\TenantMenuAvailability;
use App\Models\User;
use App\Services\CurrentBranch;
use App\Services\FeatureGate;
use App\Support\MenuCatalog;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        protected CurrentBranch $currentBranch,
        protected FeatureGate $featureGate,
        protected MenuCatalog $menuCatalog,
    ) {}

    public function version(Request $request): ?string
    {
        return parent::version($request) ?? config('ovenledger.version');
    }

    public function share(Request $request): array
    {
        $shared = [
            ...parent::share($request),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
            'appVersion' => config('ovenledger.version'),
        ];

        if ($request->is('platform/*')) {
            $admin = $request->user('platform');
            $shared['auth'] = [
                'user' => $admin,
                'guard' => 'platform',
                'permissions' => $admin?->roles()
                    ->with('permissions')
                    ->get()
                    ->flatMap(fn ($role) => $role->permissions->pluck('key'))
                    ->unique()
                    ->values()
                    ->all() ?? [],
            ];

            return $shared;
        }

        if (tenant()) {
            try {
                $user = $request->user();
                $branch = $this->currentBranch->branch();
                $features = $this->featureGate->all();

                $shared['auth'] = [
                    'user' => $user,
                    'guard' => 'web',
                    'permissions' => $user?->permissionKeys($branch?->id) ?? [],
                ];
                $shared['currentBranch'] = $branch;
                $shared['branches'] = $this->currentBranch->availableBranches();
                $shared['features'] = $features;
                $shared['menuItems'] = $this->resolveTenantMenuItems($user, $features);
                $shared['branchSuspended'] = $branch && tenancy()->central(function () use ($branch) {
                    return TenantBranchSuspension::query()
                        ->where('tenant_id', tenant('id'))
                        ->where('branch_id', $branch->id)
                        ->where('suspended', true)
                        ->exists();
                });

                return $shared;
            } catch (\Throwable $e) {
                report($e);

                if (tenancy()->initialized) {
                    tenancy()->end();
                }

                $shared['auth'] = ['user' => null];

                return $shared;
            }
        }

        // Outside tenancy the web guard's users table is unavailable.
        $shared['auth'] = [
            'user' => null,
        ];

        return $shared;
    }

    protected function resolveTenantMenuItems(?User $user, array $features): array
    {
        if (! $user || ! tenant()) {
            return [];
        }

        $roleIds = $user->userRoles()->pluck('role_id');
        $visibleMenuIds = $roleIds->isEmpty()
            ? collect()
            : RoleMenuVisibility::query()
                ->whereIn('role_id', $roleIds)
                ->where('visible', true)
                ->pluck('menu_item_id');

        return tenancy()->central(function () use ($features, $visibleMenuIds) {
            $availableMenuIds = TenantMenuAvailability::query()
                ->where('tenant_id', tenant('id'))
                ->where('available', true)
                ->pluck('menu_item_id');

            $menuQuery = MenuItem::query()
                ->where('scope', 'tenant')
                ->orderBy('sort_order');

            if ($availableMenuIds->isNotEmpty()) {
                $menuQuery->whereIn('id', $availableMenuIds);
            }

            $menus = $menuQuery->get()->filter(function (MenuItem $item) use ($features) {
                if ($item->feature_key && ! ($features[$item->feature_key] ?? false)) {
                    return false;
                }

                return true;
            });

            $visible = $visibleMenuIds->isEmpty()
                ? $menus
                : $menus->whereIn('id', $visibleMenuIds)->values();

            $withAncestors = $this->menuCatalog->withAncestors(
                $menus,
                $visible->pluck('id')->all()
            );

            $resolved = $menus->whereIn('id', $withAncestors)->values();

            return $this->menuCatalog->toTree($resolved);
        });
    }
}
