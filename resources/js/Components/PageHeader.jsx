import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export default function PageHeader({ eyebrow, title, description, actions, backHref, className }) {
    return (
        <div
            className={cn(
                'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <div className="min-w-0 flex-1">
                {backHref && (
                    <Button asChild variant="link" size="sm" className="mb-1 h-auto px-0 text-muted-foreground">
                        <Link href={backHref}>← Back</Link>
                    </Button>
                )}
                {eyebrow && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
                )}
                <h1 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">{title}</h1>
                {description && (
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
            )}
        </div>
    );
}
