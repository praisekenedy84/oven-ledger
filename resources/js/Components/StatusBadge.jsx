import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

const VARIANT_MAP = {
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
    error: 'destructive',
    info: 'secondary',
    default: 'muted',
    muted: 'muted',
};

export default function StatusBadge({ status, label, tone, className, children }) {
    const text = label ?? children ?? status;
    const variant = VARIANT_MAP[tone ?? status] ?? 'muted';

    return (
        <Badge variant={variant} className={cn('capitalize', className)}>
            {text}
        </Badge>
    );
}
