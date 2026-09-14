import { BarChart, LineChart } from '@/Components/AccentChart';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import VoidSaleDialog, { canRefundSales } from '@/Components/VoidSaleDialog';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate, formatDateTime } from '@/lib/format';
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
    'economics',
    'profitLoss',
    'dailySales',
    'filters',
];

function ticketItems(ticket) {
    return (ticket.items ?? []).map((item) => `${item.quantity} ${item.name}`).join(', ');
}

function StatementRow({ label, value, href, strong = false, muted = false, loss = false }) {
    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            spacing={2}
            component={href ? Link : 'div'}
            href={href}
            sx={{
                py: 0.85,
                textDecoration: 'none',
                color: 'inherit',
                borderBottom: `1px solid ${colors.border}`,
                '&:last-of-type': { borderBottom: 0 },
            }}
        >
            <Typography variant={strong ? 'subtitle2' : 'body2'} color={muted ? 'text.secondary' : 'inherit'}>
                {label}
            </Typography>
            <Typography
                variant={strong ? 'subtitle2' : 'body2'}
                fontWeight={strong ? 700 : 600}
                sx={{ color: loss ? colors.jam : colors.ink }}
            >
                <Money amount={value} />
            </Typography>
        </Stack>
    );
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
    profitLoss = null,
    economics = null,
    dailySales = [],
    branches,
    filters,
}) {
    const { auth } = usePage().props;
    const canRefund = canRefundSales(auth);
    const [voidTarget, setVoidTarget] = useState(null);
    const statement = profitLoss ?? economics;
    const daysWithSales = dailySales.filter((day) => day.tickets > 0 || day.voided_tickets > 0);

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

    const setToday = () => {
        const today = new Date().toISOString().slice(0, 10);
        applyFilters({ date_from: today, date_to: today });
    };

    return (
        <TenantLayout title="Reports">
            <Head title="Reports" />

            <PageHeader
                eyebrow="Numbers"
                title="Reports"
                description="Profit or loss for the dates you pick, how money moved, and a day-by-day sales sheet."
                actions={
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                        <Button size="small" variant="outlined" onClick={setToday}>
                            Today
                        </Button>
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
                        {branches?.length > 1 ? (
                            <FormControl size="small" sx={{ minWidth: 160 }}>
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
                        ) : null}
                    </Stack>
                }
            />

            {statement && (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
                        mb: 3,
                    }}
                >
                    <SurfaceCard>
                        <Typography
                            variant="overline"
                            sx={{ color: statement.is_loss ? colors.jam : colors.sage }}
                        >
                            {statement.is_loss
                                ? 'Operating loss'
                                : statement.is_profit
                                  ? 'Operating profit'
                                  : 'Breaking even'}
                        </Typography>
                        <Typography variant="h6">Profit and loss</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                            Sales in this range, minus what those goods cost and what was written off as waste.
                        </Typography>
                        <StatementRow label="Sales" value={statement.revenue} />
                        <StatementRow label="Ingredient and stock cost" value={statement.ingredient_cost} muted />
                        <StatementRow label="Waste write-off" value={statement.waste_cost ?? 0} muted />
                        <StatementRow
                            label={statement.is_loss ? 'Final loss' : 'Final profit'}
                            value={statement.profit}
                            strong
                            loss={statement.is_loss}
                        />
                        <Typography variant="h4" sx={{ mt: 2, color: statement.is_loss ? colors.jam : colors.ink }}>
                            <Money amount={statement.profit} />
                        </Typography>
                    </SurfaceCard>

                    <SurfaceCard>
                        <Typography variant="overline" sx={{ color: colors.butter }}>
                            How money moved
                        </Typography>
                        <Typography variant="h6">Cash in and cash out</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                            What came in at the counter, what customers still owe, and where money left the business.
                        </Typography>
                        <StatementRow label="Cash, card, and mobile collected" value={statement.cash_collected ?? 0} />
                        <StatementRow label="Sold on credit" value={statement.credit_sales ?? 0} />
                        <StatementRow
                            label="Capital put in"
                            value={statement.capital_in_period ?? 0}
                            href={route('tenant.capital.index')}
                        />
                        <StatementRow
                            label="Paid to creditors"
                            value={statement.debt_payments ?? 0}
                            href={route('tenant.debts.index')}
                        />
                        <StatementRow
                            label="Owner drawings"
                            value={statement.drawings_period ?? 0}
                            href={route('tenant.capital.index')}
                        />
                        <StatementRow label="Money used (cost + waste + debts + drawings)" value={statement.money_used ?? 0} strong />
                    </SurfaceCard>
                </Box>
            )}

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

            <SurfaceCard sx={{ mb: 3 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 1.5 }}
                >
                    <Box>
                        <Typography variant="overline" sx={{ color: colors.jam }}>
                            Daily sales
                        </Typography>
                        <Typography variant="h6">Each day’s take</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tickets, cash vs credit, cost, waste, and the day’s profit or loss.
                        </Typography>
                    </Box>
                </Stack>
                <Box sx={{ mb: 2 }}>
                    <LineChart
                        labels={dailySales.map((day) =>
                            new Date(`${day.date}T00:00:00`).toLocaleDateString('en-TZ', {
                                weekday: 'short',
                                day: 'numeric',
                            }),
                        )}
                        series={[
                            { key: 'sales', label: 'Sales', values: dailySales.map((day) => day.revenue), color: colors.jam },
                            {
                                key: 'profit',
                                label: 'Profit',
                                values: dailySales.map((day) => day.profit),
                                color: colors.sage,
                            },
                        ]}
                        height={220}
                    />
                </Box>
                <DataTable
                    columns={[
                        { label: 'Day' },
                        { label: 'Tickets' },
                        { label: 'Sales' },
                        { label: 'Cash in' },
                        { label: 'Credit' },
                        { label: 'Cost' },
                        { label: 'Waste' },
                        { label: 'Profit / loss' },
                    ]}
                    emptyMessage="No days in this range."
                >
                    {dailySales.map((day) => (
                        <DataTableRow key={day.date}>
                            <DataTableCell sx={{ fontWeight: 600 }}>{formatDate(day.date)}</DataTableCell>
                            <DataTableCell>
                                {day.tickets}
                                {day.voided_tickets > 0 ? ` · ${day.voided_tickets} void` : ''}
                            </DataTableCell>
                            <DataTableCell sx={{ fontWeight: 600 }}>
                                <Money amount={day.revenue} />
                            </DataTableCell>
                            <DataTableCell>
                                <Money amount={day.cash} />
                            </DataTableCell>
                            <DataTableCell>
                                <Money amount={day.credit} />
                            </DataTableCell>
                            <DataTableCell>
                                <Money amount={day.ingredient_cost} />
                            </DataTableCell>
                            <DataTableCell>
                                <Money amount={day.waste_cost} />
                            </DataTableCell>
                            <DataTableCell sx={{ fontWeight: 700, color: day.is_loss ? colors.jam : colors.ink }}>
                                <Money amount={day.profit} />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTable>
                {daysWithSales.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                        No completed tickets in this range yet.
                    </Typography>
                )}
            </SurfaceCard>

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
                        emptyMessage="No completed sales in this range."
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
                        emptyMessage="No sales data in this range."
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
                    <Typography variant="h6">Staff sales</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Completed tickets count toward the total. Tap a person to see their tickets.
                    </Typography>
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
