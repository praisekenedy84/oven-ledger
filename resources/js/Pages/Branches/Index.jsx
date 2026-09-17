import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Alert } from '@/Components/ui/alert';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Index({ branches, maxBranches, branchCount }) {
    const form = useForm({
        name: '',
        address: '',
        phone: '',
    });

    const canAdd = branchCount < maxBranches;

    return (
        <TenantLayout title="Branches">
            <Head title="Branches" />

            <PageHeader
                title="Branches"
                description={`${branchCount} of ${maxBranches} branches used.`}
            />

            {canAdd && (
                <SurfaceCard className="mb-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post(route('tenant.branches.store'), {
                                onSuccess: () => form.reset(),
                            });
                        }}
                        className="grid gap-4 lg:grid-cols-3"
                    >
                        <div>
                            <InputLabel value="Branch name" />
                            <TextInput
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div>
                            <InputLabel value="Address" />
                            <TextInput
                                value={form.data.address}
                                onChange={(e) => form.setData('address', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel value="Phone" />
                            <TextInput
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <PrimaryButton type="submit" disabled={form.processing}>
                                Add branch
                            </PrimaryButton>
                        </div>
                    </form>
                </SurfaceCard>
            )}

            {!canAdd && (
                <Alert variant="warning" className="mb-6">
                    Branch limit reached. Contact platform support to increase your allowance.
                </Alert>
            )}

            <DataTable
                columns={[
                    { label: 'Name' },
                    { label: 'Address' },
                    { label: 'Phone' },
                    { label: 'Status' },
                ]}
            >
                {branches.map((branch) => (
                    <DataTableRow key={branch.id}>
                        <DataTableCell className="font-semibold">{branch.name}</DataTableCell>
                        <DataTableCell>{branch.address || '—'}</DataTableCell>
                        <DataTableCell>{branch.phone || '—'}</DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={branch.is_active ? 'active' : 'inactive'} />
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
        </TenantLayout>
    );
}
