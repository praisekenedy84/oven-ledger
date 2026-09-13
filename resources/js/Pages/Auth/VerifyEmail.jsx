import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Thanks for signing up! Before getting started, could you verify your email address
                by clicking on the link we just emailed to you? If you didn&apos;t receive the
                email, we will gladly send you another.
            </Typography>

            {status === 'verification-link-sent' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    A new verification link has been sent to the email address you provided during
                    registration.
                </Alert>
            )}

            <Stack
                component="form"
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('verification.send'));
                }}
            >
                <PrimaryButton type="submit" disabled={processing}>
                    Resend Verification Email
                </PrimaryButton>

                <Button component={Link} href={route('logout')} method="post" as="button">
                    Log Out
                </Button>
            </Stack>
        </GuestLayout>
    );
}
