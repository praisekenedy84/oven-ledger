import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import SaleReceiptDialog from '@/Components/SaleReceiptDialog';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import VoidSaleDialog, { canVoidOrder } from '@/Components/VoidSaleDialog';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDateTime, formatQuantity } from '@/lib/format';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle, Receipt, Undo2 } from 'lucide-react';
import { useState } from 'react';

function ticketItems(ticket) {
    return (ticket.items ?? [])
        .map((item) => `${formatQuantity(item.quantity)} ${item.name}`)
        .join(', ');
}

function markSold(orderId) {
    router.patch(route('tenant.orders.fulfill', orderId), {}, { preserveScroll: true });
}

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
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild size="sm">
                            <Link href={route('tenant.pos.index')} prefetch>
                                New sale
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applyFilters({ all: !showingAll, date: filters.date })}
                        >
                            {showingAll ? 'Show today' : 'Show all days'}
                        </Button>
                        {!showingAll && (
                            <div className="w-[11.75rem]">
                                <TextInput
                                    type="date"
                                    value={filters.date ?? ''}
                                    onChange={(e) => applyFilters({ all: false, date: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                }
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {[
                    { label: 'Completed tickets', value: summary.count, money: false },
                    { label: 'Sold', value: summary.total, money: true },
                    { label: 'Open pre-orders', value: summary.pending ?? 0, money: false },
                    { label: 'Voided', value: summary.voided, money: false },
                ].map((card) => (
                    <SurfaceCard key={card.label}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-jam">{card.label}</p>
                        <p className="mt-1 text-3xl font-semibold text-ink">
                            {card.money ? <Money amount={card.value} /> : card.value}
                        </p>
                    </SurfaceCard>
                ))}
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
                            <p className="text-sm font-semibold">
                                #{ticket.id}
                                {ticket.customer?.name ? ` · ${ticket.customer.name}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {ticketItems(ticket) || ticket.channel}
                            </p>
                            {ticket.is_pre_order && (
                                <p className="text-xs text-muted-foreground">
                                    Pre-order
                                    {ticket.fulfillment_type ? ` · ${ticket.fulfillment_type}` : ''}
                                    {ticket.requested_fulfillment_at
                                        ? ` · due ${formatDateTime(ticket.requested_fulfillment_at)}`
                                        : ''}
                                </p>
                            )}
                            {ticket.void_reason && (
                                <p className="text-xs text-muted-foreground">{ticket.void_reason}</p>
                            )}
                        </DataTableCell>
                        <DataTableCell className="font-semibold">
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
                        <DataTableCell className="w-px whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                                {ticket.status !== 'voided' && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="View receipt"
                                                    className="h-8 w-8 rounded-[7px] border-border bg-cream text-muted-foreground hover:border-ink hover:bg-wheat-light hover:text-ink"
                                                    onClick={() => setReceiptSale(ticket)}
                                                >
                                                    <Receipt className="h-[18px] w-[18px]" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View receipt</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                {ticket.status === 'pending' && (
                                    <Button size="sm" className="px-3" onClick={() => markSold(ticket.id)}>
                                        <CheckCircle className="h-4 w-4" />
                                        Mark sold
                                    </Button>
                                )}
                                {canVoidOrder(auth, ticket) && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Void ticket"
                                                    className="h-8 w-8 rounded-[7px] border-border bg-cream text-jam hover:border-jam hover:bg-jam hover:text-cream"
                                                    onClick={() => setVoidTarget(ticket)}
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
