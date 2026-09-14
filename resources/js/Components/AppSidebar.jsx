import ApplicationLogo from '@/Components/ApplicationLogo';
import { colors, headerHeight, shadow } from '@/theme/bakeryTheme';
import { activeGroupKeys, isNavTreeActive, isRouteActive, userInitials } from '@/theme/nav';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import {
    Avatar,
    Box,
    Collapse,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Popover,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export const DRAWER_EXPANDED = 256;
export const DRAWER_COLLAPSED = 80;
const STORAGE_KEY = 'oven-ledger.sidebar-expanded';

const hideScrollbar = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
        display: 'none',
        width: 0,
        height: 0,
    },
};

function readExpanded() {
    if (typeof window === 'undefined') {
        return true;
    }

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === null ? true : stored === '1';
    } catch {
        return true;
    }
}

function widthTransition(theme, reduceMotion) {
    return reduceMotion
        ? 'none'
        : theme.transitions.create('width', {
              duration: 280,
              easing: theme.transitions.easing.sharp,
          });
}

export default function AppSidebar({
    navItems = [],
    headerExtra = null,
    userName,
    userMeta,
    onLogout,
    mobileOpen,
    onMobileClose,
}) {
    const theme = useTheme();
    const page = usePage();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const [expanded, setExpanded] = useState(readExpanded);
    const [openKey, setOpenKey] = useState(() => activeGroupKeys(navItems)[0] ?? null);
    const [flyout, setFlyout] = useState(null);

    const railExpanded = !isDesktop || expanded;
    const width = railExpanded ? DRAWER_EXPANDED : DRAWER_COLLAPSED;

    useEffect(() => {
        const next = activeGroupKeys(navItems)[0] ?? null;
        if (next) {
            setOpenKey(next);
        }
    }, [page.url, navItems]);

    const toggleExpanded = () => {
        setExpanded((current) => {
            const next = !current;
            try {
                window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            } catch {
                // Keep the in-memory preference if storage is blocked.
            }
            return next;
        });
        setFlyout(null);
    };

    const toggleGroup = (key) => {
        setOpenKey((current) => (current === key ? null : key));
    };

    const drawer = (
        <DrawerContents
            navItems={navItems}
            headerExtra={headerExtra}
            userName={userName}
            userMeta={userMeta}
            onLogout={onLogout}
            expanded={railExpanded}
            openKey={openKey}
            onToggleGroup={toggleGroup}
            flyout={flyout}
            onFlyoutChange={setFlyout}
            onNavigate={onMobileClose}
            reduceMotion={reduceMotion}
        />
    );

    return (
        <Box
            component="nav"
            sx={{
                width: { md: width },
                flexShrink: { md: 0 },
                position: 'relative',
                zIndex: 1201,
                transition: widthTransition(theme, reduceMotion),
            }}
        >
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: DRAWER_EXPANDED,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                    },
                }}
            >
                {drawer}
            </Drawer>
            <Drawer
                variant="permanent"
                open
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        width,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        transition: widthTransition(theme, reduceMotion),
                    },
                }}
            >
                {drawer}
            </Drawer>

            {isDesktop && (
                <Tooltip title={expanded ? 'Give the page more room' : 'Show menu labels'} placement="right">
                    <IconButton
                        onClick={toggleExpanded}
                        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        aria-expanded={expanded}
                        sx={{
                            position: 'absolute',
                            top: 72,
                            right: -12,
                            width: 24,
                            height: 24,
                            minWidth: 24,
                            minHeight: 24,
                            bgcolor: colors.cream,
                            color: colors.ink,
                            border: `1px solid ${colors.border}`,
                            boxShadow: shadow,
                            '&:hover': { bgcolor: colors.wheatLight },
                        }}
                    >
                        {expanded ? <ChevronLeftIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
}

function DrawerContents({
    navItems,
    headerExtra,
    userName,
    userMeta,
    onLogout,
    expanded,
    openKey,
    onToggleGroup,
    flyout,
    onFlyoutChange,
    onNavigate,
    reduceMotion,
}) {
    const shop = usePage().props.shop;

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: colors.ink,
                color: colors.cream,
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    height: headerHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    px: expanded ? 2 : 1,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <Box sx={{ color: colors.cream, minWidth: 0, overflow: 'hidden' }}>
                    <ApplicationLogo
                        showText={expanded}
                        src={shop?.logo_url}
                        name={shop?.shop_name || 'Oven Ledger'}
                    />
                </Box>
            </Box>

            {expanded && headerExtra}

            <List
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    px: expanded ? 2 : 2.5,
                    py: 2,
                    ...hideScrollbar,
                }}
            >
                {navItems.map((item) => (
                    <NavNode
                        key={item.key}
                        item={item}
                        depth={0}
                        expanded={expanded}
                        openKey={openKey}
                        onToggleGroup={onToggleGroup}
                        flyout={flyout}
                        onFlyoutChange={onFlyoutChange}
                        onNavigate={onNavigate}
                        reduceMotion={reduceMotion}
                    />
                ))}
            </List>

            <Box
                sx={{
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    p: expanded ? 2 : 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: expanded ? 'stretch' : 'center',
                    gap: 1,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: expanded ? 'flex-start' : 'center',
                        gap: 1.25,
                        minWidth: 0,
                    }}
                >
                    <Tooltip title={expanded ? '' : [userName, userMeta].filter(Boolean).join(' · ')} placement="right">
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
                            {userInitials(userName)}
                        </Avatar>
                    </Tooltip>
                    {expanded && (
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" sx={{ color: colors.wheatLight, display: 'block' }} noWrap>
                                {userName}
                            </Typography>
                            {userMeta && (
                                <Typography variant="caption" sx={{ color: colors.butter }} noWrap>
                                    {userMeta}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
                <Tooltip title={expanded ? '' : 'Log out'} placement="right">
                    <ListItemButton
                        onClick={onLogout}
                        sx={{
                            color: colors.wheatLight,
                            px: expanded ? 1 : 0,
                            justifyContent: 'center',
                            minHeight: 40,
                            '&:hover': { bgcolor: 'rgba(251,246,234,0.08)', color: colors.cream },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: expanded ? 40 : 0, color: 'inherit' }}>
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        {expanded && <ListItemText primary="Log out" primaryTypographyProps={{ fontSize: 14 }} />}
                    </ListItemButton>
                </Tooltip>
            </Box>
        </Box>
    );
}

function NavNode({
    item,
    depth,
    expanded,
    openKey,
    onToggleGroup,
    flyout,
    onFlyoutChange,
    onNavigate,
    reduceMotion,
}) {
    const children = item.children ?? [];
    const hasChildren = children.length > 0;
    const hasLink = Boolean(item.href);
    const active = isRouteActive(item.route_name);
    const treeActive = isNavTreeActive(item);
    const open = openKey === item.key;
    const Icon = item.Icon;
    const flyoutOpen = flyout?.key === item.key;

    if (hasChildren && !hasLink) {
        return (
            <Box sx={{ mb: 0.5 }}>
                <Tooltip title={expanded ? '' : item.label} placement="right">
                    <ListItemButton
                        onClick={(event) => {
                            if (expanded) {
                                onToggleGroup(item.key);
                                return;
                            }
                            onFlyoutChange(
                                flyoutOpen
                                    ? null
                                    : { key: item.key, anchorEl: event.currentTarget, item },
                            );
                        }}
                        aria-expanded={expanded ? open : flyoutOpen}
                        sx={{
                            ...navButtonSx({
                                active: !expanded && treeActive,
                                expanded,
                                depth,
                                open: expanded ? open || treeActive : flyoutOpen,
                            }),
                            ...(expanded &&
                                treeActive && {
                                    boxShadow: `inset 2px 0 0 ${colors.butter}`,
                                }),
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: expanded ? 40 : 0, color: 'inherit' }}>
                            <Icon fontSize="small" />
                        </ListItemIcon>
                        {expanded && (
                            <>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.04em' }}
                                />
                                <ExpandMoreIcon
                                    sx={{
                                        fontSize: 18,
                                        opacity: 0.7,
                                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: reduceMotion ? 'none' : 'transform 200ms ease',
                                    }}
                                />
                            </>
                        )}
                    </ListItemButton>
                </Tooltip>

                <Collapse in={expanded && open} timeout={reduceMotion ? 0 : 220} unmountOnExit>
                    <Box
                        sx={{
                            pt: 0.25,
                            ml: 2.25,
                            pl: 0.75,
                            borderLeft: '1px solid rgba(251,246,234,0.1)',
                        }}
                    >
                        {children.map((child) => (
                            <NavNode
                                key={child.key}
                                item={child}
                                depth={0}
                                expanded={expanded}
                                openKey={openKey}
                                onToggleGroup={onToggleGroup}
                                flyout={flyout}
                                onFlyoutChange={onFlyoutChange}
                                onNavigate={onNavigate}
                                reduceMotion={reduceMotion}
                            />
                        ))}
                    </Box>
                </Collapse>

                <Popover
                    open={!expanded && flyoutOpen}
                    anchorEl={flyout?.anchorEl}
                    onClose={() => onFlyoutChange(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    slotProps={{
                        paper: {
                            sx: {
                                ml: 1.25,
                                minWidth: 208,
                                p: 1,
                                bgcolor: colors.ink,
                                color: colors.cream,
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 12px 32px rgba(51, 38, 28, 0.28)',
                            },
                        },
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            px: 1.25,
                            py: 0.75,
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
                            depth={0}
                            expanded
                            openKey={openKey}
                            onToggleGroup={onToggleGroup}
                            flyout={flyout}
                            onFlyoutChange={onFlyoutChange}
                            onNavigate={() => {
                                onFlyoutChange(null);
                                onNavigate?.();
                            }}
                            reduceMotion={reduceMotion}
                        />
                    ))}
                </Popover>
            </Box>
        );
    }

    return (
        <>
            <Tooltip title={expanded ? '' : item.label} placement="right">
                <ListItemButton
                    component={Link}
                    href={item.href}
                    prefetch
                    onClick={onNavigate}
                    sx={navButtonSx({ active, expanded, depth })}
                >
                    <ListItemIcon sx={{ minWidth: expanded ? 40 : 0, color: 'inherit' }}>
                        <Icon fontSize="small" />
                    </ListItemIcon>
                    {expanded && (
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: depth > 0 ? 13 : 14 }}
                        />
                    )}
                </ListItemButton>
            </Tooltip>
            {children.map((child) => (
                <NavNode
                    key={child.key}
                    item={child}
                    depth={depth + 1}
                    expanded={expanded}
                    openKey={openKey}
                    onToggleGroup={onToggleGroup}
                    flyout={flyout}
                    onFlyoutChange={onFlyoutChange}
                    onNavigate={onNavigate}
                    reduceMotion={reduceMotion}
                />
            ))}
        </>
    );
}

function navButtonSx({ active, expanded, depth, open = false }) {
    return {
        mb: 0.5,
        minHeight: 40,
        px: expanded ? 1.5 : 0,
        pl: expanded ? 1.5 + depth : 0,
        justifyContent: expanded ? 'flex-start' : 'center',
        color: active ? colors.cream : colors.wheatLight,
        bgcolor: active ? colors.jam : open ? 'rgba(251,246,234,0.06)' : 'transparent',
        '&:hover': {
            bgcolor: active ? colors.jam : 'rgba(251,246,234,0.08)',
            color: colors.cream,
        },
    };
}

