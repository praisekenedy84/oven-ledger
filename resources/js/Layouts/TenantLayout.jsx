import ApplicationLogo from '@/Components/ApplicationLogo';
import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import { colors } from '@/theme/bakeryTheme';
import { isRouteActive, prepareNavTree, userInitials } from '@/theme/nav';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Alert,
    AppBar,
    Avatar,
    Box,
    Drawer,
    FormControl,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const DRAWER_WIDTH = 240;

export default function TenantLayout({ title, children }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const { auth, currentBranch, branches, menuItems, branchSuspended } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    const switchBranch = (branchId) => {
        router.get(
            window.location.pathname,
            { branch_id: branchId },
            { preserveState: true, preserveScroll: true },
        );
    };

    const navItems = prepareNavTree(menuItems);

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

            {branches?.length > 1 && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: colors.wheatLight,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Branch
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mt: 0.75 }}>
                        <Select
                            value={currentBranch?.id ?? ''}
                            onChange={(e) => switchBranch(e.target.value)}
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(0,0,0,0.2)',
                                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '.MuiSvgIcon-root': { color: colors.wheatLight },
                            }}
                        >
                            {branches.map((branch) => (
                                <MenuItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            <List sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
                {navItems.map((item) => (
                    <NavNode
                        key={item.key}
                        item={item}
                        depth={0}
                        onNavigate={() => setMobileOpen(false)}
                    />
                ))}
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
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: colors.wheatLight, display: 'block' }} noWrap>
                            {auth.user?.name}
                        </Typography>
                        {currentBranch && (
                            <Typography variant="caption" sx={{ color: colors.butter }} noWrap>
                                {currentBranch.name}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <ListItemButton
                    onClick={() => router.post(route('logout'))}
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

            <Box
                component="nav"
                sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
            >
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
                        {currentBranch && branches?.length <= 1 && (
                            <Typography variant="body2" color="text.secondary">
                                {currentBranch.name}
                            </Typography>
                        )}
                    </Toolbar>
                </AppBar>

                {branchSuspended && (
                    <Alert severity="error" sx={{ borderRadius: 0 }}>
                        This branch is currently suspended. Some operations may be unavailable.
                    </Alert>
                )}

                <Box component="main" sx={{ flex: 1, p: { xs: 2, lg: 3 } }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}

function NavNode({ item, depth, onNavigate }) {
    const children = item.children ?? [];
    const hasLink = Boolean(item.href);
    const childActive = children.some(
        (child) =>
            isRouteActive(child.route_name) ||
            (child.children ?? []).some((nested) => isRouteActive(nested.route_name)),
    );
    const active = isRouteActive(item.route_name);
    const Icon = item.Icon;

    if (!hasLink) {
        return (
            <Box sx={{ mb: 1 }}>
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        px: 1.5,
                        pt: depth === 0 ? 1 : 0.5,
                        pb: 0.5,
                        color: colors.butter,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                    }}
                >
                    {item.label}
                </Typography>
                {children.map((child) => (
                    <NavNode
                        key={child.key}
                        item={child}
                        depth={depth + 1}
                        onNavigate={onNavigate}
                    />
                ))}
            </Box>
        );
    }

    return (
        <>
            <ListItemButton
                component={Link}
                href={item.href}
                onClick={onNavigate}
                sx={{
                    mb: 0.5,
                    pl: 1.5 + depth * 1.25,
                    color: active ? colors.cream : colors.wheatLight,
                    bgcolor: active ? colors.jam : childActive ? 'rgba(251,246,234,0.06)' : 'transparent',
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
            {children.map((child) => (
                <NavNode
                    key={child.key}
                    item={child}
                    depth={depth + 1}
                    onNavigate={onNavigate}
                />
            ))}
        </>
    );
}
