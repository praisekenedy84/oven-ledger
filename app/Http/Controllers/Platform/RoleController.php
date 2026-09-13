<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Models\PlatformPermission;
use App\Models\PlatformRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        $labels = config('ovenledger.permission_groups', []);
        $permissions = PlatformPermission::query()->orderBy('group')->orderBy('id')->get();

        $roles = PlatformRole::query()
            ->with(['permissions:id'])
            ->withCount('admins')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        return Inertia::render('Platform/Roles/Index', [
            'roles' => $roles->map(fn (PlatformRole $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'is_default' => $role->is_default,
                'users_count' => $role->admins_count,
                'permission_ids' => $role->permissions->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            ]),
            'permissionGroups' => $permissions
                ->groupBy('group')
                ->map(fn ($groupPermissions, $group) => [
                    'key' => $group,
                    'label' => $labels[$group] ?? ucfirst(str_replace('_', ' ', $group)),
                    'items' => $groupPermissions->map(fn (PlatformPermission $permission) => [
                        'id' => $permission->id,
                        'key' => $permission->key,
                        'label' => $permission->label,
                        'group' => $permission->group,
                    ])->values()->all(),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:platform_roles,name'],
        ]);

        PlatformRole::query()->create([
            'name' => trim($validated['name']),
            'is_default' => false,
        ]);

        $this->audit('platform_role.created', $validated);

        return back()->with('success', 'Platform role created.');
    }

    public function update(Request $request, PlatformRole $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80', Rule::unique('platform_roles', 'name')->ignore($role->id)],
        ]);

        $role->update(['name' => trim($validated['name'])]);

        $this->audit('platform_role.renamed', ['id' => $role->id, ...$validated], $role->id);

        return back()->with('success', 'Role renamed.');
    }

    public function destroy(PlatformRole $role): RedirectResponse
    {
        if ($role->is_default) {
            return back()->with('error', 'Default platform roles cannot be deleted.');
        }

        if ($role->admins()->exists()) {
            return back()->with('error', 'Reassign admins on this role before deleting it.');
        }

        $roleId = $role->id;
        $role->delete();

        $this->audit('platform_role.deleted', ['id' => $roleId], $roleId);

        return back()->with('success', 'Role deleted.');
    }

    public function sync(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'roles' => ['required', 'array', 'min:1'],
            'roles.*.id' => ['required', 'integer', 'exists:platform_roles,id'],
            'roles.*.permission_ids' => ['present', 'array'],
            'roles.*.permission_ids.*' => ['integer', 'exists:platform_permissions,id'],
        ]);

        $rolesManageId = PlatformPermission::query()->where('key', 'roles.manage')->value('id');
        $admin = Auth::guard('platform')->user();
        $currentRoleIds = $admin?->roles()->pluck('platform_roles.id') ?? collect();

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
                $role = PlatformRole::query()->findOrFail($row['id']);
                $role->permissions()->sync(array_map('intval', $row['permission_ids']));
            }
        });

        $this->audit('platform_roles.synced', [
            'role_ids' => collect($validated['roles'])->pluck('id')->all(),
        ]);

        return back()->with('success', 'Platform role permissions updated.');
    }

    protected function audit(string $action, array $meta, ?int $targetId = null): void
    {
        PlatformAuditLog::create([
            'platform_admin_id' => Auth::guard('platform')->id(),
            'action' => $action,
            'target_type' => PlatformRole::class,
            'target_id' => $targetId ? (string) $targetId : null,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }
}
