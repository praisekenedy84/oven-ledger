import DateInput from '@/Components/DateInput';
import NumberInput from '@/Components/NumberInput';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const TextInput = forwardRef(function TextInput(
    { className = '', type = 'text', isFocused = false, inputProps, ...props },
    ref,
) {
    const localRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';
    const isDateField =
        type === 'date' ||
        type === 'datetime-local' ||
        type === 'time' ||
        type === 'month' ||
        type === 'week';
    const isNumberField = type === 'number';

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused && !isDateField && !isNumberField) {
            localRef.current?.focus();
        }
    }, [isFocused, isDateField, isNumberField]);

    if (isDateField) {
        return (
            <DateInput
                ref={ref}
                type={type}
                className={className}
                isFocused={isFocused}
                {...props}
            />
        );
    }

    if (isNumberField) {
        return (
            <NumberInput
                ref={ref}
                className={className}
                isFocused={isFocused}
                {...(inputProps ?? {})}
                {...props}
            />
        );
    }

    return (
        <div className="relative w-full">
            <Input
                {...props}
                ref={localRef}
                type={isPassword && visible ? 'text' : type}
                className={cn(
                    className,
                    isPassword && 'pr-12',
                    isPassword && !visible && 'font-semibold tracking-[0.12em]',
                )}
            />
            {isPassword && (
                <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    onClick={() => setVisible((current) => !current)}
                    onMouseDown={(event) => event.preventDefault()}
                    className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-ink/5 hover:text-foreground sm:h-10 sm:w-10"
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            )}
        </div>
    );
});

export default TextInput;
