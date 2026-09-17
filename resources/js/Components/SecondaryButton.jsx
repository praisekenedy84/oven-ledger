import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export default function SecondaryButton({ className, disabled, children, fullWidth, ...props }) {
    return (
        <Button variant="outline" className={cn(fullWidth && 'w-full', className)} disabled={disabled} {...props}>
            {children}
        </Button>
    );
}
