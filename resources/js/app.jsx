import '../css/app.css';
import './bootstrap';

import bakeryTheme from './theme/bakeryTheme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Oven Ledger';

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
                <CssBaseline />
                <App {...props} />
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
