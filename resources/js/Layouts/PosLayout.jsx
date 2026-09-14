import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import { colors } from '@/theme/bakeryTheme';
import {
    flattenMenuLeaves,
    isRouteActive,
    resolveNavIcon,
    safeRoute,
    userInitials,
} from '@/theme/nav';
import LogoutIcon from '@mui/icons-material/Logout';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { Avatar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

function NavIconButton({ item, placement = 'right' }) {
    const active = isRouteActive(item.route_name);
    const Icon = item.Icon;

    return (
        <Tooltip title={item.label} placement={placement}>
            <IconButton
                component={Link}
                href={item.href}
                prefetch
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    color: active ? colors.cream : colors.wheatLight,
                    bgcolor: active ? colors.jam : 'transparent',
                    '&:hover': {
                        bgcolor: active ? colors.jam : 'rgba(251,246,234,0.08)',
                        color: colors.cream,
                    },
                }}
            >
                <Icon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
}

export default function PosLayout({ children }) {
    const { auth, menuItems } = usePage().props;
    const [moreOpen, setMoreOpen] = useState(false);

    const navItems = flattenMenuLeaves(menuItems ?? [])
        .map((item) => ({
            ...item,
            href: safeRoute(item.route_name),
            Icon: resolveNavIcon(item.route_name, item.key),
        }))
        .filter((item) => item.href);

    const primaryNav = navItems.slice(0, 4);
    const extraNav = navItems.slice(4);
    const profileHref = safeRoute('profile.edit');

    const rail = (
        <>
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: colors.jam,
                    color: colors.cream,
                    mb: { md: 2.5 },
                }}
            >
                <StorefrontOutlinedIcon />
            </Box>

            <Stack
                spacing={0.75}
                sx={{
                    flex: 1,
                    width: '100%',
                    alignItems: 'center',
                    overflowY: 'auto',
                }}
            >
                {navItems.map((item) => (
                    <NavIconButton key={item.key} item={item} />
                ))}
            </Stack>

            <Stack spacing={0.75} sx={{ width: '100%', alignItems: 'center' }}>
                <Tooltip title="Settings" placement="right">
                    <span>
                        <IconButton
                            disabled={!profileHref}
                            component={profileHref ? Link : 'button'}
                            href={profileHref || undefined}
                            prefetch={Boolean(profileHref)}
                            sx={{ color: colors.wheatLight }}
                        >
                            <SettingsOutlinedIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Avatar
                    sx={{
                        width: 36,
                        height: 36,
                        fontSize: 13,
                        bgcolor: colors.butter,
                        color: colors.ink,
                        fontWeight: 700,
                    }}
                >
                    {userInitials(auth.user?.name)}
                </Avatar>
                <Tooltip title="Log out" placement="right">
                    <IconButton
                        onClick={() => router.post(route('logout'))}
                        sx={{ color: colors.wheatLight }}
                    >
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </>
    );

    return (
        <>
            <ImpersonationBanner />
            <FlashMessage />
            <BuildUpdatePrompt />

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    minHeight: '100dvh',
                    bgcolor: colors.kraft,
                }}
            >
                <Box
                    component="aside"
                    sx={{
                        width: 72,
                        flexShrink: 0,
                        display: { xs: 'none', md: 'flex' },
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 2,
                        px: 1,
                        bgcolor: colors.ink,
                        color: colors.cream,
                    }}
                >
                    {rail}
                </Box>

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: { xs: 0, md: '100dvh' },
                        overflow: { xs: 'visible', md: 'hidden' },
                        pb: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 0 },
                    }}
                >
                    {children}
                </Box>

                <Box
                    component="nav"
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1300,
                        height: 'calc(64px + env(safe-area-inset-bottom))',
                        pb: 'env(safe-area-inset-bottom)',
                        px: 0.5,
                        bgcolor: colors.ink,
                        color: colors.cream,
                        alignItems: 'center',
                        justifyContent: 'space-around',
                    }}
                >
                    {primaryNav.map((item) => (
                        <NavIconButton key={item.key} item={item} placement="top" />
                    ))}
                    <Tooltip title="More" placement="top">
                        <IconButton
                            onClick={() => setMoreOpen(true)}
                            sx={{
                                width: 44,
                                height: 44,
                                color: colors.wheatLight,
                            }}
                        >
                            <MoreHorizIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Drawer
                    anchor="bottom"
                    open={moreOpen}
                    onClose={() => setMoreOpen(false)}
                    sx={{ display: { md: 'none' } }}
                    PaperProps={{
                        sx: {
                            borderRadius: '16px 16px 0 0',
                            bgcolor: colors.ink,
                            color: colors.cream,
                            pb: 'env(safe-area-inset-bottom)',
                        },
                    }}
                >
                    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                        <Typography variant="overline" sx={{ color: colors.butter }}>
                            More
                        </Typography>
                    </Box>
                    <List sx={{ px: 1.5, pb: 2 }}>
                        {extraNav.map((item) => {
                            const active = isRouteActive(item.route_name);
                            const Icon = item.Icon;
                            return (
                                <ListItemButton
                                    key={item.key}
                                    component={Link}
                                    href={item.href}
                                    prefetch
                                    onClick={() => setMoreOpen(false)}
                                    sx={{
                                        mb: 0.5,
                                        color: active ? colors.cream : colors.wheatLight,
                                        bgcolor: active ? colors.jam : 'transparent',
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            );
                        })}
                        {profileHref && (
                            <ListItemButton
                                component={Link}
                                href={profileHref}
                                prefetch
                                onClick={() => setMoreOpen(false)}
                                sx={{ color: colors.wheatLight }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                    <SettingsOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Settings" />
                            </ListItemButton>
                        )}
                        <ListItemButton
                            onClick={() => router.post(route('logout'))}
                            sx={{ color: colors.wheatLight }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Log out" />
                        </ListItemButton>
                    </List>
                </Drawer>
            </Box>
        </>
    );
}
