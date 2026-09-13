import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Alert, Stack, Typography } from '@mui/material';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Forgot your password? No problem. Just let us know your email address and we will
                email you a password reset link that will allow you to choose a new one.
            </Typography>

            {status && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            <Stack
                component="form"
                spacing={2}
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
            </Stack>
        </GuestLayout>
    );
}
