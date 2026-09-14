<?php

namespace Tests\Unit;

use App\Support\MenuCatalog;
use PHPUnit\Framework\TestCase;

class MenuCatalogTest extends TestCase
{
    public function test_it_builds_a_nested_tree_and_flattens_every_level(): void
    {
        $catalog = new MenuCatalog;

        $tree = $catalog->toTree([
            ['id' => 1, 'key' => 'catalog', 'label' => 'Catalog', 'parent_id' => null, 'sort_order' => 1],
            ['id' => 2, 'key' => 'products', 'label' => 'Products', 'parent_id' => 1, 'sort_order' => 1],
            ['id' => 3, 'key' => 'recipes', 'label' => 'Recipes', 'parent_id' => 1, 'sort_order' => 2],
            ['id' => 4, 'key' => 'dashboard', 'label' => 'Dashboard', 'parent_id' => null, 'sort_order' => 0],
        ]);

        $this->assertSame('Dashboard', $tree[0]['label']);
        $this->assertSame('Catalog', $tree[1]['label']);
        $this->assertCount(2, $tree[1]['children']);
        $this->assertSame('Products', $tree[1]['children'][0]['label']);

        $flat = $catalog->flattenTree($tree);

        $this->assertSame([0, 0, 1, 1], array_column($flat, 'depth'));
        $this->assertTrue($flat[1]['has_children']);
        $this->assertFalse($flat[2]['has_children']);
    }

    public function test_it_includes_ancestors_when_a_child_is_selected(): void
    {
        $catalog = new MenuCatalog;
        $items = [
            ['id' => 1, 'key' => 'settings', 'label' => 'Settings', 'parent_id' => null, 'sort_order' => 1],
            ['id' => 2, 'key' => 'roles', 'label' => 'Roles', 'parent_id' => 1, 'sort_order' => 1],
        ];

        $this->assertEqualsCanonicalizing([1, 2], $catalog->withAncestors($items, [2]));
    }

    public function test_default_cashier_menu_is_limited_to_pos_station(): void
    {
        $catalog = new MenuCatalog;

        $this->assertSame(
            ['tenant.dashboard', 'tenant.notifications', 'tenant.pos', 'tenant.pos.tickets'],
            $catalog->defaultVisibleKeys('cashier')
        );
        $this->assertNull($catalog->defaultVisibleKeys('owner'));
        $this->assertNotContains('tenant.roles', $catalog->defaultVisibleKeys('branch_manager'));
        $this->assertContains('tenant.customers', $catalog->defaultVisibleKeys('branch_manager'));
        $this->assertContains('tenant.sales.list', $catalog->defaultVisibleKeys('branch_manager'));
        $this->assertContains('tenant.debts', $catalog->defaultVisibleKeys('branch_manager'));
        $this->assertContains('tenant.capital', $catalog->defaultVisibleKeys('branch_manager'));
        $this->assertContains('tenant.expenses', $catalog->defaultVisibleKeys('branch_manager'));
        $this->assertContains('tenant.shop', $catalog->defaultVisibleKeys('branch_manager'));
    }

    public function test_sales_menu_is_nested_under_sales_group(): void
    {
        $salesList = collect((new MenuCatalog)->tenantDefinitions())
            ->firstWhere('key', 'tenant.sales.list');

        $this->assertNotNull($salesList);
        $this->assertSame('tenant.sales', $salesList['parent_key']);
        $this->assertSame('tenant.sales.index', $salesList['route_name']);
    }

    public function test_production_menu_is_gated_by_production_module(): void
    {
        $production = collect((new MenuCatalog)->tenantDefinitions())
            ->firstWhere('key', 'tenant.production');

        $this->assertNotNull($production);
        $this->assertSame('production_module', $production['feature_key']);
    }
}
