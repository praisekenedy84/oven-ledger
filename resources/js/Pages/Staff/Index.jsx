import Checkbox from '@/Components/Checkbox';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Box,
    FormControl,
    FormGroup,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, useForm } from '@inertiajs/react';

export default function Index({ staff, roles, branches }) {
    const form = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role_id: roles[0]?.id ?? '',
        branch_ids: [],
    });

    const toggleBranch = (branchId) => {
        const ids = form.data.branch_ids.includes(branchId)
            ? form.data.branch_ids.filter((id) => id !== branchId)
            : [...form.data.branch_ids, branchId];
        form.setData('branch_ids', ids);
    };

    return (
        <TenantLayout title="Staff">
            <Head title="Staff" />

            <PageHeader
                title="Staff"
                description="Team members, roles, and branch assignments."
            />

            <Paper
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('tenant.staff.store'), {
                        onSuccess: () => form.reset('name', 'username', 'email', 'password'),
                    });
                }}
                variant="outlined"
                sx={{ mb: 3, p: 3, borderRadius: 1 }}
            >
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Add staff member
                </Typography>
                <Stack spacing={2}>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
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
                            <InputLabel value="Username" />
                            <TextInput
                                value={form.data.username}
                                autoComplete="username"
                                onChange={(e) => form.setData('username', e.target.value)}
                            />
                            <InputError message={form.errors.username} />
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
                            <InputLabel value="Password" />
                            <TextInput
                                type="password"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                            />
                            <InputError message={form.errors.password} />
                        </Box>
                        <Box>
                            <InputLabel value="Role" />
                            <FormControl fullWidth size="small">
                                <Select
                                    value={form.data.role_id}
                                    onChange={(e) => form.setData('role_id', e.target.value)}
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role.id} value={role.id}>
                                            {role.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {branches.length > 0 && (
                        <Box>
                            <InputLabel value="Assigned branches" />
                            <FormGroup row sx={{ gap: 1, mt: 0.5 }}>
                                {branches.map((branch) => (
                                    <Checkbox
                                        key={branch.id}
                                        checked={form.data.branch_ids.includes(branch.id)}
                                        onChange={() => toggleBranch(branch.id)}
                                        label={branch.name}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                    )}

                    <PrimaryButton type="submit" disabled={form.processing}>
                        Add staff
                    </PrimaryButton>
                </Stack>
            </Paper>

            <DataTable
                columns={[
                    { label: 'Name' },
                    { label: 'Username' },
                    { label: 'Email' },
                    { label: 'Role' },
                    { label: 'Branches' },
                ]}
            >
                {staff.data.map((member) => (
                    <DataTableRow key={member.id}>
                        <DataTableCell sx={{ fontWeight: 600 }}>{member.name}</DataTableCell>
                        <DataTableCell>{member.username}</DataTableCell>
                        <DataTableCell>{member.email}</DataTableCell>
                        <DataTableCell>
                            {member.user_roles?.[0]?.role?.name ?? 'â€”'}
                        </DataTableCell>
                        <DataTableCell>
                            {member.branches?.map((b) => b.name).join(', ') || 'All'}
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={staff.links} />
        </TenantLayout>
    );
}
