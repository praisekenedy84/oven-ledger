import ApplicationLogo from '@/Components/ApplicationLogo';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ canLogin }) {
    return (
        <>
            <Head title="Oven Ledger" />

            <Box
                sx={{
                    position: 'relative',
                    minHeight: '100vh',
                    overflow: 'hidden',
                    bgcolor: colors.ink,
                    color: colors.cream,
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'url(/images/bakery/login.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.35,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg, rgba(51,38,28,0.35) 0%, rgba(51,38,28,0.88) 100%)',
                    }}
                />

                <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                    sx={{
                        position: 'relative',
                        minHeight: '100vh',
                        px: 3,
                        py: 8,
                        textAlign: 'center',
                    }}
                >
                    <Box sx={{ color: colors.cream }}>
                        <ApplicationLogo showText />
                    </Box>

                    <Typography variant="h3" sx={{ maxWidth: 560, color: colors.cream }}>
                        The bakery’s book, kept warm.
                    </Typography>

                    <Typography variant="body1" sx={{ maxWidth: 440, color: 'rgba(251,246,234,0.75)' }}>
                        Production, inventory, and multi-channel sales — retail, wholesale,
                        restaurant, and the tools shelf — in one ledger.
                    </Typography>

                    {canLogin && (
                        <Stack
                            direction="row"
                            spacing={1.5}
                            useFlexGap
                            flexWrap="wrap"
                            justifyContent="center"
                            sx={{ pt: 2 }}
                        >
                            <Button
                                component={Link}
                                href={route('login')}
                                variant="contained"
                                color="primary"
                                size="large"
                                sx={{ px: 4 }}
                            >
                                Bakery sign in
                            </Button>
                            <Button
                                component={Link}
                                href={route('platform.login')}
                                variant="outlined"
                                size="large"
                                sx={{
                                    px: 4,
                                    color: colors.cream,
                                    borderColor: 'rgba(251,246,234,0.35)',
                                    '&:hover': {
                                        borderColor: colors.cream,
                                        bgcolor: 'rgba(251,246,234,0.08)',
                                    },
                                }}
                            >
                                Platform admin
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Box>
        </>
    );
}
