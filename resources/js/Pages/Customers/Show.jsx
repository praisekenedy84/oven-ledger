import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import VoidSaleDialog, { canVoidOrder } from '@/Components/VoidSaleDialog';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate, formatDateTime } from '@/lib/format';
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
            <p className="text-xs font-semibold uppercase tracking-wider text-jam">Aging</p>
            <p className="mb-4 text-sm text-muted-foreground">
                How long the unpaid balance has been sitting.
                {aging.oldest_unpaid_at
                    ? ` Oldest charge: ${formatDate(aging.oldest_unpaid_at)}.`
                    : ' Nothing outstanding.'}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {buckets.map((bucket) => (
                    <div
                        key={bucket.key}
                        className="rounded-lg border border-border bg-surface p-3"
                    >
                        <p className="text-xs text-muted-foreground">{bucket.label}</p>
                        <p className="text-base font-bold">
                            <Money amount={aging[bucket.key]} />
                        </p>
                    </div>
                ))}
            </div>
        </SurfaceCard>
    );
}

export default function Show({ customer, ledger, orders, outstanding, aging, priceList = [] }) {
    const auth = usePage().props.auth;
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

            <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-jam">Credit balance</p>
                    <p className="text-4xl font-semibold text-ink">
                        <Money amount={outstanding} />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Credit limit:{' '}
                        {customer.credit_limit != null ? (
                            <Money amount={customer.credit_limit} />
                        ) : (
                            'none'
                        )}
                    </p>
                    {customer.payment_terms && (
                        <p className="mt-2 block text-xs text-muted-foreground">
                            {customer.payment_terms}
                        </p>
                    )}
                </SurfaceCard>
                <AgingCard aging={aging} />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <SurfaceCard>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            profileForm.put(route('tenant.customers.update', customer.id));
                        }}
                        className="flex flex-col gap-4"
                    >
                        <p className="text-base font-bold">Profile</p>
                        <div>
                            <InputLabel value="Name" />
                            <TextInput
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                            />
                            <InputError message={profileForm.errors.name} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Phone" />
                                <TextInput
                                    value={profileForm.data.phone}
                                    onChange={(e) => profileForm.setData('phone', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel value="Email" />
                                <TextInput
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel value="Type" />
                                <Select
                                    value={profileForm.data.type}
                                    onValueChange={(value) => profileForm.setData('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="retail">Retail</SelectItem>
                                        <SelectItem value="wholesale">Wholesale</SelectItem>
                                        <SelectItem value="restaurant">Restaurant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <InputLabel value="Credit limit" />
                                <TextInput
                                    type="number"
                                    value={profileForm.data.credit_limit}
                                    onChange={(e) =>
                                        profileForm.setData('credit_limit', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <InputLabel value="Payment terms" />
                            <TextInput
                                value={profileForm.data.payment_terms}
                                onChange={(e) =>
                                    profileForm.setData('payment_terms', e.target.value)
                                }
                            />
                        </div>
                        <PrimaryButton type="submit" disabled={profileForm.processing}>
                            Save profile
                        </PrimaryButton>
                    </form>
                </SurfaceCard>

                <SurfaceCard>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            paymentForm.post(route('tenant.customers.payments.store', customer.id), {
                                onSuccess: () => paymentForm.reset('amount', 'notes'),
                            });
                        }}
                        className="flex flex-col gap-4"
                    >
                        <p className="text-base font-bold">Record a payment</p>
                        <div>
                            <InputLabel value="Amount (TZS)" />
                            <TextInput
                                type="number"
                                value={paymentForm.data.amount}
                                onChange={(e) => paymentForm.setData('amount', e.target.value)}
                            />
                            <InputError message={paymentForm.errors.amount} />
                        </div>
                        <div>
                            <InputLabel value="Date" />
                            <TextInput
                                type="date"
                                value={paymentForm.data.entry_date}
                                onChange={(e) => paymentForm.setData('entry_date', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel value="Notes" />
                            <TextInput
                                value={paymentForm.data.notes}
                                onChange={(e) => paymentForm.setData('notes', e.target.value)}
                            />
                        </div>
                        <PrimaryButton
                            type="submit"
                            disabled={paymentForm.processing || outstanding <= 0}
                        >
                            Apply payment
                        </PrimaryButton>
                    </form>
                </SurfaceCard>
            </div>

            <SurfaceCard className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-jam">Price list</p>
                <p className="mb-4 text-base font-semibold">
                    {customer.type === 'wholesale' || customer.type === 'restaurant'
                        ? `${customer.type} prices`
                        : 'Retail prices'}
                </p>
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
                            <DataTableCell className="font-semibold">
                                {row.product?.name}
                            </DataTableCell>
                            <DataTableCell>
                                <StatusBadge status={row.product?.type} />
                            </DataTableCell>
                            <DataTableCell className="font-semibold">
                                <Money amount={row.price} />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTable>
            </SurfaceCard>

            <SurfaceCard className="mb-6">
                <p className="mb-1 text-base font-semibold">Delivery notes</p>
                <p className="mb-4 text-sm text-muted-foreground">
                    Kitchen doors, call-aheads, and the addresses this account uses.
                </p>
                <form
                    onSubmit={saveAddress}
                    className="mb-4 grid gap-4 md:grid-cols-[1fr_2fr_1fr_1fr_auto]"
                >
                    <div>
                        <InputLabel value="Label" />
                        <TextInput
                            value={addressForm.data.label}
                            onChange={(e) => addressForm.setData('label', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel value="Address" />
                        <TextInput
                            value={addressForm.data.address_text}
                            onChange={(e) => addressForm.setData('address_text', e.target.value)}
                        />
                        <InputError message={addressForm.errors.address_text} />
                    </div>
                    <div>
                        <InputLabel value="Phone" />
                        <TextInput
                            value={addressForm.data.phone}
                            onChange={(e) => addressForm.setData('phone', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel value="Delivery note" />
                        <TextInput
                            value={addressForm.data.notes}
                            onChange={(e) => addressForm.setData('notes', e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <PrimaryButton type="submit" disabled={addressForm.processing}>
                            {editingAddress ? 'Update' : 'Add'}
                        </PrimaryButton>
                    </div>
                </form>

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
                            <DataTableCell className="font-semibold">{address.label}</DataTableCell>
                            <DataTableCell>{address.address_text}</DataTableCell>
                            <DataTableCell>{address.phone || '—'}</DataTableCell>
                            <DataTableCell>{address.notes || '—'}</DataTableCell>
                            <DataTableCell>
                                <div className="flex gap-2">
                                    <SecondaryButton
                                        size="sm"
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
                                    </SecondaryButton>
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
                                </div>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTable>
            </SurfaceCard>

            <p className="mb-3 text-base font-bold">Statement</p>
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
                        <DataTableCell className="font-semibold">
                            <Money amount={entry.balance_after} />
                        </DataTableCell>
                        <DataTableCell>{entry.notes || '—'}</DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
            <Pagination links={ledger.links} />

            <p className="mb-3 mt-8 text-base font-bold">Orders</p>
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
                            <StatusBadge
                                status={order.status}
                                label={
                                    order.is_pre_order && order.status === 'pending'
                                        ? 'Pre-order'
                                        : order.status === 'completed'
                                          ? 'Sold'
                                          : undefined
                                }
                            />
                        </DataTableCell>
                        <DataTableCell>
                            <div className="flex flex-wrap justify-end gap-2">
                                {order.status === 'pending' && (
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            router.patch(
                                                route('tenant.orders.fulfill', order.id),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Mark sold
                                    </Button>
                                )}
                                {canVoidOrder(auth, order) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
                            </div>
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
