import ApplicationLogo from '@/Components/ApplicationLogo';
import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import { colors } from '@/theme/bakeryTheme';
import { isRouteActive, resolveNavIcon, userInitials } from '@/theme/nav';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import {
    AppBar,
    Avatar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const DRAWER_WIDTH = 240;

const NAV = [
    { label: 'Dashboard', route: 'platform.dashboard' },
    { label: 'Tenants', route: 'platform.tenants.index' },
    { label: 'Roles', route: 'platform.roles.index' },
    { label: 'Audit Log', route: 'platform.audit.index' },
];

export default function PlatformLayout({ title, children }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const { auth } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const navItems = NAV.filter(
        (item) =>
            item.route !== 'platform.roles.index' ||
            (auth.permissions ?? []).includes('roles.manage'),
    );

    const drawer = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: colors.ink,
                color: colors.cream,
            }}
        >
            <Box
                sx={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <Box sx={{ color: colors.cream }}>
                    <ApplicationLogo />
                </Box>
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
                {navItems.map((item) => {
                    const active = isRouteActive(item.route);
                    const Icon = resolveNavIcon(item.route);
                    return (
                        <ListItemButton
                            key={item.route}
                            component={Link}
                            href={route(item.route)}
                            onClick={() => setMobileOpen(false)}
                            sx={{
                                mb: 0.5,
                                color: active ? colors.cream : colors.wheatLight,
                                bgcolor: active ? colors.jam : 'transparent',
                                '&:hover': {
                                    bgcolor: active ? colors.jam : 'rgba(251,246,234,0.08)',
                                    color: colors.cream,
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                                <Icon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            fontSize: 12,
                            bgcolor: colors.butter,
                            color: colors.ink,
                            fontWeight: 700,
                        }}
                    >
                        {userInitials(auth.user?.name)}
                    </Avatar>
                    <Typography variant="caption" sx={{ color: colors.wheatLight }} noWrap>
                        {auth.user?.name}
                    </Typography>
                </Box>
                <ListItemButton
                    onClick={() => router.post(route('platform.logout'))}
                    sx={{
                        color: colors.wheatLight,
                        px: 1,
                        '&:hover': { bgcolor: 'rgba(251,246,234,0.08)', color: colors.cream },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Log out" primaryTypographyProps={{ fontSize: 14 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <FlashMessage />
            <BuildUpdatePrompt />

            <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', lg: 'none' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                }}
            >
                <AppBar position="sticky">
                    <Toolbar sx={{ gap: 1.5, minHeight: 64 }}>
                        {!isDesktop && (
                            <IconButton
                                edge="start"
                                onClick={() => setMobileOpen(true)}
                                sx={{ color: colors.ink }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Typography variant="h6" sx={{ flex: 1 }}>
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

                <Box component="main" sx={{ flex: 1, p: { xs: 2, lg: 3 } }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
