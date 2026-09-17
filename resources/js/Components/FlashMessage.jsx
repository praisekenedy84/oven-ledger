import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export default function FlashMessage() {
    const { flash } = usePage().props;
    const last = useRef(null);
    const message = flash?.success || flash?.error || flash?.status;

    useEffect(() => {
        if (!message || message === last.current) {
            return;
        }
        last.current = message;
        if (flash?.error) {
            toast.error(message);
        } else {
            toast.success(message);
        }
    }, [message, flash?.error]);

    return null;
}
