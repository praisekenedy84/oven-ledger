import { LazyBarChart, LazyLineChart } from '@/Components/LazyCharts';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import ReportExportMenu from '@/Components/ReportExportMenu';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import VoidSaleDialog, { canRefundSales } from '@/Components/VoidSaleDialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { formatDate, formatDateTime, formatQuantity } from '@/lib/format';
import { chartPalette } from '@/theme/bakeryTheme';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const reportOnly = [
    'salesByChannel',
    'salesByProductType',
    'salesByProduct',
    'productTrend',
    'expenseBreakdown',
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

function localIsoDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function shiftDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return localIsoDate(date);
}

function monthStart() {
    const date = new Date();
    date.setDate(1);

    return localIsoDate(date);
}

function chartDayLabel(value) {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-TZ', {
        weekday: 'short',
        day: 'numeric',
    });
}

function ticketItems(ticket) {
    return (ticket.items ?? [])
        .map((item) => `${formatQuantity(item.quantity)} ${item.name}`)
        .join(', ');
}

function StatementRow({ label, value, href, strong = false, muted = false, loss = false }) {
    const className = cn(
        'flex flex-row justify-between gap-4 border-b border-border py-3 last:border-b-0',
        href && 'text-inherit no-underline',
    );

    if (href) {
        return (
            <Link href={href} className={className}>
                <span className={cn('text-sm', strong && 'font-semibold', muted && 'text-muted-foreground')}>
                    {label}
                </span>
                <span className={cn('text-sm font-semibold', strong && 'font-bold', loss ? 'text-jam' : 'text-ink')}>
                    <Money amount={value} />
                </span>
            </Link>
        );
    }

    return (
        <div className={className}>
            <span className={cn('text-sm', strong && 'font-semibold', muted && 'text-muted-foreground')}>
                {label}
            </span>
            <span className={cn('text-sm font-semibold', strong && 'font-bold', loss ? 'text-jam' : 'text-ink')}>
                <Money amount={value} />
            </span>
        </div>
    );
}

export default function Reports({
    salesByChannel,
    salesByProductType,
    salesByProduct = [],
    productTrend = [],
    expenseBreakdown = { lines: [], daily: [], total: 0 },
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
    const [productSearch, setProductSearch] = useState(filters.product_search ?? '');
    const debouncedProductSearch = useDebouncedValue(productSearch, 300);
    const statement = profitLoss ?? economics;
    const daysWithSales = dailySales.filter((day) => day.tickets > 0 || day.voided_tickets > 0);
    const selectedProduct = salesByProduct.find((row) => row.id === filters.product_id);
    const productChartItems = salesByProduct.slice(0, 8);
    const productViewLabel = selectedProduct
        ? selectedProduct.name
        : (filters.product_search || '').trim()
          ? `Products matching “${filters.product_search.trim()}”`
          : 'All products';
    const rangeLabel = `${formatDate(filters.date_from)} – ${formatDate(filters.date_to)}`;

    const applyFilters = (next) => {
        router.get(
            route('tenant.reports.index'),
            {
                branch_id: filters.branch_id ?? '',
                date_from: filters.date_from,
                date_to: filters.date_to,
                staff_user_id: filters.staff_user_id ?? '',
                product_search: filters.product_search ?? '',
                product_id: filters.product_id ?? '',
                ...next,
            },
            { preserveState: true, preserveScroll: true, only: reportOnly },
        );
    };

    useEffect(() => {
        setProductSearch(filters.product_search ?? '');
    }, [filters.product_search]);

    useEffect(() => {
        if ((debouncedProductSearch ?? '') === (filters.product_search ?? '')) {
            return;
        }

        applyFilters({
            product_search: debouncedProductSearch,
            product_id: '',
        });
    }, [debouncedProductSearch]);

    return (
        <TenantLayout title="Reports">
            <Head title="Reports" />

            <PageHeader
                eyebrow="Numbers"
                title="Reports"
                description="Pick a date range for the graphs, search a product’s sales, and download sales or expenses as PDF or Excel."
                actions={
                    <div className="flex flex-row flex-wrap items-center gap-2">
                        {[
                            { label: 'Today', range: { date_from: localIsoDate(), date_to: localIsoDate() } },
                            { label: '7 days', range: { date_from: shiftDays(-6), date_to: localIsoDate() } },
                            { label: '30 days', range: { date_from: shiftDays(-29), date_to: localIsoDate() } },
                            { label: 'This month', range: { date_from: monthStart(), date_to: localIsoDate() } },
                        ].map((preset) => {
                            const active =
                                filters.date_from === preset.range.date_from &&
                                filters.date_to === preset.range.date_to;

                            return (
                                <Button
                                    key={preset.label}
                                    size="sm"
                                    variant={active ? 'default' : 'outline'}
                                    onClick={() => applyFilters(preset.range)}
                                >
                                    {preset.label}
                                </Button>
                            );
                        })}
                        <div>
                            <InputLabel value="From" className="sr-only" />
                            <TextInput
                                type="date"
                                className="h-[34px] w-[11.75rem] text-sm"
                                value={filters.date_from ?? ''}
                                onChange={(e) => applyFilters({ date_from: e.target.value })}
                            />
                        </div>
                        <div>
                            <InputLabel value="To" className="sr-only" />
                            <TextInput
                                type="date"
                                className="h-[34px] w-[11.75rem] text-sm"
                                value={filters.date_to ?? ''}
                                onChange={(e) => applyFilters({ date_to: e.target.value })}
                            />
                        </div>
                        {branches?.length > 1 ? (
                            <Select
                                value={filters.branch_id ? String(filters.branch_id) : ''}
                                onValueChange={(value) => applyFilters({ branch_id: value })}
                            >
                                <SelectTrigger className="h-[34px] min-w-[160px]">
                                    <SelectValue placeholder="Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : null}
                        <ReportExportMenu filters={filters} />
                    </div>
                }
            />

            {statement && (
                <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <SurfaceCard>
                        <p
                            className={cn(
                                'text-[10px] font-semibold uppercase tracking-wider',
                                statement.is_loss ? 'text-jam' : 'text-sage',
                            )}
                        >
                            {statement.is_loss
                                ? 'Operating loss'
                                : statement.is_profit
                                  ? 'Operating profit'
                                  : 'Breaking even'}
                        </p>
                        <h2 className="text-lg font-semibold">Profit and loss</h2>
                        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                            Sales in this range, minus what those goods cost and what was written off as waste.
                        </p>
                        <StatementRow label="Sales" value={statement.revenue} />
                        <StatementRow label="Ingredient and stock cost" value={statement.ingredient_cost} muted />
                        <StatementRow label="Waste write-off" value={statement.waste_cost ?? 0} muted />
                        <StatementRow
                            label="Rent, fees, and other shop costs"
                            value={statement.operating_expenses ?? 0}
                            href={route('tenant.expenses.index')}
                            muted
                        />
                        <StatementRow
                            label={statement.is_loss ? 'Final loss' : 'Final profit'}
                            value={statement.profit}
                            strong
                            loss={statement.is_loss}
                        />
                        <p className={cn('mt-4 text-3xl', statement.is_loss ? 'text-jam' : 'text-ink')}>
                            <Money amount={statement.profit} />
                        </p>
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-butter">
                            How money moved
                        </p>
                        <h2 className="text-lg font-semibold">Cash in and cash out</h2>
                        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                            What came in at the counter, what customers still owe, and where money left the business.
                        </p>
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
                        <StatementRow
                            label="Rent, fees, and other shop costs"
                            value={statement.operating_expenses ?? 0}
                            href={route('tenant.expenses.index')}
                        />
                        <StatementRow
                            label="Money used (cost + waste + shop bills + debts + drawings)"
                            value={statement.money_used ?? 0}
                            strong
                        />
                    </SurfaceCard>
                </div>
            )}

            <div className="mb-6 grid gap-6 md:grid-cols-3">
                {[
                    { label: 'Customers owe us', value: receivablesTotal, href: route('tenant.customers.index') },
                    { label: 'We still owe', value: payablesOpen, href: route('tenant.debts.index') },
                    { label: 'Open pre-orders', value: preOrdersPending, money: false },
                ].map((card) => {
                    const inner = (
                        <SurfaceCard>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-jam">
                                {card.label}
                            </p>
                            <p className="text-2xl text-ink">
                                {card.money === false ? card.value : <Money amount={card.value} />}
                            </p>
                        </SurfaceCard>
                    );

                    return card.href ? (
                        <Link key={card.label} href={card.href} className="block no-underline">
                            {inner}
                        </Link>
                    ) : (
                        <div key={card.label}>{inner}</div>
                    );
                })}
            </div>

            <SurfaceCard className="mb-6">
                <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-jam">
                            Product sales
                        </p>
                        <h2 className="text-lg font-semibold">Search what sold</h2>
                        <p className="text-sm text-muted-foreground">
                            Graphs follow the date range and the product you look up.
                        </p>
                    </div>
                    <div className="flex flex-col flex-wrap items-center gap-2 sm:flex-row">
                        <Badge variant="secondary" className="bg-wheat-light">
                            {rangeLabel}
                        </Badge>
                        <Badge variant="secondary" className="bg-jam/10">
                            {productViewLabel}
                        </Badge>
                    </div>
                </div>
                <div className="relative mb-4 max-w-[420px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <TextInput
                        className="pl-9 pr-9"
                        placeholder="Search a product — mandazi, loaf, sugar…"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {(productSearch || filters.product_id) && (
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                            aria-label="Clear product search"
                            onClick={() => {
                                setProductSearch('');
                                applyFilters({ product_search: '', product_id: '' });
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                    <div>
                        <h3 className="mb-1 text-sm font-semibold">
                            {productViewLabel} over {rangeLabel}
                        </h3>
                        <LazyLineChart
                            labels={productTrend.map((day) => chartDayLabel(day.date))}
                            series={[
                                {
                                    key: 'product_sales',
                                    label: 'Product sales',
                                    values: productTrend.map((day) => day.revenue),
                                    color: '#9C2B3A',
                                },
                            ]}
                            height={220}
                        />
                    </div>
                    <div>
                        <h3 className="mb-1 text-sm font-semibold">Top matching products</h3>
                        <LazyBarChart
                            items={productChartItems.map((row, i) => ({
                                label: row.name,
                                value: row.revenue,
                                color: chartPalette[i % chartPalette.length],
                            }))}
                            height={220}
                        />
                    </div>
                </div>
                <DataTable
                    columns={[
                        { label: 'Product' },
                        { label: 'Type' },
                        { label: 'Qty sold' },
                        { label: 'Sales' },
                        { label: 'Cost' },
                        { label: 'Profit' },
                    ]}
                    emptyMessage="No product sales match this search and date range."
                >
                    {salesByProduct.map((row) => {
                        const selected = filters.product_id === row.id;

                        return (
                            <DataTableRow
                                key={row.id}
                                onClick={() =>
                                    applyFilters({
                                        product_id: selected ? '' : row.id,
                                    })
                                }
                                className={selected ? 'bg-jam/5' : undefined}
                            >
                                <DataTableCell className="font-semibold">{row.name}</DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={row.type} />
                                </DataTableCell>
                                <DataTableCell>
                                    {formatQuantity(row.quantity)} {row.unit}
                                </DataTableCell>
                                <DataTableCell className="font-semibold">
                                    <Money amount={row.revenue} />
                                </DataTableCell>
                                <DataTableCell>
                                    <Money amount={row.cost} />
                                </DataTableCell>
                                <DataTableCell
                                    className={cn(
                                        'font-bold',
                                        row.profit < 0 ? 'text-jam' : 'text-ink',
                                    )}
                                >
                                    <Money amount={row.profit} />
                                </DataTableCell>
                            </DataTableRow>
                        );
                    })}
                </DataTable>
            </SurfaceCard>

            <SurfaceCard className="mb-6">
                <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-jam">
                            Daily sales
                        </p>
                        <h2 className="text-lg font-semibold">Each day’s take</h2>
                        <p className="text-sm text-muted-foreground">
                            Tickets, cash vs credit, cost, waste, and the day’s profit or loss for {rangeLabel}.
                        </p>
                    </div>
                </div>
                <div className="mb-4">
                    <LazyLineChart
                        labels={dailySales.map((day) => chartDayLabel(day.date))}
                        series={[
                            { key: 'sales', label: 'Sales', values: dailySales.map((day) => day.revenue), color: '#9C2B3A' },
                            {
                                key: 'profit',
                                label: 'Profit',
                                values: dailySales.map((day) => day.profit),
                                color: '#5F7A52',
                            },
                        ]}
                        height={220}
                    />
                </div>
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
                            <DataTableCell className="font-semibold">{formatDate(day.date)}</DataTableCell>
                            <DataTableCell>
                                {day.tickets}
                                {day.voided_tickets > 0 ? ` · ${day.voided_tickets} void` : ''}
                            </DataTableCell>
                            <DataTableCell className="font-semibold">
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
                            <DataTableCell
                                className={cn('font-bold', day.is_loss ? 'text-jam' : 'text-ink')}
                            >
                                <Money amount={day.profit} />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTable>
                {daysWithSales.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">No completed tickets in this range yet.</p>
                )}
            </SurfaceCard>

            <SurfaceCard className="mb-6">
                <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-sage">
                            Expenses
                        </p>
                        <h2 className="text-lg font-semibold">Money going out</h2>
                        <p className="text-sm text-muted-foreground">
                            Baking costs plus rent, fees, creditor payments, and drawings for {rangeLabel}.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                        <p className="text-lg font-semibold">
                            <Money amount={expenseBreakdown.total ?? 0} />
                        </p>
                        <Button size="sm" variant="ghost" asChild>
                            <Link href={route('tenant.expenses.index')}>Record a shop expense</Link>
                        </Button>
                    </div>
                </div>
                <div className="mb-4">
                    <LazyLineChart
                        labels={(expenseBreakdown.daily ?? []).map((day) => chartDayLabel(day.date))}
                        series={[
                            {
                                key: 'cost',
                                label: 'Ingredient cost',
                                values: (expenseBreakdown.daily ?? []).map((day) => day.ingredient_cost),
                                color: '#E3A72B',
                            },
                            {
                                key: 'waste',
                                label: 'Waste',
                                values: (expenseBreakdown.daily ?? []).map((day) => day.waste_cost),
                                color: '#9C2B3A',
                            },
                            {
                                key: 'shop',
                                label: 'Rent and fees',
                                values: (expenseBreakdown.daily ?? []).map((day) => day.operating_expenses ?? 0),
                                color: '#33261C',
                            },
                            {
                                key: 'out',
                                label: 'Total out',
                                values: (expenseBreakdown.daily ?? []).map((day) => day.total),
                                color: '#5F7A52',
                            },
                        ]}
                        height={220}
                    />
                </div>
                <DataTable
                    columns={[{ label: 'Cost' }, { label: 'Amount' }]}
                    emptyMessage="No costs recorded in this range."
                >
                    {(expenseBreakdown.lines ?? []).map((line) => (
                        <DataTableRow key={line.key}>
                            <DataTableCell>{line.label}</DataTableCell>
                            <DataTableCell className="font-semibold">
                                <Money amount={line.amount} />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                    <DataTableRow>
                        <DataTableCell className="font-bold">Money used</DataTableCell>
                        <DataTableCell className="font-bold">
                            <Money amount={expenseBreakdown.total ?? 0} />
                        </DataTableCell>
                    </DataTableRow>
                </DataTable>
            </SurfaceCard>

            <div className="grid gap-6 lg:grid-cols-2">
                <SurfaceCard>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-jam">
                        Sales by channel
                    </p>
                    <div className="mb-4 mt-4">
                        <LazyBarChart
                            items={salesByChannel.map((row, i) => ({
                                label: row.channel,
                                value: row.total,
                                color: chartPalette[i % chartPalette.length],
                            }))}
                            height={168}
                        />
                    </div>
                    <DataTable
                        columns={[{ label: 'Channel' }, { label: 'Total' }]}
                        emptyMessage="No completed sales in this range."
                    >
                        {salesByChannel.map((row, i) => (
                            <DataTableRow key={i}>
                                <DataTableCell>
                                    <StatusBadge status={row.channel} />
                                </DataTableCell>
                                <DataTableCell className="font-semibold">
                                    <Money amount={row.total} />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                </SurfaceCard>

                <SurfaceCard>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-butter">
                        Sales by product type
                    </p>
                    <div className="mb-4 mt-4">
                        <LazyBarChart
                            items={salesByProductType.map((row, i) => ({
                                label: row.type,
                                value: row.total,
                                color: chartPalette[i % chartPalette.length],
                            }))}
                            height={168}
                        />
                    </div>
                    <DataTable
                        columns={[{ label: 'Type' }, { label: 'Total' }]}
                        emptyMessage="No sales data in this range."
                    >
                        {salesByProductType.map((row, i) => (
                            <DataTableRow key={i}>
                                <DataTableCell>
                                    <StatusBadge status={row.type} />
                                </DataTableCell>
                                <DataTableCell className="font-semibold">
                                    <Money amount={row.total} />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                </SurfaceCard>

                <div className="lg:col-span-full">
                    <h2 className="text-lg font-semibold">Staff sales</h2>
                    <p className="mb-3 text-sm text-muted-foreground">
                        Completed tickets count toward the total. Tap a person to see their tickets.
                    </p>
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
                                    className={selected ? 'bg-jam/5' : undefined}
                                >
                                    <DataTableCell className="font-semibold">{row.name}</DataTableCell>
                                    <DataTableCell>{row.tickets}</DataTableCell>
                                    <DataTableCell className="font-semibold">
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

                    <div className="mb-3 mt-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <h2 className="text-lg font-semibold">Tickets</h2>
                        {filters.staff_user_id !== null && filters.staff_user_id !== '' && (
                            <Button size="sm" variant="ghost" onClick={() => applyFilters({ staff_user_id: '' })}>
                                Show all staff
                            </Button>
                        )}
                    </div>
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
                                    <p className="text-sm font-semibold">
                                        #{ticket.id}
                                        {ticket.customer?.name ? ` · ${ticket.customer.name}` : ''}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {ticketItems(ticket) || ticket.channel}
                                    </span>
                                </DataTableCell>
                                <DataTableCell className="font-semibold">
                                    <Money amount={ticket.total_amount} />
                                </DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={ticket.status} />
                                </DataTableCell>
                                <DataTableCell>
                                    {canRefund && ticket.status !== 'voided' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive/10"
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
                </div>

                <div className="lg:col-span-full">
                    <h2 className="mb-3 text-lg font-semibold">Outstanding customer balances</h2>
                    <DataTable
                        columns={[{ label: 'Customer' }, { label: 'Type' }, { label: 'Outstanding' }]}
                        emptyMessage="No customer balances outstanding."
                    >
                        {receivables.map((row) => (
                            <DataTableRow
                                key={row.id}
                                onClick={() => router.visit(route('tenant.customers.show', row.id))}
                                className="cursor-pointer"
                            >
                                <DataTableCell className="font-semibold">{row.name}</DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={row.type} />
                                </DataTableCell>
                                <DataTableCell className="font-semibold">
                                    <Money amount={row.outstanding} />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                </div>
            </div>

            <VoidSaleDialog
                order={voidTarget}
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
            />
        </TenantLayout>
    );
}
