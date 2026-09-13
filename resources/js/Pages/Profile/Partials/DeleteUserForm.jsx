import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Box, Stack, Typography } from '@mui/material';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm() {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <Stack spacing={2}>
            <div>
                <Typography variant="h6" fontWeight={700}>
                    Delete Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Once your account is deleted, all of its resources and data will be permanently
                    deleted. Before deleting your account, please download any data or information
                    that you wish to retain.
                </Typography>
            </div>

            <DangerButton onClick={() => setConfirmingUserDeletion(true)}>
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <Box
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        destroy(route('profile.destroy'), {
                            preserveScroll: true,
                            onSuccess: () => closeModal(),
                            onError: () => passwordInput.current?.focus(),
                            onFinish: () => reset(),
                        });
                    }}
                    sx={{ p: 3 }}
                >
                    <Typography variant="h6" fontWeight={700}>
                        Are you sure you want to delete your account?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Once your account is deleted, all of its resources and data will be
                        permanently deleted. Please enter your password to confirm you would like to
                        permanently delete your account.
                    </Typography>

                    <Box sx={{ mt: 3 }}>
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            isFocused
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </Box>

                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <DangerButton type="submit" disabled={processing}>
                            Delete Account
                        </DangerButton>
                    </Stack>
                </Box>
            </Modal>
        </Stack>
    );
}
