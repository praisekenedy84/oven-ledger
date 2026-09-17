import Checkbox from '@/Components/Checkbox';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
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

            <SurfaceCard className="mb-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('tenant.staff.store'), {
                            onSuccess: () => form.reset('name', 'username', 'email', 'password'),
                        });
                    }}
                    className="flex flex-col gap-4"
                >
                    <p className="text-base font-bold">Add staff member</p>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                            <InputLabel value="Name" />
                            <TextInput
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div>
                            <InputLabel value="Username" />
                            <TextInput
                                value={form.data.username}
                                autoComplete="username"
                                onChange={(e) => form.setData('username', e.target.value)}
                            />
                            <InputError message={form.errors.username} />
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
                            <InputLabel value="Password" />
                            <TextInput
                                type="password"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                            />
                            <InputError message={form.errors.password} />
                        </div>
                        <div>
                            <InputLabel value="Role" />
                            <Select
                                value={String(form.data.role_id)}
                                onValueChange={(value) => form.setData('role_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={String(role.id)}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {branches.length > 0 && (
                        <div>
                            <InputLabel value="Assigned branches" />
                            <div className="mt-1 flex flex-row flex-wrap gap-2">
                                {branches.map((branch) => (
                                    <Checkbox
                                        key={branch.id}
                                        checked={form.data.branch_ids.includes(branch.id)}
                                        onChange={() => toggleBranch(branch.id)}
                                        label={branch.name}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <PrimaryButton type="submit" disabled={form.processing}>
                        Add staff
                    </PrimaryButton>
                </form>
            </SurfaceCard>

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
                        <DataTableCell className="font-semibold">{member.name}</DataTableCell>
                        <DataTableCell>{member.username}</DataTableCell>
                        <DataTableCell>{member.email}</DataTableCell>
                        <DataTableCell>
                            {member.user_roles?.[0]?.role?.name ?? '—'}
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
