<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\MenuItem;
use App\Models\PlatformAuditLog;
use App\Models\Tenant;
use App\Models\TenantFeatureFlag;
use App\Models\TenantMenuAvailability;
use App\Models\User;
use App\Services\FeatureGate;
use App\Services\TenantProvisioner;
use App\Services\TenantUserDirectory;
use App\Support\MenuCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function __construct(
        protected TenantProvisioner $provisioner,
        protected FeatureGate $featureGate,
        protected MenuCatalog $menuCatalog,
    ) {}

    public function index(): Response
    {
        $tenants = Tenant::query()
            ->with(['featureFlags'])
            ->latest()
            ->paginate(20)
            ->through(function (Tenant $tenant) {
                return [
                    ...$tenant->toArray(),
                    'branch_count' => $tenant->run(fn () => Branch::count()),
                ];
            });

        return Inertia::render('Platform/Tenants/Index', [
            'tenants' => $tenants,
            'featureKeys' => config('ovenledger.feature_keys'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Platform/Tenants/Create', [
            'featureKeys' => config('ovenledger.feature_keys'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $directory = app(TenantUserDirectory::class);

        $request->merge([
            'owner_email' => $directory->normalizeEmail((string) $request->input('owner_email')),
            'owner_username' => $directory->normalizeUsername((string) $request->input('owner_username')),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_username' => [
                'required',
                ...$directory->usernameFormatRules(),
                $directory->uniqueDirectoryUsername(),
            ],
            'owner_email' => ['required', 'email', 'max:255', 'unique:tenant_users,email'],
            'owner_phone' => ['nullable', 'string', 'max:50'],
            'owner_password' => ['required', 'string', 'min:8'],
            'max_branches' => ['required', 'integer', 'min:1'],
            'feature_flags' => ['nullable', 'array'],
        ]);

        $this->provisioner->provision(
            $validated,
            Auth::guard('platform')->id()
        );

        return redirect()->route('platform.tenants.index')
            ->with('success', 'Tenant provisioned successfully.');
    }

    public function show(Tenant $tenant): Response
    {
        $tenant->load(['featureFlags']);

        $branchCount = $tenant->run(fn () => Branch::count());
        $features = $tenant->featureFlags->pluck('enabled', 'feature_key');
        $menuItems = MenuItem::query()
            ->where('scope', 'tenant')
            ->orderBy('sort_order')
            ->get();
        $availability = $tenant->menuAvailability()->pluck('available', 'menu_item_id');

        $selectedMenuIds = $availability->isEmpty()
            ? $menuItems->pluck('id')->map(fn ($id) => (int) $id)->all()
            : $availability->filter()->keys()->map(fn ($id) => (int) $id)->all();

        $users = $tenant->run(function () {
            return User::query()
                ->with(['userRoles.role'])
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'roles' => $user->userRoles
                        ->map(fn ($userRole) => $userRole->role?->name)
                        ->filter()
                        ->unique()
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all();
        });

        return Inertia::render('Platform/Tenants/Show', [
            'tenant' => $tenant,
            'branchCount' => $branchCount,
            'featureKeys' => config('ovenledger.feature_keys'),
            'branchSuspensions' => $tenant->branchSuspensions()->where('suspended', true)->get(),
            'menuRows' => $this->menuCatalog->flattenTree($this->menuCatalog->toTree($menuItems)),
            'availableMenuIds' => $selectedMenuIds,
            'enabledFeatures' => $features,
            'users' => $users,
        ]);
    }

    public function updateMenuAvailability(Request $request, Tenant $tenant): RedirectResponse
    {
        $menuItems = MenuItem::query()->where('scope', 'tenant')->get();
        $validIds = $menuItems->pluck('id')->map(fn ($id) => (int) $id)->all();

        $validated = $request->validate([
            'menu_item_ids' => ['present', 'array'],
            'menu_item_ids.*' => ['integer'],
        ]);

        $features = $tenant->featureFlags()->pluck('enabled', 'feature_key');
        $selected = array_values(array_intersect(
            array_map('intval', $validated['menu_item_ids']),
            $validIds
        ));
        $selected = $this->menuCatalog->withAncestors($menuItems, $selected);

        foreach ($menuItems as $item) {
            if ($item->feature_key && ! ($features[$item->feature_key] ?? false)) {
                $selected = array_values(array_diff($selected, [(int) $item->id]));
            }
        }

        foreach ($validIds as $menuItemId) {
            TenantMenuAvailability::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'menu_item_id' => $menuItemId,
                ],
                [
                    'available' => in_array($menuItemId, $selected, true),
                    'updated_by_platform_admin_id' => Auth::guard('platform')->id(),
                ]
            );
        }

        PlatformAuditLog::create([
            'platform_admin_id' => Auth::guard('platform')->id(),
            'action' => 'tenant.menu_availability_updated',
            'target_type' => Tenant::class,
            'target_id' => $tenant->id,
            'meta' => ['menu_item_ids' => $selected],
            'created_at' => now(),
        ]);

        return back()->with('success', 'Tenant menu availability updated.');
    }

    public function updateMaxBranches(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'max_branches' => ['required', 'integer', 'min:1'],
        ]);

        $tenant->update($validated);

        PlatformAuditLog::create([
            'platform_admin_id' => Auth::guard('platform')->id(),
            'action' => 'tenant.max_branches_updated',
            'target_type' => Tenant::class,
            'target_id' => $tenant->id,
            'meta' => $validated,
            'created_at' => now(),
        ]);

        return back()->with('success', 'Branch limit updated.');
    }

    public function toggleFeature(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'feature_key' => ['required', 'string'],
            'enabled' => ['required', 'boolean'],
        ]);

        TenantFeatureFlag::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'feature_key' => $validated['feature_key'],
            ],
            [
                'enabled' => $validated['enabled'],
                'updated_by_platform_admin_id' => Auth::guard('platform')->id(),
            ]
        );

        $this->featureGate->forget($tenant->id);

        PlatformAuditLog::create([
            'platform_admin_id' => Auth::guard('platform')->id(),
            'action' => 'tenant.feature_toggled',
            'target_type' => Tenant::class,
            'target_id' => $tenant->id,
            'meta' => $validated,
            'created_at' => now(),
        ]);

        return back()->with('success', 'Feature flag updated.');
    }

    public function suspend(Tenant $tenant): RedirectResponse
    {
        $tenant->update(['status' => 'suspended']);

        PlatformAuditLog::create([
            'platform_admin_id' => Auth::guard('platform')->id(),
            'action' => 'tenant.suspended',
            'target_type' => Tenant::class,
            'target_id' => $tenant->id,
            'meta' => [],
            'created_at' => now(),
        ]);

        return back()->with('success', 'Tenant suspended.');
    }

    public function reactivate(Tenant $tenant): RedirectResponse
    {
        $tenant->update(['status' => 'active']);

        PlatformAuditLog::create([
            'platform_admin_id' => Auth::guard('platform')->id(),
            'action' => 'tenant.reactivated',
            'target_type' => Tenant::class,
            'target_id' => $tenant->id,
            'meta' => [],
            'created_at' => now(),
        ]);

        return back()->with('success', 'Tenant reactivated.');
    }
}
