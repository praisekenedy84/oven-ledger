import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                kraft: '#EFE3CB',
                cream: '#FBF6EA',
                ink: '#33261C',
                jam: '#9C2B3A',
                butter: '#E3A72B',
                sage: '#5F7A52',
                cocoa: '#33261C',
                wheat: '#E3A72B',
                'wheat-light': '#F4E8C8',
                surface: '#EFE3CB',
                'surface-raised': '#FBF6EA',
                charcoal: '#33261C',
                muted: '#6B5848',
                border: '#E0D2B4',
                success: '#5F7A52',
                warning: '#E3A72B',
                danger: '#9C2B3A',
            },
            fontFamily: {
                sans: ['Poppins', ...defaultTheme.fontFamily.sans],
                brand: ['Poppins', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                card: '10px',
            },
            boxShadow: {
                card: '0 2px 8px rgb(51 38 28 / 0.08)',
            },
        },
    },

    plugins: [forms],
};
