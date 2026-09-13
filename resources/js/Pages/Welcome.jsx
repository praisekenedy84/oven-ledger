import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import TicketPanel from '@/Components/TicketPanel';
import { colors } from '@/theme/bakeryTheme';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BakeryDiningOutlinedIcon from '@mui/icons-material/BakeryDiningOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const FEATURES = [
    {
        icon: BakeryDiningOutlinedIcon,
        title: 'Production batches',
        copy: 'Open a mix, move it through baking and cooling, and know what is ready for the counter.',
    },
    {
        icon: MenuBookOutlinedIcon,
        title: 'Recipes that hold',
        copy: 'Keep the bill of materials with the bake so flour, yeast, and yield stay on the same page.',
    },
    {
        icon: Inventory2OutlinedIcon,
        title: 'Stock and waste',
        copy: 'Watch raw materials, finished goods, and shrinkage before the count drifts overnight.',
    },
    {
        icon: PointOfSaleOutlinedIcon,
        title: 'A till for every channel',
        copy: 'Retail tickets, wholesale terms, restaurant supply, and the tools shelf — one checkout.',
    },
    {
        icon: PeopleOutlinedIcon,
        title: 'Customer ledgers',
        copy: 'Credit, payments, and delivery addresses live with the customer, not in a side notebook.',
    },
    {
        icon: AssessmentOutlinedIcon,
        title: 'The close of day',
        copy: 'Sales by channel, low stock, and yield — the numbers the owner reads before lights out.',
    },
];

const CHANNELS = [
    { icon: StorefrontOutlinedIcon, title: 'Retail', copy: 'Counter tickets, cash and card.' },
    { icon: WarehouseOutlinedIcon, title: 'Wholesale', copy: 'Price lists and standing orders.' },
    { icon: RestaurantOutlinedIcon, title: 'Restaurant', copy: 'HoReCa supply on account.' },
    { icon: LocalMallOutlinedIcon, title: 'Tools shelf', copy: 'Pans, bags, and packaging.' },
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

function riseSx(delay = 0) {
    return {
        '@keyframes welcomeRise': {
            from: { opacity: 0, transform: 'translateY(18px)' },
            to: { opacity: 1, transform: 'none' },
        },
        animation: `welcomeRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    };
}

function useInView() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || visible) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.14 },
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, [visible]);

    return [ref, visible];
}

function ActionButtons({ canLogin, size = 'large' }) {
    return (
        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
            {canLogin && (
                <Button
                    component={Link}
                    href={route('login')}
                    variant="contained"
                    color="primary"
                    size={size}
                    sx={{ px: 3.5 }}
                >
                    Login
                </Button>
            )}
            <Button
                href="#contact"
                variant="outlined"
                size={size}
                sx={{
                    px: 3.5,
                    color: 'inherit',
                    borderColor: 'currentColor',
                    '&:hover': {
                        borderColor: 'currentColor',
                        bgcolor: 'rgba(251,246,234,0.1)',
                    },
                }}
            >
                Contact us
            </Button>
        </Stack>
    );
}

function MorningBoard() {
    return (
        <Box
            sx={{
                position: 'relative',
                ...riseSx(180),
            }}
        >
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: { xs: '18% 12%', md: '16% 10%' },
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(227,167,43,0.42) 0%, rgba(156,43,58,0.08) 55%, transparent 72%)',
                    filter: 'blur(18px)',
                    '@keyframes emberGlow': {
                        '0%, 100%': { opacity: 0.55, transform: 'scale(1)' },
                        '50%': { opacity: 0.9, transform: 'scale(1.06)' },
                    },
                    animation: 'emberGlow 4.8s ease-in-out infinite',
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            />

            <Box
                sx={{
                    position: 'relative',
                    borderRadius: '28px 28px 18px 18px',
                    p: '10px',
                    background: 'linear-gradient(180deg, #4A3728 0%, #2A1E16 100%)',
                    boxShadow: '0 28px 60px rgba(20, 12, 8, 0.45)',
                    border: '1px solid rgba(227,167,43,0.28)',
                }}
            >
                <Stack direction="row" spacing={0.8} sx={{ px: 1.5, pb: 1.25 }}>
                    {[0, 1, 2].map((i) => (
                        <Box
                            key={i}
                            aria-hidden
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: i === 1 ? colors.butter : 'rgba(251,246,234,0.18)',
                                '@keyframes steamLift': {
                                    '0%': { transform: 'translateY(6px)', opacity: 0 },
                                    '35%': { opacity: 0.55 },
                                    '100%': { transform: 'translateY(-16px)', opacity: 0 },
                                },
                                animation: `steamLift 2.8s ease-out ${i * 0.45}s infinite`,
                                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                            }}
                        />
                    ))}
                </Stack>

                <Box
                    sx={{
                        borderRadius: '18px 18px 12px 12px',
                        overflow: 'hidden',
                        bgcolor: colors.cream,
                        border: `1px solid ${colors.border}`,
                        minHeight: 360,
                    }}
                >
                    <Box
                        sx={{
                            px: 2.5,
                            py: 1.75,
                            borderBottom: `1px solid ${colors.border}`,
                            background: colors.wheatLight,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                Morning board
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 0.25 }}>
                                Today’s bake
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Kariakoo branch
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ px: 2.5, pt: 2 }}>
                        {[
                            ['On the floor', '6'],
                            ['Ready', '3'],
                            ['TZS today', '184k'],
                        ].map(([label, value], index) => (
                            <Box
                                key={label}
                                sx={{
                                    flex: 1,
                                    px: 1.25,
                                    py: 1,
                                    borderRadius: 1.5,
                                    bgcolor: colors.kraft,
                                    border: `1px solid ${colors.border}`,
                                    ...riseSx(320 + index * 80),
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {label}
                                </Typography>
                                <Typography variant="subtitle1">{value}</Typography>
                            </Box>
                        ))}
                    </Stack>

                    <Stack spacing={1} sx={{ p: 2.5 }}>
                        {BOARD_TICKETS.map((ticket, index) => (
                            <Box
                                key={ticket.label}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.15,
                                    borderRadius: 1.5,
                                    bgcolor: colors.cream,
                                    border: `1px dashed ${colors.border}`,
                                    ...riseSx(480 + index * 110),
                                }}
                            >
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {ticket.time}
                                    </Typography>
                                    <Typography variant="subtitle2">{ticket.label}</Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 700,
                                        color:
                                            ticket.tone === 'jam'
                                                ? colors.jam
                                                : ticket.tone === 'sage'
                                                  ? colors.sage
                                                  : colors.ink,
                                    }}
                                >
                                    {ticket.status}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}

function Reveal({ children, delay = 0 }) {
    const [ref, visible] = useInView();

    return (
        <Box
            ref={ref}
            sx={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(22px)',
                transition: 'opacity 0.65s ease, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
                transitionDelay: `${delay}ms`,
                '@media (prefers-reduced-motion: reduce)': {
                    opacity: 1,
                    transform: 'none',
                    transition: 'none',
                },
            }}
        >
            {children}
        </Box>
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
        <TicketPanel sx={{ px: { xs: 2.5, md: 3.5 }, py: { xs: 3, md: 4 } }}>
            {flash?.success && (
                <Alert severity="success" sx={{ mb: 2.5 }}>
                    {flash.success}
                </Alert>
            )}

            <Stack
                component="form"
                spacing={2}
                onSubmit={(event) => {
                    event.preventDefault();
                    post(route('contact.store'), {
                        preserveScroll: true,
                        onSuccess: () => reset(),
                    });
                }}
            >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <InputLabel htmlFor="contact-name" value="Your name" />
                        <TextInput
                            id="contact-name"
                            value={data.name}
                            autoComplete="name"
                            onChange={(event) => setData('name', event.target.value)}
                        />
                        <InputError message={errors.name} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <InputLabel htmlFor="contact-bakery" value="Bakery name" />
                        <TextInput
                            id="contact-bakery"
                            value={data.bakery}
                            onChange={(event) => setData('bakery', event.target.value)}
                        />
                        <InputError message={errors.bakery} />
                    </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <InputLabel htmlFor="contact-email" value="Email" />
                        <TextInput
                            id="contact-email"
                            type="email"
                            value={data.email}
                            autoComplete="email"
                            onChange={(event) => setData('email', event.target.value)}
                        />
                        <InputError message={errors.email} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <InputLabel htmlFor="contact-phone" value="Phone (optional)" />
                        <TextInput
                            id="contact-phone"
                            value={data.phone}
                            autoComplete="tel"
                            onChange={(event) => setData('phone', event.target.value)}
                        />
                        <InputError message={errors.phone} />
                    </Box>
                </Stack>

                <Box>
                    <InputLabel htmlFor="contact-message" value="What should we set up?" />
                    <TextInput
                        id="contact-message"
                        value={data.message}
                        multiline
                        minRows={4}
                        onChange={(event) => setData('message', event.target.value)}
                    />
                    <InputError message={errors.message} />
                </Box>

                <Button type="submit" variant="contained" size="large" disabled={processing} sx={{ alignSelf: 'flex-start', px: 4 }}>
                    Send message
                </Button>
            </Stack>
        </TicketPanel>
    );
}

export default function Welcome({ canLogin }) {
    return (
        <>
            <Head title="The bakery’s book" />

            <Box sx={{ bgcolor: colors.cream, color: colors.ink, overflow: 'hidden' }}>
                <Box
                    component="header"
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        px: { xs: 2, md: 4 },
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        bgcolor: 'rgba(251,246,234,0.88)',
                        backdropFilter: 'blur(14px)',
                        borderBottom: `1px solid ${colors.border}`,
                    }}
                >
                    <Box component={Link} href="/" sx={{ color: colors.ink, textDecoration: 'none' }}>
                        <ApplicationLogo showText />
                    </Box>

                    <Stack direction="row" spacing={1.25}>
                        {canLogin && (
                            <Button component={Link} href={route('login')} variant="contained" color="primary">
                                Login
                            </Button>
                        )}
                        <Button
                            href="#contact"
                            variant="outlined"
                            sx={{
                                borderColor: colors.border,
                                color: colors.ink,
                                '&:hover': {
                                    borderColor: colors.ink,
                                    bgcolor: 'rgba(51,38,28,0.04)',
                                },
                            }}
                        >
                            Contact us
                        </Button>
                    </Stack>
                </Box>

                <Box
                    component="section"
                    sx={{
                        position: 'relative',
                        px: { xs: 2.5, md: 6 },
                        py: { xs: 8, md: 12 },
                        color: colors.cream,
                        bgcolor: colors.ink,
                    }}
                >
                    <Box
                        aria-hidden
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'url(/images/bakery/login.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 0.28,
                        }}
                    />
                    <Box
                        aria-hidden
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            background:
                                'linear-gradient(115deg, rgba(51,38,28,0.92) 0%, rgba(51,38,28,0.72) 48%, rgba(51,38,28,0.4) 100%)',
                        }}
                    />

                    <Box
                        sx={{
                            position: 'relative',
                            maxWidth: 1180,
                            mx: 'auto',
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(320px, 460px)' },
                            gap: { xs: 6, lg: 8 },
                            alignItems: 'center',
                        }}
                    >
                        <Stack spacing={2.5} sx={{ ...riseSx(40), maxWidth: 560 }}>
                            <Typography variant="overline" sx={{ color: colors.butter }}>
                                Multi-tenant bakery SaaS
                            </Typography>
                            <Typography variant="h1" sx={{ fontSize: { xs: '2.4rem', md: '3.4rem' }, color: colors.cream }}>
                                The bakery’s book, kept warm.
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(251,246,234,0.78)', maxWidth: 460, fontSize: '1.05rem' }}>
                                Production, inventory, and multi-channel sales in one ledger — built for bakeries
                                that sell at the counter, to shops, and to restaurants from the same oven.
                            </Typography>
                            <Box sx={{ pt: 1, color: colors.cream }}>
                                <ActionButtons canLogin={canLogin} />
                            </Box>
                        </Stack>

                        <MorningBoard />
                    </Box>
                </Box>

                <Box component="section" sx={{ px: { xs: 2.5, md: 6 }, py: { xs: 8, md: 11 }, bgcolor: colors.cream }}>
                    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
                        <Reveal>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                In the book
                            </Typography>
                            <Typography variant="h2" sx={{ mt: 1, maxWidth: 520 }}>
                                The work of the bake, not a generic dashboard.
                            </Typography>
                        </Reveal>

                        <Box
                            sx={{
                                mt: 5,
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                                gap: 2,
                            }}
                        >
                            {FEATURES.map((feature, index) => {
                                const Icon = feature.icon;

                                return (
                                    <Reveal key={feature.title} delay={index * 70}>
                                        <Box
                                            sx={{
                                                height: '100%',
                                                p: 2.75,
                                                borderRadius: 2,
                                                bgcolor: colors.kraft,
                                                border: `1px solid ${colors.border}`,
                                                transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 12px 28px rgba(51,38,28,0.08)',
                                                },
                                                '@media (prefers-reduced-motion: reduce)': {
                                                    '&:hover': { transform: 'none' },
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    borderRadius: 1.5,
                                                    bgcolor: colors.cream,
                                                    color: colors.jam,
                                                    mb: 2,
                                                }}
                                            >
                                                <Icon fontSize="small" />
                                            </Box>
                                            <Typography variant="h6">{feature.title}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                                {feature.copy}
                                            </Typography>
                                        </Box>
                                    </Reveal>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>

                <Box component="section" sx={{ px: { xs: 2.5, md: 6 }, py: { xs: 8, md: 10 }, bgcolor: colors.kraft }}>
                    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
                        <Reveal>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                Channels
                            </Typography>
                            <Typography variant="h2" sx={{ mt: 1, maxWidth: 480 }}>
                                One oven. Four ways the goods leave the shop.
                            </Typography>
                        </Reveal>

                        <Box
                            sx={{
                                mt: 4.5,
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                                gap: 2,
                            }}
                        >
                            {CHANNELS.map((channel, index) => {
                                const Icon = channel.icon;

                                return (
                                    <Reveal key={channel.title} delay={index * 80}>
                                        <Stack
                                            spacing={1}
                                            sx={{
                                                p: 2.5,
                                                height: '100%',
                                                bgcolor: colors.cream,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: 2,
                                            }}
                                        >
                                            <Icon sx={{ color: colors.jam }} />
                                            <Typography variant="h6">{channel.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {channel.copy}
                                            </Typography>
                                        </Stack>
                                    </Reveal>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>

                <Box component="section" sx={{ px: { xs: 2.5, md: 6 }, py: { xs: 8, md: 11 }, bgcolor: colors.cream }}>
                    <Box sx={{ maxWidth: 880, mx: 'auto' }}>
                        <Reveal>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                The day’s rhythm
                            </Typography>
                            <Typography variant="h2" sx={{ mt: 1 }}>
                                From the mixer to the close.
                            </Typography>
                        </Reveal>

                        <Stack spacing={0} sx={{ mt: 5 }}>
                            {RHYTHM.map((step, index) => (
                                <Reveal key={step.title} delay={index * 90}>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '56px 1fr', md: '72px 1fr' },
                                            gap: 2,
                                            py: 2.5,
                                            borderTop: `1px solid ${colors.border}`,
                                            '&:last-of-type': { borderBottom: `1px solid ${colors.border}` },
                                        }}
                                    >
                                        <Typography variant="h4" sx={{ color: colors.jam, fontFeatureSettings: '"frac"' }}>
                                            {String(index + 1).padStart(2, '0')}
                                        </Typography>
                                        <Box>
                                            <Typography variant="h5">{step.title}</Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 520 }}>
                                                {step.copy}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Reveal>
                            ))}
                        </Stack>
                    </Box>
                </Box>

                <Box
                    id="contact"
                    component="section"
                    sx={{
                        px: { xs: 2.5, md: 6 },
                        py: { xs: 8, md: 11 },
                        bgcolor: colors.kraft,
                        scrollMarginTop: 88,
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: 1180,
                            mx: 'auto',
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.85fr) minmax(0, 1.15fr)' },
                            gap: { xs: 4, lg: 7 },
                            alignItems: 'start',
                        }}
                    >
                        <Reveal>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                Get on the book
                            </Typography>
                            <Typography variant="h2" sx={{ mt: 1 }}>
                                Tell us about the bakery.
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 420 }}>
                                Existing shops sign in. New bakeries write us — Mernet opens the tenant,
                                sets the branches, and turns on the features you need.
                            </Typography>
                            {canLogin && (
                                <Button
                                    component={Link}
                                    href={route('login')}
                                    variant="contained"
                                    sx={{ mt: 3 }}
                                >
                                    Login
                                </Button>
                            )}
                        </Reveal>

                        <Reveal delay={80}>
                            <ContactForm />
                        </Reveal>
                    </Box>
                </Box>

                <Box
                    component="footer"
                    sx={{
                        px: { xs: 2.5, md: 6 },
                        py: 3,
                        bgcolor: colors.ink,
                        color: colors.cream,
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: 1180,
                            mx: 'auto',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: 'rgba(251,246,234,0.72)' }}>
                            Oven Ledger · A Mernet bakery ledger
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            {canLogin && (
                                <Button component={Link} href={route('login')} size="small" sx={{ color: colors.cream }}>
                                    Login
                                </Button>
                            )}
                            <Button href="#contact" size="small" sx={{ color: colors.cream }}>
                                Contact us
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </>
    );
}
