<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Services\TenantAccessCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function __construct(
        protected TenantAccessCatalog $catalog,
    ) {}

    public function index(): Response
    {
        $this->catalog->seedDefaultMenuVisibility();

        $roles = Role::query()
            ->with(['permissions:id', 'menuVisibility'])
            ->withCount('userRoles')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        $availableMenus = $this->catalog->availableMenuItems();

        return Inertia::render('Roles/Index', [
            'roles' => $roles->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'is_default' => $role->is_default,
                'users_count' => $role->user_roles_count,
                'permission_ids' => $role->permissions->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
                'visible_menu_ids' => $this->catalog->visibleMenuIdsForRole($role, $availableMenus),
            ]),
            'permissionGroups' => $this->catalog->permissionGroups(),
            'menuRows' => $this->catalog->availableMenuRows(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:roles,name'],
        ]);

        $role = Role::query()->create([
            'name' => trim($validated['name']),
            'is_default' => false,
        ]);

        $this->catalog->syncRoleAccess(
            $role,
            [],
            $this->catalog->availableMenuItems()->pluck('id')->all()
        );

        return back()->with('success', 'Role created. Assign permissions and menu stations below.');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80', Rule::unique('roles', 'name')->ignore($role->id)],
        ]);

        $role->update(['name' => trim($validated['name'])]);

        return back()->with('success', 'Role renamed.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->name === 'owner') {
            return back()->with('error', 'The owner role cannot be deleted.');
        }

        if ($role->userRoles()->exists()) {
            return back()->with('error', 'Reassign staff on this role before deleting it.');
        }

        $role->delete();

        return back()->with('success', 'Role deleted.');
    }

    public function sync(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'roles' => ['required', 'array', 'min:1'],
            'roles.*.id' => ['required', 'integer', 'exists:roles,id'],
            'roles.*.permission_ids' => ['present', 'array'],
            'roles.*.permission_ids.*' => ['integer', 'exists:permissions,id'],
            'roles.*.visible_menu_ids' => ['present', 'array'],
            'roles.*.visible_menu_ids.*' => ['integer'],
        ]);

        $rolesManageId = Permission::query()->where('key', 'roles.manage')->value('id');
        $currentRoleIds = $request->user()->userRoles()->pluck('role_id');

        $retainsAccess = collect($validated['roles'])
            ->contains(function (array $row) use ($currentRoleIds, $rolesManageId) {
                return $currentRoleIds->contains($row['id'])
                    && in_array($rolesManageId, array_map('intval', $row['permission_ids']), true);
            });

        if ($rolesManageId && ! $retainsAccess) {
            return back()->with('error', 'You cannot remove your own access to manage roles.');
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['roles'] as $row) {
                $role = Role::query()->findOrFail($row['id']);
                $this->catalog->syncRoleAccess(
                    $role,
                    $row['permission_ids'],
                    $row['visible_menu_ids']
                );
            }
        });

        return back()->with('success', 'Role access updated.');
    }
}
