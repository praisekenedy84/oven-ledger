import PageHeader from '@/Components/PageHeader';
import SurfaceCard from '@/Components/SurfaceCard';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, router } from '@inertiajs/react';

const KIND_COLOR = {
    alert: 'text-jam',
    reminder: 'text-[#8A6410]',
    update: 'text-sage',
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

export default function Index({ notifications = [], unreadCount = 0 }) {
    return (
        <TenantLayout title="Notifications">
            <Head title="Notifications" />

            <PageHeader
                title="Notifications"
                description="Updates, reminders, and alerts — open one to jump straight to the place you can act."
                actions={
                    unreadCount > 0 ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.post(route('tenant.notifications.read-all'), {}, { preserveScroll: true })
                            }
                        >
                            Mark all as read
                        </Button>
                    ) : null
                }
            />

            <p className="mb-4 text-sm text-muted-foreground">
                {unreadCount === 0
                    ? 'Nothing unread right now.'
                    : `${unreadCount} unread item${unreadCount === 1 ? '' : 's'} need attention.`}
            </p>

            <div className="flex flex-col gap-3">
                {notifications.length === 0 && (
                    <SurfaceCard>
                        <p className="text-sm text-muted-foreground">
                            When pre-orders are due, stock runs low, or a batch is ready, it will show up here.
                        </p>
                    </SurfaceCard>
                )}

                {notifications.map((item) => (
                    <SurfaceCard
                        key={item.id}
                        className={cn(
                            'flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center',
                            item.is_read && 'opacity-70',
                        )}
                    >
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p
                                    className={`text-xs font-bold uppercase tracking-wider ${KIND_COLOR[item.kind] ?? 'text-muted-foreground'}`}
                                >
                                    {kindLabel(item.kind)}
                                </p>
                                {!item.is_read && (
                                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                        Unread
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-base font-bold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.body}</p>
                        </div>
                        {item.href && (
                            <Button
                                size="sm"
                                type="button"
                                className="shrink-0"
                                variant={item.is_read ? 'outline' : 'default'}
                                onClick={() => openNotification(item)}
                            >
                                {item.action_label || 'Open'}
                            </Button>
                        )}
                    </SurfaceCard>
                ))}
            </div>
        </TenantLayout>
    );
}
