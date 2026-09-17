import AppSidebar from '@/Components/AppSidebar';
import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import { Button } from '@/Components/ui/button';
import { resolveNavIcon } from '@/theme/nav';
import { router, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NAV = [
    { label: 'Dashboard', route: 'platform.dashboard' },
    { label: 'Tenants', route: 'platform.tenants.index' },
    { label: 'Roles', route: 'platform.roles.index' },
    { label: 'Audit Log', route: 'platform.audit.index' },
];

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
    );
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const onChange = () => setIsDesktop(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return isDesktop;
}

export default function PlatformLayout({ title, children }) {
    const isDesktop = useIsDesktop();
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
        <div className="flex min-h-screen flex-col bg-background">
            <ImpersonationBanner />
            <div className="flex min-h-0 flex-1">
                <FlashMessage />
                <BuildUpdatePrompt />

                <AppSidebar
                    navItems={navItems}
                    userName={auth.user?.name}
                    onLogout={() => router.post(route('platform.logout'))}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-4">
                        {!isDesktop && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        )}
                        <h2 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">{title}</h2>
                        <p className="hidden text-sm text-muted-foreground sm:block">Platform Admin</p>
                    </header>

                    <main className="flex-1 p-4 md:p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
