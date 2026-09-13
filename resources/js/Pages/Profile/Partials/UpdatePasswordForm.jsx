import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Stack, Typography } from '@mui/material';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <Stack spacing={2}>
            <div>
                <Typography variant="h6" fontWeight={700}>
                    Update Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Ensure your account is using a long, random password to stay secure.
                </Typography>
            </div>

            <Stack
                component="form"
                spacing={2.5}
                onSubmit={(e) => {
                    e.preventDefault();
                    put(route('password.update'), {
                        preserveScroll: true,
                        onSuccess: () => reset(),
                        onError: (formErrors) => {
                            if (formErrors.password) {
                                reset('password', 'password_confirmation');
                                passwordInput.current?.focus();
                            }
                            if (formErrors.current_password) {
                                reset('current_password');
                                currentPasswordInput.current?.focus();
                            }
                        },
                    });
                }}
            >
                <div>
                    <InputLabel htmlFor="current_password" value="Current Password" />
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        autoComplete="current-password"
                    />
                    <InputError message={errors.current_password} />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

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
