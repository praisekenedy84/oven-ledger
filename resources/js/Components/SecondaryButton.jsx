import { Button } from '@mui/material';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <Button
            {...props}
            type={type}
            variant="outlined"
            color="inherit"
            disabled={disabled}
            className={className}
        >
            {children}
        </Button>
    );
}
