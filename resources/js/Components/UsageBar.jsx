import { colors } from '@/theme/bakeryTheme';
import { cn } from '@/lib/utils';

export default function UsageBar({ value = 0, max = 1, label, className }) {
    const safeMax = Math.max(Number(max) || 1, 1);
    const used = Number(value) || 0;
    const ratio = Math.min(used / safeMax, 1);
    const tone = ratio >= 1 ? colors.jam : ratio >= 0.75 ? colors.butter : colors.sage;

    return (
        <div className={cn('min-w-[120px]', className)}>
            <div className="mb-1.5 flex justify-between">
                <span className="text-xs text-muted-foreground">{label ?? 'Branches'}</span>
                <span className="text-xs font-bold">
                    {used}/{safeMax}
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-wheat-light">
                <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                        width: `${Math.max(ratio * 100, used > 0 ? 6 : 0)}%`,
                        backgroundColor: tone,
                    }}
                />
            </div>
        </div>
    );
}
