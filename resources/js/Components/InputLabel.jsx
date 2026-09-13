import { InputLabel as MuiInputLabel } from '@mui/material';

export default function InputLabel({ value, className = '', children, ...props }) {
    return (
        <MuiInputLabel
            {...props}
            shrink
            className={className}
            sx={{
                position: 'relative',
                transform: 'none',
                mb: 0.75,
                fontSize: 14,
                fontWeight: 600,
                color: 'text.primary',
                ...props.sx,
            }}
        >
            {value ?? children}
        </MuiInputLabel>
    );
}
