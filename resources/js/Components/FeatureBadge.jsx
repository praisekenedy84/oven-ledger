import { Badge } from '@/Components/ui/badge';
import { featureLabel } from '@/lib/features';
import { cn } from '@/lib/utils';

export default function FeatureBadge({ featureKey, enabled, className }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'h-6 font-semibold',
                enabled
                    ? 'border-transparent bg-sage/12 text-sage'
                    : 'border-border bg-wheat-light text-muted-foreground',
                className,
            )}
        >
            {featureLabel(featureKey)}
        </Badge>
    );
}
