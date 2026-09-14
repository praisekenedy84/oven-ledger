import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BakeryDiningOutlinedIcon from '@mui/icons-material/BakeryDiningOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

const NAV_ICONS = {
    'tenant.dashboard': DashboardOutlinedIcon,
    'tenant.notifications.index': NotificationsNoneOutlinedIcon,
    'tenant.notifications': NotificationsNoneOutlinedIcon,
    'tenant.pos.index': PointOfSaleOutlinedIcon,
    'tenant.pos.tickets': ReceiptLongOutlinedIcon,
    'tenant.products.index': LocalMallOutlinedIcon,
    'tenant.raw-materials.index': ScienceOutlinedIcon,
    'tenant.recipes.index': MenuBookOutlinedIcon,
    'tenant.production-batches.index': BakeryDiningOutlinedIcon,
    'tenant.inventory.index': Inventory2OutlinedIcon,
    'tenant.customers.index': PeopleOutlinedIcon,
    'tenant.debts.index': AccountBalanceOutlinedIcon,
    'tenant.capital.index': SavingsOutlinedIcon,
    'tenant.expenses.index': PaymentsOutlinedIcon,
    'tenant.expenses': PaymentsOutlinedIcon,
    'tenant.reports.index': AssessmentOutlinedIcon,
    'tenant.sales.index': ReceiptLongOutlinedIcon,
    'tenant.sales.list': ReceiptLongOutlinedIcon,
    'tenant.branches.index': BusinessOutlinedIcon,
    'tenant.staff.index': BadgeOutlinedIcon,
    'tenant.shop.edit': StorefrontOutlinedIcon,
    'tenant.roles.index': ShieldOutlinedIcon,
    'tenant.catalog': LocalMallOutlinedIcon,
    'tenant.operations': BakeryDiningOutlinedIcon,
    'tenant.sales': AssessmentOutlinedIcon,
    'tenant.settings': SettingsOutlinedIcon,
    'platform.dashboard': DashboardOutlinedIcon,
    'platform.tenants.index': BusinessOutlinedIcon,
    'platform.roles.index': ShieldOutlinedIcon,
    'platform.audit.index': PolicyOutlinedIcon,
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
        return LocalMallOutlinedIcon;
    }
    if (routeName?.startsWith('tenant.customers') || routeName?.startsWith('tenant.staff')) {
        return PeopleOutlinedIcon;
    }
    if (routeName?.startsWith('tenant.debts')) {
        return AccountBalanceOutlinedIcon;
    }
    if (routeName?.startsWith('tenant.capital')) {
        return SavingsOutlinedIcon;
    }
    if (routeName?.startsWith('tenant.expenses')) {
        return PaymentsOutlinedIcon;
    }
    if (routeName?.startsWith('tenant.reports') || routeName?.startsWith('platform.audit')) {
        return AssessmentOutlinedIcon;
    }
    if (routeName?.includes('inventory') || routeName?.includes('raw-materials')) {
        return Inventory2OutlinedIcon;
    }
    if (routeName?.includes('recipe')) {
        return MenuBookOutlinedIcon;
    }
    if (routeName?.includes('production') || routeName?.includes('batch')) {
        return BakeryDiningOutlinedIcon;
    }
    if (routeName?.includes('branch')) {
        return BusinessOutlinedIcon;
    }
    return DashboardOutlinedIcon;
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
