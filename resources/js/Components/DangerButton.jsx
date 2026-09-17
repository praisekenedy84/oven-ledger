import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export default function DangerButton({ className, disabled, children, ...props }) {
    return (
        <Button variant="destructive" className={cn(className)} disabled={disabled} {...props}>
            {children}
        </Button>
    );
}
