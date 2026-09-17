import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/recharts') || id.includes('node_modules/victory-vendor')) {
                        return 'recharts';
                    }

                    if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
                        return 'motion';
                    }

                    if (id.includes('node_modules/@radix-ui')) {
                        return 'radix-ui';
                    }

                    if (id.includes('node_modules/lucide-react')) {
                        return 'lucide';
                    }

                    return undefined;
                },
            },
        },
    },
});
