import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Stack, Typography } from '@mui/material';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is a secure area of the application. Please confirm your password before
                continuing.
            </Typography>

            <Stack
                component="form"
                spacing={2.5}
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('password.confirm'), {
                        onFinish: () => reset('password'),
                    });
                }}
            >
                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        value={data.password}
                        isFocused
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <PrimaryButton type="submit" disabled={processing}>
                    Confirm
                </PrimaryButton>
            </Stack>
        </GuestLayout>
    );
}
