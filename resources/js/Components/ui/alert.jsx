import { cn } from '@/lib/utils';

function Alert({ className, variant = 'default', ...props }) {
    return (
        <div
            role="alert"
            className={cn(
                'relative w-full rounded-card border px-4 py-3 text-sm',
                variant === 'destructive' && 'border-destructive/50 bg-destructive/10 text-destructive',
                variant === 'warning' && 'border-butter/50 bg-butter/15 text-ink',
                variant === 'success' && 'border-sage/50 bg-sage/10 text-sage',
                variant === 'default' && 'border-border bg-card text-foreground',
                className,
            )}
            {...props}
        />
    );
}

function AlertTitle({ className, ...props }) {
    return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />;
}

function AlertDescription({ className, ...props }) {
    return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
