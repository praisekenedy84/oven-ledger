import { colors } from '@/theme/bakeryTheme';
import { Box } from '@mui/material';

const PHOTOS = {
    bread: '/images/bakery/bread.png',
    cake: '/images/bakery/cake.png',
    pastry: '/images/bakery/pastry.png',
    tools: '/images/bakery/tools.png',
};

function resolveKind(product = {}) {
    const type = String(product.type ?? '').toLowerCase();
    const name = String(product.name ?? '').toLowerCase();
    const category = String(product.product_category?.name ?? product.category ?? '').toLowerCase();
    const haystack = `${name} ${category}`;

    if (type === 'trading' || /tool|supply|supplies|utensil|packag|hardware/.test(haystack)) {
        return 'tools';
    }
    if (/cake|gateau|gateau|tart|tier/.test(haystack)) {
        return 'cake';
    }
    if (/pastr|croissant|danish|bun|roll|muffin|cookie|scone/.test(haystack)) {
        return 'pastry';
    }
    return 'bread';
}

export default function ProductVisual({ product, size = 88, radius = '10px', sx }) {
    const kind = resolveKind(product);

    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: radius,
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: colors.wheatLight,
                backgroundImage: `url(${PHOTOS[kind]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'inset 0 0 0 1px rgb(51 38 28 / 0.08)',
                ...sx,
            }}
            aria-hidden
        />
    );
}

export { resolveKind, PHOTOS };
