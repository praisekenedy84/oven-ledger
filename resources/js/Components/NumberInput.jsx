import { Input } from '@/Components/ui/input';
import { formatNumberInput, parseNumberInput } from '@/lib/format';
import { cn } from '@/lib/utils';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

function digitCountBefore(value, caret) {
    const text = String(value ?? '').slice(0, Math.max(0, caret ?? 0));
    return (text.match(/\d/g) || []).length;
}

function caretFromDigitCount(value, digits) {
    if (digits <= 0) {
        return 0;
    }

    let seen = 0;
    const text = String(value ?? '');

    for (let index = 0; index < text.length; index += 1) {
        if (/\d/.test(text[index])) {
            seen += 1;
            if (seen >= digits) {
                return index + 1;
            }
        }
    }

    return text.length;
}

function decimalsFromStep(step) {
    if (step === undefined || step === null || step === '' || step === 'any') {
        return 3;
    }

    const text = String(step);
    if (!text.includes('.')) {
        return 0;
    }

    return text.split('.')[1]?.length ?? 0;
}

/**
 * Text field that shows 1,250,000 while keeping form state as a plain number string.
 */
const NumberInput = forwardRef(function NumberInput(
    {
        className = '',
        value,
        onChange,
        onBlur,
        isFocused = false,
        step,
        min,
        max,
        inputMode,
        maximumFractionDigits,
        ...props
    },
    ref,
) {
    const localRef = useRef(null);
    const decimals =
        maximumFractionDigits !== undefined
            ? maximumFractionDigits
            : decimalsFromStep(step);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const displayValue = formatNumberInput(value, { maximumFractionDigits: decimals });

    const handleChange = (event) => {
        const input = event.target;
        const digitsBefore = digitCountBefore(input.value, input.selectionStart);
        const endedWithSeparator = /[.,]$/.test(input.value.replace(/,/g, ''));
        const raw = parseNumberInput(input.value);

        if (onChange) {
            onChange({
                ...event,
                target: {
                    ...input,
                    value: raw,
                    name: input.name,
                },
            });
        }

        requestAnimationFrame(() => {
            const node = localRef.current;
            if (!node) {
                return;
            }

            const nextDisplay = formatNumberInput(raw, { maximumFractionDigits: decimals });
            let nextCaret = caretFromDigitCount(nextDisplay, digitsBefore);

            if (endedWithSeparator && nextDisplay.endsWith('.')) {
                nextCaret = nextDisplay.length;
            }

            try {
                node.setSelectionRange(nextCaret, nextCaret);
            } catch {
                // Some browsers reject selection on certain input types.
            }
        });
    };

    return (
        <Input
            {...props}
            ref={localRef}
            type="text"
            inputMode={inputMode ?? (decimals > 0 ? 'decimal' : 'numeric')}
            step={step}
            min={min}
            max={max}
            value={displayValue}
            onChange={handleChange}
            onBlur={onBlur}
            className={cn('tabular-nums', className)}
            autoComplete="off"
        />
    );
});

export default NumberInput;
