import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * SmoothUI-inspired animated tabs with sliding indicator.
 */
export default function AnimatedTabs({ tabs = [], value, onChange, className }) {
    const reduceMotion = useReducedMotion();

    return (
        <div className={cn('relative inline-flex rounded-md bg-muted p-1', className)} role="tablist">
            {tabs.map((tab) => {
                const active = tab.value === value;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange?.(tab.value)}
                        className={cn(
                            'relative z-10 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                            active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId={reduceMotion ? undefined : 'animated-tab-pill'}
                                className="absolute inset-0 -z-10 rounded-sm bg-card shadow-sm"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
