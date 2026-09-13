import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import { colors } from '@/theme/bakeryTheme';
import {
    flattenMenuLeaves,
    isRouteActive,
    resolveNavIcon,
    safeRoute,
    userInitials,
} from '@/theme/nav';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { Avatar, Box, IconButton, Stack, Tooltip } from '@mui/material';
import { Link, router, usePage } from '@inertiajs/react';

export default function PosLayout({ children }) {
    const { auth, menuItems } = usePage().props;

    const navItems = flattenMenuLeaves(menuItems ?? [])
        .map((item) => ({
            ...item,
            href: safeRoute(item.route_name),
            Icon: resolveNavIcon(item.route_name, item.key),
        }))
        .filter((item) => item.href)
        .slice(0, 6);

    const profileHref = safeRoute('profile.edit');

    return (
        <>
            <FlashMessage />
            <BuildUpdatePrompt />

            <Box
                sx={{
                    display: 'flex',
                    minHeight: '100vh',
                    bgcolor: colors.kraft,
                }}
            >
                <Box
                    component="aside"
                    sx={{
                        width: 72,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 2,
                        px: 1,
                        bgcolor: colors.ink,
                        color: colors.cream,
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '10px',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: colors.jam,
                            color: colors.cream,
                            mb: 2.5,
                        }}
                    >
                        <StorefrontOutlinedIcon />
                    </Box>

                    <Stack spacing={0.75} sx={{ flex: 1, width: '100%', alignItems: 'center' }}>
                        {navItems.map((item) => {
                            const active = isRouteActive(item.route_name);
                            const Icon = item.Icon;

                            return (
                                <Tooltip key={item.key} title={item.label} placement="right">
                                    <IconButton
                                        component={Link}
                                        href={item.href}
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
                        })}
                    </Stack>

                    <Stack spacing={0.75} sx={{ width: '100%', alignItems: 'center' }}>
                        <Tooltip title="Help" placement="right">
                            <IconButton sx={{ color: colors.wheatLight }}>
                                <HelpOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Settings" placement="right">
                            <span>
                                <IconButton
                                    disabled={!profileHref}
                                    component={profileHref ? Link : 'button'}
                                    href={profileHref || undefined}
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
                </Box>

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: '100vh',
                        overflow: 'hidden',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </>
    );
}
