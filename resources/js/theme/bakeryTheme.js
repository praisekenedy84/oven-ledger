import { createTheme } from '@mui/material/styles';

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
const controlHeight = 40;
const headerHeight = 64;
const layout = {
    controlHeight,
    headerHeight,
    pageGutter: { xs: 2, md: 3 },
    sectionGap: 3,
    cardPad: { xs: 2, sm: 3 },
};
const chartPalette = [colors.jam, colors.butter, colors.sage, '#C46B3A', '#7A5C3E', '#D4A574'];

const bakeryTheme = createTheme({
    spacing: 8,
    palette: {
        mode: 'light',
        primary: {
            main: colors.jam,
            dark: '#7C1F2C',
            light: '#C24A5A',
            contrastText: '#FBF6EA',
        },
        secondary: {
            main: colors.butter,
            light: colors.wheatLight,
            contrastText: colors.ink,
        },
        background: {
            default: colors.kraft,
            paper: colors.cream,
        },
        text: {
            primary: colors.ink,
            secondary: colors.muted,
        },
        success: { main: colors.sage, contrastText: '#FBF6EA' },
        warning: { main: colors.butter, contrastText: colors.ink },
        error: { main: colors.jam },
        divider: colors.border,
        grey: {
            50: colors.kraft,
            100: colors.wheatLight,
            200: colors.border,
            500: colors.muted,
            800: colors.ink,
            900: colors.ink,
        },
    },
    typography: {
        fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
        h1: {
            fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
            fontWeight: 700,
            fontSize: '2.5rem',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
        },
        h2: {
            fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
        },
        h3: {
            fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: '1.75rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h4: {
            fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h5: {
            fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: '1.35rem',
            lineHeight: 1.25,
        },
        h6: {
            fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: '1.15rem',
            lineHeight: 1.3,
        },
        subtitle1: { fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' },
        subtitle2: { fontWeight: 600, fontSize: '0.875rem' },
        body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
        body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
        overline: {
            fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
            fontWeight: 700,
            fontSize: '0.6875rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
        },
        caption: { fontSize: '0.75rem', letterSpacing: '0.01em' },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    },
    shape: {
        borderRadius: radius,
    },
    shadows: [
        'none',
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
        shadow,
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: colors.kraft,
                    color: colors.ink,
                },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    borderRadius: radius,
                    boxShadow: 'none',
                    minHeight: controlHeight,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 8,
                    paddingBottom: 8,
                    lineHeight: 1.25,
                    '&:hover': { boxShadow: 'none' },
                },
                containedPrimary: {
                    backgroundColor: colors.jam,
                    '&:hover': { backgroundColor: '#7C1F2C' },
                },
                containedSecondary: {
                    backgroundColor: colors.butter,
                    color: colors.ink,
                    '&:hover': { backgroundColor: '#C8901F' },
                },
                outlined: {
                    borderColor: colors.border,
                    color: colors.ink,
                    '&:hover': {
                        borderColor: colors.ink,
                        backgroundColor: 'rgba(51, 38, 28, 0.04)',
                    },
                },
                sizeSmall: {
                    minHeight: controlHeight,
                    paddingLeft: 14,
                    paddingRight: 14,
                },
                sizeLarge: {
                    minHeight: 48,
                    paddingLeft: 20,
                    paddingRight: 20,
                },
            },
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: colors.cream,
                    borderRadius: radius,
                },
                outlined: {
                    borderColor: colors.border,
                    boxShadow: shadow,
                },
            },
        },
        MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: `1px solid ${colors.border}`,
                    boxShadow: shadow,
                    borderRadius: radius,
                    backgroundColor: colors.cream,
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: 24,
                    '&:last-child': { paddingBottom: 24 },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    backgroundImage: 'none',
                },
            },
        },
        MuiAppBar: {
            defaultProps: { elevation: 0, color: 'inherit' },
            styleOverrides: {
                root: {
                    backgroundColor: colors.cream,
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.ink,
                    boxShadow: 'none',
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: headerHeight,
                    paddingLeft: 16,
                    paddingRight: 16,
                    '@media (min-width: 900px)': {
                        minHeight: headerHeight,
                        paddingLeft: 24,
                        paddingRight: 24,
                    },
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.wheatLight,
                    '& .MuiTableCell-head': {
                        color: colors.muted,
                        fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: colors.border,
                    fontSize: '0.875rem',
                    padding: '14px 16px',
                    verticalAlign: 'middle',
                },
                head: {
                    padding: '12px 16px',
                    lineHeight: 1.2,
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: radius,
                    boxShadow: shadow,
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: { padding: '24px 24px 12px' },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: { padding: '8px 24px 16px' },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: { padding: '16px 24px 24px', gap: 8 },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: radius },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    appearance: 'none',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    '&:focus': {
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                    },
                    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus': {
                        WebkitBoxShadow: `0 0 0 1000px ${colors.cream} inset`,
                        WebkitTextFillColor: colors.ink,
                        caretColor: colors.ink,
                        borderRadius: 'inherit',
                        transition: 'background-color 9999s ease-out 0s',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: radius,
                    backgroundColor: colors.cream,
                    minHeight: controlHeight,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.border,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.butter,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.jam,
                    },
                    '&.Mui-focused': {
                        boxShadow: 'none',
                    },
                },
                input: {
                    padding: '10px 14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    '&:focus': {
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                    },
                },
                inputSizeSmall: {
                    padding: '8.5px 14px',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    height: 24,
                    fontWeight: 600,
                    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
                },
                sizeSmall: { height: 24 },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: { width: controlHeight, height: controlHeight, minWidth: controlHeight, minHeight: controlHeight },
                sizeSmall: { width: 32, height: 32, minWidth: 32, minHeight: 32 },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: { borderRadius: radius, minHeight: controlHeight },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: { minHeight: 48 },
                indicator: { backgroundColor: colors.jam, height: 3, borderRadius: 999 },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    minHeight: 48,
                    paddingLeft: 16,
                    paddingRight: 16,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: colors.muted,
                    '&.Mui-selected': { color: colors.ink },
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    '&.Mui-checked': { color: colors.jam },
                    '&.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.jam },
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: colors.border,
                    '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: colors.jam },
                },
            },
        },
    },
});

function sanitizeHex(value) {
    if (typeof value !== 'string') {
        return null;
    }

    return /^#[0-9A-Fa-f]{6}$/.test(value) ? value.toUpperCase() : null;
}

export function createBakeryTheme(brand = {}) {
    const primary = sanitizeHex(brand?.primary_color) ?? colors.jam;
    const accent = sanitizeHex(brand?.accent_color) ?? colors.butter;

    return createTheme(bakeryTheme, {
        palette: {
            primary: {
                main: primary,
                contrastText: colors.cream,
            },
            secondary: {
                main: accent,
                contrastText: colors.ink,
            },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    containedPrimary: {
                        backgroundColor: primary,
                        '&:hover': { backgroundColor: primary },
                    },
                    containedSecondary: {
                        backgroundColor: accent,
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    indicator: { backgroundColor: primary },
                },
            },
            MuiSwitch: {
                styleOverrides: {
                    switchBase: {
                        '&.Mui-checked': { color: primary },
                        '&.Mui-checked + .MuiSwitch-track': { backgroundColor: primary },
                    },
                },
            },
            MuiCheckbox: {
                styleOverrides: {
                    root: {
                        '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: primary },
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: primary,
                        },
                    },
                },
            },
        },
    });
}

export { colors, shadow, radius, chartPalette, layout, controlHeight, headerHeight };
export default bakeryTheme;
