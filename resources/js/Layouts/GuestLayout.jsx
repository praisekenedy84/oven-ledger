import ApplicationLogo from '@/Components/ApplicationLogo';
import TicketPanel from '@/Components/TicketPanel';
import { colors } from '@/theme/bakeryTheme';
import { Box, Typography } from '@mui/material';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, variant = 'tenant' }) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(360px, 480px)' },
                bgcolor: colors.kraft,
            }}
        >
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: 6,
                    position: 'relative',
                    backgroundImage: 'url(/images/bakery/login.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: colors.cream,
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg, rgba(51,38,28,0.15) 0%, rgba(51,38,28,0.72) 100%)',
                    }}
                />
                <Box sx={{ position: 'relative', maxWidth: 420 }}>
                    <Typography variant="overline" sx={{ color: colors.butter }}>
                        {variant === 'platform' ? 'Platform' : 'Bakery ledger'}
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 1, color: colors.cream }}>
                        The morning board, kept in one book.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(251,246,234,0.78)', maxWidth: 360 }}>
                        Production, stock, and the ticket at the counter — without the generic SaaS glow.
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 2, sm: 4 },
                    py: 6,
                }}
            >
                <Box sx={{ mb: 3, color: colors.ink }}>
                    <Link href="/">
                        <ApplicationLogo />
                    </Link>
                </Box>

                <TicketPanel
                    sx={{
                        width: '100%',
                        maxWidth: 420,
                        px: { xs: 2.5, sm: 3.5 },
                        py: { xs: 3, sm: 4 },
                    }}
                >
                    {variant === 'platform' && (
                        <Typography
                            variant="overline"
                            sx={{ display: 'block', mb: 2, textAlign: 'center', color: colors.jam }}
                        >
                            Platform admin
                        </Typography>
                    )}
                    {children}
                </TicketPanel>
            </Box>
        </Box>
    );
}
