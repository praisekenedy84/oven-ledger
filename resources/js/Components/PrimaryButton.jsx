import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export default function PrimaryButton({ className, disabled, children, fullWidth, ...props }) {
    return (
        <Button
            className={cn(fullWidth && 'w-full', className)}
            disabled={disabled}
            {...props}
        >
            {children}
        </Button>
    );
}
