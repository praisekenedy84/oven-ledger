import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import SurfaceCard from '@/Components/SurfaceCard';
import VoidSaleDialog, { canRefundSales } from '@/Components/VoidSaleDialog';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate, formatDateTime } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    Button,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function AgingCard({ aging }) {
    const buckets = [
        { key: 'current', label: '0-30 days' },
        { key: 'days_31_60', label: '31-60' },
        { key: 'days_61_90', label: '61-90' },
        { key: 'days_90_plus', label: '90+' },
    ];

    return (
        <SurfaceCard>
            <Typography variant="overline" sx={{ color: colors.jam }}>
                Aging
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How long the unpaid balance has been sitting.
                {aging.oldest_unpaid_at
                    ? ` Oldest charge: ${formatDate(aging.oldest_unpaid_at)}.`
                    : ' Nothing outstanding.'}
            </Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                }}
            >
                {buckets.map((bucket) => (
                    <Box
                        key={bucket.key}
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: colors.surface,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {bucket.label}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                            <Money amount={aging[bucket.key]} />
                        </Typography>
                    </Box>
                ))}
            </Box>
        </SurfaceCard>
    );
}

export default function Show({ customer, ledger, orders, outstanding, aging, priceList = [] }) {
    const canRefund = canRefundSales(usePage().props.auth);
    const [editingAddress, setEditingAddress] = useState(null);
    const [voidTarget, setVoidTarget] = useState(null);

    const profileForm = useForm({
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        type: customer.type,
        tin_number: customer.tin_number ?? '',
        credit_limit: customer.credit_limit ?? '',
        payment_terms: customer.payment_terms ?? '',
        is_active: customer.is_active,
    });

    const addressForm = useForm({
        label: 'Home',
        address_text: '',
        phone: '',
        notes: '',
    });

    const paymentForm = useForm({
        amount: '',
        notes: '',
        entry_date: new Date().toISOString().slice(0, 10),
    });

    const saveAddress = (e) => {
        e.preventDefault();
        if (editingAddress) {
            addressForm.put(
                route('tenant.customers.addresses.update', [customer.id, editingAddress]),
                {
                    onSuccess: () => {
                        setEditingAddress(null);
                        addressForm.reset();
                    },
                },
            );
            return;
        }

        addressForm.post(route('tenant.customers.addresses.store', customer.id), {
            onSuccess: () => addressForm.reset(),
        });
    };

    return (
        <TenantLayout title={customer.name}>
            <Head title={customer.name} />

            <PageHeader
                eyebrow={`${customer.type} account`}
                title={customer.name}
                description={`${customer.phone || 'No phone'} · credit terms ${customer.payment_terms || 'not set'}`}
                backHref={route('tenant.customers.index')}
                actions={
                    <StatusBadge
                        status={outstanding > 0 ? 'open' : 'settled'}
                        label={outstanding > 0 ? 'Has balance' : 'Settled'}
                    />
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
                    mb: 3,
                }}
            >
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.jam }}>
                        Credit balance
                    </Typography>
                    <Typography variant="h3" sx={{ color: colors.ink }}>
                        <Money amount={outstanding} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Credit limit:{' '}
                        {customer.credit_limit != null ? (
                            <Money amount={customer.credit_limit} />
                        ) : (
                            'none'
                        )}
                    </Typography>
                    {customer.payment_terms && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            {customer.payment_terms}
                        </Typography>
                    )}
                </SurfaceCard>
                <AgingCard aging={aging} />
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                    mb: 3,
                }}
            >
                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        profileForm.put(route('tenant.customers.update', customer.id));
                    }}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 1 }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Profile
                    </Typography>
                    <Stack spacing={2}>
                        <Box>
                            <InputLabel value="Name" />
                            <TextInput
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                            />
                            <InputError message={profileForm.errors.name} />
                        </Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            }}
                        >
                            <Box>
                                <InputLabel value="Phone" />
                                <TextInput
                                    value={profileForm.data.phone}
                                    onChange={(e) => profileForm.setData('phone', e.target.value)}
                                />
                            </Box>
                            <Box>
                                <InputLabel value="Email" />
                                <TextInput
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                />
                            </Box>
                            <Box>
                                <InputLabel value="Type" />
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={profileForm.data.type}
                                        onChange={(e) =>
                                            profileForm.setData('type', e.target.value)
                                        }
                                    >
                                        <MenuItem value="retail">Retail</MenuItem>
                                        <MenuItem value="wholesale">Wholesale</MenuItem>
                                        <MenuItem value="restaurant">Restaurant</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box>
                                <InputLabel value="Credit limit" />
                                <TextInput
                                    type="number"
                                    value={profileForm.data.credit_limit}
                                    onChange={(e) =>
                                        profileForm.setData('credit_limit', e.target.value)
                                    }
                                />
                            </Box>
                        </Box>
                        <Box>
                            <InputLabel value="Payment terms" />
                            <TextInput
                                value={profileForm.data.payment_terms}
                                onChange={(e) =>
                                    profileForm.setData('payment_terms', e.target.value)
                                }
                            />
                        </Box>
                        <PrimaryButton type="submit" disabled={profileForm.processing}>
                            Save profile
                        </PrimaryButton>
                    </Stack>
                </Paper>

                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        paymentForm.post(route('tenant.customers.payments.store', customer.id), {
                            onSuccess: () => paymentForm.reset('amount', 'notes'),
                        });
                    }}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 1 }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Record a payment
                    </Typography>
                    <Stack spacing={2}>
                        <Box>
                            <InputLabel value="Amount (TZS)" />
                            <TextInput
                                type="number"
                                value={paymentForm.data.amount}
                                onChange={(e) => paymentForm.setData('amount', e.target.value)}
                            />
                            <InputError message={paymentForm.errors.amount} />
                        </Box>
                        <Box>
                            <InputLabel value="Date" />
                            <TextInput
                                type="date"
                                value={paymentForm.data.entry_date}
                                onChange={(e) => paymentForm.setData('entry_date', e.target.value)}
                            />
                        </Box>
                        <Box>
                            <InputLabel value="Notes" />
                            <TextInput
                                value={paymentForm.data.notes}
                                onChange={(e) => paymentForm.setData('notes', e.target.value)}
                            />
                        </Box>
                        <PrimaryButton
                            type="submit"
                            disabled={paymentForm.processing || outstanding <= 0}
                        >
                            Apply payment
                        </PrimaryButton>
                    </Stack>
                </Paper>
            </Box>

            <SurfaceCard sx={{ mb: 3 }}>
                <Typography variant="overline" sx={{ color: colors.jam }}>
                    Price list
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {customer.type === 'wholesale' || customer.type === 'restaurant'
                        ? `${customer.type} prices`
                        : 'Retail prices'}
                </Typography>
                <DataTable
                    columns={[
                        { label: 'Product' },
                        { label: 'Type' },
                        { label: 'Price' },
                    ]}
                    emptyMessage="No prices set for this channel yet."
                >
                    {priceList.map((row) => (
                        <DataTableRow key={row.id}>
                            <DataTableCell sx={{ fontWeight: 600 }}>
                                {row.product?.name}
                            </DataTableCell>
                            <DataTableCell>
                                <StatusBadge status={row.product?.type} />
                            </DataTableCell>
                            <DataTableCell sx={{ fontWeight: 600 }}>
                                <Money amount={row.price} />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTable>
            </SurfaceCard>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 1, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Delivery notes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Kitchen doors, call-aheads, and the addresses this account uses.
                </Typography>
                <Box
                    component="form"
                    onSubmit={saveAddress}
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr 1fr auto' },
                        mb: 2,
                    }}
                >
                    <Box>
                        <InputLabel value="Label" />
                        <TextInput
                            value={addressForm.data.label}
                            onChange={(e) => addressForm.setData('label', e.target.value)}
                        />
                    </Box>
                    <Box>
                        <InputLabel value="Address" />
                        <TextInput
                            value={addressForm.data.address_text}
                            onChange={(e) => addressForm.setData('address_text', e.target.value)}
                        />
                        <InputError message={addressForm.errors.address_text} />
                    </Box>
                    <Box>
                        <InputLabel value="Phone" />
                        <TextInput
                            value={addressForm.data.phone}
                            onChange={(e) => addressForm.setData('phone', e.target.value)}
                        />
                    </Box>
                    <Box>
                        <InputLabel value="Delivery note" />
                        <TextInput
                            value={addressForm.data.notes}
                            onChange={(e) => addressForm.setData('notes', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                        <PrimaryButton type="submit" disabled={addressForm.processing}>
                            {editingAddress ? 'Update' : 'Add'}
                        </PrimaryButton>
                    </Box>
                </Box>

                <DataTable
                    columns={[
                        { label: 'Label' },
                        { label: 'Address' },
                        { label: 'Phone' },
                        { label: 'Notes' },
                        { label: '' },
                    ]}
                    emptyMessage="No addresses yet. Add one for delivery or pre-orders."
                >
                    {customer.addresses.map((address) => (
                        <DataTableRow key={address.id}>
                            <DataTableCell sx={{ fontWeight: 600 }}>{address.label}</DataTableCell>
                            <DataTableCell>{address.address_text}</DataTableCell>
                            <DataTableCell>{address.phone || '—'}</DataTableCell>
                            <DataTableCell>{address.notes || '—'}</DataTableCell>
                            <DataTableCell>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setEditingAddress(address.id);
                                            addressForm.setData({
                                                label: address.label,
                                                address_text: address.address_text,
                                                phone: address.phone ?? '',
                                                notes: address.notes ?? '',
                                            });
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <ConfirmButton
                                        size="small"
                                        variant="danger"
                                        confirmMessage="Remove this address?"
                                        onConfirm={() =>
                                            router.delete(
                                                route('tenant.customers.addresses.destroy', [
                                                    customer.id,
                                                    address.id,
                                                ]),
                                            )
                                        }
                                    >
                                        Remove
                                    </ConfirmButton>
                                </Stack>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTable>
            </Paper>

            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Statement
            </Typography>
            <DataTable
                columns={[
                    { label: 'Date' },
                    { label: 'Type' },
                    { label: 'Amount' },
                    { label: 'Balance after' },
                    { label: 'Notes' },
                ]}
                emptyMessage="No charges or payments yet."
            >
                {ledger.data.map((entry) => (
                    <DataTableRow key={entry.id}>
                        <DataTableCell>{formatDateTime(entry.entry_date)}</DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={entry.type} />
                        </DataTableCell>
                        <DataTableCell>
                            <Money amount={entry.amount} />
                        </DataTableCell>
                        <DataTableCell sx={{ fontWeight: 600 }}>
                            <Money amount={entry.balance_after} />
                        </DataTableCell>
                        <DataTableCell>{entry.notes || '—'}</DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
            <Pagination links={ledger.links} />

            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 4, mb: 1.5 }}>
                Orders
            </Typography>
            <DataTable
                columns={[
                    { label: 'When' },
                    { label: 'Cashier' },
                    { label: 'Channel' },
                    { label: 'Fulfillment' },
                    { label: 'Total' },
                    { label: 'Status' },
                    { label: '' },
                ]}
                emptyMessage="No orders linked to this customer."
            >
                {orders.data.map((order) => (
                    <DataTableRow key={order.id}>
                        <DataTableCell>
                            {formatDateTime(order.requested_fulfillment_at || order.created_at)}
                        </DataTableCell>
                        <DataTableCell>
                            {order.sold_by?.name ?? 'Unassigned'}
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={order.channel} />
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge
                                status={order.fulfillment_type}
                                label={
                                    order.is_pre_order
                                        ? `Pre-order · ${order.fulfillment_type}`
                                        : order.fulfillment_type
                                }
                            />
                        </DataTableCell>
                        <DataTableCell>
                            <Money amount={order.total_amount} />
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={order.status} />
                        </DataTableCell>
                        <DataTableCell>
                            <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap flexWrap="wrap">
                                {order.status === 'pending' && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() =>
                                            router.patch(
                                                route('tenant.orders.fulfill', order.id),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Mark fulfilled
                                    </Button>
                                )}
                                {canRefund && order.status !== 'voided' && (
                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={() => setVoidTarget({
                                            ...order,
                                            cashier: order.sold_by,
                                            items: (order.items ?? []).map((item) => ({
                                                name: item.product?.name ?? 'Item',
                                                quantity: item.quantity,
                                            })),
                                        })}
                                    >
                                        Void
                                    </Button>
                                )}
                            </Stack>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
            <Pagination links={orders.links} />

            <VoidSaleDialog
                order={voidTarget}
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
            />
        </TenantLayout>
    );
}
