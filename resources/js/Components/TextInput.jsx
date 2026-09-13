import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        InputProps,
        inputProps,
        slotProps,
        ...props
    },
    ref,
) {
    const localRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const incomingInputSlot =
        slotProps?.input && typeof slotProps.input === 'object' ? slotProps.input : {};
    const existingAdornment = InputProps?.endAdornment ?? incomingInputSlot.endAdornment;
    const passwordAdornment = isPassword ? (
        <InputAdornment position="end">
            <IconButton
                type="button"
                edge="end"
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                onClick={() => setVisible((current) => !current)}
                onMouseDown={(event) => event.preventDefault()}
                size="small"
            >
                {visible ? (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                    <VisibilityOutlinedIcon fontSize="small" />
                )}
            </IconButton>
        </InputAdornment>
    ) : null;

    return (
        <TextField
            {...props}
            type={isPassword && visible ? 'text' : type}
            className={className}
            inputRef={localRef}
            fullWidth
            size="small"
            slotProps={{
                ...slotProps,
                htmlInput: {
                    ...inputProps,
                    ...(slotProps?.htmlInput && typeof slotProps.htmlInput === 'object'
                        ? slotProps.htmlInput
                        : {}),
                },
                input: {
                    ...InputProps,
                    ...incomingInputSlot,
                    endAdornment: passwordAdornment ? (
                        <>
                            {existingAdornment}
                            {passwordAdornment}
                        </>
                    ) : (
                        existingAdornment
                    ),
                },
            }}
        />
    );
});
