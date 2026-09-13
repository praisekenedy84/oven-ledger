import { BarChart, LineChart, PieChart } from '@/Components/AccentChart';
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

function riseSx(delay = 0) {
    return {
        '@keyframes chartRise': {
            from: { opacity: 0, transform: 'translateY(14px)' },
            to: { opacity: 1, transform: 'none' },
        },
        animation: `chartRise 0.62s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    };
}

export default function Dashboard({
    currentBranch,
    todayBatches = [],
    lowStock = [],
    wholesaleDue = [],
    salesByChannel = [],
    salesTrend = { labels: [], series: [] },
    bestSellingProducts = [],
    bestSellingSummary = { total_quantity: 0, total_revenue: 0, product_count: 0 },
}) {
    const bakingCount = todayBatches.filter((b) => ['baking', 'cooling', 'ready'].includes(b.status)).length;
    const dueCount = wholesaleDue.length;
    const alertCount = lowStock.length;
    const weekSales = salesByChannel.reduce((sum, row) => sum + Number(row.total || 0), 0);

    const trendSeries = (salesTrend.series ?? []).map((series) => ({
        ...series,
        color: CHANNEL_COLORS[series.key] ?? colors.jam,
    }));

    const sellerColors = bestSellingProducts.map((product, index) =>
        product.is_other ? colors.muted : chartPalette[index % chartPalette.length],
    );
    const topSeller = bestSellingProducts.find((product) => !product.is_other) ?? bestSellingProducts[0];
    const topShare =
        topSeller && bestSellingSummary.total_quantity > 0
            ? Math.round((Number(topSeller.quantity) / bestSellingSummary.total_quantity) * 100)
            : 0;
    const sellerInsight = topSeller
        ? `${topSeller.name} led the week at ${topShare}% of units sold${
              bestSellingSummary.product_count > 1 ? ` across ${bestSellingSummary.product_count} products` : ''
          }.`
        : 'Complete a few tickets and this ring fills in with what customers actually take home.';

    return (
        <TenantLayout title="Dashboard">
            <Head title="Dashboard" />

            <PageHeader
                eyebrow={currentBranch?.name ?? 'Owner board'}
                title="Today’s bake"
                description="Batches on the floor, stock that needs a reorder, and the wholesale tickets still due."
                actions={
                    <Button component={Link} href={route('tenant.pos.index')} prefetch variant="contained">
                        Open POS
                    </Button>
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                    mb: 3,
                }}
            >
                <StatTile label="Live batches" value={bakingCount} hint="Baking, cooling, ready" accent={colors.jam} delay={0} />
                <StatTile label="Reorder alerts" value={alertCount} hint="Raw + finished" accent={colors.butter} delay={60} />
                <StatTile label="Orders due" value={dueCount} hint="Wholesale & restaurant" accent={colors.sage} delay={120} />
                <StatTile label="7-day sales" value={formatMoney(weekSales)} hint="All channels" accent={colors.ink} delay={180} />
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.45fr) minmax(320px, 0.75fr)' },
                    mb: 3,
                }}
            >
                <SurfaceCard sx={riseSx(80)}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ sm: 'baseline' }}
                        spacing={1}
                        sx={{ mb: 1 }}
                    >
                        <Box>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                Sales by channel
                            </Typography>
                            <Typography variant="h6">How the week was taken</Typography>
                        </Box>
                        <Button component={Link} href={route('tenant.reports.index')} prefetch size="small">
                            Full reports
                        </Button>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 520 }}>
                        Daily take across retail, wholesale, restaurant, and tools.
                    </Typography>
                    <LineChart labels={salesTrend.labels ?? []} series={trendSeries} />
                    <Box sx={{ mt: 1 }}>
                        <BarChart
                            items={salesByChannel.map((row) => ({
                                label: row.label ?? row.channel,
                                value: row.total,
                                color: CHANNEL_COLORS[row.channel] ?? colors.jam,
                            }))}
                            height={176}
                        />
                    </Box>
                </SurfaceCard>

                <SurfaceCard sx={riseSx(140)}>
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
                        prefetch
                        size="small"
                        sx={{ mt: 2 }}
                    >
                        Production board
                    </Button>
                </SurfaceCard>
            </Box>

            <SurfaceCard sx={{ mb: 3, ...riseSx(200) }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ md: 'flex-start' }}
                    spacing={2}
                    sx={{ mb: 2 }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="overline" sx={{ color: colors.butter }}>
                            Best sellers
                        </Typography>
                        <Typography variant="h6">What walked out the door</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560 }}>
                            {sellerInsight}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                        <InsightChip
                            label="Units this week"
                            value={bestSellingSummary.total_quantity ? Math.round(bestSellingSummary.total_quantity) : '—'}
                        />
                        <InsightChip
                            label="From these sales"
                            value={bestSellingSummary.total_revenue ? formatMoney(bestSellingSummary.total_revenue) : '—'}
                        />
                    </Stack>
                </Stack>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 2.5,
                        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(260px, 0.9fr)' },
                        alignItems: 'center',
                    }}
                >
                    <Stack spacing={1.25}>
                        {bestSellingProducts.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No completed product sales this week. Open POS and the mix will show here.
                            </Typography>
                        )}
                        {bestSellingProducts.map((product, index) => {
                            const share =
                                bestSellingSummary.total_quantity > 0
                                    ? Math.round((Number(product.quantity) / bestSellingSummary.total_quantity) * 100)
                                    : 0;
                            const color = sellerColors[index];
                            const content = (
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '28px minmax(0, 1fr) auto',
                                        gap: 1.25,
                                        alignItems: 'center',
                                        p: 1.25,
                                        borderRadius: '10px',
                                        border: `1px solid ${colors.border}`,
                                        bgcolor: colors.wheatLight,
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: '8px',
                                            bgcolor: color,
                                            color: colors.cream,
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontSize: 12,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {product.is_other ? '·' : index + 1}
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle2" noWrap>
                                            {product.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {Math.round(product.quantity)} {product.unit || 'sold'} · {share}% of units
                                        </Typography>
                                        <Box
                                            sx={{
                                                mt: 0.75,
                                                height: 5,
                                                borderRadius: 999,
                                                bgcolor: colors.border,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: `${Math.max(share, product.quantity > 0 ? 4 : 0)}%`,
                                                    height: '100%',
                                                    bgcolor: color,
                                                    borderRadius: 999,
                                                    transformOrigin: 'left center',
                                                    animation: 'chartRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
                                                    animationDelay: `${220 + index * 70}ms`,
                                                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ color: colors.ink, whiteSpace: 'nowrap' }}>
                                        {formatMoney(product.revenue)}
                                    </Typography>
                                </Box>
                            );

                            if (product.is_other) {
                                return <Box key={product.id}>{content}</Box>;
                            }

                            return (
                                <Box
                                    key={product.id}
                                    component={Link}
                                    href={route('tenant.products.show', product.id)}
                                    prefetch
                                    sx={{ textDecoration: 'none' }}
                                >
                                    {content}
                                </Box>
                            );
                        })}
                    </Stack>

                    <Box sx={{ position: 'relative', minHeight: 280 }}>
                        <PieChart
                            items={bestSellingProducts.map((product, index) => ({
                                id: product.id,
                                label: product.name,
                                value: product.quantity,
                                color: sellerColors[index],
                            }))}
                            height={280}
                            valueFormatter={(item) => `${Math.round(item.value)} sold`}
                        />
                        {topSeller && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'grid',
                                    placeItems: 'center',
                                    pointerEvents: 'none',
                                    textAlign: 'center',
                                    px: 8,
                                }}
                            >
                                <Box>
                                    <Typography variant="h5" sx={{ color: colors.ink, lineHeight: 1 }}>
                                        {topShare}%
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: colors.muted, display: 'block', maxWidth: 120, mx: 'auto' }}
                                    >
                                        {topSeller.name}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </SurfaceCard>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                    mb: 3,
                }}
            >
                <SurfaceCard sx={riseSx(260)}>
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
                    <Button component={Link} href={route('tenant.inventory.index')} prefetch size="small" sx={{ mt: 2 }}>
                        Open inventory
                    </Button>
                </SurfaceCard>

                <SurfaceCard sx={riseSx(300)}>
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
                    <Button component={Link} href={route('tenant.customers.index')} prefetch size="small" sx={{ mt: 2 }}>
                        Customer accounts
                    </Button>
                </SurfaceCard>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
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
                            prefetch
                            sx={{ textDecoration: 'none', p: { xs: 2, sm: 2.5 }, ...riseSx(340) }}
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

function StatTile({ label, value, hint, accent, delay = 0 }) {
    return (
        <SurfaceCard sx={{ ...riseSx(delay) }}>
            <Typography variant="overline" sx={{ color: accent }}>
                {label}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, color: colors.ink, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {hint}
            </Typography>
        </SurfaceCard>
    );
}

function InsightChip({ label, value }) {
    return (
        <Box
            sx={{
                px: 1.5,
                py: 1,
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                bgcolor: colors.wheatLight,
                minWidth: 120,
            }}
        >
            <Typography variant="caption" color="text.secondary" display="block">
                {label}
            </Typography>
            <Typography variant="subtitle2">{value}</Typography>
        </Box>
    );
}
