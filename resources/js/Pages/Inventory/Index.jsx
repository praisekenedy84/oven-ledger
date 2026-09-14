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
import TenantLayout from '@/Layouts/TenantLayout';
import { formatQuantity } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
    Box,
    Divider,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
        <Box sx={{ mb: 3 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
            >
                <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {title}
                    </Typography>
                    {description && (
                        <Typography variant="body2" color="text.secondary">
                            {description}
                        </Typography>
                    )}
                </Box>
                {action}
            </Stack>
            {children}
        </Box>
    );
}

function SummaryPill({ label, value, tone = 'default' }) {
    const tones = {
        default: { bg: colors.wheatLight, color: colors.ink },
        warn: { bg: `${colors.butter}22`, color: '#8A6410' },
        danger: { bg: `${colors.jam}14`, color: colors.jam },
        ok: { bg: `${colors.sage}14`, color: colors.sage },
    };
    const style = tones[tone] ?? tones.default;

    return (
        <Box
            sx={{
                px: 2,
                py: 1.5,
                borderRadius: 1,
                bgcolor: style.bg,
                border: `1px solid ${colors.border}`,
                minWidth: 120,
            }}
        >
            <Typography variant="caption" color="text.secondary" display="block">
                {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: style.color, lineHeight: 1.2 }}>
                {value}
            </Typography>
        </Box>
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

            <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                flexWrap="wrap"
                sx={{ mb: 2.5 }}
            >
                <SummaryPill label="On the shelf" value={finishedGoodsStock.length} />
                <SummaryPill label="Ingredients tracked" value={rawMaterialStock.length} />
                <SummaryPill
                    label="Needs attention"
                    value={alertCount}
                    tone={alertCount > 0 ? 'warn' : 'ok'}
                />
            </Stack>

            {alertCount > 0 && (
                <SurfaceCard sx={{ mb: 3, borderColor: colors.butter, bgcolor: `${colors.butter}14` }}>
                    <Typography variant="overline" sx={{ color: '#8A6410' }}>
                        Reorder alerts
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                        {alertCount} item{alertCount === 1 ? '' : 's'} under the line
                    </Typography>
                    <Stack spacing={0.5}>
                        {rawAlerts.map((row) => (
                            <Typography key={`raw-${row.id}`} variant="body2">
                                {row.raw_material?.name} — {formatQuantity(row.quantity_on_hand)}{' '}
                                {row.raw_material?.unit_of_measure}
                                <Typography component="span" variant="caption" color="text.secondary">
                                    {' '}
                                    · ingredient
                                </Typography>
                            </Typography>
                        ))}
                        {finishedAlerts.map((row) => {
                            const threshold = finishedThreshold(row);
                            return (
                                <Typography key={`fg-${row.id}`} variant="body2">
                                    {row.product?.name} — {formatQuantity(row.quantity_on_hand)}{' '}
                                    {row.product?.unit_of_measure}
                                    <Typography component="span" variant="caption" color="text.secondary">
                                        {' '}
                                        · shelf
                                        {threshold == null
                                            ? ' · out of stock'
                                            : ` · at or below reorder of ${threshold}`}
                                    </Typography>
                                </Typography>
                            );
                        })}
                    </Stack>
                </SurfaceCard>
            )}

            <Tabs
                value={tab}
                onChange={(_, next) => setTab(next)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{
                    mb: 3,
                    borderBottom: `1px solid ${colors.border}`,
                    minHeight: 48,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        minHeight: 48,
                    },
                }}
            >
                <Tab value="shelf" label="1. Shelf" />
                <Tab value="ingredients" label="2. Ingredients" />
                <Tab value="writeoffs" label="3. Write-offs" />
                <Tab value="activity" label="4. Activity" />
            </Tabs>

            {tab === 'shelf' && (
                <Box>
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
                                        sx={low ? { bgcolor: `${colors.jam}0d` } : undefined}
                                    >
                                        <DataTableCell sx={{ fontWeight: 600 }}>
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
                            <SurfaceCard
                                component="form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    receiveForm.post(route('tenant.inventory.receive'), {
                                        preserveScroll: true,
                                        onSuccess: () => receiveForm.reset('quantity', 'notes'),
                                    });
                                }}
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                                }}
                            >
                                <Box>
                                    <InputLabel value="Product" />
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={receiveForm.data.product_id}
                                            onChange={(e) =>
                                                receiveForm.setData('product_id', e.target.value)
                                            }
                                        >
                                            {products.map((p) => (
                                                <MenuItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <InputError message={receiveForm.errors.product_id} />
                                </Box>
                                <Box>
                                    <InputLabel value="Quantity ready" />
                                    <TextInput
                                        type="number"
                                        inputProps={{ min: 0, step: '0.001' }}
                                        value={receiveForm.data.quantity}
                                        onChange={(e) =>
                                            receiveForm.setData('quantity', e.target.value)
                                        }
                                    />
                                    <InputError message={receiveForm.errors.quantity} />
                                </Box>
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <InputLabel value="Notes" />
                                    <TextInput
                                        value={receiveForm.data.notes}
                                        onChange={(e) =>
                                            receiveForm.setData('notes', e.target.value)
                                        }
                                        placeholder="Morning bake, leftover from yesterday…"
                                    />
                                </Box>
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <PrimaryButton
                                        type="submit"
                                        disabled={receiveForm.processing || products.length === 0}
                                    >
                                        Add to shelf
                                    </PrimaryButton>
                                </Box>
                            </SurfaceCard>
                        </Section>
                    ) : (
                        <SurfaceCard sx={{ bgcolor: colors.wheatLight }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                Shelf stock comes from production
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                                Complete a batch to dispatch goods onto this shelf. Use Ingredients when
                                you receive flour, sugar, and other supplies.
                            </Typography>
                            <SecondaryButton
                                component={Link}
                                href={route('tenant.production-batches.index')}
                                size="small"
                            >
                                Open production
                            </SecondaryButton>
                        </SurfaceCard>
                    )}
                </Box>
            )}

            {tab === 'ingredients' && (
                <Box>
                    <Section
                        title="Ingredient stock"
                        description="Raw materials available for recipes and production."
                        action={
                            <SecondaryButton
                                component={Link}
                                href={route('tenant.raw-materials.index')}
                                size="small"
                            >
                                Manage materials
                            </SecondaryButton>
                        }
                    >
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
                                        sx={low ? { bgcolor: `${colors.jam}0d` } : undefined}
                                    >
                                        <DataTableCell sx={{ fontWeight: 600 }}>
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
                                                <Tooltip title="View history">
                                                    <IconButton
                                                        component={Link}
                                                        href={route(
                                                            'tenant.raw-materials.show',
                                                            row.raw_material_id,
                                                        )}
                                                        size="small"
                                                        aria-label={`View history for ${row.raw_material?.name}`}
                                                    >
                                                        <VisibilityOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </DataTableCell>
                                    </DataTableRow>
                                );
                            })}
                        </DataTable>
                    </Section>

                    <Section
                        title="Restock ingredients"
                        description="Record what arrived from the supplier. On-hand quantity and buy-in price update when you save."
                    >
                        <SurfaceCard
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                restockForm.post(route('tenant.inventory.restock'), {
                                    preserveScroll: true,
                                    onSuccess: () => restockForm.reset('quantity', 'notes'),
                                });
                            }}
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            }}
                        >
                            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                                <InputLabel value="Material" />
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={restockForm.data.raw_material_id}
                                        onChange={(e) => {
                                            const next = rawMaterials.find(
                                                (item) =>
                                                    String(item.id) === String(e.target.value),
                                            );
                                            restockForm.setData({
                                                ...restockForm.data,
                                                raw_material_id: e.target.value,
                                                unit_cost: next?.unit_cost ?? '',
                                            });
                                        }}
                                    >
                                        {rawMaterials.map((item) => (
                                            <MenuItem key={item.id} value={item.id}>
                                                {item.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <InputError message={restockForm.errors.raw_material_id} />
                            </Box>
                            <Box>
                                <InputLabel
                                    value={`Quantity${selectedRestock ? ` (${selectedRestock.unit_of_measure})` : ''}`}
                                />
                                <TextInput
                                    type="number"
                                    inputProps={{ min: 0, step: '0.001' }}
                                    value={restockForm.data.quantity}
                                    onChange={(e) =>
                                        restockForm.setData('quantity', e.target.value)
                                    }
                                />
                                <InputError message={restockForm.errors.quantity} />
                            </Box>
                            <Box>
                                <InputLabel value="Price per unit (TZS)" />
                                <TextInput
                                    type="number"
                                    inputProps={{ min: 0, step: '1' }}
                                    value={restockForm.data.unit_cost}
                                    onChange={(e) =>
                                        restockForm.setData('unit_cost', e.target.value)
                                    }
                                />
                            </Box>
                            <Box>
                                <InputLabel value="Received on" />
                                <TextInput
                                    type="date"
                                    value={restockForm.data.occurred_at}
                                    onChange={(e) =>
                                        restockForm.setData('occurred_at', e.target.value)
                                    }
                                />
                            </Box>
                            <Box>
                                <InputLabel value="Notes" />
                                <TextInput
                                    value={restockForm.data.notes}
                                    onChange={(e) => restockForm.setData('notes', e.target.value)}
                                    placeholder="Supplier, bag count…"
                                />
                            </Box>
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <PrimaryButton
                                    type="submit"
                                    disabled={
                                        restockForm.processing || rawMaterials.length === 0
                                    }
                                >
                                    Record restock
                                </PrimaryButton>
                            </Box>
                        </SurfaceCard>
                    </Section>
                </Box>
            )}

            {tab === 'writeoffs' && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Use write-offs when stock is spoiled, damaged, or given away — not for normal
                        sales.
                    </Typography>

                    <Section
                        title="Finished-goods waste"
                        description="Remove items that left the shelf without a sale."
                    >
                        <SurfaceCard
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                wasteForm.post(route('tenant.inventory.waste'), {
                                    preserveScroll: true,
                                    onSuccess: () => wasteForm.reset('quantity'),
                                });
                            }}
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
                            }}
                        >
                            <Box>
                                <InputLabel value="Product" />
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={wasteForm.data.product_id}
                                        onChange={(e) =>
                                            wasteForm.setData('product_id', e.target.value)
                                        }
                                    >
                                        {products.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <InputError message={wasteForm.errors.product_id} />
                            </Box>
                            <Box>
                                <InputLabel value="Quantity" />
                                <TextInput
                                    type="number"
                                    inputProps={{ step: '0.001' }}
                                    value={wasteForm.data.quantity}
                                    onChange={(e) =>
                                        wasteForm.setData('quantity', e.target.value)
                                    }
                                />
                                <InputError message={wasteForm.errors.quantity} />
                            </Box>
                            <Box>
                                <InputLabel value="Reason" />
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={wasteForm.data.reason}
                                        onChange={(e) =>
                                            wasteForm.setData('reason', e.target.value)
                                        }
                                    >
                                        <MenuItem value="expired">Expired</MenuItem>
                                        <MenuItem value="damaged">Damaged</MenuItem>
                                        <MenuItem value="given_away">Given away</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <PrimaryButton type="submit" disabled={wasteForm.processing}>
                                    Log shelf waste
                                </PrimaryButton>
                            </Box>
                        </SurfaceCard>
                    </Section>

                    <Divider sx={{ my: 3, borderColor: colors.border }} />

                    <Section
                        title="Ingredient write-off"
                        description="Expired bags, spills, or damaged raw materials."
                    >
                        <SurfaceCard
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                rawWasteForm.post(route('tenant.inventory.raw-waste'), {
                                    preserveScroll: true,
                                    onSuccess: () => rawWasteForm.reset('quantity', 'notes'),
                                });
                            }}
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            }}
                        >
                            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                                <InputLabel value="Material" />
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={rawWasteForm.data.raw_material_id}
                                        onChange={(e) =>
                                            rawWasteForm.setData(
                                                'raw_material_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {rawMaterials.map((item) => (
                                            <MenuItem key={item.id} value={item.id}>
                                                {item.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <InputError message={rawWasteForm.errors.raw_material_id} />
                            </Box>
                            <Box>
                                <InputLabel value="Quantity" />
                                <TextInput
                                    type="number"
                                    inputProps={{ min: 0, step: '0.001' }}
                                    value={rawWasteForm.data.quantity}
                                    onChange={(e) =>
                                        rawWasteForm.setData('quantity', e.target.value)
                                    }
                                />
                                <InputError message={rawWasteForm.errors.quantity} />
                            </Box>
                            <Box>
                                <InputLabel value="Reason" />
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={rawWasteForm.data.reason}
                                        onChange={(e) =>
                                            rawWasteForm.setData('reason', e.target.value)
                                        }
                                    >
                                        <MenuItem value="expired">Expired</MenuItem>
                                        <MenuItem value="damaged">Damaged</MenuItem>
                                        <MenuItem value="spillage">Spillage</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <InputLabel value="Notes" />
                                <TextInput
                                    value={rawWasteForm.data.notes}
                                    onChange={(e) =>
                                        rawWasteForm.setData('notes', e.target.value)
                                    }
                                />
                            </Box>
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <PrimaryButton
                                    type="submit"
                                    disabled={
                                        rawWasteForm.processing || rawMaterials.length === 0
                                    }
                                >
                                    Log ingredient waste
                                </PrimaryButton>
                            </Box>
                        </SurfaceCard>
                    </Section>
                </Box>
            )}

            {tab === 'activity' && (
                <Box>
                    <Section
                        title="Ingredient movement history"
                        description="Every restock, bake usage, and write-off for this branch."
                        action={
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <Select
                                    displayEmpty
                                    value={filters.raw_material_id ?? ''}
                                    onChange={(e) =>
                                        router.get(
                                            route('tenant.inventory.index'),
                                            {
                                                raw_material_id: e.target.value || undefined,
                                            },
                                            { preserveState: true, replace: true },
                                        )
                                    }
                                >
                                    <MenuItem value="">All materials</MenuItem>
                                    {rawMaterials.map((item) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        }
                    >
                        <RawMaterialLifecycleTable movements={movements} showMaterial />
                    </Section>
                </Box>
            )}
        </TenantLayout>
    );
}
