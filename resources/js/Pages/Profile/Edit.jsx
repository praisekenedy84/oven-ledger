import PageHeader from '@/Components/PageHeader';
import TenantLayout from '@/Layouts/TenantLayout';
import { Alert, Paper, Stack } from '@mui/material';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { impersonation } = usePage().props;

    return (
        <TenantLayout title="Profile">
            <Head title="Profile" />

            <PageHeader
                title="Profile"
                description="Manage your account details and security."
            />

            <Stack spacing={3} sx={{ maxWidth: 720 }}>
                {impersonation && (
                    <Alert severity="warning">
                        Account details cannot be changed while impersonating. Stop impersonation
                        first.
                    </Alert>
                )}

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </Paper>

                {!impersonation && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                        <UpdatePasswordForm />
                    </Paper>
                )}

                {!impersonation && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                        <DeleteUserForm />
                    </Paper>
                )}
            </Stack>
        </TenantLayout>
    );
}
