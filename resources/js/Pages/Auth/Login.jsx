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
        login: '',
        password: '',
        remember: false,
    });

    return (
        <GuestLayout>
            <Head title="Log in" />

            <Typography variant="h4" sx={{ mb: 0.5 }}>
                Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The morning board is waiting.
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
                    post(route('login'), { onFinish: () => reset('password') });
                }}
            >
                <div>
                    <InputLabel htmlFor="login" value="Email or username" />
                    <TextInput
                        id="login"
                        type="text"
                        value={data.login}
                        autoComplete="username"
                        isFocused
                        onChange={(e) => setData('login', e.target.value)}
                    />
                    <InputError message={errors.login ?? errors.email} />
                    <Typography variant="caption" color="text.secondary">
                        Use the username set when the account was created, or the email.
                    </Typography>
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
                    Enter the bakery
                </PrimaryButton>
            </Stack>

            <Typography
                variant="caption"
                sx={{ display: 'block', mt: 3, textAlign: 'center', color: colors.muted }}
            >
                Staff accounts only. Ask the owner if you need a seat.
            </Typography>
        </GuestLayout>
    );
}
