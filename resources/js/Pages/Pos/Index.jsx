import ProductVisual from '@/Components/ProductVisual';
import SaleReceiptDialog from '@/Components/SaleReceiptDialog';
import TextInput from '@/Components/TextInput';
import TicketPanel from '@/Components/TicketPanel';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Sheet, SheetContent, SheetTitle } from '@/Components/ui/sheet';
import PosLayout from '@/Layouts/PosLayout';
import { formatMoney, formatQuantity } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    CreditCard,
    Minus,
    Plus,
    Search,
    ShoppingBag,
    Trash2,
    X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

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

const LOW_STOCK = 8;
const NONE = '__none__';

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const handler = (event) => setIsDesktop(event.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isDesktop;
}

function shelfQuantity(product) {
    const quantity = Number(product?.quantity_on_hand);

    return Number.isFinite(quantity) ? quantity : 0;
}

function shelfLabel(product) {
    const quantity = shelfQuantity(product);
    const unit = product?.unit_of_measure ? ` ${product.unit_of_measure}` : '';

    if (quantity <= 0) {
        return 'Out of stock';
    }

    return `${formatQuantity(quantity)}${unit} left`;
}

function PillButton({ active, onClick, children, className }) {
    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClick}
            className={cn(
                'min-h-10 rounded-full font-semibold',
                active
                    ? 'border-jam bg-jam/8 text-jam hover:border-jam hover:bg-jam/12 hover:text-jam'
                    : 'border-border text-muted-foreground',
                className,
            )}
        >
            {children}
        </Button>
    );
}

const ProductCard = memo(function ProductCard({ product, price, qtyInCart, allowOversell, onAdd }) {
    const inCart = qtyInCart > 0;
    const onHand = shelfQuantity(product);
    const outOfStock = onHand <= 0;
    const atLimit = !allowOversell && qtyInCart >= onHand;
    const lowStock = !outOfStock && onHand <= LOW_STOCK;
    const canAdd = allowOversell || (!outOfStock && !atLimit);

    return (
        <Card
            className={cn(
                'h-full overflow-hidden transition-colors',
                outOfStock ? 'border-border opacity-70' : inCart ? 'border-jam' : 'border-border',
                (canAdd || inCart) && 'hover:border-jam',
            )}
        >
            <CardContent className="flex h-full flex-col p-0">
                <div className="relative h-[88px] w-full sm:h-[120px]">
                    <ProductVisual
                        product={product}
                        size="100%"
                        radius="10px 10px 0 0"
                        className="absolute inset-0 h-full w-full"
                        style={{ filter: outOfStock ? 'grayscale(0.65)' : 'none' }}
                    />
                    <Badge
                        className={cn(
                            'absolute bottom-2 left-2 h-6 font-bold',
                            outOfStock
                                ? 'border-transparent bg-jam text-cream'
                                : lowStock
                                  ? 'border-transparent bg-butter text-ink'
                                  : 'border-transparent bg-sage text-cream',
                        )}
                    >
                        {shelfLabel(product)}
                    </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
                    <p className="text-sm font-semibold leading-tight">{product.name}</p>
                    <p className="text-base font-bold text-jam sm:text-lg">{formatMoney(price)}</p>
                    <p className="flex-1 text-xs text-muted-foreground">
                        {product.category || (product.type === 'trading' ? 'Tools & supplies' : 'Bakery')}
                    </p>
                    <Button
                        type="button"
                        variant={inCart ? 'outline' : 'default'}
                        disabled={!canAdd}
                        onClick={() => onAdd(product)}
                        className="mt-1 min-h-10 w-full"
                    >
                        {outOfStock && !allowOversell
                            ? 'Out of stock'
                            : atLimit
                              ? `On ticket (${formatQuantity(qtyInCart)})`
                              : inCart
                                ? `Add more (${formatQuantity(qtyInCart)})`
                                : allowOversell && outOfStock
                                  ? 'Add to pre-order'
                                  : 'Add to ticket'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
});

export default function Pos({ products, customers = [], clients = [], priceLists, todayTicketCount = 0 }) {
    const isDesktop = useIsDesktop();
    const { errors, flash } = usePage().props;
    const [ticket, setTicket] = useState([]);
    const [ticketOpen, setTicketOpen] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(true);
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
    const [receiptSale, setReceiptSale] = useState(null);
    const directory = customers.length ? customers : clients;

    useEffect(() => {
        if (flash?.last_sale) {
            setReceiptSale(flash.last_sale);
            setTicketOpen(false);
        }
    }, [flash?.last_sale]);

    const priceMap = useMemo(() => {
        const map = {};
        priceLists.forEach((pl) => {
            map[`${pl.product_id}-${pl.channel}`] = Number(pl.price);
        });
        return map;
    }, [priceLists]);

    const getPrice = useCallback(
        (productId) => {
            const ch = channel === 'custom' ? 'retail' : channel;
            return priceMap[`${productId}-${ch}`] ?? 0;
        },
        [channel, priceMap],
    );

    useEffect(() => {
        setTicket((prev) =>
            prev.map((line) => ({
                ...line,
                unit_price: getPrice(line.product_id),
            })),
        );
    }, [getPrice]);

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

    const productById = useMemo(() => {
        const map = {};
        products.forEach((product) => {
            map[product.id] = product;
        });
        return map;
    }, [products]);

    const qtyByProduct = useMemo(() => {
        const map = {};
        ticket.forEach((line) => {
            map[line.product_id] = line.quantity;
        });
        return map;
    }, [ticket]);

    const addToTicket = useCallback(
        (product) => {
            const unitPrice = getPrice(product.id);
            const onHand = shelfQuantity(product);
            setTicket((prev) => {
                const existing = prev.find((l) => l.product_id === product.id);
                const nextQty = (existing?.quantity ?? 0) + 1;

                if (!isPreOrder && nextQty - onHand > 0.0005) {
                    return prev;
                }

                if (existing) {
                    return prev.map((l) =>
                        l.product_id === product.id
                            ? { ...l, quantity: nextQty }
                            : l,
                    );
                }
                return [
                    ...prev,
                    {
                        product_id: product.id,
                        name: product.name,
                        category: product.category,
                        unit_of_measure: product.unit_of_measure,
                        quantity: 1,
                        unit_price: unitPrice,
                    },
                ];
            });
        },
        [getPrice, isPreOrder],
    );

    const bumpQty = (productId, delta) => {
        const onHand = shelfQuantity(productById[productId]);
        setTicket((prev) =>
            prev
                .map((l) => {
                    if (l.product_id !== productId) {
                        return l;
                    }

                    const nextQty = l.quantity + delta;
                    if (!isPreOrder && delta > 0 && nextQty - onHand > 0.0005) {
                        return l;
                    }

                    return { ...l, quantity: nextQty };
                })
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
    const stockBlockedLines = isPreOrder
        ? []
        : ticket.filter((line) => line.quantity - shelfQuantity(productById[line.product_id]) > 0.0005);
    const creditSale = paymentMethod === 'credit_account';
    const deposit = isPreOrder && depositAmount !== '' ? Number(depositAmount) : 0;
    const remainderOnAccount = creditSale
        ? total
        : isPreOrder && deposit > 0 && deposit < total
          ? total - deposit
          : 0;

    const submit = (e) => {
        e.preventDefault();
        if (ticket.length === 0 || processing || stockBlockedLines.length > 0) {
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
                    setTicketOpen(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const canConfirm =
        !processing &&
        ticket.length > 0 &&
        stockBlockedLines.length === 0 &&
        !(remainderOnAccount > 0 && !customerId) &&
        !(fulfillmentType === 'delivery' && (!customerId || !deliveryAddressId));

    const showOptions = isDesktop || optionsOpen;

    const ticketPanel = (
        <TicketPanel
            component="form"
            onSubmit={submit}
            className={cn(
                'flex h-full min-h-0 flex-col overflow-hidden bg-cream',
                'rounded-t-2xl lg:rounded-none lg:border-l lg:border-border',
            )}
        >
            <div className="shrink-0 border-b border-border px-4 py-3 pb-3 sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-jam">Ticket</p>
                        <p className="text-lg font-semibold text-ink sm:text-xl">Order ticket</p>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isDesktop && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setOptionsOpen((open) => !open)}
                                className="text-muted-foreground"
                            >
                                Options
                                {optionsOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                        {!isDesktop && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setTicketOpen(false)}
                                aria-label="Close ticket"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {showOptions && (
                    <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {CHANNELS.map((ch) => (
                                <PillButton
                                    key={ch.value}
                                    active={channel === ch.value}
                                    onClick={() => setChannel(ch.value)}
                                >
                                    {ch.label}
                                </PillButton>
                            ))}
                        </div>

                        <Select
                            value={customerId || NONE}
                            onValueChange={(value) => {
                                setCustomerId(value === NONE ? '' : value);
                                setDeliveryAddressId('');
                            }}
                        >
                            <SelectTrigger className="h-10 bg-card">
                                <SelectValue placeholder="Walk-in / no account" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE}>Walk-in / no account</SelectItem>
                                {visibleCustomers.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex flex-wrap gap-2">
                            <PillButton
                                active={isPreOrder}
                                onClick={() => {
                                    const next = !isPreOrder;
                                    setIsPreOrder(next);
                                    if (!next) {
                                        setDepositAmount('');
                                    }
                                }}
                                className="min-w-[110px] flex-1"
                            >
                                Pre-order
                            </PillButton>
                            {['pickup', 'delivery'].map((type) => (
                                <PillButton
                                    key={type}
                                    active={fulfillmentType === type}
                                    onClick={() => setFulfillmentType(type)}
                                    className="min-w-[90px] flex-1 capitalize"
                                >
                                    {type}
                                </PillButton>
                            ))}
                        </div>

                        {(isPreOrder || fulfillmentType === 'delivery') && (
                            <div className="space-y-1.5">
                                <Label htmlFor="requested-fulfillment">Requested for</Label>
                                <TextInput
                                    id="requested-fulfillment"
                                    type="datetime-local"
                                    value={requestedFulfillmentAt}
                                    onChange={(e) => setRequestedFulfillmentAt(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                        )}

                        {fulfillmentType === 'delivery' && (
                            <Select
                                value={deliveryAddressId || NONE}
                                onValueChange={(value) =>
                                    setDeliveryAddressId(value === NONE ? '' : value)
                                }
                            >
                                <SelectTrigger className="h-10 bg-card">
                                    <SelectValue placeholder="Choose delivery address" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>Choose delivery address</SelectItem>
                                    {customerAddresses.map((address) => (
                                        <SelectItem key={address.id} value={String(address.id)}>
                                            {address.label} — {address.address_text}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {isPreOrder && (
                            <div className="space-y-1.5">
                                    <Label htmlFor="deposit-amount">Deposit (TZS)</Label>
                                <TextInput
                                    id="deposit-amount"
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="h-10 bg-card"
                                    step="1"
                                    min="0"
                                />
                            </div>
                        )}
                    </div>
                )}

                {!isDesktop && !optionsOpen && (
                    <p className="mt-2 block text-xs text-muted-foreground">
                        {CHANNELS.find((ch) => ch.value === channel)?.label}
                        {selectedCustomer ? ` · ${selectedCustomer.name}` : ' · Walk-in'}
                        {isPreOrder ? ' · Pre-order' : ''}
                        {` · ${fulfillmentType}`}
                    </p>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-ink">Items ({ticket.length})</p>
                    {ticket.length > 0 && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={clearTicket}
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear all
                        </Button>
                    )}
                </div>

                {ticket.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <ShoppingBag className="mx-auto mb-2 h-10 w-10 opacity-35" />
                        <p className="text-sm">
                            Tap products to add items to the ticket. Sell only what is on the shelf.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ticket.map((line) => (
                            <div
                                key={line.product_id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                            >
                                <ProductVisual product={line} size={52} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="truncate text-sm font-bold text-ink">{line.name}</p>
                                        <p className="whitespace-nowrap text-sm font-bold text-jam">
                                            {formatMoney(line.quantity * line.unit_price)}
                                        </p>
                                    </div>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {formatMoney(line.unit_price)} each
                                        {isPreOrder
                                            ? ''
                                            : ` · ${shelfLabel(productById[line.product_id] ?? line)}`}
                                    </p>

                                    <div className="mt-2 inline-flex h-9 items-stretch overflow-hidden rounded-md border border-border bg-cream">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-none text-ink"
                                            onClick={() => bumpQty(line.product_id, -1)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="flex min-w-9 items-center justify-center border-x border-border px-1 text-sm font-bold leading-none text-ink">
                                            {line.quantity}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-none text-ink"
                                            disabled={
                                                !isPreOrder &&
                                                line.quantity >= shelfQuantity(productById[line.product_id])
                                            }
                                            onClick={() => bumpQty(line.product_id, 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="shrink-0 border-t border-border bg-card p-4 shadow-[0_-8px_24px_rgba(51,38,28,0.08)] sm:p-5 lg:shadow-none pb-[calc(12px+env(safe-area-inset-bottom))] sm:pb-5">
                <div className="mb-4 space-y-1.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-ink">{formatMoney(subtotal)}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-base font-bold text-ink">Grand Total</span>
                        <span className="text-xl font-bold text-jam sm:text-2xl">{formatMoney(total)}</span>
                    </div>
                </div>

                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="relative mb-4 h-10 bg-card pl-9">
                        <CreditCard className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                                {method.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(stockBlockedLines.length > 0 ||
                    errors?.items ||
                    errors?.customer_id ||
                    errors?.delivery_address_id ||
                    errors?.payments) && (
                    <p className="mb-4 text-sm text-destructive">
                        {stockBlockedLines.length > 0
                            ? stockBlockedLines
                                  .map((line) =>
                                      shelfQuantity(productById[line.product_id]) <= 0
                                          ? `${line.name} is out of stock.`
                                          : `${line.name}: only ${shelfLabel(productById[line.product_id])} on the shelf.`,
                                  )
                                  .join(' ')
                            : errors.items ||
                              errors.customer_id ||
                              errors.delivery_address_id ||
                              errors.payments}
                    </p>
                )}

                {remainderOnAccount > 0 && (
                    <p className="mb-4 block text-xs text-muted-foreground">
                        {formatMoney(remainderOnAccount)} will go on the customer account.
                    </p>
                )}

                <Button type="submit" size="lg" disabled={!canConfirm} className="w-full font-bold">
                    <CreditCard className="h-4 w-4" />
                    {processing ? 'Recording...' : 'Confirm Payment'}
                </Button>
            </div>
        </TicketPanel>
    );

    return (
        <PosLayout hideBottomNav={!isDesktop && ticketOpen}>
            <Head title="Point of Sale" />

            <div className="grid h-auto min-h-0 overflow-visible lg:h-full lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_min(480px,42vw)] lg:overflow-hidden">
                <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-visible p-4 pb-12 md:p-6 lg:overflow-hidden lg:pb-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-jam">
                                Point of sale
                            </p>
                            <h1 className="text-2xl font-bold text-ink sm:text-3xl">Order line</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Shelf counts stay on each card. Sell fewer than you have — leftover stays in stock.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="sm:self-center">
                            <Link href={route('tenant.pos.tickets')} prefetch>
                                Today’s tickets{todayTicketCount ? ` (${todayTicketCount})` : ''}
                            </Link>
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'bakery', label: 'Bakery' },
                            { value: 'tools', label: 'Tools & supplies' },
                        ].map((tab) => (
                            <Button
                                key={tab.value}
                                type="button"
                                variant={department === tab.value ? 'default' : 'outline'}
                                onClick={() => setDepartment(tab.value)}
                                className="flex-1 px-4 sm:flex-none"
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    <div className="relative w-full max-w-[420px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 rounded-full bg-card pl-9"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 pb-1">
                        {categories.map((cat) => {
                            const active = category === cat;
                            const label = cat === 'all' ? 'All' : cat;
                            return (
                                <Badge
                                    key={cat}
                                    variant="outline"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setCategory(cat)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setCategory(cat);
                                        }
                                    }}
                                    className={cn(
                                        'h-9 cursor-pointer px-3 text-sm font-semibold',
                                        active
                                            ? 'border-jam bg-jam/8 text-jam'
                                            : 'border-border text-muted-foreground',
                                    )}
                                >
                                    {label}
                                </Badge>
                            );
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 lg:pr-1">
                        {filteredProducts.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <p>No products match this filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        price={getPrice(product.id)}
                                        qtyInCart={qtyByProduct[product.id] ?? 0}
                                        allowOversell={isPreOrder}
                                        onAdd={addToTicket}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {isDesktop ? (
                    ticketPanel
                ) : (
                    <Sheet open={ticketOpen} onOpenChange={setTicketOpen}>
                        <SheetContent
                            side="bottom"
                            className="h-dvh max-h-dvh border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
                        >
                            <SheetTitle className="sr-only">Order ticket</SheetTitle>
                            {ticketPanel}
                        </SheetContent>
                    </Sheet>
                )}

                {!isDesktop && ticket.length > 0 && !ticketOpen && (
                    <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 z-[1200] flex items-center justify-between gap-3 bg-ink px-4 py-3 text-cream">
                        <div className="min-w-0">
                            <p className="text-xs text-wheat-light">
                                {ticket.length} item{ticket.length === 1 ? '' : 's'}
                            </p>
                            <p className="truncate text-base font-bold">{formatMoney(total)}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <Button
                                size="sm"
                                onClick={() => {
                                    setOptionsOpen(true);
                                    setTicketOpen(true);
                                }}
                                className="border border-wheat-light bg-cream text-ink shadow-none hover:bg-wheat-light hover:text-ink"
                            >
                                Ticket
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setOptionsOpen(false);
                                    setTicketOpen(true);
                                }}
                                className="min-w-[88px]"
                            >
                                Pay
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <SaleReceiptDialog
                sale={receiptSale}
                open={Boolean(receiptSale)}
                onClose={() => setReceiptSale(null)}
            />
        </PosLayout>
    );
}
