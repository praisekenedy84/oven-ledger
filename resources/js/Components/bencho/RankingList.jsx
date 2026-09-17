import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Bencho-inspired ranking list with hover lift.
 */
export default function RankingList({ title, items = [], className, empty = 'Nothing ranked yet.' }) {
    const reduceMotion = useReducedMotion();

    return (
        <div className={cn('rounded-card border border-border bg-card p-4 shadow-card sm:p-5', className)}>
            {title && <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>}
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{empty}</p>
            ) : (
                <ol className="space-y-2">
                    {items.map((item, index) => (
                        <motion.li
                            key={item.id ?? item.name ?? index}
                            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                            whileHover={reduceMotion ? undefined : { x: 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                {item.meta && <p className="truncate text-xs text-muted-foreground">{item.meta}</p>}
                            </div>
                            {item.value != null && (
                                <span className="shrink-0 text-sm font-semibold text-foreground">{item.value}</span>
                            )}
                        </motion.li>
                    ))}
                </ol>
            )}
        </div>
    );
}
