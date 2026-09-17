import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { router, usePage } from '@inertiajs/react';

export default function ImpersonationBanner() {
    const { impersonation } = usePage().props;

    if (!impersonation) {
        return null;
    }

    const who = impersonation.user_name || impersonation.user_email || 'a tenant user';
    const bakery = impersonation.tenant_name || 'this bakery';

    return (
        <Alert variant="warning" className="flex items-center justify-between gap-4 rounded-none border-x-0 border-t-0">
            <AlertDescription>
                Viewing as <strong>{who}</strong> at {bakery}. Actions you take are attributed to this
                account.
            </AlertDescription>
            <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-ink font-bold text-ink hover:bg-ink/5"
                onClick={() => router.post(route('impersonation.stop'))}
            >
                Stop
            </Button>
        </Alert>
    );
}
