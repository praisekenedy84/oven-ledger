import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import TenantLayout from '@/Layouts/TenantLayout';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { Head, Link, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
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
                    <Button asChild>
                        <Link href={route('tenant.products.create')}>Add product</Link>
                    </Button>
                }
            />

            <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-[420px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <TextInput
                        placeholder="Search by name, category, type, or unit…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {search ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Clear product search"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                            onClick={() => {
                                setSearch('');
                                applyFilters({ search: '' });
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    ) : null}
                </div>
            </div>

            {activeSearch !== '' && (
                <p className="mb-3 text-sm text-muted-foreground">
                    Showing products matching “{activeSearch}”.
                </p>
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
                        <DataTableCell className="font-semibold">{product.name}</DataTableCell>
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
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={route('tenant.products.show', product.id)}>Edit</Link>
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
                            </div>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={products.links} />
        </TenantLayout>
    );
}
