import { BarChart, LineChart } from '@/Components/AccentChart';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDateTime, formatMoney } from '@/lib/format';
import { colors, chartPalette } from '@/theme/bakeryTheme';
import { resolveNavIcon } from '@/theme/nav';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Head, Link } from '@inertiajs/react';

const CHANNEL_COLORS = {
    retail: chartPalette[0],
    wholesale: chartPalette[1],
    restaurant: chartPalette[2],
    tools: colors.ink,
};

export default function Dashboard({
    currentBranch,
    todayBatches = [],
    lowStock = [],
    wholesaleDue = [],
    salesByChannel = [],
    salesTrend = { labels: [], series: [] },
}) {
    const bakingCount = todayBatches.filter((b) => ['baking', 'cooling', 'ready'].includes(b.status)).length;
    const dueCount = wholesaleDue.length;
    const alertCount = lowStock.length;
    const weekSales = salesByChannel.reduce((sum, row) => sum + Number(row.total || 0), 0);

    const trendSeries = (salesTrend.series ?? []).map((series) => ({
        ...series,
        color: CHANNEL_COLORS[series.key] ?? colors.jam,
    }));

    return (
        <TenantLayout title="Dashboard">
            <Head title="Dashboard" />

            <PageHeader
                eyebrow={currentBranch?.name ?? 'Owner board'}
                title="Today’s bake"
                description="Batches on the floor, stock that needs a reorder, and the wholesale tickets still due."
                actions={
                    <Button component={Link} href={route('tenant.pos.index')} variant="contained">
                        Open POS
                    </Button>
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                    mb: 3,
                }}
            >
                <StatTile label="Live batches" value={bakingCount} hint="Baking, cooling, ready" accent={colors.jam} />
                <StatTile label="Reorder alerts" value={alertCount} hint="Raw + finished" accent={colors.butter} />
                <StatTile label="Orders due" value={dueCount} hint="Wholesale & restaurant" accent={colors.sage} />
                <StatTile label="7-day sales" value={formatMoney(weekSales)} hint="All channels" accent={colors.ink} />
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.4fr) minmax(320px, 0.8fr)' },
                    mb: 2,
                }}
            >
                <SurfaceCard>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
                        <Box>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                Sales by channel
                            </Typography>
                            <Typography variant="h6">Retail, wholesale, restaurant, tools</Typography>
                        </Box>
                        <Button component={Link} href={route('tenant.reports.index')} size="small">
                            Full reports
                        </Button>
                    </Stack>
                    <LineChart labels={salesTrend.labels ?? []} series={trendSeries} />
                    <Box sx={{ mt: 3 }}>
                        <BarChart
                            items={salesByChannel.map((row) => ({
                                label: row.label ?? row.channel,
                                value: row.total,
                                color: CHANNEL_COLORS[row.channel] ?? colors.jam,
                            }))}
                            height={160}
                        />
                    </Box>
                </SurfaceCard>

                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.jam }}>
                        Production
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Today’s batches
                    </Typography>
                    <Stack spacing={1.5}>
                        {todayBatches.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No active batches. Schedule the first one from production.
                            </Typography>
                        )}
                        {todayBatches.map((batch) => (
                            <Box
                                key={batch.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: '10px',
                                    border: `1px solid ${colors.border}`,
                                    bgcolor: colors.wheatLight,
                                }}
                            >
                                <Box>
                                    <Typography variant="subtitle2">{batch.product?.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        #{batch.batch_number} · {batch.planned_quantity}
                                    </Typography>
                                </Box>
                                <StatusBadge status={batch.status} />
                            </Box>
                        ))}
                    </Stack>
                    <Button
                        component={Link}
                        href={route('tenant.production-batches.index')}
                        size="small"
                        sx={{ mt: 2 }}
                    >
                        Production board
                    </Button>
                </SurfaceCard>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                    mb: 3,
                }}
            >
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.butter }}>
                        Inventory
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Low-stock alerts
                    </Typography>
                    <Stack spacing={1.25}>
                        {lowStock.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                Nothing is under the reorder line.
                            </Typography>
                        )}
                        {lowStock.map((row) => (
                            <Stack key={row.id} direction="row" justifyContent="space-between" spacing={1}>
                                <Box>
                                    <Typography variant="subtitle2">{row.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {row.kind === 'raw' ? 'Raw material' : 'Finished'} · threshold {row.threshold ?? '—'}
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle2" sx={{ color: colors.jam }}>
                                    {row.quantity} {row.unit}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                    <Button component={Link} href={route('tenant.inventory.index')} size="small" sx={{ mt: 2 }}>
                        Open inventory
                    </Button>
                </SurfaceCard>

                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.sage }}>
                        Wholesale
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Orders due
                    </Typography>
                    <Stack spacing={1.25}>
                        {wholesaleDue.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No wholesale or restaurant tickets waiting.
                            </Typography>
                        )}
                        {wholesaleDue.map((order) => (
                            <Stack key={order.id} direction="row" justifyContent="space-between" spacing={1}>
                                <Box>
                                    <Typography variant="subtitle2">{order.customer?.name ?? 'Account'}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDateTime(order.requested_fulfillment_at || order.due_date || order.created_at)}
                                    </Typography>
                                </Box>
                                <StatusBadge status={order.channel} />
                            </Stack>
                        ))}
                    </Stack>
                    <Button component={Link} href={route('tenant.customers.index')} size="small" sx={{ mt: 2 }}>
                        Customer accounts
                    </Button>
                </SurfaceCard>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                }}
            >
                {[
                    { label: 'Point of sale', route: 'tenant.pos.index', description: 'Ticket the counter' },
                    { label: 'Customers', route: 'tenant.customers.index', description: 'Accounts and credit' },
                    { label: 'Roles', route: 'tenant.roles.index', description: 'Who can do what' },
                ].map((link) => {
                    const Icon = resolveNavIcon(link.route);
                    return (
                        <SurfaceCard
                            key={link.route}
                            component={Link}
                            href={route(link.route)}
                            sx={{ textDecoration: 'none', p: 2.5 }}
                        >
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    display: 'grid',
                                    placeItems: 'center',
                                    bgcolor: colors.wheatLight,
                                    color: colors.jam,
                                    mb: 1.5,
                                }}
                            >
                                <Icon fontSize="small" />
                            </Box>
                            <Typography variant="subtitle1">{link.label}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {link.description}
                            </Typography>
                        </SurfaceCard>
                    );
                })}
            </Box>
        </TenantLayout>
    );
}

function StatTile({ label, value, hint, accent }) {
    return (
        <SurfaceCard sx={{ p: 2.5 }}>
            <Typography variant="overline" sx={{ color: accent }}>
                {label}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, color: colors.ink }}>
                {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {hint}
            </Typography>
        </SurfaceCard>
    );
}
