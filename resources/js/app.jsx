import '../css/app.css';
import './bootstrap';

import bakeryTheme, { createBakeryTheme } from './theme/bakeryTheme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createInertiaApp, router, usePage } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Oven Ledger';

function BrandTheme({ children }) {
    const shop = usePage().props.shop;
    const theme = useMemo(
        () => createBakeryTheme(shop),
        [shop?.primary_color, shop?.accent_color],
    );

    useEffect(() => {
        if (shop?.primary_color) {
            document.documentElement.style.setProperty('--color-jam', shop.primary_color);
        }
        if (shop?.accent_color) {
            document.documentElement.style.setProperty('--color-butter', shop.accent_color);
        }
    }, [shop?.primary_color, shop?.accent_color]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ThemeProvider theme={bakeryTheme}>
                <App {...props}>
                    {({ Component, key, props: pageProps }) => (
                        <BrandTheme>
                            <Component key={key} {...pageProps} />
                        </BrandTheme>
                    )}
                </App>
            </ThemeProvider>,
        );
    },
    progress: {
        color: '#9C2B3A',
    },
});

router.on('invalid', (event) => {
    const status = event.detail.response?.status;

    if (status === 419) {
        event.preventDefault();
        window.location.reload();
    }
});

document.addEventListener('inertia:error', (event) => {
    const status = event.detail?.response?.status;

    if (status === 419) {
        window.location.reload();
    }
});
