import { LazyBarChart, LazyLineChart, LazyPieChart } from '@/Components/LazyCharts';
import BalanceCard from '@/Components/bencho/BalanceCard';
import RankingList from '@/Components/bencho/RankingList';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import SmoothButton from '@/Components/smoothui/SmoothButton';
import { MotionItem, MotionRise, MotionStagger } from '@/Components/smoothui/MotionRise';
import { Button } from '@/Components/ui/button';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDateTime, formatMoney, formatQuantity } from '@/lib/format';
import { colors, chartPalette } from '@/theme/bakeryTheme';
import { resolveNavIcon } from '@/theme/nav';
import { Head, Link, router } from '@inertiajs/react';

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
    bestSellingProducts = [],
    bestSellingSummary = { total_quantity: 0, total_revenue: 0, product_count: 0 },
    economics = null,
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
                    <Button asChild>
                        <Link href={route('tenant.pos.index')} prefetch>
                            Open POS
                        </Link>
                    </Button>
                }
            />

            <MotionStagger className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <MotionItem>
                    <BalanceCard label="Live batches" value={bakingCount} format="number" deltaLabel="Baking, cooling, ready" />
                </MotionItem>
                <MotionItem>
                    <BalanceCard label="Reorder alerts" value={alertCount} format="number" deltaLabel="Raw + finished" />
                </MotionItem>
                <MotionItem>
                    <BalanceCard label="Orders due" value={dueCount} format="number" deltaLabel="Wholesale & restaurant" />
                </MotionItem>
                <MotionItem>
                    <BalanceCard label="7-day sales" value={weekSales} deltaLabel="All channels" />
                </MotionItem>
            </MotionStagger>

            {economics && (
                <MotionRise delay={80} className="mb-6">
                    <SurfaceCard>
                        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div>
                                <p className={`text-xs font-semibold uppercase tracking-wider ${economics.is_loss ? 'text-jam' : 'text-sage'}`}>
                                    {economics.is_loss ? 'This week is a loss' : economics.is_profit ? 'This week is a profit' : 'This week is even'}
                                </p>
                                <h2 className="text-lg font-semibold">Capital, ingredient cost, and the week’s result</h2>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={route('tenant.reports.index')} prefetch>
                                    Full P&L
                                </Link>
                            </Button>
                        </div>
                        <p className="mb-4 max-w-xl text-sm text-muted-foreground">
                            This week’s sales minus ingredient cost and waste, using current buy-in prices.
                        </p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                            <InsightChip label="Capital in" value={formatMoney(economics.capital_in)} />
                            <InsightChip label="Still in the business" value={formatMoney(economics.capital_remaining)} />
                            <InsightChip label="7-day sales" value={formatMoney(economics.revenue)} />
                            <InsightChip label="Ingredient / stock cost" value={formatMoney(economics.ingredient_cost)} />
                            <InsightChip label="Waste" value={formatMoney(economics.waste_cost ?? 0)} />
                            <InsightChip
                                label={economics.is_loss ? '7-day loss' : '7-day profit'}
                                value={formatMoney(Math.abs(economics.profit))}
                            />
                        </div>
                    </SurfaceCard>
                </MotionRise>
            )}

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
                <MotionRise delay={80}>
                    <SurfaceCard>
                        <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Sales by channel</p>
                                <h2 className="text-lg font-semibold">How the week was taken</h2>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={route('tenant.reports.index')} prefetch>
                                    Full reports
                                </Link>
                            </Button>
                        </div>
                        <p className="mb-3 max-w-lg text-sm text-muted-foreground">
                            Daily take across retail, wholesale, restaurant, and tools.
                        </p>
                        <LazyLineChart labels={salesTrend.labels ?? []} series={trendSeries} />
                        <div className="mt-2">
                            <LazyBarChart
                                items={salesByChannel.map((row) => ({
                                    label: row.label ?? row.channel,
                                    value: row.total,
                                    color: CHANNEL_COLORS[row.channel] ?? colors.jam,
                                }))}
                                height={176}
                            />
                        </div>
                    </SurfaceCard>
                </MotionRise>

                <MotionRise delay={140}>
                    <SurfaceCard>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Production</p>
                        <h2 className="mb-4 text-lg font-semibold">Today’s batches</h2>
                        <div className="space-y-3">
                            {todayBatches.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No active batches. Schedule the first one from production.
                                </p>
                            )}
                            {todayBatches.map((batch) => (
                                <div
                                    key={batch.id}
                                    className="flex items-start justify-between gap-3 rounded-[10px] border border-border bg-wheat-light p-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{batch.product?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            #{batch.batch_number} · {batch.planned_quantity}
                                        </p>
                                    </div>
                                    <StatusBadge status={batch.status} />
                                </div>
                            ))}
                        </div>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                            <Link href={route('tenant.production-batches.index')} prefetch>
                                Production board
                            </Link>
                        </Button>
                    </SurfaceCard>
                </MotionRise>
            </div>

            <MotionRise delay={200} className="mb-6">
                <SurfaceCard>
                    <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Best sellers</p>
                            <h2 className="text-lg font-semibold">What walked out the door</h2>
                            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{sellerInsight}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <InsightChip
                                label="Units this week"
                                value={
                                    bestSellingSummary.total_quantity
                                        ? formatQuantity(bestSellingSummary.total_quantity)
                                        : '—'
                                }
                            />
                            <InsightChip
                                label="From these sales"
                                value={bestSellingSummary.total_revenue ? formatMoney(bestSellingSummary.total_revenue) : '—'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
                        <RankingList
                            empty="No completed product sales this week. Open POS and the mix will show here."
                            items={bestSellingProducts.map((product, index) => ({
                                id: product.id,
                                name: product.name,
                                meta: `${Math.round(product.quantity)} ${product.unit || 'sold'} · ${
                                    bestSellingSummary.total_quantity > 0
                                        ? Math.round((Number(product.quantity) / bestSellingSummary.total_quantity) * 100)
                                        : 0
                                }% of units`,
                                value: formatMoney(product.revenue),
                            }))}
                            className="border-0 bg-transparent p-0 shadow-none"
                        />

                        <div className="relative min-h-[280px]">
                            <LazyPieChart
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
                                <div className="pointer-events-none absolute inset-0 grid place-items-center px-16 text-center">
                                    <div>
                                        <p className="text-2xl font-semibold leading-none text-foreground">{topShare}%</p>
                                        <p className="mx-auto mt-1 max-w-[120px] text-xs text-muted-foreground">{topSeller.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </SurfaceCard>
            </MotionRise>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MotionRise delay={260}>
                    <SurfaceCard>
                        <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Inventory</p>
                        <h2 className="mb-4 text-lg font-semibold">Low-stock alerts</h2>
                        <div className="space-y-3">
                            {lowStock.length === 0 && (
                                <p className="text-sm text-muted-foreground">Nothing is under the reorder line.</p>
                            )}
                            {lowStock.map((row) => (
                                <div key={row.id} className="flex justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold">{row.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {row.kind === 'raw' ? 'Raw material' : 'Finished'} · threshold {row.threshold ?? '—'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-jam">
                                        {row.quantity} {row.unit}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                            <Link href={route('tenant.inventory.index')} prefetch>
                                Open inventory
                            </Link>
                        </Button>
                    </SurfaceCard>
                </MotionRise>

                <MotionRise delay={300}>
                    <SurfaceCard>
                        <p className="text-xs font-semibold uppercase tracking-wider text-sage">Wholesale</p>
                        <h2 className="mb-4 text-lg font-semibold">Orders due</h2>
                        <div className="space-y-3">
                            {wholesaleDue.length === 0 && (
                                <p className="text-sm text-muted-foreground">No wholesale or restaurant tickets waiting.</p>
                            )}
                            {wholesaleDue.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold">{order.customer?.name ?? 'Account'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDateTime(order.requested_fulfillment_at || order.due_date || order.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={order.channel} />
                                        {order.status === 'pending' && (
                                            <SmoothButton
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
                                            </SmoothButton>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                            <Link href={route('tenant.pos.tickets', { all: 1 })} prefetch>
                                Open tickets
                            </Link>
                        </Button>
                    </SurfaceCard>
                </MotionRise>
            </div>

            <MotionStagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Point of sale', route: 'tenant.pos.index', description: 'Ticket the counter' },
                    { label: 'Customers', route: 'tenant.customers.index', description: 'Accounts and credit' },
                    { label: 'Roles', route: 'tenant.roles.index', description: 'Who can do what' },
                ].map((link) => {
                    const Icon = resolveNavIcon(link.route);
                    return (
                        <MotionItem key={link.route}>
                            <Link
                                href={route(link.route)}
                                prefetch
                                className="block rounded-card border border-border bg-card p-4 shadow-card no-underline transition-colors hover:bg-muted/40 sm:p-5"
                            >
                                <div className="mb-3 grid h-9 w-9 place-items-center rounded-[10px] bg-wheat-light text-primary">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <p className="font-semibold text-foreground">{link.label}</p>
                                <p className="text-sm text-muted-foreground">{link.description}</p>
                            </Link>
                        </MotionItem>
                    );
                })}
            </MotionStagger>
        </TenantLayout>
    );
}

function InsightChip({ label, value }) {
    return (
        <div className="min-w-[120px] rounded-[10px] border border-border bg-wheat-light px-3 py-2">
            <p className="block text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
        </div>
    );
}
