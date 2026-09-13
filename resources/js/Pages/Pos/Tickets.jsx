import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import VoidSaleDialog, { canRefundSales } from '@/Components/VoidSaleDialog';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDateTime } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

function ticketItems(ticket) {
    return (ticket.items ?? []).map((item) => `${item.quantity} ${item.name}`).join(', ');
}

export default function Tickets({ tickets, summary, filters }) {
    const { auth } = usePage().props;
    const canRefund = canRefundSales(auth);
    const [voidTarget, setVoidTarget] = useState(null);
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
                description={
                    canRefund
                        ? 'Every sale at this branch. Void a wrongly placed ticket, then ring it again.'
                        : 'Every sale recorded at this branch.'
                }
                backHref={route('tenant.pos.index')}
                actions={
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Button
                            component={Link}
                            href={route('tenant.pos.index')}
                            variant="contained"
                        >
                            New sale
                        </Button>
                        <Button
                            variant={showingAll ? 'contained' : 'outlined'}
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
                                sx={{ width: 160 }}
                            />
                        )}
                    </Stack>
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    mb: 3,
                }}
            >
                {[
                    { label: 'Completed tickets', value: summary.count, money: false },
                    { label: 'Sold', value: summary.total, money: true },
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

            <VoidSaleDialog
                order={voidTarget}
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
            />
        </TenantLayout>
    );
}
