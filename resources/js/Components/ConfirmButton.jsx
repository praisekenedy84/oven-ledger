import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { useState } from 'react';

export default function ConfirmButton({
    onConfirm,
    confirmMessage = 'Are you sure?',
    confirmTitle = 'Confirm',
    variant = 'danger',
    children,
    disabled,
    ...props
}) {
    const [open, setOpen] = useState(false);
    const color =
        variant === 'danger' ? 'error' : variant === 'primary' ? 'primary' : 'inherit';
    const buttonVariant = variant === 'secondary' ? 'outlined' : 'contained';

    return (
        <>
            <Button
                type="button"
                color={color === 'inherit' ? 'inherit' : color}
                variant={buttonVariant}
                disabled={disabled}
                onClick={() => setOpen(true)}
                {...props}
            >
                {children}
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{confirmTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{confirmMessage}</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        color={color === 'inherit' ? 'primary' : color}
                        variant="contained"
                        disabled={disabled}
                        onClick={() => {
                            onConfirm();
                            setOpen(false);
                        }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
