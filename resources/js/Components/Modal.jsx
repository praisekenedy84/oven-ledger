import { Dialog, DialogContent } from '@mui/material';

const MAX_WIDTH = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
    xl: 'lg',
    '2xl': 'md',
};

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    return (
        <Dialog
            open={show}
            onClose={() => {
                if (closeable) {
                    onClose();
                }
            }}
            maxWidth={MAX_WIDTH[maxWidth] ?? 'md'}
            fullWidth
        >
            <DialogContent sx={{ p: 0 }}>{children}</DialogContent>
        </Dialog>
    );
}
