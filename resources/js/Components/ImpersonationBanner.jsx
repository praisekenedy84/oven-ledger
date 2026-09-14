import { colors } from '@/theme/bakeryTheme';
import { Alert, Button } from '@mui/material';
import { router, usePage } from '@inertiajs/react';

export default function ImpersonationBanner() {
    const { impersonation } = usePage().props;

    if (!impersonation) {
        return null;
    }

    const who = impersonation.user_name || impersonation.user_email || 'a tenant user';
    const bakery = impersonation.tenant_name || 'this bakery';

    return (
        <Alert
            severity="warning"
            sx={{
                borderRadius: 0,
                bgcolor: colors.butter,
                color: colors.ink,
                '& .MuiAlert-icon': { color: colors.ink },
            }}
            action={
                <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={() => router.post(route('impersonation.stop'))}
                    sx={{
                        borderColor: colors.ink,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Stop
                </Button>
            }
        >
            Viewing as <strong>{who}</strong> at {bakery}. Actions you take are attributed to this
            account.
        </Alert>
    );
}
