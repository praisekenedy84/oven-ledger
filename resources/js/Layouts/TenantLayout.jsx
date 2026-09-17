import AppSidebar from '@/Components/AppSidebar';
import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import NotificationBell from '@/Components/NotificationBell';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { prepareNavTree } from '@/theme/nav';
import { router, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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

export default function TenantLayout({ title, children }) {
    const isDesktop = useIsDesktop();
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
        <div className="flex min-h-screen flex-col bg-background">
            <ImpersonationBanner />
            <div className="flex min-h-0 flex-1">
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
                            <div className="border-b border-sidebar-border px-4 py-3">
                                <p className="text-[10px] uppercase tracking-wider text-wheat-light">Branch</p>
                                <Select
                                    value={String(currentBranch?.id ?? '')}
                                    onValueChange={switchBranch}
                                >
                                    <SelectTrigger className="mt-2 h-9 border-0 bg-black/20 text-cream">
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={String(branch.id)}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null
                    }
                />

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-4">
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
                        <NotificationBell />
                        {currentBranch && branches?.length <= 1 && (
                            <p className="hidden text-sm text-muted-foreground sm:block">{currentBranch.name}</p>
                        )}
                    </header>

                    {branchSuspended && (
                        <Alert variant="destructive" className="rounded-none border-x-0">
                            <AlertDescription>
                                This branch is currently suspended. Some operations may be unavailable.
                            </AlertDescription>
                        </Alert>
                    )}

                    <main className="flex-1 p-4 md:p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
