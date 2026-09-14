import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import VoidSaleDialog, { canVoidOrder } from '@/Components/VoidSaleDialog';
import TenantLayout from '@/Layouts/TenantLayout';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { formatDateTime } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    Button,
    Divider,
    FormControl,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { Head, router, usePage } from '@inertiajs/react';
import { Fragment, useEffect, useState } from 'react';

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
    return (sale.items ?? []).map((item) => `${item.quantity} ${item.name}`).join(', ');
}

function SalesExportMenu({ filters }) {
    const [anchor, setAnchor] = useState(null);

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
        <>
            <Button
                size="small"
                variant="contained"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={(event) => setAnchor(event.currentTarget)}
            >
                Export
            </Button>
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                slotProps={{ paper: { sx: { minWidth: 220 } } }}
            >
                {[
                    { format: 'pdf', label: 'Download PDF', icon: PictureAsPdfOutlinedIcon },
                    { format: 'xlsx', label: 'Download Excel', icon: TableChartOutlinedIcon },
                ].map((option, index) => {
                    const Icon = option.icon;
                    return (
                        <Fragment key={option.format}>
                            {index > 0 ? <Divider sx={{ my: 0.5 }} /> : null}
                            <MenuItem
                                component="a"
                                href={hrefFor(option.format)}
                                onClick={() => setAnchor(null)}
                            >
                                <ListItemIcon>
                                    <Icon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={option.label} />
                            </MenuItem>
                        </Fragment>
                    );
                })}
            </Menu>
        </>
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

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                    mb: 3,
                }}
            >
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.jam }}>
                        Today’s total
                    </Typography>
                    <Typography variant="h4" sx={{ color: colors.ink, mt: 0.5 }}>
                        <Money amount={summary.today_total} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {summary.today_count} sold ticket{summary.today_count === 1 ? '' : 's'} today
                    </Typography>
                </SurfaceCard>
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.butter }}>
                        {periodSameDay ? 'Selected day' : 'Selected range'}
                    </Typography>
                    <Typography variant="h4" sx={{ color: colors.ink, mt: 0.5 }}>
                        <Money amount={summary.period_total} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {summary.period_count} sold · {summary.voided_count} voided
                    </Typography>
                </SurfaceCard>
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.sage }}>
                        Open pre-orders
                    </Typography>
                    <Typography variant="h4" sx={{ color: colors.ink, mt: 0.5 }}>
                        {summary.pending_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Still waiting in this date range
                    </Typography>
                </SurfaceCard>
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.muted }}>
                        Live view
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: colors.ink, mt: 0.5 }}>
                        Auto-refreshing
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Updated {refreshedAt ? formatDateTime(refreshedAt) : 'just now'}
                    </Typography>
                </SurfaceCard>
            </Box>

            <SurfaceCard sx={{ mb: 3 }}>
                <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={2}
                    useFlexGap
                    flexWrap="wrap"
                    alignItems={{ lg: 'flex-end' }}
                >
                    <Box sx={{ minWidth: { sm: 150 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            From
                        </Typography>
                        <TextField
                            size="small"
                            type="date"
                            fullWidth
                            value={filters.date_from}
                            onChange={(e) => applyFilters({ ...filters, date_from: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Box sx={{ minWidth: { sm: 150 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            To
                        </Typography>
                        <TextField
                            size="small"
                            type="date"
                            fullWidth
                            value={filters.date_to}
                            onChange={(e) => applyFilters({ ...filters, date_to: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: { sm: 200 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Search staff
                        </Typography>
                        <TextInput
                            placeholder="Cashier name…"
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                        />
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Staff
                        </Typography>
                        <Select
                            value={filters.staff_user_id ?? ''}
                            displayEmpty
                            onChange={(e) =>
                                applyFilters({
                                    ...filters,
                                    staff_user_id: e.target.value === '' ? null : Number(e.target.value),
                                })
                            }
                        >
                            <MenuItem value="">All staff</MenuItem>
                            <MenuItem value={0}>Unassigned</MenuItem>
                            {staffOptions.map((person) => (
                                <MenuItem key={person.id} value={person.id}>
                                    {person.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Channel
                        </Typography>
                        <Select
                            value={filters.channel ?? ''}
                            displayEmpty
                            onChange={(e) => applyFilters({ ...filters, channel: e.target.value })}
                        >
                            <MenuItem value="">All channels</MenuItem>
                            <MenuItem value="retail">Retail</MenuItem>
                            <MenuItem value="wholesale">Wholesale</MenuItem>
                            <MenuItem value="restaurant">Restaurant</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Status
                        </Typography>
                        <Select
                            value={filters.status ?? 'completed'}
                            onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
                        >
                            <MenuItem value="completed">Sold</MenuItem>
                            <MenuItem value="voided">Voided</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="all">Sold + voided</MenuItem>
                        </Select>
                    </FormControl>
                    {branches.length > 1 && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Branch
                            </Typography>
                            <Select
                                value={filters.branch_id ?? ''}
                                displayEmpty
                                onChange={(e) =>
                                    applyFilters({
                                        ...filters,
                                        branch_id: e.target.value === '' ? null : Number(e.target.value),
                                    })
                                }
                            >
                                <MenuItem value="">All branches</MenuItem>
                                {branches.map((branch) => (
                                    <MenuItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Stack>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
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
                                size="small"
                                variant={active ? 'contained' : 'outlined'}
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
                </Stack>
            </SurfaceCard>

            {byChannel.length > 0 && (
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mb: 3 }}
                >
                    {byChannel.map((row) => (
                        <SurfaceCard
                            key={row.channel}
                            sx={{
                                flex: '1 1 160px',
                                cursor: 'pointer',
                                borderColor:
                                    filters.channel === row.channel ? colors.jam : colors.border,
                            }}
                            onClick={() =>
                                applyFilters({
                                    ...filters,
                                    channel: filters.channel === row.channel ? '' : row.channel,
                                })
                            }
                        >
                            <Typography variant="overline" sx={{ color: colors.muted }}>
                                {row.channel}
                            </Typography>
                            <Typography variant="h6" sx={{ color: colors.ink }}>
                                <Money amount={row.total} />
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {row.tickets} ticket{row.tickets === 1 ? '' : 's'}
                            </Typography>
                        </SurfaceCard>
                    ))}
                </Stack>
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
                            <Typography variant="body2" fontWeight={600}>
                                #{sale.id}
                                {sale.customer?.name ? ` · ${sale.customer.name}` : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {saleItems(sale) || '—'}
                            </Typography>
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={sale.channel} />
                        </DataTableCell>
                        <DataTableCell sx={{ fontWeight: 600 }}>
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
                        <DataTableCell sx={{ width: 1, whiteSpace: 'nowrap' }}>
                            <Stack
                                direction="row"
                                spacing={0.75}
                                justifyContent="flex-end"
                                alignItems="center"
                            >
                                {sale.status === 'pending' && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                                        onClick={() =>
                                            router.patch(
                                                route('tenant.orders.fulfill', sale.id),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        sx={{ px: 1.25 }}
                                    >
                                        Mark sold
                                    </Button>
                                )}
                                {canVoidOrder(auth, sale) && (
                                    <Tooltip title="Void ticket" arrow>
                                        <IconButton
                                            size="small"
                                            aria-label="Void ticket"
                                            onClick={() => setVoidTarget(sale)}
                                            sx={{
                                                color: colors.jam,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '7px',
                                                bgcolor: colors.cream,
                                                '&:hover': {
                                                    color: colors.cream,
                                                    borderColor: colors.jam,
                                                    bgcolor: colors.jam,
                                                },
                                            }}
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

            <Pagination links={sales?.links} />

            <VoidSaleDialog
                order={voidTarget}
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
            />
        </TenantLayout>
    );
}
