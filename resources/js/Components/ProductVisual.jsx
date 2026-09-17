import { cn } from '@/lib/utils';

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
    if (/cake|gateau|gâteau|tart|tier/.test(haystack)) {
        return 'cake';
    }
    if (/pastr|croissant|danish|bun|roll|muffin|cookie|scone/.test(haystack)) {
        return 'pastry';
    }
    return 'bread';
}

/**
 * Category photo tile for POS / catalog. Prefer product.image_url when present,
 * otherwise the bakery stock photo for the resolved kind.
 */
export default function ProductVisual({
    product,
    size = 88,
    radius = '10px',
    className,
    style,
}) {
    const kind = resolveKind(product);
    const src = product?.image_url || product?.photo_url || PHOTOS[kind];

    const dimensionStyle =
        size === '100%'
            ? { width: '100%' }
            : {
                  width: typeof size === 'number' ? `${size}px` : size,
                  height: typeof size === 'number' ? `${size}px` : size,
              };

    return (
        <div
            className={cn(
                'shrink-0 overflow-hidden bg-wheat-light bg-cover bg-center shadow-[inset_0_0_0_1px_rgb(51_38_28/0.08)]',
                size === '100%' && 'min-h-[88px]',
                className,
            )}
            style={{
                ...dimensionStyle,
                borderRadius: radius,
                backgroundImage: `url(${src})`,
                ...style,
            }}
            role="img"
            aria-label={product?.name ? `${product.name} image` : undefined}
            aria-hidden={!product?.name}
        />
    );
}

export { resolveKind, PHOTOS };
