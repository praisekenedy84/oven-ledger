import { colors } from '@/theme/bakeryTheme';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import {
    Badge,
    Box,
    Button,
    Divider,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Popover,
    Stack,
    Typography,
} from '@mui/material';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const KIND_COLOR = {
    alert: colors.jam,
    reminder: '#8A6410',
    update: colors.sage,
};

function kindLabel(kind) {
    if (kind === 'alert') {
        return 'Alert';
    }
    if (kind === 'reminder') {
        return 'Reminder';
    }
    return 'Update';
}

export default function NotificationBell() {
    const { staffNotifications } = usePage().props;
    const items = staffNotifications?.items ?? [];
    const unreadCount = staffNotifications?.unread_count ?? items.length;
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const goTo = (href) => {
        setAnchorEl(null);
        if (href) {
            router.visit(href);
        }
    };

    return (
        <>
            <IconButton
                aria-label="Notifications"
                onClick={(event) => setAnchorEl(event.currentTarget)}
                sx={{ color: colors.ink }}
            >
                <Badge
                    badgeContent={unreadCount}
                    color="error"
                    max={99}
                    overlap="circular"
                    sx={{
                        '& .MuiBadge-badge': {
                            bgcolor: colors.jam,
                            color: colors.cream,
                            fontWeight: 700,
                        },
                    }}
                >
                    <NotificationsNoneOutlinedIcon />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: 'min(100vw - 24px, 380px)', sm: 380 },
                            maxHeight: 480,
                            mt: 1,
                            border: `1px solid ${colors.border}`,
                            boxShadow: '0 2px 8px rgba(51, 38, 28, 0.08)',
                        },
                    },
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 2, py: 1.5 }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        Notifications
                    </Typography>
                    <Button
                        component={Link}
                        href={route('tenant.notifications.index')}
                        size="small"
                        onClick={() => setAnchorEl(null)}
                    >
                        View all
                    </Button>
                </Stack>
                <Divider />
                {items.length === 0 ? (
                    <Box sx={{ px: 2, py: 4 }}>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            No alerts or reminders right now.
                        </Typography>
                    </Box>
                ) : (
                    <List dense disablePadding sx={{ overflowY: 'auto', maxHeight: 360 }}>
                        {items.map((item) => (
                            <ListItemButton
                                key={item.id}
                                onClick={() => goTo(item.href)}
                                alignItems="flex-start"
                                sx={{ py: 1.25, px: 2 }}
                            >
                                <ListItemText
                                    primary={
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: KIND_COLOR[item.kind] ?? colors.muted,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                }}
                                            >
                                                {kindLabel(item.kind)}
                                            </Typography>
                                        </Stack>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" sx={{ color: colors.ink, fontWeight: 600 }}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.body}
                                            </Typography>
                                        </>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Popover>
        </>
    );
}
