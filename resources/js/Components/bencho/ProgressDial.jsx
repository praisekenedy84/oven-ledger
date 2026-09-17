import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Bencho-inspired progress dial (circular).
 */
export default function ProgressDial({
    value = 0,
    max = 100,
    label,
    size = 96,
    stroke = 8,
    className,
    color = 'var(--primary)',
}) {
    const reduceMotion = useReducedMotion();
    const pct = Math.min(100, Math.max(0, (Number(value) / Number(max || 1)) * 100));
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className={cn('inline-flex flex-col items-center gap-2', className)}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth={stroke}
                    />
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={reduceMotion ? false : { strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold text-foreground">{Math.round(pct)}%</span>
                </div>
            </div>
            {label && <p className="text-xs text-muted-foreground">{label}</p>}
        </div>
    );
}
