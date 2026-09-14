import { BarChart } from '@/Components/AccentChart';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate } from '@/lib/format';
import { colors, chartPalette } from '@/theme/bakeryTheme';
import { Box, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Head, router, useForm } from '@inertiajs/react';

function localIsoDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function Index({ expenses, branches = [], categories = [], filters, totals }) {
    const form = useForm({
        category: 'rent',
        payee: '',
        amount: '',
        incurred_at: localIsoDate(),
        branch_id: branches[0]?.id ?? '',
        notes: '',
    });

    return (
        <TenantLayout title="Expenses">
            <Head title="Expenses" />

            <PageHeader
                eyebrow="Shop costs"
                title="Expenses"
                description="Rent, fees, salaries, and other money that leaves the bakery outside of flour, sugar, and waste."
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    mb: 3,
                }}
            >
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.jam }}>
                        This month
                    </Typography>
                    <Typography variant="h5" sx={{ color: colors.ink }}>
                        <Money amount={totals.this_month} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Shop costs recorded since {formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                    </Typography>
                </SurfaceCard>
                <SurfaceCard>
                    <Typography variant="overline" sx={{ color: colors.sage }}>
                        All time
                    </Typography>
                    <Typography variant="h5" sx={{ color: colors.ink }}>
                        <Money amount={totals.all_time} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Every rent, fee, and shop bill on the books.
                    </Typography>
                </SurfaceCard>
            </Box>

            {(totals.by_category ?? []).length > 0 && (
                <SurfaceCard sx={{ mb: 3 }}>
                    <Typography variant="overline" sx={{ color: colors.butter }}>
                        This month by type
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Where the money went
                    </Typography>
                    <BarChart
                        items={(totals.by_category ?? []).map((row, index) => ({
                            label: row.label,
                            value: row.total,
                            color: chartPalette[index % chartPalette.length],
                        }))}
                        height={196}
                    />
                </SurfaceCard>
            )}

            <SurfaceCard
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('tenant.expenses.store'), {
                        onSuccess: () => form.reset('payee', 'amount', 'notes'),
                    });
                }}
                sx={{
                    mb: 3,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                }}
            >
                <Box>
                    <InputLabel value="Type" />
                    <FormControl fullWidth size="small">
                        <Select
                            value={form.data.category}
                            onChange={(e) => form.setData('category', e.target.value)}
                        >
                            {categories.map((category) => (
                                <MenuItem key={category.value} value={category.value}>
                                    {category.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <InputError message={form.errors.category} />
                </Box>
                <Box>
                    <InputLabel value="Paid to / for" />
                    <TextInput
                        value={form.data.payee}
                        onChange={(e) => form.setData('payee', e.target.value)}
                        placeholder="Landlord, TRA, TANESCO…"
                    />
                    <InputError message={form.errors.payee} />
                </Box>
                <Box>
                    <InputLabel value="Amount (TZS)" />
                    <TextInput
                        type="number"
                        value={form.data.amount}
                        onChange={(e) => form.setData('amount', e.target.value)}
                    />
                    <InputError message={form.errors.amount} />
                </Box>
                <Box>
                    <InputLabel value="Date" />
                    <TextInput
                        type="date"
                        value={form.data.incurred_at}
                        onChange={(e) => form.setData('incurred_at', e.target.value)}
                    />
                </Box>
                {branches.length > 1 && (
                    <Box>
                        <InputLabel value="Branch" />
                        <FormControl fullWidth size="small">
                            <Select
                                value={form.data.branch_id}
                                onChange={(e) => form.setData('branch_id', e.target.value)}
                            >
                                {branches.map((branch) => (
                                    <MenuItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}
                <Box>
                    <InputLabel value="Notes" />
                    <TextInput
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="Optional"
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <PrimaryButton type="submit" fullWidth disabled={form.processing}>
                        Record expense
                    </PrimaryButton>
                </Box>
            </SurfaceCard>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select
                        displayEmpty
                        value={filters.category ?? ''}
                        onChange={(e) =>
                            router.get(
                                route('tenant.expenses.index'),
                                { category: e.target.value },
                                { preserveState: true, preserveScroll: true, only: ['expenses', 'filters'] },
                            )
                        }
                    >
                        <MenuItem value="">All types</MenuItem>
                        {categories.map((category) => (
                            <MenuItem key={category.value} value={category.value}>
                                {category.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

            <DataTable
                columns={[
                    { label: 'Date' },
                    { label: 'Type' },
                    { label: 'Paid to / for' },
                    { label: 'Amount' },
                    { label: 'Branch' },
                ]}
                emptyMessage="No shop expenses recorded yet. Rent, TRA fees, and salaries belong here."
            >
                {(expenses.data ?? []).map((expense) => (
                    <DataTableRow key={expense.id}>
                        <DataTableCell>{formatDate(expense.incurred_at)}</DataTableCell>
                        <DataTableCell>
                        <StatusBadge
                            status={expense.category}
                            label={categories.find((category) => category.value === expense.category)?.label}
                        />
                        </DataTableCell>
                        <DataTableCell>
                            <Typography variant="body2" fontWeight={600}>
                                {expense.payee}
                            </Typography>
                            {expense.notes ? (
                                <Typography variant="caption" color="text.secondary">
                                    {expense.notes}
                                </Typography>
                            ) : null}
                        </DataTableCell>
                        <DataTableCell sx={{ fontWeight: 600 }}>
                            <Money amount={expense.amount} />
                        </DataTableCell>
                        <DataTableCell>{expense.branch?.name ?? '—'}</DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
            <Pagination links={expenses.links} />
        </TenantLayout>
    );
}
