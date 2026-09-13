export const FEATURE_LABELS = {
    wholesale_module: 'Wholesale',
    restaurant_module: 'Restaurant',
    trading_goods_module: 'Trading Goods',
    custom_orders_module: 'Custom Orders',
    multi_branch: 'Multi-Branch',
    tra_fiscalization: 'TRA Fiscalization',
    inter_branch_transfers: 'Inter-Branch Transfers',
};

export function featureLabel(key) {
    return FEATURE_LABELS[key] ?? key.replace(/_/g, ' ');
}
