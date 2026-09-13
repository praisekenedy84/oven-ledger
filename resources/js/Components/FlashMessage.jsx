import { Alert, Snackbar } from '@mui/material';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function FlashMessage() {
    const { flash } = usePage().props;
    const [open, setOpen] = useState(false);
    const message = flash?.success || flash?.error || flash?.status;
    const severity = flash?.error ? 'error' : 'success';

    useEffect(() => {
        setOpen(Boolean(message));
    }, [message]);

    return (
        <Snackbar
            open={open && Boolean(message)}
            autoHideDuration={5000}
            onClose={() => setOpen(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{ top: { xs: 16, sm: 24 }, left: { xs: 16, sm: 'auto' }, right: { xs: 16, sm: 24 } }}
        >
            <Alert
                onClose={() => setOpen(false)}
                severity={severity}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}
