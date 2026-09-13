import { BarChart } from '@/Components/AccentChart';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import VoidSaleDialog, { canRefundSales } from '@/Components/VoidSaleDialog';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDateTime } from '@/lib/format';
import { colors, chartPalette } from '@/theme/bakeryTheme';
import { Box, Button, FormControl, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const reportOnly = [
    'salesByChannel',
    'salesByProductType',
    'salesByStaff',
    'tickets',
    'receivables',
    'payablesOpen',
    'receivablesTotal',
    'preOrdersPending',
    'filters',
];

function ticketItems(ticket) {
    return (ticket.items ?? []).map((item) => `${item.quantity} ${item.name}`).join(', ');
}

export default function Reports({
    salesByChannel,
    salesByProductType,
    salesByStaff = [],
    tickets,
    receivables = [],
    payablesOpen = 0,
    receivablesTotal = 0,
    preOrdersPending = 0,
    branches,
    filters,
}) {
    const { auth } = usePage().props;
    const canRefund = canRefundSales(auth);
    const [voidTarget, setVoidTarget] = useState(null);

    const applyFilters = (next) => {
        router.get(
            route('tenant.reports.index'),
            {
                branch_id: filters.branch_id ?? '',
                date_from: filters.date_from,
                date_to: filters.date_to,
                staff_user_id: filters.staff_user_id ?? '',
                ...next,
            },
            { preserveState: true, preserveScroll: true, only: reportOnly },
        );
    };

    return (
        <TenantLayout title="Reports">
            <Head title="Reports" />

            <PageHeader
                eyebrow="Numbers"
                title="Reports"
                description="Sales by person and ticket, plus customer balances and what the bakery still owes."
                actions={
                    branches?.length > 1 ? (
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <Select
                                value={filters.branch_id ?? ''}
                                onChange={(e) => applyFilters({ branch_id: e.target.value })}
                            >
                                {branches.map((b) => (
                                    <MenuItem key={b.id} value={b.id}>
                                        {b.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : null
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    mb: 3,
                }}
            >
                {[
                    { label: 'Customers owe us', value: receivablesTotal, href: route('tenant.customers.index') },
                    { label: 'We still owe', value: payablesOpen, href: route('tenant.debts.index') },
                    { label: 'Open pre-orders', value: preOrdersPending, money: false },
                ].map((card) => (
                    <SurfaceCard
                        key={card.label}
                        component={card.href ? Link : 'div'}
                        href={card.href}
                        sx={{ textDecoration: 'none' }}
                    >
                        <Typography variant="overline" sx={{ color: colors.jam }}>
                            {card.label}
                        </Typography>
                        <Typography variant="h5" sx={{ color: colors.ink }}>
                            {card.money === false ? card.value : <Money amount={card.value} />}
                        </Typography>
                    </SurfaceCard>
                ))}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                }}
            >
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.jam }}>
                        Sales by channel
                    </Typography>
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <BarChart
                            items={salesByChannel.map((row, i) => ({
                                label: row.channel,
                                value: row.total,
                                color: chartPalette[i % chartPalette.length],
                            }))}
                            height={168}
                        />
                    </Box>
                    <DataTable
                        columns={[{ label: 'Channel' }, { label: 'Total' }]}
                        emptyMessage="No completed sales yet."
                    >
                        {salesByChannel.map((row, i) => (
                            <DataTableRow key={i}>
                                <DataTableCell>
                                    <StatusBadge status={row.channel} />
                                </DataTableCell>
                                <DataTableCell sx={{ fontWeight: 600 }}>
                                    <Money amount={row.total} />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                </SurfaceCard>

                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.butter }}>
                        Sales by product type
                    </Typography>
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <BarChart
                            items={salesByProductType.map((row, i) => ({
                                label: row.type,
                                value: row.total,
                                color: chartPalette[i % chartPalette.length],
                            }))}
                            height={168}
                        />
                    </Box>
                    <DataTable
                        columns={[{ label: 'Type' }, { label: 'Total' }]}
                        emptyMessage="No sales data yet."
                    >
                        {salesByProductType.map((row, i) => (
                            <DataTableRow key={i}>
                                <DataTableCell>
                                    <StatusBadge status={row.type} />
                                </DataTableCell>
                                <DataTableCell sx={{ fontWeight: 600 }}>
                                    <Money amount={row.total} />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                </SurfaceCard>

                <Box sx={{ gridColumn: { lg: '1 / -1' } }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1.5}
                        sx={{ mb: 1.5 }}
                    >
                        <Box>
                            <Typography variant="h6">Staff sales</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Completed tickets count toward the total. Tap a person to see their tickets.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <TextField
                                size="small"
                                type="date"
                                label="From"
                                value={filters.date_from ?? ''}
                                onChange={(e) => applyFilters({ date_from: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="To"
                                value={filters.date_to ?? ''}
                                onChange={(e) => applyFilters({ date_to: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                        </Stack>
                    </Stack>
                    <DataTable
                        columns={[
                            { label: 'Staff' },
                            { label: 'Tickets' },
                            { label: 'Sold' },
                            { label: 'Voided' },
                        ]}
                        emptyMessage="No staff sales in this date range."
                    >
                        {salesByStaff.map((row) => {
                            const selected =
                                (filters.staff_user_id ?? null) === (row.user_id ?? 0) ||
                                (filters.staff_user_id === 0 && row.user_id === null);
                            return (
                                <DataTableRow
                                    key={row.user_id ?? 'unassigned'}
                                    onClick={() =>
                                        applyFilters({
                                            staff_user_id: selected ? '' : (row.user_id ?? 0),
                                        })
                                    }
                                    sx={{
                                        bgcolor: selected ? `${colors.jam}0f` : undefined,
                                    }}
                                >
                                    <DataTableCell sx={{ fontWeight: 600 }}>{row.name}</DataTableCell>
                                    <DataTableCell>{row.tickets}</DataTableCell>
                                    <DataTableCell sx={{ fontWeight: 600 }}>
                                        <Money amount={row.total} />
                                    </DataTableCell>
                                    <DataTableCell>
                                        {row.voided_tickets > 0
                                            ? `${row.voided_tickets} · `
                                            : '—'}
                                        {row.voided_tickets > 0 ? <Money amount={row.voided_total} /> : null}
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                    </DataTable>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ mt: 3, mb: 1.5 }}
                    >
                        <Typography variant="h6">Tickets</Typography>
                        {filters.staff_user_id !== null && filters.staff_user_id !== '' && (
                            <Button size="small" onClick={() => applyFilters({ staff_user_id: '' })}>
                                Show all staff
                            </Button>
                        )}
                    </Stack>
                    <DataTable
                        columns={[
                            { label: 'When' },
                            { label: 'Cashier' },
                            { label: 'Ticket' },
                            { label: 'Total' },
                            { label: 'Status' },
                            { label: '' },
                        ]}
                        emptyMessage="No tickets in this date range."
                    >
                        {(tickets?.data ?? []).map((ticket) => (
                            <DataTableRow key={ticket.id}>
                                <DataTableCell>{formatDateTime(ticket.created_at)}</DataTableCell>
                                <DataTableCell>{ticket.cashier?.name ?? 'Unassigned'}</DataTableCell>
                                <DataTableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        #{ticket.id}
                                        {ticket.customer?.name ? ` · ${ticket.customer.name}` : ''}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {ticketItems(ticket) || ticket.channel}
                                    </Typography>
                                </DataTableCell>
                                <DataTableCell sx={{ fontWeight: 600 }}>
                                    <Money amount={ticket.total_amount} />
                                </DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={ticket.status} />
                                </DataTableCell>
                                <DataTableCell>
                                    {canRefund && ticket.status !== 'voided' && (
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            onClick={() => setVoidTarget(ticket)}
                                        >
                                            Void
                                        </Button>
                                    )}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                    <Pagination links={tickets?.links} />
                </Box>

                <Box sx={{ gridColumn: { lg: '1 / -1' } }}>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>
                        Outstanding customer balances
                    </Typography>
                    <DataTable
                        columns={[{ label: 'Customer' }, { label: 'Type' }, { label: 'Outstanding' }]}
                        emptyMessage="No customer balances outstanding."
                    >
                        {receivables.map((row) => (
                            <DataTableRow
                                key={row.id}
                                onClick={() => router.visit(route('tenant.customers.show', row.id))}
                            >
                                <DataTableCell sx={{ fontWeight: 600 }}>{row.name}</DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={row.type} />
                                </DataTableCell>
                                <DataTableCell sx={{ fontWeight: 600 }}>
                                    <Money amount={row.outstanding} />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                </Box>
            </Box>

            <VoidSaleDialog
                order={voidTarget}
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
            />
        </TenantLayout>
    );
}
