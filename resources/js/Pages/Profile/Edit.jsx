import PageHeader from '@/Components/PageHeader';
import { Alert } from '@/Components/ui/alert';
import { Card } from '@/Components/ui/card';
import TenantLayout from '@/Layouts/TenantLayout';
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

            <div className="max-w-[720px] space-y-6">
                {impersonation && (
                    <Alert variant="warning">
                        Account details cannot be changed while impersonating. Stop impersonation
                        first.
                    </Alert>
                )}

                <Card className="p-6">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </Card>

                {!impersonation && (
                    <Card className="p-6">
                        <UpdatePasswordForm />
                    </Card>
                )}

                {!impersonation && (
                    <Card className="p-6">
                        <DeleteUserForm />
                    </Card>
                )}
            </div>
        </TenantLayout>
    );
}
