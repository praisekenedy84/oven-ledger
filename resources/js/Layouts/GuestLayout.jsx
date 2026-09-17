import ApplicationLogo from '@/Components/ApplicationLogo';
import TicketPanel from '@/Components/TicketPanel';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, variant = 'tenant' }) {
    return (
        <div className="grid min-h-screen grid-cols-1 bg-background md:grid-cols-[minmax(0,1fr)_minmax(440px,580px)]">
            <div
                className="relative hidden flex-col justify-end bg-cover bg-center p-12 text-cream md:flex"
                style={{ backgroundImage: 'url(/images/bakery/login.png)' }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-ink/15 to-ink/70" />
                <div className="relative max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                        {variant === 'platform' ? 'Platform' : 'Bakery ledger'}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold leading-tight text-cream">
                        The morning board, kept in one book.
                    </h1>
                    <p className="mt-3 max-w-sm text-sm text-cream/80">
                        Production, stock, and the ticket at the counter — without the generic SaaS glow.
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
                <div className="mb-6 text-foreground">
                    <Link href="/">
                        <ApplicationLogo />
                    </Link>
                </div>

                <TicketPanel className="w-full max-w-[520px] px-6 py-8 sm:px-9 sm:py-10">
                    {variant === 'platform' && (
                        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-primary">
                            Platform admin
                        </p>
                    )}
                    {children}
                </TicketPanel>
            </div>
        </div>
    );
}
