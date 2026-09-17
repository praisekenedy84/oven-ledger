import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
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
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Delete Account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Once your account is deleted, all of its resources and data will be permanently
                    deleted. Before deleting your account, please download any data or information
                    that you wish to retain.
                </p>
            </div>

            <DangerButton onClick={() => setConfirmingUserDeletion(true)}>
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form
                    className="p-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        destroy(route('profile.destroy'), {
                            preserveScroll: true,
                            onSuccess: () => closeModal(),
                            onError: () => passwordInput.current?.focus(),
                            onFinish: () => reset(),
                        });
                    }}
                >
                    <h3 className="text-lg font-semibold text-foreground">
                        Are you sure you want to delete your account?
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Once your account is deleted, all of its resources and data will be
                        permanently deleted. Please enter your password to confirm you would like to
                        permanently delete your account.
                    </p>

                    <div className="mt-6">
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
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <DangerButton type="submit" disabled={processing}>
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
