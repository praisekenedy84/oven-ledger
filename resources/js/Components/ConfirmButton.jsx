import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const TRIGGER_VARIANTS = {
    danger: 'destructive',
    primary: 'default',
    secondary: 'outline',
};

const CONFIRM_VARIANTS = {
    danger: 'destructive',
    primary: 'default',
    secondary: 'default',
};

export default function ConfirmButton({
    onConfirm,
    confirmMessage = 'Are you sure?',
    confirmTitle = 'Confirm',
    variant = 'danger',
    children,
    disabled,
    size,
    className,
    ...props
}) {
    const [open, setOpen] = useState(false);
    const buttonSize = size === 'small' ? 'sm' : size;

    return (
        <>
            <Button
                type="button"
                variant={TRIGGER_VARIANTS[variant] ?? 'destructive'}
                size={buttonSize}
                className={cn(className)}
                disabled={disabled}
                onClick={() => setOpen(true)}
                {...props}
            >
                {children}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>{confirmTitle}</DialogTitle>
                        <DialogDescription>{confirmMessage}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={CONFIRM_VARIANTS[variant] ?? 'destructive'}
                            size="sm"
                            disabled={disabled}
                            onClick={() => {
                                onConfirm();
                                setOpen(false);
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
