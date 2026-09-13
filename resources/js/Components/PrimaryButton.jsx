import { Button } from '@mui/material';

export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <Button
            {...props}
            variant="contained"
            color="primary"
            disabled={disabled}
            className={className}
        >
            {children}
        </Button>
    );
}
