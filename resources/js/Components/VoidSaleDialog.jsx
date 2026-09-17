import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { formatMoney, formatQuantity } from '@/lib/format';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function VoidSaleDialog({ order, open, onClose }) {
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const close = () => {
        if (processing) {
            return;
        }
        setReason('');
        setError('');
        onClose();
    };

    const submit = () => {
        const trimmed = reason.trim();
        if (trimmed.length < 3) {
            setError('Add a short reason so the void can be audited.');
            return;
        }

        setProcessing(true);
        router.post(
            route('tenant.orders.void', order.id),
            { reason: trimmed },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReason('');
                    setError('');
                    onClose();
                },
                onError: (errors) => {
                    setError(errors.reason || errors.order || 'Could not void this sale.');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    if (!order) {
        return null;
    }

    const itemSummary = (order.items ?? [])
        .map((item) => `${formatQuantity(item.quantity)} ${item.name}`)
        .join(', ');

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    close();
                }
            }}
        >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Void sale #{order.id}</DialogTitle>
                    <DialogDescription>
                        {itemSummary || 'Ticket'} · {formatMoney(order.total_amount)}
                        {order.cashier?.name ? ` · ${order.cashier.name}` : ''}
                    </DialogDescription>
                </DialogHeader>

                <p className="text-sm text-ink">
                    This does not rewrite the ticket. Stock comes back if it was taken, and any
                    amount on a customer account is reversed. Hand back cash or card at the till,
                    then ring the sale again if it still needs to be sold.
                </p>

                <div>
                    <InputLabel value="Why is this being voided?" htmlFor="void-reason" />
                    <textarea
                        id="void-reason"
                        autoFocus
                        rows={2}
                        value={reason}
                        onChange={(event) => {
                            setReason(event.target.value);
                            setError('');
                        }}
                        className={cn(
                            'mt-1.5 flex min-h-[80px] w-full rounded-md border bg-card px-3.5 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                            error ? 'border-destructive' : 'border-input',
                        )}
                    />
                    <InputError message={error} />
                    {!error && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Example: Wrong product, or put on the wrong customer.
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" size="sm" disabled={processing} onClick={close}>
                        Keep sale
                    </Button>
                    <Button variant="destructive" size="sm" disabled={processing} onClick={submit}>
                        {processing ? 'Voiding…' : 'Void sale'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function canRefundSales(auth) {
    return (auth?.permissions ?? []).includes('pos.refund');
}

export function canVoidOrder(auth, order) {
    const permissions = auth?.permissions ?? [];
    const canRefund = permissions.includes('pos.refund');
    const canSell = permissions.includes('pos.sell');

    if (!order || order.status === 'voided') {
        return false;
    }

    if (order.status === 'pending') {
        return canSell || canRefund;
    }

    return canRefund;
}
