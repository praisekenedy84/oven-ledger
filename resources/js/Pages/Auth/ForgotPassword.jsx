import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Alert } from '@/Components/ui/alert';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <p className="mb-4 text-sm text-muted-foreground">
                Forgot your password? No problem. Just let us know your email address and we will
                email you a password reset link that will allow you to choose a new one.
            </p>

            {status && (
                <Alert variant="success" className="mb-4">
                    {status}
                </Alert>
            )}

            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('password.email'));
                }}
            >
                <div>
                    <TextInput
                        id="email"
                        type="email"
                        value={data.email}
                        isFocused
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <PrimaryButton type="submit" disabled={processing}>
                    Email Password Reset Link
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
