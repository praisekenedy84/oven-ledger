import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * SmoothUI-inspired spring button (Motion-powered).
 */
export default function SmoothButton({
    children,
    className,
    variant = 'default',
    size = 'default',
    disabled,
    type = 'button',
    ...props
}) {
    const reduceMotion = useReducedMotion();

    const variants = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        outline: 'border border-input bg-card hover:bg-muted',
        ghost: 'hover:bg-muted',
    };

    const sizes = {
        default: 'h-10 px-4 text-sm',
        sm: 'h-[34px] px-3 text-xs',
        lg: 'h-[46px] px-6 text-base',
    };

    return (
        <motion.button
            type={type}
            disabled={disabled}
            whileHover={reduceMotion || disabled ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
