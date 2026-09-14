import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { colors } from '@/theme/bakeryTheme';
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
        sx,
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
                sx={{
                    color: colors.muted,
                    width: { xs: 44, sm: 40 },
                    height: { xs: 44, sm: 40 },
                    minWidth: { xs: 44, sm: 40 },
                    minHeight: { xs: 44, sm: 40 },
                    '&:hover': { color: colors.ink, bgcolor: 'rgba(51, 38, 28, 0.06)' },
                }}
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
            sx={[
                {
                    '& .MuiOutlinedInput-root': {
                        minHeight: 48,
                    },
                    '& .MuiInputBase-input, & .MuiInputBase-input:focus, & .MuiInputBase-input:focus-visible':
                        {
                            outline: 'none',
                            boxShadow: 'none',
                            border: 'none',
                            color: colors.ink,
                            caretColor: colors.ink,
                            WebkitTextFillColor: colors.ink,
                            fontSize: '1rem',
                            lineHeight: 1.5,
                            minHeight: 48,
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            overflow: 'visible',
                        },
                    ...(isPassword
                        ? {
                              '& .MuiInputBase-input': {
                                  letterSpacing: visible ? 'normal' : '0.12em',
                                  fontWeight: 600,
                              },
                          }
                        : {}),
                },
                sx,
            ]}
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
