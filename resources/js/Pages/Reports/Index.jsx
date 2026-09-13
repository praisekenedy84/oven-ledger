import { BarChart } from '@/Components/AccentChart';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TenantLayout from '@/Layouts/TenantLayout';
import { colors, chartPalette } from '@/theme/bakeryTheme';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { Head, Link, router } from '@inertiajs/react';

export default function Reports({
    salesByChannel,
    salesByProductType,
    receivables = [],
    payablesOpen = 0,
    receivablesTotal = 0,
    preOrdersPending = 0,
    branches,
    filters,
}) {
    const onBranchChange = (branchId) => {
        router.get(
            route('tenant.reports.index'),
            { branch_id: branchId },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <TenantLayout title="Reports">
            <Head title="Reports" />

            <PageHeader
                eyebrow="Numbers"
                title="Reports"
                description="Sales, customer balances, and what the bakery still owes."
                actions={
                    branches?.length > 1 ? (
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <Select
                                value={filters.branch_id ?? ''}
                                onChange={(e) => onBranchChange(e.target.value)}
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
                    gap: 2,
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
                        sx={{ p: 2.5, textDecoration: 'none' }}
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
        </TenantLayout>
    );
}
