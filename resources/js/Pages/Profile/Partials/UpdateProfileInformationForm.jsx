import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        username: user.username ?? '',
        email: user.email,
    });

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Update your account&apos;s name, username, and email address.
                </p>
            </div>

            <form
                className="space-y-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    patch(route('profile.update'));
                }}
            >
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="username" value="Username" />
                    <TextInput
                        id="username"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError message={errors.username} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="email"
                    />
                    <InputError message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-sm text-foreground">
                            Your email address is unverified.{' '}
                            <Button variant="link" className="h-auto p-0" asChild>
                                <Link href={route('verification.send')} method="post" as="button">
                                    Click here to re-send the verification email.
                                </Link>
                            </Button>
                        </p>

                        {status === 'verification-link-sent' && (
                            <Alert variant="success" className="mt-2">
                                A new verification link has been sent to your email address.
                            </Alert>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton type="submit" disabled={processing}>
                        Save
                    </PrimaryButton>
                    {recentlySuccessful && (
                        <p className="text-sm text-muted-foreground">Saved.</p>
                    )}
                </div>
            </form>
        </div>
    );
}
