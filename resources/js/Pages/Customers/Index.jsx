import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { Box, Button, FormControl, MenuItem, Paper, Select, Stack } from '@mui/material';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const TYPES = [
    { value: '', label: 'All types' },
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'restaurant', label: 'Restaurant' },
];

export default function Index({ customers, filters }) {
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
            only: ['customers', 'filters'],
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

            <Paper
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('tenant.customers.store'), {
                        onSuccess: () => form.reset(),
                    });
                }}
                variant="outlined"
                sx={{
                    mb: 3,
                    p: { xs: 2, sm: 3 },
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                }}
            >
                <Box>
                    <InputLabel value="Name" />
                    <TextInput
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                    <InputError message={form.errors.name} />
                </Box>
                <Box>
                    <InputLabel value="Phone" />
                    <TextInput
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                    />
                    <InputError message={form.errors.phone} />
                </Box>
                <Box>
                    <InputLabel value="Email" />
                    <TextInput
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                    />
                    <InputError message={form.errors.email} />
                </Box>
                <Box>
                    <InputLabel value="Type" />
                    <FormControl fullWidth size="small">
                        <Select
                            value={form.data.type}
                            onChange={(e) => form.setData('type', e.target.value)}
                        >
                            <MenuItem value="retail">Retail</MenuItem>
                            <MenuItem value="wholesale">Wholesale</MenuItem>
                            <MenuItem value="restaurant">Restaurant</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box>
                    <InputLabel value="Credit limit (TZS)" />
                    <TextInput
                        type="number"
                        value={form.data.credit_limit}
                        onChange={(e) => form.setData('credit_limit', e.target.value)}
                    />
                </Box>
                <Box>
                    <InputLabel value="Payment terms" />
                    <TextInput
                        value={form.data.payment_terms}
                        onChange={(e) => form.setData('payment_terms', e.target.value)}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gridColumn: { lg: '3 / 4' } }}>
                    <PrimaryButton type="submit" fullWidth disabled={form.processing}>
                        Add customer
                    </PrimaryButton>
                </Box>
            </Paper>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                sx={{ mb: 3 }}
            >
                <TextInput
                    placeholder="Search name or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                        value={filters.type ?? ''}
                        onChange={(e) => applyFilters({ ...filters, type: e.target.value })}
                    >
                        {TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                                {type.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

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
                        <DataTableCell sx={{ fontWeight: 600 }}>{customer.name}</DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={customer.type} />
                        </DataTableCell>
                        <DataTableCell>{customer.phone || '—'}</DataTableCell>
                        <DataTableCell sx={{ fontWeight: 600 }}>
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
                            <Button
                                component={Link}
                                href={route('tenant.customers.show', customer.id)}
                                prefetch
                                size="small"
                            >
                                Statement
                            </Button>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={customers.links} />
        </TenantLayout>
    );
}
