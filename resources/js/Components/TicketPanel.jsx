import { shadow } from '@/theme/bakeryTheme';
import { cn } from '@/lib/utils';

function sxToStyle(sx) {
    if (!sx || typeof sx !== 'object') {
        return {};
    }

    const style = {};
    const keyMap = {
        bgcolor: 'backgroundColor',
        color: 'color',
    };

    Object.entries(sx).forEach(([key, value]) => {
        if (value === null || typeof value === 'object') {
            return;
        }
        style[keyMap[key] ?? key] = value;
    });

    return style;
}

export default function TicketPanel({
    children,
    className,
    sx,
    component: Component = 'div',
    style,
    ...props
}) {
    return (
        <Component
            {...props}
            className={cn(
                'relative overflow-hidden bg-cream border border-border shadow-card',
                '[&>*]:relative [&>*]:z-[1]',
                'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-0 before:h-2.5 before:-translate-y-[5px]',
                'before:content-[""] before:bg-[radial-gradient(circle_at_8px_0,var(--color-kraft)_6px,transparent_6.5px)] before:bg-[length:16px_10px] before:bg-repeat-x',
                'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-0 after:h-2.5 after:translate-y-[5px] after:rotate-180',
                'after:content-[""] after:bg-[radial-gradient(circle_at_8px_0,var(--color-kraft)_6px,transparent_6.5px)] after:bg-[length:16px_10px] after:bg-repeat-x',
                className,
            )}
            style={{
                boxShadow: shadow,
                ...sxToStyle(sx),
                ...style,
            }}
        >
            {children}
        </Component>
    );
}
