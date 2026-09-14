import { formatMoney } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
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
        .map((item) => `${item.quantity} ${item.name}`)
        .join(', ');

    return (
        <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
            <DialogTitle>Void sale #{order.id}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {itemSummary || 'Ticket'} · {formatMoney(order.total_amount)}
                    {order.cashier?.name ? ` · ${order.cashier.name}` : ''}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: colors.ink }}>
                    This does not rewrite the ticket. Stock comes back if it was taken, and any
                    amount on a customer account is reversed. Hand back cash or card at the till,
                    then ring the sale again if it still needs to be sold.
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    multiline
                    minRows={2}
                    label="Why is this being voided?"
                    value={reason}
                    onChange={(event) => {
                        setReason(event.target.value);
                        setError('');
                    }}
                    error={Boolean(error)}
                    helperText={error || 'Example: Wrong product, or put on the wrong customer.'}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={close} color="inherit" disabled={processing}>
                    Keep sale
                </Button>
                <Button onClick={submit} color="error" variant="contained" disabled={processing}>
                    {processing ? 'Voiding…' : 'Void sale'}
                </Button>
            </DialogActions>
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
