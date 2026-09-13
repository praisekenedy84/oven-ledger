<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleMenuVisibility;
use App\Models\TenantMenuAvailability;
use App\Support\MenuCatalog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TenantAccessCatalog
{
    public function __construct(
        protected FeatureGate $featureGate,
        protected MenuCatalog $menuCatalog,
    ) {}

    public function availablePermissions(): Collection
    {
        $features = $this->featureGate->all();
        $featureMap = config('ovenledger.permission_features', []);

        return Permission::query()
            ->orderBy('group')
            ->orderBy('id')
            ->get()
            ->filter(function (Permission $permission) use ($features, $featureMap) {
                $featureKey = $featureMap[$permission->key] ?? null;

                if (! $featureKey) {
                    return true;
                }

                return (bool) ($features[$featureKey] ?? false);
            })
            ->values();
    }

    public function permissionGroups(): array
    {
        $labels = config('ovenledger.permission_groups', []);

        return $this->availablePermissions()
            ->groupBy('group')
            ->map(function (Collection $permissions, string $group) use ($labels) {
                return [
                    'key' => $group,
                    'label' => $labels[$group] ?? ucfirst(str_replace('_', ' ', $group)),
                    'items' => $permissions->map(fn (Permission $permission) => [
                        'id' => $permission->id,
                        'key' => $permission->key,
                        'label' => $permission->label,
                        'group' => $permission->group,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();
    }

    public function availableMenuItems(): Collection
    {
        $features = $this->featureGate->all();

        return tenancy()->central(function () use ($features) {
            $availableIds = TenantMenuAvailability::query()
                ->where('tenant_id', tenant('id'))
                ->where('available', true)
                ->pluck('menu_item_id');

            $query = MenuItem::query()
                ->where('scope', 'tenant')
                ->orderBy('sort_order');

            if ($availableIds->isNotEmpty()) {
                $query->whereIn('id', $availableIds);
            }

            return $query->get()->filter(function (MenuItem $item) use ($features) {
                if ($item->feature_key && ! ($features[$item->feature_key] ?? false)) {
                    return false;
                }

                return true;
            })->values();
        });
    }

    public function availableMenuTree(): array
    {
        return $this->menuCatalog->toTree($this->availableMenuItems());
    }

    public function availableMenuRows(): array
    {
        return $this->menuCatalog->flattenTree($this->availableMenuTree());
    }

    public function visibleMenuIdsForRole(Role $role, ?Collection $available = null): array
    {
        $available ??= $this->availableMenuItems();
        $availableIds = $available->pluck('id')->map(fn ($id) => (int) $id);

        $stored = $role->menuVisibility()
            ->where('visible', true)
            ->pluck('menu_item_id')
            ->map(fn ($id) => (int) $id);

        if ($stored->isEmpty()) {
            return $availableIds->all();
        }

        return $availableIds->intersect($stored)->values()->all();
    }

    public function seedDefaultMenuVisibility(): void
    {
        $menus = MenuItem::query()->where('scope', 'tenant')->get();

        foreach (Role::query()->get() as $role) {
            if ($role->menuVisibility()->exists()) {
                continue;
            }

            $keys = $this->menuCatalog->defaultVisibleKeys($role->name);
            $selected = $keys === null
                ? $menus->pluck('id')->all()
                : $menus->whereIn('key', $keys)->pluck('id')->all();

            $selected = $this->menuCatalog->withAncestors($menus, $selected);

            foreach ($selected as $menuItemId) {
                RoleMenuVisibility::query()->updateOrInsert(
                    [
                        'role_id' => $role->id,
                        'menu_item_id' => $menuItemId,
                    ],
                    ['visible' => true]
                );
            }
        }
    }

    public function syncRoleAccess(Role $role, array $permissionIds, array $visibleMenuIds): void
    {
        $availablePermissionIds = $this->availablePermissions()->pluck('id')->all();
        $hiddenPermissionIds = $role->permissions()
            ->whereNotIn('permissions.id', $availablePermissionIds)
            ->pluck('permissions.id')
            ->all();

        $role->permissions()->sync(array_values(array_unique([
            ...array_map('intval', array_intersect($permissionIds, $availablePermissionIds)),
            ...array_map('intval', $hiddenPermissionIds),
        ])));

        $availableMenus = $this->availableMenuItems();
        $availableMenuIds = $availableMenus->pluck('id')->map(fn ($id) => (int) $id)->all();
        $visibleMenuIds = array_values(array_intersect(
            array_map('intval', $visibleMenuIds),
            $availableMenuIds
        ));
        $visibleMenuIds = $this->menuCatalog->withAncestors($availableMenus, $visibleMenuIds);

        DB::transaction(function () use ($role, $availableMenuIds, $visibleMenuIds) {
            RoleMenuVisibility::query()
                ->where('role_id', $role->id)
                ->whereIn('menu_item_id', $availableMenuIds)
                ->delete();

            foreach ($availableMenuIds as $menuItemId) {
                RoleMenuVisibility::query()->updateOrInsert(
                    [
                        'role_id' => $role->id,
                        'menu_item_id' => $menuItemId,
                    ],
                    ['visible' => in_array($menuItemId, $visibleMenuIds, true)]
                );
            }
        });
    }
}
