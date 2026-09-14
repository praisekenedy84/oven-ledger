import AppSidebar from '@/Components/AppSidebar';
import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import { colors, layout } from '@/theme/bakeryTheme';
import { prepareNavTree } from '@/theme/nav';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Alert,
    AppBar,
    Box,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function TenantLayout({ title, children }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const { auth, currentBranch, branches, menuItems, branchSuspended } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const navItems = useMemo(() => prepareNavTree(menuItems), [menuItems]);

    const switchBranch = (branchId) => {
        router.get(
            window.location.pathname,
            { branch_id: branchId },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <ImpersonationBanner />
            <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <FlashMessage />
            <BuildUpdatePrompt />

            <AppSidebar
                navItems={navItems}
                userName={auth.user?.name}
                userMeta={currentBranch?.name}
                onLogout={() => router.post(route('logout'))}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                headerExtra={
                    branches?.length > 1 ? (
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
                    ) : null
                }
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

                <Box component="main" sx={{ flex: 1, p: layout.pageGutter }}>
                    {children}
                </Box>
            </Box>
            </Box>
        </Box>
    );
}
