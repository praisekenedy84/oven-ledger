import ApplicationLogo from '@/Components/ApplicationLogo';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
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
import { Sheet, SheetContent } from '@/Components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { cn } from '@/lib/utils';
import { activeGroupKeys, isNavTreeActive, isRouteActive, userInitials } from '@/theme/nav';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export const DRAWER_EXPANDED = 256;
export const DRAWER_COLLAPSED = 80;
const STORAGE_KEY = 'oven-ledger.sidebar-expanded';

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

export default function AppSidebar({
    navItems = [],
    headerExtra = null,
    userName,
    userMeta,
    onLogout,
    mobileOpen,
    onMobileClose,
}) {
    const page = usePage();
    const isDesktop = useIsDesktop();
    const [expanded, setExpanded] = useState(readExpanded);
    const [openKey, setOpenKey] = useState(() => activeGroupKeys(navItems)[0] ?? null);

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
                // ignore
            }
            return next;
        });
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
            onToggleGroup={(key) => setOpenKey((current) => (current === key ? null : key))}
            onNavigate={onMobileClose}
        />
    );

    return (
        <TooltipProvider delayDuration={200}>
            <nav
                className="relative z-[40] shrink-0 transition-[width] duration-280"
                style={{ width: isDesktop ? width : undefined }}
            >
                <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
                    <SheetContent side="left" className="w-64 border-0 bg-sidebar p-0 text-sidebar-foreground md:hidden [&>button]:text-sidebar-foreground">
                        {drawer}
                    </SheetContent>
                </Sheet>

                <div
                    className="hidden h-full overflow-hidden md:block"
                    style={{ width }}
                >
                    {drawer}
                </div>

                {isDesktop && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={toggleExpanded}
                                aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                                className="absolute -right-3 top-[72px] z-10 h-6 w-6 rounded-full border-border bg-card p-0 shadow-card hover:bg-wheat-light"
                            >
                                {expanded ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {expanded ? 'Give the page more room' : 'Show menu labels'}
                        </TooltipContent>
                    </Tooltip>
                )}
            </nav>
        </TooltipProvider>
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
    onNavigate,
}) {
    const shop = usePage().props.shop;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
            <div
                className={cn(
                    'flex h-16 items-center border-b border-sidebar-border',
                    expanded ? 'justify-start px-4' : 'justify-center px-2',
                )}
            >
                <ApplicationLogo
                    showText={expanded}
                    src={shop?.logo_url}
                    name={shop?.shop_name || 'Oven Ledger'}
                />
            </div>

            {expanded && headerExtra}

            <ScrollArea className="min-h-0 flex-1">
                <div className={cn('space-y-0.5 py-4', expanded ? 'px-3' : 'px-2')}>
                    {navItems.map((item) => (
                        <NavNode
                            key={item.key}
                            item={item}
                            depth={0}
                            expanded={expanded}
                            openKey={openKey}
                            onToggleGroup={onToggleGroup}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            </ScrollArea>

            <div
                className={cn(
                    'flex flex-col gap-2 border-t border-sidebar-border',
                    expanded ? 'items-stretch p-4' : 'items-center p-3',
                )}
            >
                <div className={cn('flex min-w-0 items-center gap-3', expanded ? 'justify-start' : 'justify-center')}>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                            {userInitials(userName)}
                        </AvatarFallback>
                    </Avatar>
                    {expanded && (
                        <div className="min-w-0">
                            <p className="truncate text-xs text-sidebar-foreground">{userName}</p>
                            {userMeta && <p className="truncate text-xs text-secondary">{userMeta}</p>}
                        </div>
                    )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onLogout}
                    className={cn(
                        'h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        expanded ? 'justify-start px-2' : 'w-10 justify-center px-0',
                    )}
                >
                    <LogOut className="h-4 w-4" />
                    {expanded && <span>Log out</span>}
                </Button>
            </div>
        </div>
    );
}

function NavNode({ item, depth, expanded, openKey, onToggleGroup, onNavigate }) {
    const children = item.children ?? [];
    const hasChildren = children.length > 0;
    const hasLink = Boolean(item.href);
    const active = isRouteActive(item.route_name);
    const treeActive = isNavTreeActive(item);
    const open = openKey === item.key;
    const Icon = item.Icon;

    if (hasChildren && !hasLink) {
        return (
            <div className="mb-0.5">
                {expanded ? (
                    <>
                        <button
                            type="button"
                            onClick={() => onToggleGroup(item.key)}
                            className={cn(
                                'flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-[13px] font-bold tracking-wide transition-colors',
                                treeActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--secondary)]'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            <ChevronDown className={cn('h-4 w-4 opacity-70 transition-transform', open && 'rotate-180')} />
                        </button>
                        {open && (
                            <div className="ml-3 space-y-0.5 border-l border-sidebar-border py-1 pl-2">
                                {children.map((child) => (
                                    <NavNode
                                        key={child.key}
                                        item={child}
                                        depth={0}
                                        expanded={expanded}
                                        openKey={openKey}
                                        onToggleGroup={onToggleGroup}
                                        onNavigate={onNavigate}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    'h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                    treeActive && 'bg-primary text-primary-foreground hover:bg-primary',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="min-w-[208px] border-sidebar-border bg-sidebar text-sidebar-foreground">
                            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-secondary">
                                {item.label}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-sidebar-border" />
                            {children.map((child) => {
                                const ChildIcon = child.Icon;
                                return (
                                    <DropdownMenuItem key={child.key} asChild className="focus:bg-sidebar-accent focus:text-sidebar-accent-foreground">
                                        <Link href={child.href} prefetch onClick={onNavigate}>
                                            <ChildIcon className="h-4 w-4" />
                                            {child.label}
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        );
    }

    const link = (
        <Link
            href={item.href}
            prefetch
            onClick={onNavigate}
            className={cn(
                'mb-0.5 flex h-10 items-center gap-2 rounded-md text-sm font-semibold transition-colors',
                expanded ? 'px-3' : 'w-10 justify-center px-0',
                depth > 0 && expanded && 'text-[13px]',
                active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {expanded && <span className="truncate">{item.label}</span>}
        </Link>
    );

    if (!expanded) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <>
            {link}
            {children.map((child) => (
                <NavNode
                    key={child.key}
                    item={child}
                    depth={depth + 1}
                    expanded={expanded}
                    openKey={openKey}
                    onToggleGroup={onToggleGroup}
                    onNavigate={onNavigate}
                />
            ))}
        </>
    );
}
