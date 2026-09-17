import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { colors } from '@/theme/bakeryTheme';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';

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

function openNotification(item) {
    const go = () => {
        if (item.href) {
            router.visit(item.href);
        }
    };

    if (item.is_read) {
        go();
        return;
    }

    router.post(
        route('tenant.notifications.read'),
        { id: item.id },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: go,
        },
    );
}

function markAllRead() {
    router.post(route('tenant.notifications.read-all'), {}, { preserveScroll: true });
}

export default function NotificationBell() {
    const { staffNotifications } = usePage().props;
    const items = staffNotifications?.items ?? [];
    const unreadCount = staffNotifications?.unread_count ?? 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-ink" aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(100vw-24px,380px)] p-0 shadow-card">
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <DropdownMenuLabel className="p-0 text-base font-bold">Notifications</DropdownMenuLabel>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button type="button" variant="ghost" size="sm" onClick={markAllRead}>
                                Mark all read
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('tenant.notifications.index')}>View all</Link>
                        </Button>
                    </div>
                </div>
                <DropdownMenuSeparator className="m-0" />
                {items.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No alerts or reminders right now.
                    </div>
                ) : (
                    <ScrollArea className="max-h-[360px]">
                        {items.map((item) => (
                            <DropdownMenuItem
                                key={item.id}
                                className={cn(
                                    'cursor-pointer items-start gap-2 px-4 py-3',
                                    item.is_read && 'opacity-60',
                                )}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    openNotification(item);
                                }}
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-widest"
                                            style={{ color: KIND_COLOR[item.kind] ?? colors.muted }}
                                        >
                                            {kindLabel(item.kind)}
                                        </p>
                                        {!item.is_read && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Unread" />
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.body}</p>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </ScrollArea>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
