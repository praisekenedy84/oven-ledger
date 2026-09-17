import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Native date / datetime-local field with a visible calendar affordance.
 * Keeps browser picker behavior (same as pre-rebuild MUI TextField type="date").
 */
const DateInput = forwardRef(function DateInput(
    { className = '', type = 'date', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
        showPicker: () => {
            try {
                localRef.current?.showPicker?.();
            } catch {
                localRef.current?.focus();
            }
        },
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const openPicker = () => {
        try {
            localRef.current?.showPicker?.();
        } catch {
            localRef.current?.focus();
        }
    };

    return (
        <div
            className={cn(
                'relative w-full',
                type === 'datetime-local' ? 'min-w-[16rem]' : 'min-w-[11.5rem]',
            )}
        >
            <Input
                {...props}
                ref={localRef}
                type={type}
                onClick={openPicker}
                className={cn('date-input cursor-pointer pr-11', className)}
            />
            <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={openPicker}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-ink/5 hover:text-foreground"
            >
                <CalendarDays className="h-4 w-4" />
            </button>
        </div>
    );
});

export default DateInput;
