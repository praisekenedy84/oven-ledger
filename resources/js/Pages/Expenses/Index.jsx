import { LazyBarChart } from '@/Components/LazyCharts';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate } from '@/lib/format';
import { chartPalette } from '@/theme/bakeryTheme';
import { Head, router, useForm } from '@inertiajs/react';

function localIsoDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

const selectClassName =
    'flex h-10 min-w-[220px] rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

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

            <div className="mb-6 grid gap-6 md:grid-cols-2">
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-jam">This month</p>
                    <p className="text-xl font-semibold text-ink">
                        <Money amount={totals.this_month} />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Shop costs recorded since {formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                    </p>
                </SurfaceCard>
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-sage">All time</p>
                    <p className="text-xl font-semibold text-ink">
                        <Money amount={totals.all_time} />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Every rent, fee, and shop bill on the books.
                    </p>
                </SurfaceCard>
            </div>

            {(totals.by_category ?? []).length > 0 && (
                <SurfaceCard className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-butter">This month by type</p>
                    <p className="mb-2 text-base font-semibold">Where the money went</p>
                    <LazyBarChart
                        items={(totals.by_category ?? []).map((row, index) => ({
                            label: row.label,
                            value: row.total,
                            color: chartPalette[index % chartPalette.length],
                        }))}
                        height={196}
                    />
                </SurfaceCard>
            )}

            <SurfaceCard className="mb-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('tenant.expenses.store'), {
                            onSuccess: () => form.reset('payee', 'amount', 'notes'),
                        });
                    }}
                    className="grid gap-4 lg:grid-cols-3"
                >
                    <div>
                        <InputLabel value="Type" />
                        <Select
                            value={form.data.category}
                            onValueChange={(value) => form.setData('category', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.category} />
                    </div>
                    <div>
                        <InputLabel value="Paid to / for" />
                        <TextInput
                            value={form.data.payee}
                            onChange={(e) => form.setData('payee', e.target.value)}
                            placeholder="Landlord, TRA, TANESCO…"
                        />
                        <InputError message={form.errors.payee} />
                    </div>
                    <div>
                        <InputLabel value="Amount (TZS)" />
                        <TextInput
                            type="number"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                        />
                        <InputError message={form.errors.amount} />
                    </div>
                    <div>
                        <InputLabel value="Date" />
                        <TextInput
                            type="date"
                            value={form.data.incurred_at}
                            onChange={(e) => form.setData('incurred_at', e.target.value)}
                        />
                    </div>
                    {branches.length > 1 && (
                        <div>
                            <InputLabel value="Branch" />
                            <Select
                                value={String(form.data.branch_id)}
                                onValueChange={(value) => form.setData('branch_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div>
                        <InputLabel value="Notes" />
                        <TextInput
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Optional"
                        />
                    </div>
                    <div className="flex items-end">
                        <PrimaryButton type="submit" className="w-full" disabled={form.processing}>
                            Record expense
                        </PrimaryButton>
                    </div>
                </form>
            </SurfaceCard>

            <div className="mb-4">
                <select
                    className={selectClassName}
                    value={filters.category ?? ''}
                    onChange={(e) =>
                        router.get(
                            route('tenant.expenses.index'),
                            { category: e.target.value },
                            { preserveState: true, preserveScroll: true, only: ['expenses', 'filters'] },
                        )
                    }
                >
                    <option value="">All types</option>
                    {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                            {category.label}
                        </option>
                    ))}
                </select>
            </div>

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
                            <p className="text-sm font-semibold">{expense.payee}</p>
                            {expense.notes ? (
                                <p className="text-xs text-muted-foreground">{expense.notes}</p>
                            ) : null}
                        </DataTableCell>
                        <DataTableCell className="font-semibold">
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
