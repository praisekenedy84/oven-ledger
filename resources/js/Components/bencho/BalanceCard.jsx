import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatMoney, formatQuantity } from '@/lib/format';

/**
 * Bencho-inspired balance / KPI tile with spring number and subtle hover slosh.
 */
export default function BalanceCard({
    label = 'Balance',
    value = 0,
    delta,
    deltaLabel,
    className,
    format = 'money',
}) {
    const reduceMotion = useReducedMotion();
    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, { stiffness: 90, damping: 20 });
    const display = useTransform(spring, (latest) => {
        if (format === 'money') {
            return formatMoney(latest);
        }
            return formatQuantity(latest);
    });

    useEffect(() => {
        motionValue.set(Number(value) || 0);
    }, [value, motionValue]);

    return (
        <motion.div
            className={cn(
                'rounded-card border border-border bg-card p-4 shadow-card sm:p-5',
                className,
            )}
            whileHover={reduceMotion ? undefined : { y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <motion.p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {display}
            </motion.p>
            {(delta != null || deltaLabel) && (
                <p
                    className={cn(
                        'mt-1 text-sm',
                        Number(delta) >= 0 ? 'text-sage' : 'text-jam',
                    )}
                >
                    {delta != null && (
                        <span>
                            {Number(delta) >= 0 ? '+' : ''}
                            {format === 'money' ? formatMoney(delta) : formatQuantity(delta)}
                        </span>
                    )}
                    {deltaLabel && <span className="text-muted-foreground"> · {deltaLabel}</span>}
                </p>
            )}
        </motion.div>
    );
}
