import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { Button, IconButton, InputAdornment, Stack, Typography } from '@mui/material';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Index({ products, filters = {} }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const debouncedSearch = useDebouncedValue(search, 300);
    const activeSearch = (filters.search ?? '').trim();

    const applyFilters = (next) => {
        router.get(route('tenant.products.index'), next, {
            preserveState: true,
            preserveScroll: true,
            only: ['products', 'filters'],
        });
    };

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        if ((debouncedSearch ?? '') === (filters.search ?? '')) {
            return;
        }

        applyFilters({ search: debouncedSearch });
    }, [debouncedSearch]);

    return (
        <TenantLayout title="Products">
            <Head title="Products" />

            <PageHeader
                title="Products"
                description="Baked goods carry a recipe so cost is locked. Hardware is bought in."
                actions={
                    <Button
                        component={Link}
                        href={route('tenant.products.create')}
                        variant="contained"
                    >
                        Add product
                    </Button>
                }
            />

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                sx={{ mb: 3 }}
            >
                <TextInput
                    placeholder="Search by name, category, type, or unit…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: search ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    aria-label="Clear product search"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilters({ search: '' });
                                    }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                    sx={{ maxWidth: { sm: 420 } }}
                />
            </Stack>

            {activeSearch !== '' && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Showing products matching “{activeSearch}”.
                </Typography>
            )}

            <DataTable
                columns={[
                    { label: 'Name' },
                    { label: 'Type' },
                    { label: 'Category' },
                    { label: 'Unit' },
                    { label: 'Cost' },
                    { label: 'Retail' },
                    { label: 'Status' },
                    { label: '' },
                ]}
                emptyMessage={
                    activeSearch !== ''
                        ? `No products match “${activeSearch}”.`
                        : 'No products yet. Add a baked good or a hardware item.'
                }
            >
                {products.data.map((product) => (
                    <DataTableRow key={product.id}>
                        <DataTableCell sx={{ fontWeight: 600 }}>{product.name}</DataTableCell>
                        <DataTableCell>
                            <StatusBadge
                                status={product.type === 'trading' ? 'hardware' : product.type}
                                label={product.type === 'trading' ? 'Hardware' : 'Baked'}
                            />
                        </DataTableCell>
                        <DataTableCell>{product.category || '—'}</DataTableCell>
                        <DataTableCell>{product.unit_of_measure}</DataTableCell>
                        <DataTableCell>
                            {product.unit_cost ? <Money amount={product.unit_cost} /> : '—'}
                        </DataTableCell>
                        <DataTableCell>
                            {product.retail_price != null ? <Money amount={product.retail_price} /> : '—'}
                        </DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
                        </DataTableCell>
                        <DataTableCell>
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    component={Link}
                                    href={route('tenant.products.show', product.id)}
                                    size="small"
                                >
                                    Edit
                                </Button>
                                <ConfirmButton
                                    size="small"
                                    variant="danger"
                                    confirmTitle="Delete product"
                                    confirmMessage={`Delete ${product.name}? Past sales stay on record.`}
                                    onConfirm={() =>
                                        router.delete(route('tenant.products.destroy', product.id), {
                                            preserveScroll: true,
                                        })
                                    }
                                >
                                    Delete
                                </ConfirmButton>
                            </Stack>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={products.links} />
        </TenantLayout>
    );
}
