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
// 48px keeps text legible, meets touch-target guidance, and avoids iOS zoom (<16px inputs).
const controlHeight = 48;
// Buttons are shorter than inputs so actions feel refined; sizes actually differ.
const buttonHeight = {
    small: 34,
    medium: 40,
    large: 46,
};
const inputFontSize = '1rem';
const inputLineHeight = 1.5;
const inputPaddingY = 12;
const inputPaddingX = 14;
const inputComfortStyles = {
    fontSize: inputFontSize,
    lineHeight: inputLineHeight,
    padding: `${inputPaddingY}px ${inputPaddingX}px`,
    boxSizing: 'border-box',
    minHeight: controlHeight,
    overflow: 'visible',
};
const nativeFocusReset = {
    appearance: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    color: colors.ink,
    caretColor: colors.ink,
    WebkitTextFillColor: colors.ink,
    '&::placeholder': {
        color: colors.muted,
        opacity: 1,
        WebkitTextFillColor: colors.muted,
    },
    '&:focus, &:focus-visible': {
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        color: colors.ink,
        caretColor: colors.ink,
        WebkitTextFillColor: colors.ink,
    },
    '&[type="password"]': {
        // Keep native password masking; appearance:none can wash out discs in WebKit.
        appearance: 'auto',
        color: colors.ink,
        caretColor: colors.ink,
        WebkitTextFillColor: colors.ink,
        letterSpacing: '0.12em',
    },
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
        button: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
        },
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
                'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), textarea, select':
                    {
                        '&:focus, &:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none',
                        },
                    },
                '.MuiInputBase-root, .MuiOutlinedInput-root, .MuiSelect-select, .MuiInputBase-input, .MuiOutlinedInput-input':
                    {
                        outline: 'none',
                        '&:focus, &:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none',
                        },
                    },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                    minHeight: buttonHeight.medium,
                    paddingLeft: 14,
                    paddingRight: 14,
                    paddingTop: 6,
                    paddingBottom: 6,
                    fontSize: '0.875rem',
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    transition:
                        'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': { boxShadow: 'none' },
                    '&.Mui-disabled': { opacity: 0.5 },
                },
                startIcon: {
                    marginLeft: -2,
                    marginRight: 6,
                    '& > *:nth-of-type(1)': { fontSize: '1.05rem' },
                },
                endIcon: {
                    marginRight: -2,
                    marginLeft: 6,
                    '& > *:nth-of-type(1)': { fontSize: '1.05rem' },
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
                containedInherit: {
                    backgroundColor: colors.wheatLight,
                    color: colors.ink,
                    '&:hover': { backgroundColor: colors.border },
                },
                outlined: {
                    borderColor: colors.border,
                    borderWidth: 1,
                    color: colors.ink,
                    backgroundColor: colors.cream,
                    '&:hover': {
                        borderColor: colors.muted,
                        backgroundColor: colors.wheatLight,
                    },
                },
                outlinedError: {
                    backgroundColor: 'transparent',
                    '&:hover': {
                        backgroundColor: 'rgba(156, 43, 58, 0.06)',
                        borderColor: colors.jam,
                    },
                },
                text: {
                    paddingLeft: 10,
                    paddingRight: 10,
                    minHeight: buttonHeight.medium - 4,
                    color: colors.muted,
                    '&:hover': {
                        color: colors.ink,
                        backgroundColor: 'rgba(51, 38, 28, 0.04)',
                    },
                },
                sizeSmall: {
                    minHeight: buttonHeight.small,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: '0.8125rem',
                    borderRadius: 7,
                    '& .MuiButton-startIcon': {
                        marginLeft: -2,
                        marginRight: 4,
                        '& > *:nth-of-type(1)': { fontSize: '0.95rem' },
                    },
                    '& .MuiButton-endIcon': {
                        marginRight: -2,
                        marginLeft: 4,
                        '& > *:nth-of-type(1)': { fontSize: '0.95rem' },
                    },
                },
                sizeLarge: {
                    minHeight: buttonHeight.large,
                    paddingLeft: 18,
                    paddingRight: 18,
                    paddingTop: 8,
                    paddingBottom: 8,
                    fontSize: '0.9375rem',
                    borderRadius: 9,
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
                root: {
                    padding: '12px 24px 20px',
                    gap: 8,
                    '& .MuiButton-root': {
                        minWidth: 72,
                    },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: radius },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    outline: 'none',
                    '&:focus, &:focus-visible, &.Mui-focused': {
                        outline: 'none',
                        boxShadow: 'none',
                    },
                },
                input: {
                    ...nativeFocusReset,
                    ...inputComfortStyles,
                    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus': {
                        WebkitBoxShadow: '0 0 0 1000px #FFFDF8 inset',
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
                    // Slightly lighter than kraft panels so fields read as inputs,
                    // while staying warm with the bakery palette.
                    backgroundColor: '#FFFDF8',
                    color: colors.ink,
                    minHeight: controlHeight,
                    alignItems: 'center',
                    outline: 'none',
                    boxShadow: 'none',
                    '@media (max-width: 899px)': {
                        minHeight: controlHeight,
                    },
                    '&:focus, &:focus-visible, &.Mui-focused': {
                        outline: 'none',
                        boxShadow: 'none',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.border,
                        borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.butter,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.jam,
                        borderWidth: 1,
                    },
                    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.danger,
                    },
                    '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.danger,
                        borderWidth: 1,
                    },
                },
                notchedOutline: {
                    outline: 'none',
                },
                input: {
                    ...nativeFocusReset,
                    ...inputComfortStyles,
                },
                inputSizeSmall: {
                    ...inputComfortStyles,
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                select: {
                    outline: 'none',
                    '&:focus, &:focus-visible': {
                        outline: 'none',
                        backgroundColor: 'transparent',
                    },
                },
                nativeInput: nativeFocusReset,
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
                root: {
                    width: buttonHeight.medium,
                    height: buttonHeight.medium,
                    minWidth: buttonHeight.medium,
                    minHeight: buttonHeight.medium,
                    borderRadius: 8,
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                },
                sizeSmall: {
                    width: 30,
                    height: 30,
                    minWidth: 30,
                    minHeight: 30,
                    borderRadius: 7,
                },
                sizeLarge: {
                    width: buttonHeight.large,
                    height: buttonHeight.large,
                    minWidth: buttonHeight.large,
                    minHeight: buttonHeight.large,
                },
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
                            borderWidth: 1,
                        },
                        '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.danger,
                            borderWidth: 1,
                        },
                    },
                },
            },
        },
    });
}

export { colors, shadow, radius, chartPalette, layout, controlHeight, buttonHeight, headerHeight };
export default bakeryTheme;
