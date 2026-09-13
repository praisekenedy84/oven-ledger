import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import TenantLayout from '@/Layouts/TenantLayout';
import { Button } from '@mui/material';
import { Head, Link } from '@inertiajs/react';

export default function Index({ products }) {
    return (
        <TenantLayout title="Products">
            <Head title="Products" />

            <PageHeader
                title="Products"
                description="Produced goods and trading items in your catalog."
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
                    { label: 'Status' },
                    { label: '' },
                ]}
            >
                {products.data.map((product) => (
                    <DataTableRow key={product.id}>
                        <DataTableCell sx={{ fontWeight: 600 }}>{product.name}</DataTableCell>
                        <DataTableCell><StatusBadge status={product.type} /></DataTableCell>
                        <DataTableCell>{product.category || '—'}</DataTableCell>
                        <DataTableCell>{product.unit_of_measure}</DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
                        </DataTableCell>
                        <DataTableCell>
                            <Button
                                component={Link}
                                href={route('tenant.products.show', product.id)}
                                size="small"
                            >
                                View
                            </Button>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={products.links} />
        </TenantLayout>
    );
}
