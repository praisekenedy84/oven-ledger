import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import TicketPanel from '@/Components/TicketPanel';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    CreditCard,
    Package,
    ShoppingBag,
    Store,
    Users,
    UtensilsCrossed,
    Warehouse,
    Wheat,
} from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';

const FEATURES = [
    {
        icon: Wheat,
        title: 'Production batches',
        copy: 'Open a mix, move it through baking and cooling, and know what is ready for the counter.',
    },
    {
        icon: BookOpen,
        title: 'Recipes that hold',
        copy: 'Keep the bill of materials with the bake so flour, yeast, and yield stay on the same page.',
    },
    {
        icon: Package,
        title: 'Stock and waste',
        copy: 'Watch raw materials, finished goods, and shrinkage before the count drifts overnight.',
    },
    {
        icon: CreditCard,
        title: 'A till for every channel',
        copy: 'Retail tickets, wholesale terms, restaurant supply, and the tools shelf — one checkout.',
    },
    {
        icon: Users,
        title: 'Customer ledgers',
        copy: 'Credit, payments, and delivery addresses live with the customer, not in a side notebook.',
    },
    {
        icon: BarChart3,
        title: 'The close of day',
        copy: 'Sales by channel, low stock, and yield — the numbers the owner reads before lights out.',
    },
];

const CHANNELS = [
    { icon: Store, title: 'Retail', copy: 'Counter tickets, cash and card.' },
    { icon: Warehouse, title: 'Wholesale', copy: 'Price lists and standing orders.' },
    { icon: UtensilsCrossed, title: 'Restaurant', copy: 'HoReCa supply on account.' },
    { icon: ShoppingBag, title: 'Tools shelf', copy: 'Pans, bags, and packaging.' },
];

const RHYTHM = [
    {
        title: 'Mix the batch',
        copy: 'Start from the recipe, weigh the room, and put a due time on the tray.',
    },
    {
        title: 'Sell the ticket',
        copy: 'The same goods leave as retail, wholesale, or a restaurant drop — priced for the channel.',
    },
    {
        title: 'Close the book',
        copy: 'Waste is logged, credit is collected, and the owner sees the day in one ledger.',
    },
];

const BOARD_TICKETS = [
    { time: '05:40', label: 'Batch 14 · Mandazi', status: 'Baking', tone: 'butter' },
    { time: '07:10', label: 'Retail counter', status: '42 tickets', tone: 'sage' },
    { time: '08:00', label: 'Wheat flour 00', status: 'Low stock', tone: 'jam' },
];

function Reveal({ children, delay = 0, className }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.14 });
    const reduceMotion = useReducedMotion();

    if (reduceMotion) {
        return (
            <div ref={ref} className={className}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
            transition={{ duration: 0.65, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

function ActionButtons({ canLogin, size = 'lg' }) {
    return (
        <div className="flex flex-wrap gap-3">
            {canLogin && (
                <Button asChild size={size} className="px-7">
                    <Link href={route('login')}>Login</Link>
                </Button>
            )}
            <Button
                asChild
                variant="outline"
                size={size}
                className="border-current px-7 text-inherit hover:bg-cream/10"
            >
                <a href="#contact">Contact us</a>
            </Button>
        </div>
    );
}

function MorningBoard() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
        >
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-[12%] inset-y-[18%] rounded-full blur-[18px] md:inset-x-[10%] md:inset-y-[16%]"
                style={{
                    background:
                        'radial-gradient(circle, rgba(227,167,43,0.42) 0%, rgba(156,43,58,0.08) 55%, transparent 72%)',
                }}
                animate={
                    reduceMotion
                        ? undefined
                        : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.06, 1] }
                }
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative rounded-[28px_28px_18px_18px] border border-butter/30 bg-gradient-to-b from-[#4A3728] to-[#2A1E16] p-2.5 shadow-[0_28px_60px_rgba(20,12,8,0.45)]">
                <div className="flex gap-2 px-3 pb-3">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            aria-hidden
                            className={cn(
                                'h-2.5 w-2.5 rounded-full',
                                i === 1 ? 'bg-butter' : 'bg-cream/20',
                            )}
                            animate={
                                reduceMotion
                                    ? undefined
                                    : { y: [-6, -16], opacity: [0, 0.55, 0] }
                            }
                            transition={{
                                duration: 2.8,
                                repeat: Infinity,
                                delay: i * 0.45,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                </div>

                <div className="min-h-[360px] overflow-hidden rounded-[18px_18px_12px_12px] border border-border bg-cream">
                    <div className="flex items-baseline justify-between gap-4 border-b border-border bg-wheat-light px-5 py-3.5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-jam">Morning board</p>
                            <p className="mt-0.5 text-lg font-semibold text-ink">Today’s bake</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Kariakoo branch</p>
                    </div>

                    <div className="flex gap-2 px-5 pt-4">
                        {[
                            ['On the floor', '6'],
                            ['Ready', '3'],
                            ['TZS today', '184k'],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex-1 rounded-md border border-border bg-kraft px-3 py-2"
                            >
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-base font-semibold text-ink">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 p-5">
                        {BOARD_TICKETS.map((ticket) => (
                            <div
                                key={ticket.label}
                                className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-cream px-3 py-2.5"
                            >
                                <div>
                                    <p className="text-xs text-muted-foreground">{ticket.time}</p>
                                    <p className="text-sm font-semibold text-ink">{ticket.label}</p>
                                </div>
                                <p
                                    className={cn(
                                        'text-xs font-bold',
                                        ticket.tone === 'jam'
                                            ? 'text-jam'
                                            : ticket.tone === 'sage'
                                              ? 'text-sage'
                                              : 'text-ink',
                                    )}
                                >
                                    {ticket.status}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ContactForm() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        bakery: '',
        email: '',
        phone: '',
        message: '',
    });

    return (
        <TicketPanel className="px-5 py-6 md:px-7 md:py-8">
            {flash?.success && (
                <Alert variant="success" className="mb-5">
                    <AlertDescription>{flash.success}</AlertDescription>
                </Alert>
            )}

            <form
                className="space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    post(route('contact.store'), {
                        preserveScroll: true,
                        onSuccess: () => reset(),
                    });
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="contact-name" value="Your name" />
                        <TextInput
                            id="contact-name"
                            value={data.name}
                            autoComplete="name"
                            onChange={(event) => setData('name', event.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <InputLabel htmlFor="contact-bakery" value="Bakery name" />
                        <TextInput
                            id="contact-bakery"
                            value={data.bakery}
                            onChange={(event) => setData('bakery', event.target.value)}
                        />
                        <InputError message={errors.bakery} />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="contact-email" value="Email" />
                        <TextInput
                            id="contact-email"
                            type="email"
                            value={data.email}
                            autoComplete="email"
                            onChange={(event) => setData('email', event.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div>
                        <InputLabel htmlFor="contact-phone" value="Phone (optional)" />
                        <TextInput
                            id="contact-phone"
                            value={data.phone}
                            autoComplete="tel"
                            onChange={(event) => setData('phone', event.target.value)}
                        />
                        <InputError message={errors.phone} />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="contact-message" value="What should we set up?" />
                    <TextInput
                        id="contact-message"
                        value={data.message}
                        multiline
                        minRows={4}
                        onChange={(event) => setData('message', event.target.value)}
                    />
                    <InputError message={errors.message} />
                </div>

                <Button type="submit" size="lg" disabled={processing} className="px-8">
                    Send message
                </Button>
            </form>
        </TicketPanel>
    );
}

export default function Welcome({ canLogin }) {
    const reduceMotion = useReducedMotion();

    return (
        <>
            <Head title="The bakery’s book" />

            <div className="overflow-hidden bg-cream text-ink">
                <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-cream/90 px-4 py-3 backdrop-blur-md md:px-8">
                    <Link href="/" className="text-ink no-underline">
                        <ApplicationLogo showText />
                    </Link>

                    <div className="flex gap-2">
                        {canLogin && (
                            <Button asChild>
                                <Link href={route('login')}>Login</Link>
                            </Button>
                        )}
                        <Button asChild variant="outline" className="border-border text-ink hover:border-ink hover:bg-ink/5">
                            <a href="#contact">Contact us</a>
                        </Button>
                    </div>
                </header>

                <section className="relative bg-ink px-5 py-16 text-cream md:px-12 md:py-24">
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: 'url(/images/bakery/login.png)' }}
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-br from-ink/92 via-ink/72 to-ink/40"
                    />

                    <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:gap-16">
                        <motion.div
                            className="max-w-xl space-y-5"
                            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-wider text-butter">
                                Multi-tenant bakery SaaS
                            </p>
                            <h1 className="text-4xl font-bold leading-tight text-cream md:text-[3.4rem] md:leading-[1.08]">
                                <span className="block text-butter">Oven Ledger</span>
                                The bakery’s book, kept warm.
                            </h1>
                            <p className="max-w-md text-base leading-relaxed text-cream/80 md:text-[1.05rem]">
                                Production, inventory, and multi-channel sales in one ledger — built for bakeries
                                that sell at the counter, to shops, and to restaurants from the same oven.
                            </p>
                            <div className="pt-1 text-cream">
                                <ActionButtons canLogin={canLogin} />
                            </div>
                        </motion.div>

                        <MorningBoard />
                    </div>
                </section>

                <section className="bg-cream px-5 py-16 md:px-12 md:py-20">
                    <div className="mx-auto max-w-[1180px]">
                        <Reveal>
                            <p className="text-xs font-semibold uppercase tracking-wider text-jam">In the book</p>
                            <h2 className="mt-1 max-w-lg text-3xl font-bold text-ink md:text-4xl">
                                The work of the bake, not a generic dashboard.
                            </h2>
                        </Reveal>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feature, index) => {
                                const Icon = feature.icon;

                                return (
                                    <Reveal key={feature.title} delay={index * 70}>
                                        <div className="h-full rounded-card border border-border bg-kraft p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(51,38,28,0.08)] motion-reduce:hover:translate-y-0">
                                            <div className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-cream text-jam">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-ink">{feature.title}</h3>
                                            <p className="mt-2 text-sm text-muted-foreground">{feature.copy}</p>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-kraft px-5 py-16 md:px-12 md:py-20">
                    <div className="mx-auto max-w-[1180px]">
                        <Reveal>
                            <p className="text-xs font-semibold uppercase tracking-wider text-jam">Channels</p>
                            <h2 className="mt-1 max-w-md text-3xl font-bold text-ink md:text-4xl">
                                One oven. Four ways the goods leave the shop.
                            </h2>
                        </Reveal>

                        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {CHANNELS.map((channel, index) => {
                                const Icon = channel.icon;

                                return (
                                    <Reveal key={channel.title} delay={index * 80}>
                                        <div className="flex h-full flex-col gap-2 rounded-card border border-border bg-cream p-5">
                                            <Icon className="h-5 w-5 text-jam" />
                                            <h3 className="text-lg font-semibold text-ink">{channel.title}</h3>
                                            <p className="text-sm text-muted-foreground">{channel.copy}</p>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-cream px-5 py-16 md:px-12 md:py-20">
                    <div className="mx-auto max-w-[880px]">
                        <Reveal>
                            <p className="text-xs font-semibold uppercase tracking-wider text-jam">The day’s rhythm</p>
                            <h2 className="mt-1 text-3xl font-bold text-ink md:text-4xl">From the mixer to the close.</h2>
                        </Reveal>

                        <div className="mt-10">
                            {RHYTHM.map((step, index) => (
                                <Reveal key={step.title} delay={index * 90}>
                                    <div className="grid grid-cols-[56px_1fr] gap-4 border-t border-border py-5 md:grid-cols-[72px_1fr] last:border-b">
                                        <p className="text-3xl font-bold text-jam md:text-4xl">
                                            {String(index + 1).padStart(2, '0')}
                                        </p>
                                        <div>
                                            <h3 className="text-xl font-semibold text-ink md:text-2xl">{step.title}</h3>
                                            <p className="mt-2 max-w-lg text-muted-foreground">{step.copy}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="contact"
                    className="scroll-mt-[88px] bg-kraft px-5 py-16 md:px-12 md:py-20"
                >
                    <div className="mx-auto grid max-w-[1180px] items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
                        <Reveal>
                            <p className="text-xs font-semibold uppercase tracking-wider text-jam">Get on the book</p>
                            <h2 className="mt-1 text-3xl font-bold text-ink md:text-4xl">Tell us about the bakery.</h2>
                            <p className="mt-3 max-w-md text-muted-foreground">
                                Existing shops sign in. New bakeries write us — Mernet opens the tenant,
                                sets the branches, and turns on the features you need.
                            </p>
                            {canLogin && (
                                <Button asChild className="mt-5">
                                    <Link href={route('login')}>Login</Link>
                                </Button>
                            )}
                        </Reveal>

                        <Reveal delay={80}>
                            <ContactForm />
                        </Reveal>
                    </div>
                </section>

                <footer className="bg-ink px-5 py-6 text-cream md:px-12">
                    <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-cream/75">Oven Ledger · A Mernet bakery ledger</p>
                        <div className="flex gap-4">
                            {canLogin && (
                                <Button asChild variant="ghost" size="sm" className="text-cream hover:bg-cream/10 hover:text-cream">
                                    <Link href={route('login')}>Login</Link>
                                </Button>
                            )}
                            <Button asChild variant="ghost" size="sm" className="text-cream hover:bg-cream/10 hover:text-cream">
                                <a href="#contact">Contact us</a>
                            </Button>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
