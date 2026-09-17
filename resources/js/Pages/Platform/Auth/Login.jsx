import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Alert } from '@/Components/ui/alert';
import GuestLayout from '@/Layouts/GuestLayout';
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

            <h1 className="text-2xl font-semibold text-foreground">Platform sign in</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
                Tenant health, flags, and the audit trail.
            </p>

            {status && (
                <Alert variant="success" className="mb-4">
                    {status}
                </Alert>
            )}

            <form
                className="space-y-5"
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
            </form>

            <p className="mt-6 block text-center text-xs text-muted-foreground">
                Platform administrators only.
            </p>
        </GuestLayout>
    );
}
