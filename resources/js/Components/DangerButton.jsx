import { Button } from '@mui/material';

export default function DangerButton({ className = '', disabled, children, ...props }) {
    return (
        <Button
            {...props}
            variant="contained"
            color="error"
            disabled={disabled}
            className={className}
        >
            {children}
        </Button>
    );
}
