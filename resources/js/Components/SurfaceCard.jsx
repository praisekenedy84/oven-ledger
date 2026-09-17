import { cn } from '@/lib/utils';

export default function SurfaceCard({ children, className, ...props }) {
    return (
        <div
            className={cn('rounded-card border border-border bg-card p-4 shadow-card sm:p-6', className)}
            {...props}
        >
            {children}
        </div>
    );
}
