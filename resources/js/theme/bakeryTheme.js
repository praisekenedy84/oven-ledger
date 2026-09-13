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
const chartPalette = [colors.jam, colors.butter, colors.sage];

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
        fontFamily: '"Archivo", "Helvetica", "Arial", sans-serif',
        h1: {
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 700,
            fontSize: '2.5rem',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
        },
        h2: {
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
        },
        h3: {
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 600,
            fontSize: '1.75rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h4: {
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h5: {
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 600,
            fontSize: '1.35rem',
            lineHeight: 1.25,
        },
        h6: {
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 600,
            fontSize: '1.15rem',
            lineHeight: 1.3,
        },
        subtitle1: { fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' },
        subtitle2: { fontWeight: 600, fontSize: '0.875rem' },
        body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
        body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
        overline: {
            fontFamily: '"Archivo", "Helvetica", "Arial", sans-serif',
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
                    minHeight: 40,
                    px: 2,
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
                sizeSmall: { minHeight: 32 },
            },
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: { backgroundImage: 'none', backgroundColor: colors.cream },
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
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.wheatLight,
                    '& .MuiTableCell-head': {
                        color: colors.muted,
                        fontFamily: '"Archivo", "Helvetica", "Arial", sans-serif',
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
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: radius },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: radius,
                    backgroundColor: colors.cream,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.border,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.butter,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.jam,
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    fontWeight: 600,
                    fontFamily: '"Archivo", "Helvetica", "Arial", sans-serif',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: { borderRadius: radius },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: { backgroundColor: colors.jam, height: 3, borderRadius: 999 },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
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

export { colors, shadow, radius, chartPalette };
export default bakeryTheme;
