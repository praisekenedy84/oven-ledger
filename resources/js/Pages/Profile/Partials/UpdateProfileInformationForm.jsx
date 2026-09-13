import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    return (
        <Stack spacing={2}>
            <div>
                <Typography variant="h6" fontWeight={700}>
                    Profile Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Update your account&apos;s profile information and email address.
                </Typography>
            </div>

            <Stack
                component="form"
                spacing={2.5}
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
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <Typography variant="body2">
                            Your email address is unverified.{' '}
                            <Button
                                component={Link}
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                size="small"
                                sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }}
                            >
                                Click here to re-send the verification email.
                            </Button>
                        </Typography>

                        {status === 'verification-link-sent' && (
                            <Alert severity="success" sx={{ mt: 1 }}>
                                A new verification link has been sent to your email address.
                            </Alert>
                        )}
                    </div>
                )}

                <Stack direction="row" alignItems="center" spacing={2}>
                    <PrimaryButton type="submit" disabled={processing}>
                        Save
                    </PrimaryButton>
                    {recentlySuccessful && (
                        <Typography variant="body2" color="text.secondary">
                            Saved.
                        </Typography>
                    )}
                </Stack>
            </Stack>
        </Stack>
    );
}
