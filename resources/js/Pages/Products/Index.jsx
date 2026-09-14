import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import TenantLayout from '@/Layouts/TenantLayout';
import { Button, Stack } from '@mui/material';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ products }) {
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
