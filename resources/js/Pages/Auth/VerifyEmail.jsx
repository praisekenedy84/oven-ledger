import PrimaryButton from '@/Components/PrimaryButton';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <p className="mb-4 text-sm text-muted-foreground">
                Thanks for signing up! Before getting started, could you verify your email address
                by clicking on the link we just emailed to you? If you didn&apos;t receive the
                email, we will gladly send you another.
            </p>

            {status === 'verification-link-sent' && (
                <Alert variant="success" className="mb-4">
                    A new verification link has been sent to the email address you provided during
                    registration.
                </Alert>
            )}

            <form
                className="flex items-center justify-between gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('verification.send'));
                }}
            >
                <PrimaryButton type="submit" disabled={processing}>
                    Resend Verification Email
                </PrimaryButton>

                <Button variant="ghost" asChild>
                    <Link href={route('logout')} method="post" as="button">
                        Log Out
                    </Link>
                </Button>
            </form>
        </GuestLayout>
    );
}
