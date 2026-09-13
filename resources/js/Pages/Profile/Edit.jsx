import PageHeader from '@/Components/PageHeader';
import TenantLayout from '@/Layouts/TenantLayout';
import { Paper, Stack } from '@mui/material';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <TenantLayout title="Profile">
            <Head title="Profile" />

            <PageHeader
                title="Profile"
                description="Manage your account details and security."
            />

            <Stack spacing={3} sx={{ maxWidth: 720 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </Paper>

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <UpdatePasswordForm />
                </Paper>

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <DeleteUserForm />
                </Paper>
            </Stack>
        </TenantLayout>
    );
}
