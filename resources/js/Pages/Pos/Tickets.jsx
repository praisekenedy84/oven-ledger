import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import SaleReceiptDialog from '@/Components/SaleReceiptDialog';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import VoidSaleDialog, { canVoidOrder } from '@/Components/VoidSaleDialog';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDateTime } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

function ticketItems(ticket) {
    return (ticket.items ?? []).map((item) => `${item.quantity} ${item.name}`).join(', ');
}

function markSold(orderId) {
    router.patch(route('tenant.orders.fulfill', orderId), {}, { preserveScroll: true });
}

const actionIconSx = {
    color: colors.muted,
    border: `1px solid ${colors.border}`,
    borderRadius: '7px',
    bgcolor: colors.cream,
    '&:hover': {
        color: colors.ink,
        borderColor: colors.ink,
        bgcolor: colors.wheatLight,
    },
};

const dangerIconSx = {
    color: colors.jam,
    border: `1px solid ${colors.border}`,
    borderRadius: '7px',
    bgcolor: colors.cream,
    '&:hover': {
        color: colors.cream,
        borderColor: colors.jam,
        bgcolor: colors.jam,
    },
};

export default function Tickets({ tickets, summary, filters }) {
    const { auth } = usePage().props;
    const [voidTarget, setVoidTarget] = useState(null);
    const [receiptSale, setReceiptSale] = useState(null);
    const showingAll = Boolean(filters.all);
    const title = showingAll ? 'All tickets' : 'Today’s tickets';

    const applyFilters = (next) => {
        router.get(
            route('tenant.pos.tickets'),
            {
                branch_id: filters.branch_id ?? '',
                date: next.all ? '' : (next.date ?? filters.date ?? ''),
                all: next.all ? 1 : '',
            },
            { preserveState: true, preserveScroll: true, only: ['tickets', 'summary', 'filters'] },
        );
    };

    return (
        <TenantLayout title={title}>
            <Head title={title} />

            <PageHeader
                eyebrow="Till tape"
                title={title}
                description="Every sale and open pre-order at this branch. Mark pre-orders as sold when collected, or void if they should not stand."
                backHref={route('tenant.pos.index')}
                actions={
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                        <Button
                            component={Link}
                            href={route('tenant.pos.index')}
                            variant="contained"
                            size="small"
                        >
                            New sale
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => applyFilters({ all: !showingAll, date: filters.date })}
                        >
                            {showingAll ? 'Show today' : 'Show all days'}
                        </Button>
                        {!showingAll && (
                            <TextField
                                size="small"
                                type="date"
                                label="Date"
                                value={filters.date ?? ''}
                                onChange={(e) => applyFilters({ all: false, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 156 }}
                            />
                        )}
                    </Stack>
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    mb: 3,
                }}
            >
                {[
                    { label: 'Completed tickets', value: summary.count, money: false },
                    { label: 'Sold', value: summary.total, money: true },
                    { label: 'Open pre-orders', value: summary.pending ?? 0, money: false },
                    { label: 'Voided', value: summary.voided, money: false },
                ].map((card) => (
                    <SurfaceCard key={card.label}>
                        <Typography variant="overline" sx={{ color: colors.jam }}>
                            {card.label}
                        </Typography>
                        <Typography variant="h5" sx={{ color: colors.ink }}>
                            {card.money ? <Money amount={card.value} /> : card.value}
                        </Typography>
                    </SurfaceCard>
                ))}
            </Box>

            <DataTable
                columns={[
                    { label: 'When' },
                    { label: 'Cashier' },
                    { label: 'Ticket' },
                    { label: 'Total' },
                    { label: 'Status' },
                    { label: '' },
                ]}
                emptyMessage={
                    showingAll
                        ? 'No sales recorded at this branch yet.'
                        : 'No tickets recorded for this date.'
                }
            >
                {(tickets?.data ?? []).map((ticket) => (
                    <DataTableRow key={ticket.id}>
                        <DataTableCell>
                            {formatDateTime(
                                ticket.is_pre_order
                                    ? ticket.requested_fulfillment_at || ticket.created_at
                                    : ticket.created_at,
                            )}
                        </DataTableCell>
                        <DataTableCell>{ticket.cashier?.name ?? 'Unassigned'}</DataTableCell>
                        <DataTableCell>
                            <Typography variant="body2" fontWeight={600}>
                                #{ticket.id}
                                {ticket.customer?.name ? ` · ${ticket.customer.name}` : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {ticketItems(ticket) || ticket.channel}
                            </Typography>
                            {ticket.is_pre_order && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Pre-order
                                    {ticket.fulfillment_type ? ` · ${ticket.fulfillment_type}` : ''}
                                    {ticket.requested_fulfillment_at
                                        ? ` · due ${formatDateTime(ticket.requested_fulfillment_at)}`
                                        : ''}
                                </Typography>
                            )}
                            {ticket.void_reason && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {ticket.void_reason}
                                </Typography>
                            )}
                        </DataTableCell>
                        <DataTableCell sx={{ fontWeight: 600 }}>
                            <Money amount={ticket.total_amount} />
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge
                                status={ticket.status}
                                label={
                                    ticket.is_pre_order && ticket.status === 'pending'
                                        ? 'Pre-order'
                                        : ticket.status === 'completed'
                                          ? 'Sold'
                                          : undefined
                                }
                            />
                        </DataTableCell>
                        <DataTableCell sx={{ width: 1, whiteSpace: 'nowrap' }}>
                            <Stack
                                direction="row"
                                spacing={0.75}
                                justifyContent="flex-end"
                                alignItems="center"
                                useFlexGap
                            >
                                {ticket.status !== 'voided' && (
                                    <Tooltip title="View receipt" arrow>
                                        <IconButton
                                            size="small"
                                            aria-label="View receipt"
                                            onClick={() => setReceiptSale(ticket)}
                                            sx={actionIconSx}
                                        >
                                            <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {ticket.status === 'pending' && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => markSold(ticket.id)}
                                        sx={{ px: 1.25 }}
                                    >
                                        Mark sold
                                    </Button>
                                )}
                                {canVoidOrder(auth, ticket) && (
                                    <Tooltip title="Void ticket" arrow>
                                        <IconButton
                                            size="small"
                                            aria-label="Void ticket"
                                            onClick={() => setVoidTarget(ticket)}
                                            sx={dangerIconSx}
                                        >
                                            <UndoOutlinedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
            <Pagination links={tickets?.links} />

            <VoidSaleDialog
                order={voidTarget}
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
            />

            <SaleReceiptDialog
                sale={receiptSale}
                open={Boolean(receiptSale)}
                onClose={() => setReceiptSale(null)}
            />
        </TenantLayout>
    );
}
