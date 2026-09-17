import {
    Dialog,
    DialogContent,
} from '@/Components/ui/dialog';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const widthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    }[maxWidth] ?? 'max-w-2xl';

    return (
        <Dialog
            open={show}
            onOpenChange={(open) => {
                if (!open && closeable) {
                    onClose();
                }
            }}
        >
            <DialogContent className={`${widthClass} p-0`}>{children}</DialogContent>
        </Dialog>
    );
}
