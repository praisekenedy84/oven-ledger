<?php

namespace App\Support;

use App\Models\MenuItem;

class MenuCatalog
{
    public function platformDefinitions(): array
    {
        return [
            ['scope' => 'platform', 'key' => 'platform.dashboard', 'label' => 'Dashboard', 'icon' => 'home', 'route_name' => 'platform.dashboard', 'parent_key' => null, 'sort_order' => 1, 'feature_key' => null],
            ['scope' => 'platform', 'key' => 'platform.tenants', 'label' => 'Tenants', 'icon' => 'building', 'route_name' => 'platform.tenants.index', 'parent_key' => null, 'sort_order' => 2, 'feature_key' => null],
            ['scope' => 'platform', 'key' => 'platform.roles', 'label' => 'Roles', 'icon' => 'shield', 'route_name' => 'platform.roles.index', 'parent_key' => null, 'sort_order' => 3, 'feature_key' => null],
            ['scope' => 'platform', 'key' => 'platform.audit', 'label' => 'Audit Log', 'icon' => 'clipboard', 'route_name' => 'platform.audit.index', 'parent_key' => null, 'sort_order' => 4, 'feature_key' => null],
        ];
    }

    public function tenantDefinitions(): array
    {
        return [
            ['scope' => 'tenant', 'key' => 'tenant.dashboard', 'label' => 'Dashboard', 'icon' => 'home', 'route_name' => 'tenant.dashboard', 'parent_key' => null, 'sort_order' => 1, 'feature_key' => null],

            ['scope' => 'tenant', 'key' => 'tenant.catalog', 'label' => 'Catalog', 'icon' => 'box', 'route_name' => null, 'parent_key' => null, 'sort_order' => 2, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.products', 'label' => 'Products', 'icon' => 'box', 'route_name' => 'tenant.products.index', 'parent_key' => 'tenant.catalog', 'sort_order' => 1, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.raw_materials', 'label' => 'Raw Materials', 'icon' => 'flask', 'route_name' => 'tenant.raw-materials.index', 'parent_key' => 'tenant.catalog', 'sort_order' => 2, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.recipes', 'label' => 'Recipes', 'icon' => 'book', 'route_name' => 'tenant.recipes.index', 'parent_key' => 'tenant.catalog', 'sort_order' => 3, 'feature_key' => null],

            ['scope' => 'tenant', 'key' => 'tenant.operations', 'label' => 'Operations', 'icon' => 'fire', 'route_name' => null, 'parent_key' => null, 'sort_order' => 3, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.production', 'label' => 'Production', 'icon' => 'fire', 'route_name' => 'tenant.production-batches.index', 'parent_key' => 'tenant.operations', 'sort_order' => 1, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.inventory', 'label' => 'Inventory', 'icon' => 'archive', 'route_name' => 'tenant.inventory.index', 'parent_key' => 'tenant.operations', 'sort_order' => 2, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.pos', 'label' => 'POS', 'icon' => 'cash', 'route_name' => 'tenant.pos.index', 'parent_key' => 'tenant.operations', 'sort_order' => 3, 'feature_key' => null],

            ['scope' => 'tenant', 'key' => 'tenant.sales', 'label' => 'Sales', 'icon' => 'chart', 'route_name' => null, 'parent_key' => null, 'sort_order' => 4, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.customers', 'label' => 'Customers', 'icon' => 'users', 'route_name' => 'tenant.customers.index', 'parent_key' => 'tenant.sales', 'sort_order' => 1, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.debts', 'label' => 'Debts', 'icon' => 'clipboard', 'route_name' => 'tenant.debts.index', 'parent_key' => 'tenant.sales', 'sort_order' => 2, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.reports', 'label' => 'Reports', 'icon' => 'chart', 'route_name' => 'tenant.reports.index', 'parent_key' => 'tenant.sales', 'sort_order' => 3, 'feature_key' => null],

            ['scope' => 'tenant', 'key' => 'tenant.settings', 'label' => 'Settings', 'icon' => 'cog', 'route_name' => null, 'parent_key' => null, 'sort_order' => 5, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.branches', 'label' => 'Branches', 'icon' => 'map', 'route_name' => 'tenant.branches.index', 'parent_key' => 'tenant.settings', 'sort_order' => 1, 'feature_key' => 'multi_branch'],
            ['scope' => 'tenant', 'key' => 'tenant.staff', 'label' => 'Staff', 'icon' => 'user-group', 'route_name' => 'tenant.staff.index', 'parent_key' => 'tenant.settings', 'sort_order' => 2, 'feature_key' => null],
            ['scope' => 'tenant', 'key' => 'tenant.roles', 'label' => 'Roles & access', 'icon' => 'shield', 'route_name' => 'tenant.roles.index', 'parent_key' => 'tenant.settings', 'sort_order' => 3, 'feature_key' => null],
        ];
    }

    public function definitions(): array
    {
        return array_merge($this->platformDefinitions(), $this->tenantDefinitions());
    }

    public function sync(): void
    {
        foreach ($this->definitions() as $definition) {
            MenuItem::query()->updateOrCreate(
                ['key' => $definition['key']],
                collect($definition)->except('parent_key')->all()
            );
        }

        $idsByKey = MenuItem::query()->pluck('id', 'key');

        foreach ($this->definitions() as $definition) {
            $parentId = $definition['parent_key']
                ? $idsByKey->get($definition['parent_key'])
                : null;

            MenuItem::query()
                ->where('key', $definition['key'])
                ->update(['parent_id' => $parentId]);
        }
    }

    public function toTree(iterable $items): array
    {
        $items = collect($items)
            ->map(fn ($item) => $this->normalizeItem($item))
            ->sortBy([
                ['sort_order', 'asc'],
                ['label', 'asc'],
            ])
            ->values();

        $grouped = $items->groupBy(fn (array $item) => $item['parent_id'] ?? 'root');

        $build = function ($parentId) use (&$build, $grouped): array {
            $key = $parentId ?? 'root';

            return ($grouped->get($key) ?? collect())
                ->map(function (array $item) use ($build) {
                    $item['children'] = $build($item['id']);

                    return $item;
                })
                ->values()
                ->all();
        };

        return $build(null);
    }

    public function flattenTree(array $tree, int $depth = 0): array
    {
        $flat = [];

        foreach ($tree as $node) {
            $children = $node['children'] ?? [];
            $row = $node;
            unset($row['children']);
            $row['depth'] = $depth;
            $row['has_children'] = $children !== [];
            $flat[] = $row;
            array_push($flat, ...$this->flattenTree($children, $depth + 1));
        }

        return $flat;
    }

    public function withAncestors(iterable $items, array $selectedIds): array
    {
        $byId = collect($items)
            ->map(fn ($item) => $this->normalizeItem($item))
            ->keyBy('id');

        $include = [];

        foreach ($selectedIds as $id) {
            $current = $byId->get($id);

            while ($current) {
                $include[$current['id']] = true;
                $current = $current['parent_id'] ? $byId->get($current['parent_id']) : null;
            }
        }

        return array_map('intval', array_keys($include));
    }

    public function defaultVisibleKeys(string $roleName): ?array
    {
        return match ($roleName) {
            'owner' => null,
            'branch_manager' => array_values(array_filter(
                array_column($this->tenantDefinitions(), 'key'),
                fn (string $key) => $key !== 'tenant.roles'
            )),
            'cashier' => [
                'tenant.dashboard',
                'tenant.operations',
                'tenant.pos',
            ],
            'production_staff' => [
                'tenant.dashboard',
                'tenant.catalog',
                'tenant.raw_materials',
                'tenant.recipes',
                'tenant.operations',
                'tenant.production',
                'tenant.inventory',
            ],
            default => null,
        };
    }

    protected function normalizeItem(mixed $item): array
    {
        if (is_array($item)) {
            return [
                'id' => (int) $item['id'],
                'key' => $item['key'],
                'label' => $item['label'],
                'icon' => $item['icon'] ?? null,
                'route_name' => $item['route_name'] ?? null,
                'parent_id' => $item['parent_id'] ?? null,
                'sort_order' => (int) ($item['sort_order'] ?? 0),
                'feature_key' => $item['feature_key'] ?? null,
                'children' => $item['children'] ?? [],
            ];
        }

        return [
            'id' => (int) $item->id,
            'key' => $item->key,
            'label' => $item->label,
            'icon' => $item->icon,
            'route_name' => $item->route_name,
            'parent_id' => $item->parent_id,
            'sort_order' => (int) $item->sort_order,
            'feature_key' => $item->feature_key,
            'children' => [],
        ];
    }
}
