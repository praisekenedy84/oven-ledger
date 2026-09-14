import AppSidebar from '@/Components/AppSidebar';
import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import { colors, layout } from '@/theme/bakeryTheme';
import { resolveNavIcon } from '@/theme/nav';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const NAV = [
    { label: 'Dashboard', route: 'platform.dashboard' },
    { label: 'Tenants', route: 'platform.tenants.index' },
    { label: 'Roles', route: 'platform.roles.index' },
    { label: 'Audit Log', route: 'platform.audit.index' },
];

export default function PlatformLayout({ title, children }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const { auth } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = useMemo(
        () =>
            NAV.filter(
                (item) =>
                    item.route !== 'platform.roles.index' ||
                    (auth.permissions ?? []).includes('roles.manage'),
            ).map((item) => ({
                key: item.route,
                label: item.label,
                route_name: item.route,
                href: route(item.route),
                children: [],
                Icon: resolveNavIcon(item.route),
            })),
        [auth.permissions],
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <ImpersonationBanner />
            <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <FlashMessage />
            <BuildUpdatePrompt />

            <AppSidebar
                navItems={navItems}
                userName={auth.user?.name}
                onLogout={() => router.post(route('platform.logout'))}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}
            >
                <AppBar position="sticky">
                    <Toolbar sx={{ gap: 2, minHeight: layout.headerHeight }}>
                        {!isDesktop && (
                            <IconButton
                                edge="start"
                                onClick={() => setMobileOpen(true)}
                                sx={{ color: colors.ink }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Typography variant="h6" noWrap sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                            {title}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: { xs: 'none', sm: 'block' } }}
                        >
                            Platform Admin
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Box component="main" sx={{ flex: 1, p: layout.pageGutter }}>
                    {children}
                </Box>
            </Box>
            </Box>
        </Box>
    );
}
