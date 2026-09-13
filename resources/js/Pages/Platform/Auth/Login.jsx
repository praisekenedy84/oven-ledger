import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { colors } from '@/theme/bakeryTheme';
import { Alert, Stack, Typography } from '@mui/material';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    return (
        <GuestLayout variant="platform">
            <Head title="Platform Login" />

            <Typography variant="h4" sx={{ mb: 0.5 }}>
                Platform sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Tenant health, flags, and the audit trail.
            </Typography>

            {status && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            <Stack
                component="form"
                spacing={2.5}
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('platform.login'), {
                        onFinish: () => reset('password'),
                    });
                }}
            >
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        value={data.email}
                        autoComplete="username"
                        isFocused
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <Checkbox
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                    label="Remember me"
                />

                <PrimaryButton type="submit" fullWidth disabled={processing}>
                    Enter the console
                </PrimaryButton>
            </Stack>

            <Typography
                variant="caption"
                sx={{ display: 'block', mt: 3, textAlign: 'center', color: colors.muted }}
            >
                Platform administrators only.
            </Typography>
        </GuestLayout>
    );
}
