import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import RawMaterialLifecycleTable from '@/Components/RawMaterialLifecycleTable';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Separator } from '@/Components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatQuantity } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';

function isRawLow(row) {
    const qty = Number(row.quantity_on_hand) || 0;
    const threshold = row.raw_material?.reorder_threshold;
    if (threshold == null) {
        return qty <= 0;
    }
    return qty <= Number(threshold);
}

function isFinishedLow(row) {
    if (typeof row.is_low === 'boolean') {
        return row.is_low;
    }

    const qty = Number(row.quantity_on_hand) || 0;
    const threshold = row.reorder_threshold ?? row.product?.reorder_threshold;
    if (threshold == null || threshold === '') {
        return qty <= 0;
    }
    return qty <= Number(threshold);
}

function finishedLowLabel(row) {
    const qty = Number(row.quantity_on_hand) || 0;
    if (qty <= 0) {
        return 'Out';
    }
    return 'Reorder';
}

function finishedThreshold(row) {
    const threshold = row.reorder_threshold ?? row.product?.reorder_threshold;
    return threshold == null || threshold === '' ? null : threshold;
}

function todayInput() {
    return new Date().toISOString().slice(0, 10);
}

function Section({ title, description, children, action }) {
    return (
        <div className="mb-6">
            <div className="mb-3 flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                    <h2 className="text-base font-bold">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function SummaryPill({ label, value, tone = 'default' }) {
    const tones = {
        default: 'bg-wheat-light text-ink',
        warn: 'bg-butter/15 text-[#8A6410]',
        danger: 'bg-jam/10 text-jam',
        ok: 'bg-sage/10 text-sage',
    };

    return (
        <div
            className={cn(
                'min-w-[120px] rounded-md border border-border px-4 py-3',
                tones[tone] ?? tones.default,
            )}
        >
            <span className="block text-xs text-muted-foreground">{label}</span>
            <span className="block text-xl font-bold leading-tight">{value}</span>
        </div>
    );
}

export default function Index({
    rawMaterialStock,
    finishedGoodsStock,
    products,
    rawMaterials = [],
    movements,
    filters = {},
    simpleStock = false,
}) {
    const rawAlerts = rawMaterialStock.filter(isRawLow);
    const finishedAlerts = finishedGoodsStock.filter(isFinishedLow);
    const alertCount = rawAlerts.length + finishedAlerts.length;

    const defaultTab = filters.raw_material_id
        ? 'activity'
        : finishedAlerts.length && !rawAlerts.length
            ? 'shelf'
            : rawAlerts.length
                ? 'ingredients'
                : 'shelf';

    const [tab, setTab] = useState(defaultTab);

    const wasteForm = useForm({
        product_id: products[0]?.id ?? '',
        quantity: '',
        reason: 'expired',
    });

    const receiveForm = useForm({
        product_id: products[0]?.id ?? '',
        quantity: '',
        notes: '',
    });

    const restockForm = useForm({
        raw_material_id: rawMaterials[0]?.id ?? '',
        quantity: '',
        unit_cost: rawMaterials[0]?.unit_cost ?? '',
        occurred_at: todayInput(),
        notes: '',
    });

    const rawWasteForm = useForm({
        raw_material_id: rawMaterials[0]?.id ?? '',
        quantity: '',
        reason: 'expired',
        occurred_at: todayInput(),
        notes: '',
    });

    const selectedRestock = rawMaterials.find(
        (item) => String(item.id) === String(restockForm.data.raw_material_id),
    );

    return (
        <TenantLayout title="Inventory">
            <Head title="Inventory" />

            <PageHeader
                eyebrow="Stock"
                title="Inventory"
                description={
                    simpleStock
                        ? 'Restock ingredients, put finished goods on the shelf for POS, then write off anything that spoils.'
                        : 'Restock ingredients, watch stock through production, and keep a clear on-hand trail.'
                }
            />

            <div className="mb-5 flex flex-row flex-wrap gap-3">
                <SummaryPill label="On the shelf" value={finishedGoodsStock.length} />
                <SummaryPill label="Ingredients tracked" value={rawMaterialStock.length} />
                <SummaryPill
                    label="Needs attention"
                    value={alertCount}
                    tone={alertCount > 0 ? 'warn' : 'ok'}
                />
            </div>

            {alertCount > 0 && (
                <SurfaceCard className="mb-6 border-butter bg-butter/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6410]">
                        Reorder alerts
                    </p>
                    <h2 className="mb-2 text-base font-bold">
                        {alertCount} item{alertCount === 1 ? '' : 's'} under the line
                    </h2>
                    <div className="space-y-1">
                        {rawAlerts.map((row) => (
                            <p key={`raw-${row.id}`} className="text-sm">
                                {row.raw_material?.name} — {formatQuantity(row.quantity_on_hand)}{' '}
                                {row.raw_material?.unit_of_measure}
                                <span className="text-xs text-muted-foreground"> · ingredient</span>
                            </p>
                        ))}
                        {finishedAlerts.map((row) => {
                            const threshold = finishedThreshold(row);
                            return (
                                <p key={`fg-${row.id}`} className="text-sm">
                                    {row.product?.name} — {formatQuantity(row.quantity_on_hand)}{' '}
                                    {row.product?.unit_of_measure}
                                    <span className="text-xs text-muted-foreground">
                                        {' '}
                                        · shelf
                                        {threshold == null
                                            ? ' · out of stock'
                                            : ` · at or below reorder of ${threshold}`}
                                    </span>
                                </p>
                            );
                        })}
                    </div>
                </SurfaceCard>
            )}

            <Tabs value={tab} onValueChange={setTab} className="mb-6">
                <TabsList className="mb-4 h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
                    <TabsTrigger
                        value="shelf"
                        className="min-h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        1. Shelf
                    </TabsTrigger>
                    <TabsTrigger
                        value="ingredients"
                        className="min-h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        2. Ingredients
                    </TabsTrigger>
                    <TabsTrigger
                        value="writeoffs"
                        className="min-h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        3. Write-offs
                    </TabsTrigger>
                    <TabsTrigger
                        value="activity"
                        className="min-h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        4. Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="shelf">
                    <Section
                        title="Finished goods on hand"
                        description={
                            simpleStock
                                ? 'What is ready to sell at the counter right now.'
                                : 'What production has put on the ready shelf for this branch.'
                        }
                    >
                        <DataTable
                            columns={[
                                { label: 'Product' },
                                { label: 'On hand' },
                                { label: 'Reorder at' },
                                { label: 'Status' },
                            ]}
                            emptyMessage="No finished goods in stock yet."
                        >
                            {finishedGoodsStock.map((row) => {
                                const low = isFinishedLow(row);
                                const threshold = finishedThreshold(row);
                                return (
                                    <DataTableRow
                                        key={row.id}
                                        className={low ? 'bg-jam/5' : undefined}
                                    >
                                        <DataTableCell className="font-semibold">
                                            {row.product?.name}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {formatQuantity(row.quantity_on_hand)}{' '}
                                            {row.product?.unit_of_measure}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {threshold == null ? '—' : threshold}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <StatusBadge
                                                status={low ? 'open' : 'ready'}
                                                label={low ? finishedLowLabel(row) : 'OK'}
                                            />
                                        </DataTableCell>
                                    </DataTableRow>
                                );
                            })}
                        </DataTable>
                    </Section>

                    {simpleStock ? (
                        <Section
                            title="Add product to shelf"
                            description="Adds to the existing on-hand quantity for that product — it does not create a second shelf line. Recipe ingredients are deducted so profit and loss stay accurate."
                        >
                            <SurfaceCard>
                                <form
                                    className="grid gap-4 sm:grid-cols-[2fr_1fr]"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        receiveForm.post(route('tenant.inventory.receive'), {
                                            preserveScroll: true,
                                            onSuccess: () => receiveForm.reset('quantity', 'notes'),
                                        });
                                    }}
                                >
                                    <div>
                                        <InputLabel value="Product" />
                                        <Select
                                            value={String(receiveForm.data.product_id ?? '')}
                                            onValueChange={(value) =>
                                                receiveForm.setData('product_id', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={receiveForm.errors.product_id} />
                                    </div>
                                    <div>
                                        <InputLabel value="Quantity ready" />
                                        <TextInput
                                            type="number"
                                            min={0}
                                            step="0.001"
                                            value={receiveForm.data.quantity}
                                            onChange={(e) =>
                                                receiveForm.setData('quantity', e.target.value)
                                            }
                                        />
                                        <InputError message={receiveForm.errors.quantity} />
                                    </div>
                                    <div className="col-span-full">
                                        <InputLabel value="Notes" />
                                        <TextInput
                                            value={receiveForm.data.notes}
                                            onChange={(e) =>
                                                receiveForm.setData('notes', e.target.value)
                                            }
                                            placeholder="Morning bake, leftover from yesterday…"
                                        />
                                    </div>
                                    <div className="col-span-full">
                                        <PrimaryButton
                                            type="submit"
                                            disabled={receiveForm.processing || products.length === 0}
                                        >
                                            Add to shelf
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </SurfaceCard>
                        </Section>
                    ) : (
                        <SurfaceCard className="bg-wheat-light">
                            <h3 className="text-sm font-bold">Shelf stock comes from production</h3>
                            <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                                Complete a batch to dispatch goods onto this shelf. Use Ingredients when you
                                receive flour, sugar, and other supplies.
                            </p>
                            <SecondaryButton size="small" asChild>
                                <Link href={route('tenant.production-batches.index')}>Open production</Link>
                            </SecondaryButton>
                        </SurfaceCard>
                    )}
                </TabsContent>

                <TabsContent value="ingredients">
                    <Section
                        title="Ingredient stock"
                        description="Raw materials available for recipes and production."
                        action={
                            <SecondaryButton size="small" asChild>
                                <Link href={route('tenant.raw-materials.index')}>Manage materials</Link>
                            </SecondaryButton>
                        }
                    >
                        <TooltipProvider>
                            <DataTable
                                columns={[
                                    { label: 'Material' },
                                    { label: 'On hand' },
                                    { label: 'Reorder' },
                                    { label: 'Status' },
                                    { label: '' },
                                ]}
                                emptyMessage="No raw material stock recorded."
                            >
                                {rawMaterialStock.map((row) => {
                                    const low = isRawLow(row);
                                    return (
                                        <DataTableRow
                                            key={row.id}
                                            className={low ? 'bg-jam/5' : undefined}
                                        >
                                            <DataTableCell className="font-semibold">
                                                {row.raw_material?.name}
                                            </DataTableCell>
                                            <DataTableCell>
                                                {formatQuantity(row.quantity_on_hand)}{' '}
                                                {row.raw_material?.unit_of_measure}
                                            </DataTableCell>
                                            <DataTableCell>
                                                {row.raw_material?.reorder_threshold ?? '—'}
                                            </DataTableCell>
                                            <DataTableCell>
                                                <StatusBadge
                                                    status={low ? 'open' : 'ready'}
                                                    label={low ? 'Reorder' : 'OK'}
                                                />
                                            </DataTableCell>
                                            <DataTableCell>
                                                {row.raw_material_id && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                asChild
                                                                aria-label={`View history for ${row.raw_material?.name}`}
                                                            >
                                                                <Link
                                                                    href={route(
                                                                        'tenant.raw-materials.show',
                                                                        row.raw_material_id,
                                                                    )}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View history</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </DataTableCell>
                                        </DataTableRow>
                                    );
                                })}
                            </DataTable>
                        </TooltipProvider>
                    </Section>

                    <Section
                        title="Restock ingredients"
                        description="Record what arrived from the supplier. On-hand quantity and buy-in price update when you save."
                    >
                        <SurfaceCard>
                            <form
                                className="grid gap-4 sm:grid-cols-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    restockForm.post(route('tenant.inventory.restock'), {
                                        preserveScroll: true,
                                        onSuccess: () => restockForm.reset('quantity', 'notes'),
                                    });
                                }}
                            >
                                <div className="sm:col-span-full">
                                    <InputLabel value="Material" />
                                    <Select
                                        value={String(restockForm.data.raw_material_id ?? '')}
                                        onValueChange={(value) => {
                                            const next = rawMaterials.find(
                                                (item) => String(item.id) === String(value),
                                            );
                                            restockForm.setData({
                                                ...restockForm.data,
                                                raw_material_id: value,
                                                unit_cost: next?.unit_cost ?? '',
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select material" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rawMaterials.map((item) => (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={restockForm.errors.raw_material_id} />
                                </div>
                                <div>
                                    <InputLabel
                                        value={`Quantity${selectedRestock ? ` (${selectedRestock.unit_of_measure})` : ''}`}
                                    />
                                    <TextInput
                                        type="number"
                                        min={0}
                                        step="0.001"
                                        value={restockForm.data.quantity}
                                        onChange={(e) => restockForm.setData('quantity', e.target.value)}
                                    />
                                    <InputError message={restockForm.errors.quantity} />
                                </div>
                                <div>
                                    <InputLabel value="Price per unit (TZS)" />
                                    <TextInput
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={restockForm.data.unit_cost}
                                        onChange={(e) => restockForm.setData('unit_cost', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Received on" />
                                    <TextInput
                                        type="date"
                                        value={restockForm.data.occurred_at}
                                        onChange={(e) =>
                                            restockForm.setData('occurred_at', e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Notes" />
                                    <TextInput
                                        value={restockForm.data.notes}
                                        onChange={(e) => restockForm.setData('notes', e.target.value)}
                                        placeholder="Supplier, bag count…"
                                    />
                                </div>
                                <div className="col-span-full">
                                    <PrimaryButton
                                        type="submit"
                                        disabled={restockForm.processing || rawMaterials.length === 0}
                                    >
                                        Record restock
                                    </PrimaryButton>
                                </div>
                            </form>
                        </SurfaceCard>
                    </Section>
                </TabsContent>

                <TabsContent value="writeoffs">
                    <p className="mb-5 text-sm text-muted-foreground">
                        Use write-offs when stock is spoiled, damaged, or given away — not for normal sales.
                    </p>

                    <Section
                        title="Finished-goods waste"
                        description="Remove items that left the shelf without a sale."
                    >
                        <SurfaceCard>
                            <form
                                className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    wasteForm.post(route('tenant.inventory.waste'), {
                                        preserveScroll: true,
                                        onSuccess: () => wasteForm.reset('quantity'),
                                    });
                                }}
                            >
                                <div>
                                    <InputLabel value="Product" />
                                    <Select
                                        value={String(wasteForm.data.product_id ?? '')}
                                        onValueChange={(value) => wasteForm.setData('product_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={wasteForm.errors.product_id} />
                                </div>
                                <div>
                                    <InputLabel value="Quantity" />
                                    <TextInput
                                        type="number"
                                        step="0.001"
                                        value={wasteForm.data.quantity}
                                        onChange={(e) => wasteForm.setData('quantity', e.target.value)}
                                    />
                                    <InputError message={wasteForm.errors.quantity} />
                                </div>
                                <div>
                                    <InputLabel value="Reason" />
                                    <Select
                                        value={wasteForm.data.reason}
                                        onValueChange={(value) => wasteForm.setData('reason', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="damaged">Damaged</SelectItem>
                                            <SelectItem value="given_away">Given away</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-full">
                                    <PrimaryButton type="submit" disabled={wasteForm.processing}>
                                        Log shelf waste
                                    </PrimaryButton>
                                </div>
                            </form>
                        </SurfaceCard>
                    </Section>

                    <Separator className="my-6" />

                    <Section
                        title="Ingredient write-off"
                        description="Expired bags, spills, or damaged raw materials."
                    >
                        <SurfaceCard>
                            <form
                                className="grid gap-4 sm:grid-cols-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    rawWasteForm.post(route('tenant.inventory.raw-waste'), {
                                        preserveScroll: true,
                                        onSuccess: () => rawWasteForm.reset('quantity', 'notes'),
                                    });
                                }}
                            >
                                <div className="sm:col-span-full">
                                    <InputLabel value="Material" />
                                    <Select
                                        value={String(rawWasteForm.data.raw_material_id ?? '')}
                                        onValueChange={(value) =>
                                            rawWasteForm.setData('raw_material_id', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select material" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rawMaterials.map((item) => (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={rawWasteForm.errors.raw_material_id} />
                                </div>
                                <div>
                                    <InputLabel value="Quantity" />
                                    <TextInput
                                        type="number"
                                        min={0}
                                        step="0.001"
                                        value={rawWasteForm.data.quantity}
                                        onChange={(e) =>
                                            rawWasteForm.setData('quantity', e.target.value)
                                        }
                                    />
                                    <InputError message={rawWasteForm.errors.quantity} />
                                </div>
                                <div>
                                    <InputLabel value="Reason" />
                                    <Select
                                        value={rawWasteForm.data.reason}
                                        onValueChange={(value) => rawWasteForm.setData('reason', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="damaged">Damaged</SelectItem>
                                            <SelectItem value="spillage">Spillage</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-full">
                                    <InputLabel value="Notes" />
                                    <TextInput
                                        value={rawWasteForm.data.notes}
                                        onChange={(e) => rawWasteForm.setData('notes', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-full">
                                    <PrimaryButton
                                        type="submit"
                                        disabled={rawWasteForm.processing || rawMaterials.length === 0}
                                    >
                                        Log ingredient waste
                                    </PrimaryButton>
                                </div>
                            </form>
                        </SurfaceCard>
                    </Section>
                </TabsContent>

                <TabsContent value="activity">
                    <Section
                        title="Ingredient movement history"
                        description="Every restock, bake usage, and write-off for this branch."
                        action={
                            <Select
                                value={
                                    filters.raw_material_id
                                        ? String(filters.raw_material_id)
                                        : 'all'
                                }
                                onValueChange={(value) =>
                                    router.get(
                                        route('tenant.inventory.index'),
                                        {
                                            raw_material_id: value === 'all' ? undefined : value,
                                        },
                                        { preserveState: true, replace: true },
                                    )
                                }
                            >
                                <SelectTrigger className="min-w-[220px]">
                                    <SelectValue placeholder="All materials" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All materials</SelectItem>
                                    {rawMaterials.map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        }
                    >
                        <RawMaterialLifecycleTable movements={movements} showMaterial />
                    </Section>
                </TabsContent>
            </Tabs>
        </TenantLayout>
    );
}
