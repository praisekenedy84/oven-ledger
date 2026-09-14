<?php

return [

    'version' => env('APP_VERSION', '1.0.0'),

    'contact_email' => env('CONTACT_EMAIL', env('MAIL_FROM_ADDRESS', 'hello@example.com')),

    'business_sizes' => [
        'small',
        'medium',
        'large',
    ],

    /*
    |--------------------------------------------------------------------------
    | Business size → feature presets
    |--------------------------------------------------------------------------
    |
    | Choosing a bakery size on the platform applies these flags. Other module
    | flags (wholesale, restaurant, etc.) are left unchanged unless listed.
    |
    */
    'business_size_presets' => [
        'small' => [
            'production_module' => false,
            'multi_branch' => false,
            'inter_branch_transfers' => false,
        ],
        'medium' => [
            'production_module' => true,
            'multi_branch' => false,
            'inter_branch_transfers' => false,
        ],
        'large' => [
            'production_module' => true,
            'multi_branch' => true,
            'inter_branch_transfers' => true,
        ],
    ],

    'feature_keys' => [
        'production_module',
        'wholesale_module',
        'restaurant_module',
        'trading_goods_module',
        'custom_orders_module',
        'multi_branch',
        'tra_fiscalization',
        'inter_branch_transfers',
    ],

    'default_feature_flags' => [
        'production_module' => true,
        'wholesale_module' => true,
        'restaurant_module' => true,
        'trading_goods_module' => true,
        'custom_orders_module' => true,
        'multi_branch' => false,
        'tra_fiscalization' => false,
        'inter_branch_transfers' => false,
    ],

    'permission_features' => [
        'wholesale.manage_clients' => 'wholesale_module',
        'branches.manage' => 'multi_branch',
        'reports.view_all_branches' => 'multi_branch',
        'inventory.transfer' => 'inter_branch_transfers',
        'production.manage' => 'production_module',
    ],

    'permission_groups' => [
        'pos' => 'Point of sale',
        'inventory' => 'Inventory',
        'production' => 'Production',
        'reports' => 'Reports',
        'wholesale' => 'Wholesale',
        'customers' => 'Customers',
        'debts' => 'Debts',
        'expenses' => 'Expenses',
        'staff' => 'Staff & access',
        'branches' => 'Branches',
        'catalog' => 'Catalog',
        'settings' => 'Shop settings',
        'tenants' => 'Tenants',
        'features' => 'Features',
        'roles' => 'Roles',
        'audit' => 'Audit',
    ],

];
