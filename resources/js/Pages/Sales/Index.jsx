import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import VoidSaleDialog, { canVoidOrder } from '@/Components/VoidSaleDialog';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import TenantLayout from '@/Layouts/TenantLayout';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { formatDateTime, formatQuantity } from '@/lib/format';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Download, FileSpreadsheet, FileText, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    return localIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function saleItems(sale) {
    return (sale.items ?? [])
        .map((item) => `${formatQuantity(item.quantity)} ${item.name}`)
        .join(', ');
}

const filterSelectClassName =
    'flex h-10 w-full min-w-[150px] rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

function SalesExportMenu({ filters }) {
    const hrefFor = (format) =>
        route('tenant.sales.export', {
            format,
            branch_id: filters.branch_id ?? '',
            date_from: filters.date_from,
            date_to: filters.date_to,
            staff_user_id: filters.staff_user_id ?? '',
            staff_search: filters.staff_search ?? '',
            channel: filters.channel ?? '',
            status: filters.status ?? 'completed',
        });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuItem asChild>
                    <a href={hrefFor('pdf')} className="flex cursor-pointer items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Download PDF
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href={hrefFor('xlsx')} className="flex cursor-pointer items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Download Excel
                    </a>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function Index({
    sales,
    summary,
    byChannel = [],
    staffOptions = [],
    branches = [],
    filters,
    refreshedAt,
}) {
    const { auth } = usePage().props;
    const [voidTarget, setVoidTarget] = useState(null);
    const [staffSearch, setStaffSearch] = useState(filters.staff_search ?? '');
    const debouncedStaffSearch = useDebouncedValue(staffSearch, 300);

    const applyFilters = (next, options = {}) => {
        router.get(
            route('tenant.sales.index'),
            {
                branch_id: next.branch_id ?? '',
                date_from: next.date_from,
                date_to: next.date_to,
                staff_user_id: next.staff_user_id ?? '',
                staff_search: next.staff_search ?? '',
                channel: next.channel ?? '',
                status: next.status ?? 'completed',
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['sales', 'summary', 'byChannel', 'staffOptions', 'filters', 'refreshedAt'],
                ...options,
            },
        );
    };

    useEffect(() => {
        setStaffSearch(filters.staff_search ?? '');
    }, [filters.staff_search]);

    useEffect(() => {
        if ((debouncedStaffSearch ?? '') === (filters.staff_search ?? '')) {
            return;
        }

        applyFilters({ ...filters, staff_search: debouncedStaffSearch });
    }, [debouncedStaffSearch]);

    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            router.reload({
                only: ['sales', 'summary', 'byChannel', 'refreshedAt'],
                preserveScroll: true,
                preserveState: true,
            });
        };

        const timer = window.setInterval(refresh, 20000);
        const onFocus = () => refresh();
        window.addEventListener('focus', onFocus);

        return () => {
            window.clearInterval(timer);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const periodSameDay = filters.date_from === filters.date_to;

    return (
        <TenantLayout title="Sales">
            <Head title="Sales" />

            <PageHeader
                eyebrow="Ledger"
                title="Sales"
                description="Every completed sale on the books — filter by day, staff, or channel, then export the ledger."
                actions={<SalesExportMenu filters={filters} />}
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-jam">Today’s total</p>
                    <p className="mt-1 text-3xl font-semibold text-ink">
                        <Money amount={summary.today_total} />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {summary.today_count} sold ticket{summary.today_count === 1 ? '' : 's'} today
                    </p>
                </SurfaceCard>
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-butter">
                        {periodSameDay ? 'Selected day' : 'Selected range'}
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-ink">
                        <Money amount={summary.period_total} />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {summary.period_count} sold · {summary.voided_count} voided
                    </p>
                </SurfaceCard>
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-sage">Open pre-orders</p>
                    <p className="mt-1 text-3xl font-semibold text-ink">
                        {summary.pending_count}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Still waiting in this date range
                    </p>
                </SurfaceCard>
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live view</p>
                    <p className="mt-1 text-base font-bold text-ink">Auto-refreshing</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Updated {refreshedAt ? formatDateTime(refreshedAt) : 'just now'}
                    </p>
                </SurfaceCard>
            </div>

            <SurfaceCard className="mb-6">
                <div className="flex flex-col flex-wrap items-stretch gap-4 lg:flex-row lg:items-end">
                    <div className="min-w-[11.75rem]">
                        <p className="mb-1 block text-xs text-muted-foreground">From</p>
                        <TextInput
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => applyFilters({ ...filters, date_from: e.target.value })}
                        />
                    </div>
                    <div className="min-w-[11.75rem]">
                        <p className="mb-1 block text-xs text-muted-foreground">To</p>
                        <TextInput
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => applyFilters({ ...filters, date_to: e.target.value })}
                        />
                    </div>
                    <div className="min-w-[200px] flex-1">
                        <p className="mb-1 block text-xs text-muted-foreground">Search staff</p>
                        <TextInput
                            placeholder="Cashier name…"
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                        />
                    </div>
                    <div className="min-w-[180px]">
                        <p className="mb-1 block text-xs text-muted-foreground">Staff</p>
                        <select
                            className={filterSelectClassName}
                            value={filters.staff_user_id ?? ''}
                            onChange={(e) =>
                                applyFilters({
                                    ...filters,
                                    staff_user_id: e.target.value === '' ? null : Number(e.target.value),
                                })
                            }
                        >
                            <option value="">All staff</option>
                            <option value="0">Unassigned</option>
                            {staffOptions.map((person) => (
                                <option key={person.id} value={person.id}>
                                    {person.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[150px]">
                        <p className="mb-1 block text-xs text-muted-foreground">Channel</p>
                        <select
                            className={filterSelectClassName}
                            value={filters.channel ?? ''}
                            onChange={(e) => applyFilters({ ...filters, channel: e.target.value })}
                        >
                            <option value="">All channels</option>
                            <option value="retail">Retail</option>
                            <option value="wholesale">Wholesale</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div className="min-w-[150px]">
                        <p className="mb-1 block text-xs text-muted-foreground">Status</p>
                        <select
                            className={filterSelectClassName}
                            value={filters.status ?? 'completed'}
                            onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="completed">Sold</option>
                            <option value="voided">Voided</option>
                            <option value="pending">Pending</option>
                            <option value="all">Sold + voided</option>
                        </select>
                    </div>
                    {branches.length > 1 && (
                        <div className="min-w-[160px]">
                            <p className="mb-1 block text-xs text-muted-foreground">Branch</p>
                            <select
                                className={filterSelectClassName}
                                value={filters.branch_id ?? ''}
                                onChange={(e) =>
                                    applyFilters({
                                        ...filters,
                                        branch_id: e.target.value === '' ? null : Number(e.target.value),
                                    })
                                }
                            >
                                <option value="">All branches</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                        { label: 'Today', from: localIsoDate(), to: localIsoDate() },
                        { label: 'Last 7 days', from: shiftDays(-6), to: localIsoDate() },
                        { label: 'This month', from: monthStart(), to: localIsoDate() },
                    ].map((preset) => {
                        const active =
                            filters.date_from === preset.from && filters.date_to === preset.to;
                        return (
                            <Button
                                key={preset.label}
                                size="sm"
                                variant={active ? 'default' : 'outline'}
                                onClick={() =>
                                    applyFilters({
                                        ...filters,
                                        date_from: preset.from,
                                        date_to: preset.to,
                                    })
                                }
                            >
                                {preset.label}
                            </Button>
                        );
                    })}
                </div>
            </SurfaceCard>

            {byChannel.length > 0 && (
                <div className="mb-6 flex flex-col flex-wrap gap-3 sm:flex-row">
                    {byChannel.map((row) => (
                        <SurfaceCard
                            key={row.channel}
                            className={`min-w-[160px] flex-1 cursor-pointer ${
                                filters.channel === row.channel ? 'border-jam' : ''
                            }`}
                            onClick={() =>
                                applyFilters({
                                    ...filters,
                                    channel: filters.channel === row.channel ? '' : row.channel,
                                })
                            }
                        >
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {row.channel}
                            </p>
                            <p className="text-lg font-semibold text-ink">
                                <Money amount={row.total} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {row.tickets} ticket{row.tickets === 1 ? '' : 's'}
                            </p>
                        </SurfaceCard>
                    ))}
                </div>
            )}

            <DataTable
                columns={[
                    { label: 'When' },
                    { label: 'Cashier' },
                    { label: 'Sale' },
                    { label: 'Channel' },
                    { label: 'Total' },
                    { label: 'Status' },
                    { label: '' },
                ]}
                emptyMessage="No sales in this range. Widen the dates or clear the staff filter."
            >
                {(sales?.data ?? []).map((sale) => (
                    <DataTableRow key={sale.id}>
                        <DataTableCell>{formatDateTime(sale.created_at)}</DataTableCell>
                        <DataTableCell>{sale.cashier?.name ?? 'Unassigned'}</DataTableCell>
                        <DataTableCell>
                            <p className="text-sm font-semibold">
                                #{sale.id}
                                {sale.customer?.name ? ` · ${sale.customer.name}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {saleItems(sale) || '—'}
                            </p>
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={sale.channel} />
                        </DataTableCell>
                        <DataTableCell className="font-semibold">
                            <Money amount={sale.total_amount} />
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge
                                status={sale.status}
                                label={
                                    sale.status === 'completed'
                                        ? 'Sold'
                                        : sale.is_pre_order && sale.status === 'pending'
                                          ? 'Pre-order'
                                          : undefined
                                }
                            />
                        </DataTableCell>
                        <DataTableCell className="w-px whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                                {sale.status === 'pending' && (
                                    <Button
                                        size="sm"
                                        className="px-3"
                                        onClick={() =>
                                            router.patch(
                                                route('tenant.orders.fulfill', sale.id),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Mark sold
                                    </Button>
                                )}
                                {canVoidOrder(auth, sale) && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Void ticket"
                                                    className="h-8 w-8 rounded-[7px] border-border bg-cream text-jam hover:border-jam hover:bg-jam hover:text-cream"
                                                    onClick={() => setVoidTarget(sale)}
                                                >
                                                    <Undo2 className="h-[18px] w-[18px]" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Void ticket</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={sales?.links} />

            <VoidSaleDialog
                order={voidTarget}
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
            />
        </TenantLayout>
    );
}
