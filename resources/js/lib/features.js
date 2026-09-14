export const FEATURE_LABELS = {
    production_module: 'Production batches',
    wholesale_module: 'Wholesale',
    restaurant_module: 'Restaurant',
    trading_goods_module: 'Trading Goods',
    custom_orders_module: 'Custom Orders',
    multi_branch: 'Multi-Branch',
    tra_fiscalization: 'TRA Fiscalization',
    inter_branch_transfers: 'Inter-Branch Transfers',
};

export const BUSINESS_SIZE_LABELS = {
    small: 'Small bakery',
    medium: 'Medium bakery',
    large: 'Large bakery',
};

export function featureLabel(key) {
    return FEATURE_LABELS[key] ?? key.replace(/_/g, ' ');
}

export function businessSizeLabel(size) {
    return BUSINESS_SIZE_LABELS[size] ?? size;
}
