import '../css/app.css';
import './bootstrap';

import { applyBakeryBrand } from './theme/bakeryTheme';
import { createInertiaApp, router, usePage } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

const appName = import.meta.env.VITE_APP_NAME || 'Oven Ledger';

function BrandTheme({ children }) {
    const shop = usePage().props.shop;

    useEffect(() => {
        applyBakeryBrand(shop);
    }, [shop?.primary_color, shop?.accent_color]);

    return (
        <>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    className: 'font-sans',
                    style: {
                        background: 'var(--card)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                    },
                }}
            />
        </>
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
            <App {...props}>
                {({ Component, key, props: pageProps }) => (
                    <BrandTheme>
                        <Component key={key} {...pageProps} />
                    </BrandTheme>
                )}
            </App>,
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
