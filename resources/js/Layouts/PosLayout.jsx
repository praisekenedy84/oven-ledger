import BuildUpdatePrompt from '@/Components/BuildUpdatePrompt';
import FlashMessage from '@/Components/FlashMessage';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    flattenMenuLeaves,
    isRouteActive,
    resolveNavIcon,
    safeRoute,
    userInitials,
} from '@/theme/nav';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, MoreHorizontal, ScanBarcode, Settings } from 'lucide-react';
import { useState } from 'react';

function NavIconButton({ item, placement = 'right' }) {
    const active = isRouteActive(item.route_name);
    const Icon = item.Icon;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'h-11 w-11 rounded-[10px]',
                        active
                            ? 'bg-primary text-primary-foreground hover:bg-primary'
                            : 'text-wheat-light hover:bg-sidebar-accent hover:text-cream',
                    )}
                >
                    <Link href={item.href} prefetch>
                        <Icon className="h-4 w-4" />
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent side={placement}>{item.label}</TooltipContent>
        </Tooltip>
    );
}

export default function PosLayout({ children, hideBottomNav = false }) {
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
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-[10px] bg-primary text-primary-foreground">
                <ScanBarcode className="h-5 w-5" />
            </div>

            <div className="flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto">
                {navItems.map((item) => (
                    <NavIconButton key={item.key} item={item} />
                ))}
            </div>

            <div className="flex w-full flex-col items-center gap-1.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <Button
                                asChild={Boolean(profileHref)}
                                disabled={!profileHref}
                                variant="ghost"
                                size="icon"
                                className="text-wheat-light hover:bg-sidebar-accent hover:text-cream"
                            >
                                {profileHref ? (
                                    <Link href={profileHref} prefetch>
                                        <Settings className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <Settings className="h-4 w-4" />
                                )}
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
                <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-secondary text-[13px] font-bold text-secondary-foreground">
                        {userInitials(auth.user?.name)}
                    </AvatarFallback>
                </Avatar>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => router.post(route('logout'))}
                            className="text-wheat-light hover:bg-sidebar-accent hover:text-cream"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Log out</TooltipContent>
                </Tooltip>
            </div>
        </>
    );

    return (
        <TooltipProvider delayDuration={200}>
            <ImpersonationBanner />
            <FlashMessage />
            <BuildUpdatePrompt />

            <div className="flex min-h-dvh flex-col bg-background md:flex-row">
                <aside className="hidden w-[72px] shrink-0 flex-col items-center bg-sidebar px-2 py-4 text-sidebar-foreground md:flex">
                    {rail}
                </aside>

                <main
                    className={cn(
                        'min-w-0 flex-1 overflow-visible md:min-h-dvh md:overflow-hidden',
                        !hideBottomNav && 'pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0',
                    )}
                >
                    {children}
                </main>

                <nav
                    className={cn(
                        'fixed bottom-0 left-0 right-0 z-50 flex h-[calc(64px+env(safe-area-inset-bottom))] items-center justify-around bg-sidebar px-1 pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden',
                        hideBottomNav && 'hidden',
                    )}
                >
                    {primaryNav.map((item) => (
                        <NavIconButton key={item.key} item={item} placement="top" />
                    ))}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setMoreOpen(true)}
                                className="h-11 w-11 text-wheat-light"
                            >
                                <MoreHorizontal />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">More</TooltipContent>
                    </Tooltip>
                </nav>

                <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                    <SheetContent side="bottom" className="rounded-t-2xl border-0 bg-sidebar text-sidebar-foreground md:hidden">
                        <SheetHeader>
                            <SheetTitle className="text-left text-xs uppercase tracking-wider text-secondary">
                                More
                            </SheetTitle>
                        </SheetHeader>
                        <div className="space-y-1 pb-4 pt-2">
                            {extraNav.map((item) => {
                                const active = isRouteActive(item.route_name);
                                const Icon = item.Icon;
                                return (
                                    <Button
                                        key={item.key}
                                        asChild
                                        variant="ghost"
                                        className={cn(
                                            'h-11 w-full justify-start gap-3',
                                            active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-wheat-light hover:bg-sidebar-accent',
                                        )}
                                    >
                                        <Link href={item.href} prefetch onClick={() => setMoreOpen(false)}>
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    </Button>
                                );
                            })}
                            {profileHref && (
                                <Button asChild variant="ghost" className="h-11 w-full justify-start gap-3 text-wheat-light">
                                    <Link href={profileHref} prefetch onClick={() => setMoreOpen(false)}>
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </Link>
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-11 w-full justify-start gap-3 text-wheat-light"
                                onClick={() => router.post(route('logout'))}
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </TooltipProvider>
    );
}
