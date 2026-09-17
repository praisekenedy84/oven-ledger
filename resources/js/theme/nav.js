import {
    LayoutDashboard,
    Bell,
    ScanBarcode,
    ClipboardList,
    ShoppingBag,
    FlaskConical,
    BookOpen,
    Croissant,
    Package2,
    Users,
    Landmark,
    PiggyBank,
    Wallet,
    BarChart3,
    Building2,
    BadgeCheck,
    Store,
    Shield,
    Settings,
    ScrollText,
    Receipt,
} from 'lucide-react';

/**
 * Lucide equivalents of the previous MUI outlined nav icons.
 * PointOfSale → ScanBarcode, BakeryDining → Croissant, etc.
 */
const NAV_ICONS = {
    'tenant.dashboard': LayoutDashboard,
    'tenant.notifications.index': Bell,
    'tenant.notifications': Bell,
    'tenant.pos.index': ScanBarcode,
    'tenant.pos.tickets': ClipboardList,
    'tenant.products.index': ShoppingBag,
    'tenant.raw-materials.index': FlaskConical,
    'tenant.recipes.index': BookOpen,
    'tenant.production-batches.index': Croissant,
    'tenant.inventory.index': Package2,
    'tenant.customers.index': Users,
    'tenant.debts.index': Landmark,
    'tenant.capital.index': PiggyBank,
    'tenant.expenses.index': Wallet,
    'tenant.expenses': Wallet,
    'tenant.reports.index': BarChart3,
    'tenant.sales.index': Receipt,
    'tenant.sales.list': Receipt,
    'tenant.branches.index': Building2,
    'tenant.staff.index': BadgeCheck,
    'tenant.shop.edit': Store,
    'tenant.roles.index': Shield,
    'tenant.catalog': ShoppingBag,
    'tenant.operations': Croissant,
    'tenant.sales': BarChart3,
    'tenant.settings': Settings,
    'platform.dashboard': LayoutDashboard,
    'platform.tenants.index': Building2,
    'platform.roles.index': Shield,
    'platform.audit.index': ScrollText,
};

export function safeRoute(name) {
    try {
        if (!name || typeof route !== 'function' || !route().has(name)) {
            return null;
        }
        return route(name);
    } catch {
        return null;
    }
}

export function resolveNavIcon(routeName, key) {
    if (NAV_ICONS[routeName]) {
        return NAV_ICONS[routeName];
    }
    if (key && NAV_ICONS[key]) {
        return NAV_ICONS[key];
    }
    if (routeName?.startsWith('tenant.products') || routeName?.startsWith('platform.tenants')) {
        return ShoppingBag;
    }
    if (routeName?.startsWith('tenant.customers') || routeName?.startsWith('tenant.staff')) {
        return Users;
    }
    if (routeName?.startsWith('tenant.debts')) {
        return Landmark;
    }
    if (routeName?.startsWith('tenant.capital')) {
        return PiggyBank;
    }
    if (routeName?.startsWith('tenant.expenses')) {
        return Wallet;
    }
    if (routeName?.startsWith('tenant.reports') || routeName?.startsWith('platform.audit')) {
        return BarChart3;
    }
    if (routeName?.includes('inventory') || routeName?.includes('raw-materials')) {
        return Package2;
    }
    if (routeName?.includes('recipe')) {
        return BookOpen;
    }
    if (routeName?.includes('production') || routeName?.includes('batch')) {
        return Croissant;
    }
    if (routeName?.includes('branch')) {
        return Building2;
    }
    if (routeName?.includes('pos')) {
        return ScanBarcode;
    }
    return LayoutDashboard;
}

export function isRouteActive(routeName) {
    if (!routeName || typeof route !== 'function') {
        return false;
    }
    try {
        return (
            route().current(routeName) ||
            route().current(`${routeName}.*`) ||
            (routeName === 'tenant.pos.index' && route().current('tenant.pos.*') && !route().current('tenant.pos.tickets'))
        );
    } catch {
        return false;
    }
}

export function isNavTreeActive(item) {
    if (!item) {
        return false;
    }
    if (isRouteActive(item.route_name)) {
        return true;
    }
    return (item.children ?? []).some(isNavTreeActive);
}

export function activeGroupKeys(items = []) {
    return (items ?? [])
        .filter((item) => (item.children ?? []).length > 0 && isNavTreeActive(item))
        .map((item) => item.key);
}

export function flattenMenuLeaves(items = []) {
    return items.flatMap((item) => {
        const children = flattenMenuLeaves(item.children ?? []);
        return item.route_name ? [item, ...children] : children;
    });
}

export function prepareNavTree(items = []) {
    return (items ?? [])
        .map((item) => {
            const children = prepareNavTree(item.children ?? []);
            const href = safeRoute(item.route_name);
            if (!href && children.length === 0) {
                return null;
            }

            return {
                ...item,
                href,
                children,
                Icon: resolveNavIcon(item.route_name, item.key),
            };
        })
        .filter(Boolean);
}

export function userInitials(name = 'OL') {
    return String(name)
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}
