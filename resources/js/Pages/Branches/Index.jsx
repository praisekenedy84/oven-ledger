import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { colors } from '@/theme/bakeryTheme';
import { Alert, Box, Paper } from '@mui/material';
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
                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('tenant.branches.store'), {
                            onSuccess: () => form.reset(),
                        });
                    }}
                    variant="outlined"
                    sx={{
                        mb: 3,
                        p: 3,
                        borderRadius: 3,
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                    }}
                >
                    <Box>
                        <InputLabel value="Branch name" />
                        <TextInput
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        <InputError message={form.errors.name} />
                    </Box>
                    <Box>
                        <InputLabel value="Address" />
                        <TextInput
                            value={form.data.address}
                            onChange={(e) => form.setData('address', e.target.value)}
                        />
                    </Box>
                    <Box>
                        <InputLabel value="Phone" />
                        <TextInput
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <PrimaryButton type="submit" disabled={form.processing}>
                            Add branch
                        </PrimaryButton>
                    </Box>
                </Paper>
            )}

            {!canAdd && (
                <Alert
                    severity="warning"
                    sx={{
                        mb: 3,
                        bgcolor: `${colors.warning}14`,
                        color: colors.charcoal,
                        border: `1px solid ${colors.warning}4d`,
                    }}
                >
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
                        <DataTableCell sx={{ fontWeight: 600 }}>{branch.name}</DataTableCell>
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
