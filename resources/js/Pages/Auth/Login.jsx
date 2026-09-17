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
        login: '',
        password: '',
        remember: false,
    });

    return (
        <GuestLayout>
            <Head title="Log in" />

            <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">The morning board is waiting.</p>

            {status && (
                <Alert variant="success" className="mb-4">
                    {status}
                </Alert>
            )}

            <form
                className="space-y-5"
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
                    <p className="mt-1 text-xs text-muted-foreground">
                        Use the username set when the account was created, or the email.
                    </p>
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
            </form>

            <p className="mt-6 block text-center text-xs text-muted-foreground">
                Staff accounts only. Ask the owner if you need a seat.
            </p>
        </GuestLayout>
    );
}
