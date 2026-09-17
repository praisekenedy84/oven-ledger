import { cn } from '@/lib/utils';

export default function InputError({ message, className }) {
    if (!message) {
        return null;
    }

    return <p className={cn('mt-1 text-sm text-destructive', className)}>{message}</p>;
}
