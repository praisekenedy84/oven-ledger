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
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const TYPES = [
    { value: '', label: 'All types' },
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'restaurant', label: 'Restaurant' },
];

const filterSelectClassName =
    'flex h-10 min-w-[180px] rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function Index({ customers, filters, totals = { total_owed: 0, customers_owing: 0, by_type: {} } }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const debouncedSearch = useDebouncedValue(search, 300);

    const form = useForm({
        name: '',
        phone: '',
        email: '',
        type: 'retail',
        tin_number: '',
        credit_limit: '',
        payment_terms: '',
        is_active: true,
    });

    const applyFilters = (next) => {
        router.get(route('tenant.customers.index'), next, {
            preserveState: true,
            preserveScroll: true,
            only: ['customers', 'filters', 'totals'],
        });
    };

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        if ((debouncedSearch ?? '') === (filters.search ?? '')) {
            return;
        }

        applyFilters({ ...filters, search: debouncedSearch });
    }, [debouncedSearch]);

    return (
        <TenantLayout title="Customers">
            <Head title="Customers" />

            <PageHeader
                title="Customers"
                description="Retail, wholesale, and restaurant accounts — with delivery details and a running balance."
            />

            <div className="mb-6 grid gap-6 md:grid-cols-[1.2fr_0.7fr_1fr]">
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-jam">They owe us</p>
                    <p className="mt-1 text-3xl font-semibold text-ink">
                        <Money amount={totals.total_owed} />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Unpaid credit across every customer account.
                    </p>
                </SurfaceCard>
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-butter">Open accounts</p>
                    <p className="mt-1 text-3xl font-semibold text-ink">
                        {totals.customers_owing ?? 0}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {totals.customers_owing === 1
                            ? 'Customer still has a balance.'
                            : 'Customers still have a balance.'}
                    </p>
                </SurfaceCard>
                <SurfaceCard>
                    <p className="text-xs font-semibold uppercase tracking-wider text-sage">By type</p>
                    <div className="mt-2 flex flex-col gap-1.5">
                        {[
                            { key: 'wholesale', label: 'Wholesale' },
                            { key: 'restaurant', label: 'Restaurant' },
                            { key: 'retail', label: 'Retail' },
                        ].map((row) => (
                            <div key={row.key} className="flex justify-between gap-4">
                                <p className="text-sm text-muted-foreground">{row.label}</p>
                                <p className="text-sm font-semibold">
                                    <Money amount={totals.by_type?.[row.key] ?? 0} />
                                </p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>
            </div>

            <SurfaceCard className="mb-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('tenant.customers.store'), {
                            onSuccess: () => form.reset(),
                        });
                    }}
                    className="grid gap-4 lg:grid-cols-3"
                >
                    <div>
                        <InputLabel value="Name" />
                        <TextInput
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div>
                        <InputLabel value="Phone" />
                        <TextInput
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                        />
                        <InputError message={form.errors.phone} />
                    </div>
                    <div>
                        <InputLabel value="Email" />
                        <TextInput
                            type="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                        />
                        <InputError message={form.errors.email} />
                    </div>
                    <div>
                        <InputLabel value="Type" />
                        <Select
                            value={form.data.type}
                            onValueChange={(value) => form.setData('type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="wholesale">Wholesale</SelectItem>
                                <SelectItem value="restaurant">Restaurant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <InputLabel value="Credit limit (TZS)" />
                        <TextInput
                            type="number"
                            value={form.data.credit_limit}
                            onChange={(e) => form.setData('credit_limit', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel value="Payment terms" />
                        <TextInput
                            value={form.data.payment_terms}
                            onChange={(e) => form.setData('payment_terms', e.target.value)}
                        />
                    </div>
                    <div className="flex items-end lg:col-start-3">
                        <PrimaryButton type="submit" className="w-full" disabled={form.processing}>
                            Add customer
                        </PrimaryButton>
                    </div>
                </form>
            </SurfaceCard>

            <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <TextInput
                    placeholder="Search name or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className={filterSelectClassName}
                    value={filters.type ?? ''}
                    onChange={(e) => applyFilters({ ...filters, type: e.target.value })}
                >
                    {TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            <DataTable
                columns={[
                    { label: 'Name' },
                    { label: 'Type' },
                    { label: 'Phone' },
                    { label: 'Balance' },
                    { label: 'Credit limit' },
                    { label: 'Status' },
                    { label: '' },
                ]}
                emptyMessage="No customers yet. Add a retail buyer or a wholesale account."
            >
                {customers.data.map((customer) => (
                    <DataTableRow key={customer.id}>
                        <DataTableCell className="font-semibold">{customer.name}</DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={customer.type} />
                        </DataTableCell>
                        <DataTableCell>{customer.phone || '—'}</DataTableCell>
                        <DataTableCell className="font-semibold">
                            <Money amount={customer.outstanding_balance} />
                        </DataTableCell>
                        <DataTableCell>
                            {customer.credit_limit != null ? (
                                <Money amount={customer.credit_limit} />
                            ) : (
                                '—'
                            )}
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={customer.is_active ? 'active' : 'inactive'} />
                        </DataTableCell>
                        <DataTableCell>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('tenant.customers.show', customer.id)} prefetch>
                                    Statement
                                </Link>
                            </Button>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={customers.links} />
        </TenantLayout>
    );
}
