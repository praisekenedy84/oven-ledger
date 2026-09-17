import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

export default function InputLabel({ value, className, children, ...props }) {
    return (
        <Label className={cn('mb-1.5 block', className)} {...props}>
            {value ?? children}
        </Label>
    );
}
