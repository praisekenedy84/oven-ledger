import PosLayout from '@/Layouts/PosLayout';
import ProductVisual from '@/Components/ProductVisual';
import TicketPanel from '@/Components/TicketPanel';
import { formatMoney } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import AddIcon from '@mui/icons-material/Add';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const CHANNELS = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'custom', label: 'Custom' },
];

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit or Debit Card' },
    { value: 'credit_account', label: 'Credit Account' },
    { value: 'mobile_money', label: 'Mobile Money' },
];

function ProductCard({ product, price, qtyInCart, onAdd }) {
    const inCart = qtyInCart > 0;

    return (
        <Card
            sx={{
                height: '100%',
                borderColor: inCart ? colors.jam : colors.border,
                '&:hover': { borderColor: colors.jam },
            }}
        >
            <CardContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    p: 0,
                    '&:last-child': { pb: 0 },
                }}
            >
                <ProductVisual
                    product={product}
                    size="100%"
                    radius="10px 10px 0 0"
                    sx={{ height: 120, width: '100%' }}
                />
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, gap: 0.75 }}>
                    <Typography variant="subtitle2" sx={{ lineHeight: 1.25 }}>
                        {product.name}
                    </Typography>
                    <Typography variant="h6" sx={{ color: colors.jam }}>
                        {formatMoney(price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                        {product.category || (product.type === 'trading' ? 'Tools & supplies' : 'Bakery')}
                    </Typography>
                    <Button
                        fullWidth
                        variant={inCart ? 'outlined' : 'contained'}
                        color={inCart ? 'inherit' : 'primary'}
                        onClick={() => onAdd(product)}
                        sx={{ mt: 0.5 }}
                    >
                        {inCart ? `Add more (${qtyInCart})` : 'Add to ticket'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function Pos({ products, customers = [], clients = [], priceLists }) {
    const { errors } = usePage().props;
    const [ticket, setTicket] = useState([]);
    const [channel, setChannel] = useState('retail');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerId, setCustomerId] = useState('');
    const [isPreOrder, setIsPreOrder] = useState(false);
    const [fulfillmentType, setFulfillmentType] = useState('pickup');
    const [requestedFulfillmentAt, setRequestedFulfillmentAt] = useState('');
    const [deliveryAddressId, setDeliveryAddressId] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [department, setDepartment] = useState('bakery');
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const directory = customers.length ? customers : clients;

    const priceMap = useMemo(() => {
        const map = {};
        priceLists.forEach((pl) => {
            map[`${pl.product_id}-${pl.channel}`] = Number(pl.price);
        });
        return map;
    }, [priceLists]);

    const getPrice = (productId) => {
        const ch = channel === 'custom' ? 'retail' : channel;
        return priceMap[`${productId}-${ch}`] ?? 0;
    };

    useEffect(() => {
        setTicket((prev) =>
            prev.map((line) => ({
                ...line,
                unit_price: getPrice(line.product_id),
            })),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh prices when channel/price map changes
    }, [channel, priceMap]);

    useEffect(() => {
        setCategory('all');
    }, [department]);

    const departmentProducts = useMemo(
        () =>
            products.filter((p) =>
                department === 'tools' ? p.type === 'trading' : p.type !== 'trading',
            ),
        [products, department],
    );

    const categories = useMemo(() => {
        const set = new Set();
        departmentProducts.forEach((p) => {
            if (p.category) {
                set.add(p.category);
            }
        });
        return ['all', ...Array.from(set).sort()];
    }, [departmentProducts]);

    const filteredProducts = useMemo(() => {
        const q = search.trim().toLowerCase();
        return departmentProducts.filter((p) => {
            const matchesCategory = category === 'all' || p.category === category;
            const matchesSearch =
                !q ||
                p.name.toLowerCase().includes(q) ||
                (p.category ?? '').toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [departmentProducts, category, search]);

    const qtyByProduct = useMemo(() => {
        const map = {};
        ticket.forEach((line) => {
            map[line.product_id] = line.quantity;
        });
        return map;
    }, [ticket]);

    const addToTicket = (product) => {
        const unitPrice = getPrice(product.id);
        setTicket((prev) => {
            const existing = prev.find((l) => l.product_id === product.id);
            if (existing) {
                return prev.map((l) =>
                    l.product_id === product.id
                        ? { ...l, quantity: l.quantity + 1 }
                        : l,
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    category: product.category,
                    quantity: 1,
                    unit_price: unitPrice,
                },
            ];
        });
    };

    const bumpQty = (productId, delta) => {
        setTicket((prev) =>
            prev
                .map((l) =>
                    l.product_id === productId
                        ? { ...l, quantity: l.quantity + delta }
                        : l,
                )
                .filter((l) => l.quantity > 0),
        );
    };

    const clearTicket = () => setTicket([]);

    const subtotal = ticket.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
    const tax = 0;
    const discount = 0;
    const total = subtotal + tax - discount;

    const selectedCustomer = directory.find((c) => String(c.id) === String(customerId));
    const customerAddresses = selectedCustomer?.addresses ?? [];
    const visibleCustomers = directory.filter(
        (c) => channel === 'retail' || channel === 'custom' || c.type === channel || c.type === 'retail',
    );
    const creditSale = paymentMethod === 'credit_account';
    const deposit = isPreOrder && depositAmount !== '' ? Number(depositAmount) : 0;
    const remainderOnAccount = creditSale
        ? total
        : isPreOrder && deposit > 0 && deposit < total
          ? total - deposit
          : 0;

    const submit = (e) => {
        e.preventDefault();
        if (ticket.length === 0 || processing) {
            return;
        }

        const payments =
            isPreOrder && deposit > 0 && deposit < total && paymentMethod !== 'credit_account'
                ? [
                      { method: paymentMethod, amount: deposit },
                      { method: 'credit_account', amount: remainderOnAccount },
                  ]
                : [{ method: paymentMethod, amount: total }];

        setProcessing(true);
        router.post(
            route('tenant.pos.store'),
            {
                channel,
                customer_id: customerId || null,
                is_pre_order: isPreOrder,
                fulfillment_type: fulfillmentType,
                requested_fulfillment_at: requestedFulfillmentAt || null,
                delivery_address_id: fulfillmentType === 'delivery' ? deliveryAddressId || null : null,
                deposit_amount: isPreOrder ? deposit || null : null,
                items: ticket.map((l) => ({
                    product_id: l.product_id,
                    quantity: l.quantity,
                })),
                payments,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTicket([]);
                    setCustomerId('');
                    setIsPreOrder(false);
                    setFulfillmentType('pickup');
                    setRequestedFulfillmentAt('');
                    setDeliveryAddressId('');
                    setDepositAmount('');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <PosLayout>
            <Head title="Point of Sale" />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' },
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                {/* Center: catalog */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                        overflow: 'hidden',
                        p: { xs: 2, md: 3 },
                        gap: 2.5,
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Box>
                            <Typography variant="overline" sx={{ color: colors.jam }}>
                                Point of sale
                            </Typography>
                            <Typography variant="h4">Order line</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Bakery or tools — then build the ticket.
                            </Typography>
                        </Box>
                        <IconButton size="small" sx={{ border: `1px solid ${colors.border}` }}>
                            <MoreHorizIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        {[
                            { value: 'bakery', label: 'Bakery' },
                            { value: 'tools', label: 'Tools & supplies' },
                        ].map((tab) => {
                            const active = department === tab.value;
                            return (
                                <Button
                                    key={tab.value}
                                    type="button"
                                    variant={active ? 'contained' : 'outlined'}
                                    onClick={() => setDepartment(tab.value)}
                                    sx={{ px: 2 }}
                                >
                                    {tab.label}
                                </Button>
                            );
                        })}
                    </Stack>

                    <TextField
                        size="small"
                        placeholder="Search products…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: colors.muted }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            maxWidth: 420,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 999,
                                bgcolor: 'background.paper',
                            },
                        }}
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ pb: 0.5 }}
                    >
                        {categories.map((cat) => {
                            const active = category === cat;
                            const label = cat === 'all' ? 'All' : cat;
                            return (
                                <Chip
                                    key={cat}
                                    label={label}
                                    clickable
                                    onClick={() => setCategory(cat)}
                                    variant="outlined"
                                    sx={{
                                        height: 36,
                                        px: 0.5,
                                        fontWeight: 600,
                                        borderColor: active ? colors.jam : colors.border,
                                        color: active ? colors.jam : colors.muted,
                                        bgcolor: active ? `${colors.jam}14` : 'transparent',
                                    }}
                                />
                            );
                        })}
                    </Stack>

                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            pr: 0.5,
                            pb: 2,
                        }}
                    >
                        {filteredProducts.length === 0 ? (
                            <Box
                                sx={{
                                    py: 8,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                <Typography>No products match this filter.</Typography>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: {
                                        xs: 'repeat(2, minmax(0, 1fr))',
                                        sm: 'repeat(3, minmax(0, 1fr))',
                                        xl: 'repeat(4, minmax(0, 1fr))',
                                    },
                                }}
                            >
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        price={getPrice(product.id)}
                                        qtyInCart={qtyByProduct[product.id] ?? 0}
                                        onAdd={addToTicket}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Right: order summary */}
                <TicketPanel
                    component="form"
                    onSubmit={submit}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: { lg: `1px solid ${colors.border}` },
                        borderTop: { xs: `1px solid ${colors.border}`, lg: 'none' },
                        bgcolor: colors.cream,
                        height: { xs: 'auto', lg: '100vh' },
                        maxHeight: { xs: 'none', lg: '100vh' },
                        overflow: 'hidden',
                        borderRadius: 0,
                    }}
                >
                    <Box sx={{ p: 2.5, pb: 2, borderBottom: `1px solid ${colors.border}` }}>
                        <Typography variant="overline" sx={{ color: colors.jam }}>
                            Ticket
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Order ticket
                        </Typography>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {CHANNELS.map((ch) => {
                                const active = channel === ch.value;
                                return (
                                    <Button
                                        key={ch.value}
                                        type="button"
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setChannel(ch.value)}
                                        sx={{
                                            borderRadius: 999,
                                            px: 1.75,
                                            borderColor: active ? colors.jam : colors.border,
                                            color: active ? colors.jam : colors.muted,
                                            bgcolor: active ? `${colors.jam}14` : 'transparent',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {ch.label}
                                    </Button>
                                );
                            })}
                        </Stack>

                        <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                            <FormControl fullWidth size="small">
                                <Select
                                    displayEmpty
                                    value={customerId}
                                    onChange={(e) => {
                                        setCustomerId(e.target.value);
                                        setDeliveryAddressId('');
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Walk-in / no account</em>
                                    </MenuItem>
                                    {visibleCustomers.map((c) => (
                                        <MenuItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Stack direction="row" spacing={1}>
                                <Button
                                    type="button"
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        const next = !isPreOrder;
                                        setIsPreOrder(next);
                                        if (!next) {
                                            setDepositAmount('');
                                        }
                                    }}
                                    sx={{
                                        flex: 1,
                                        borderRadius: 999,
                                        borderColor: isPreOrder ? colors.jam : colors.border,
                                        bgcolor: isPreOrder ? `${colors.jam}14` : 'transparent',
                                        color: isPreOrder ? colors.jam : colors.muted,
                                        fontWeight: 600,
                                    }}
                                >
                                    Pre-order
                                </Button>
                                {['pickup', 'delivery'].map((type) => (
                                    <Button
                                        key={type}
                                        type="button"
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setFulfillmentType(type)}
                                        sx={{
                                            flex: 1,
                                            borderRadius: 999,
                                            borderColor:
                                                fulfillmentType === type ? colors.jam : colors.border,
                                            bgcolor:
                                                fulfillmentType === type
                                                    ? `${colors.jam}14`
                                                    : 'transparent',
                                            color:
                                                fulfillmentType === type ? colors.jam : colors.muted,
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </Stack>

                            {(isPreOrder || fulfillmentType === 'delivery') && (
                                <TextField
                                    size="small"
                                    type="datetime-local"
                                    label="Requested for"
                                    value={requestedFulfillmentAt}
                                    onChange={(e) => setRequestedFulfillmentAt(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}

                            {fulfillmentType === 'delivery' && (
                                <FormControl fullWidth size="small">
                                    <Select
                                        displayEmpty
                                        value={deliveryAddressId}
                                        onChange={(e) => setDeliveryAddressId(e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>Choose delivery address</em>
                                        </MenuItem>
                                        {customerAddresses.map((address) => (
                                            <MenuItem key={address.id} value={String(address.id)}>
                                                {address.label} — {address.address_text}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {isPreOrder && (
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Deposit (TZS)"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                />
                            )}

                            <TextField
                                size="small"
                                label="Channel price"
                                value={CHANNELS.find((c) => c.value === channel)?.label ?? channel}
                                InputProps={{ readOnly: true }}
                            />
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            px: 2.5,
                            py: 2,
                        }}
                    >
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1.5 }}
                        >
                            <Typography variant="subtitle2" fontWeight={700}>
                                Items ({ticket.length})
                            </Typography>
                            {ticket.length > 0 && (
                                <Button
                                    type="button"
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteOutlinedIcon fontSize="small" />}
                                    onClick={clearTicket}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Clear all
                                </Button>
                            )}
                        </Stack>

                        {ticket.length === 0 ? (
                            <Box
                                sx={{
                                    py: 6,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                <ShoppingBagOutlinedIcon sx={{ fontSize: 40, opacity: 0.35, mb: 1 }} />
                                <Typography variant="body2">
                                    Tap products to add items to the ticket.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1.5}>
                                {ticket.map((line) => (
                                    <Box
                                        key={line.product_id}
                                        sx={{
                                            display: 'flex',
                                            gap: 1.5,
                                            alignItems: 'flex-start',
                                            p: 1.25,
                                            borderRadius: 2,
                                            border: `1px solid ${colors.border}`,
                                            bgcolor: colors.surface,
                                        }}
                                    >
                                        <ProductVisual
                                            product={line}
                                            size={44}
                                        />

                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                spacing={1}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    noWrap
                                                >
                                                    {line.name}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    sx={{ color: colors.jam, whiteSpace: 'nowrap' }}
                                                >
                                                    {formatMoney(line.quantity * line.unit_price)}
                                                </Typography>
                                            </Stack>

                                            <Typography variant="caption" color="text.secondary">
                                                {formatMoney(line.unit_price)} each
                                            </Typography>

                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={0.5}
                                                sx={{ mt: 1 }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    type="button"
                                                    onClick={() => bumpQty(line.product_id, -1)}
                                                    sx={{
                                                        border: `1px solid ${colors.border}`,
                                                        width: 28,
                                                        height: 28,
                                                    }}
                                                >
                                                    <RemoveIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    sx={{ minWidth: 28, textAlign: 'center' }}
                                                >
                                                    {line.quantity}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    type="button"
                                                    onClick={() => bumpQty(line.product_id, 1)}
                                                    sx={{
                                                        border: `1px solid ${colors.border}`,
                                                        width: 28,
                                                        height: 28,
                                                    }}
                                                >
                                                    <AddIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>

                    <Box
                        sx={{
                            borderTop: `1px solid ${colors.border}`,
                            p: 2.5,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Stack spacing={1} sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                    Subtotal
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {formatMoney(subtotal)}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                    Taxes
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {formatMoney(tax)}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                    Discount
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color="error.main">
                                    −{formatMoney(discount)}
                                </Typography>
                            </Stack>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="baseline"
                                sx={{ pt: 0.5 }}
                            >
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Grand Total
                                </Typography>
                                <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{ color: colors.jam }}
                                >
                                    {formatMoney(total)}
                                </Typography>
                            </Stack>
                        </Stack>

                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <Select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <CreditCardOutlinedIcon
                                            sx={{ color: colors.muted, fontSize: 20 }}
                                        />
                                    </InputAdornment>
                                }
                            >
                                {PAYMENT_METHODS.map((method) => (
                                    <MenuItem key={method.value} value={method.value}>
                                        {method.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {(errors?.items ||
                            errors?.customer_id ||
                            errors?.delivery_address_id ||
                            errors?.payments) && (
                            <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
                                {errors.items ||
                                    errors.customer_id ||
                                    errors.delivery_address_id ||
                                    errors.payments}
                            </Typography>
                        )}

                        {remainderOnAccount > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                {formatMoney(remainderOnAccount)} will go on the customer account.
                            </Typography>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={
                                processing ||
                                ticket.length === 0 ||
                                (remainderOnAccount > 0 && !customerId) ||
                                (fulfillmentType === 'delivery' && (!customerId || !deliveryAddressId))
                            }
                            startIcon={<CreditCardOutlinedIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: 3,
                                fontSize: '1rem',
                            }}
                        >
                            {processing ? 'Recording…' : 'Confirm Payment'}
                        </Button>
                    </Box>
                </TicketPanel>
            </Box>
        </PosLayout>
    );
}
