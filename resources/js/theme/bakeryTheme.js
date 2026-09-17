const colors = {
    kraft: '#EFE3CB',
    cream: '#FBF6EA',
    ink: '#33261C',
    jam: '#9C2B3A',
    butter: '#E3A72B',
    sage: '#5F7A52',
    muted: '#6B5848',
    border: '#E0D2B4',
    cocoa: '#33261C',
    wheat: '#E3A72B',
    wheatLight: '#F4E8C8',
    surface: '#EFE3CB',
    surfaceRaised: '#FBF6EA',
    charcoal: '#33261C',
    success: '#5F7A52',
    warning: '#E3A72B',
    danger: '#9C2B3A',
};

const shadow = '0 2px 8px rgba(51, 38, 28, 0.08)';
const radius = 10;
const controlHeight = 48;
const buttonHeight = {
    small: 34,
    medium: 40,
    large: 46,
};
const headerHeight = 64;
const layout = {
    controlHeight,
    headerHeight,
    pageGutter: { xs: 2, md: 3 },
    sectionGap: 3,
    cardPad: { xs: 2, sm: 3 },
};
const chartPalette = [colors.jam, colors.butter, colors.sage, '#C46B3A', '#7A5C3E', '#D4A574'];

/**
 * Apply shop brand colors as CSS variables (replaces MUI createTheme).
 */
export function applyBakeryBrand(shop) {
    if (typeof document === 'undefined') {
        return;
    }

    const root = document.documentElement;
    if (shop?.primary_color) {
        root.style.setProperty('--primary', shop.primary_color);
        root.style.setProperty('--color-jam', shop.primary_color);
        root.style.setProperty('--ring', shop.primary_color);
        root.style.setProperty('--sidebar-primary', shop.primary_color);
        root.style.setProperty('--destructive', shop.primary_color);
    }
    if (shop?.accent_color) {
        root.style.setProperty('--secondary', shop.accent_color);
        root.style.setProperty('--accent', shop.accent_color);
        root.style.setProperty('--color-butter', shop.accent_color);
        root.style.setProperty('--sidebar-ring', shop.accent_color);
    }
}

/** @deprecated Use applyBakeryBrand — kept for call-site compatibility during migration */
export function createBakeryTheme(shop) {
    applyBakeryBrand(shop);
    return { colors, shop };
}

export {
    colors,
    shadow,
    radius,
    controlHeight,
    buttonHeight,
    headerHeight,
    layout,
    chartPalette,
};

export default { colors, shadow, radius, layout, chartPalette, headerHeight };
