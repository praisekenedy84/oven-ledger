import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const NEXT_STATUS = {
    planned: 'baking',
    baking: 'cooling',
    cooling: 'ready',
    ready: 'dispatched',
};

const COLUMNS = [
    { key: 'baking', label: 'Baking', accentClass: 'text-jam' },
    { key: 'cooling', label: 'Cooling', accentClass: 'text-butter' },
    { key: 'ready', label: 'Ready', accentClass: 'text-sage' },
];

export default function Index({ batches, products }) {
    const createForm = useForm({
        product_id: products[0]?.id ?? '',
        planned_quantity: '',
        expiry_date: '',
    });

    const selectedProduct = products.find(
        (product) => String(product.id) === String(createForm.data.product_id),
    );

    const [qtyDialog, setQtyDialog] = useState({ open: false, batch: null, status: null, quantity: '' });

    const transition = (batch, status) => {
        if (status === 'ready' || status === 'dispatched') {
            setQtyDialog({
                open: true,
                batch,
                status,
                quantity: batch.actual_quantity ?? batch.planned_quantity ?? '',
            });
            return;
        }

        router.patch(route('tenant.production-batches.transition', batch.id), { status }, {
            preserveScroll: true,
        });
    };

    const confirmQuantity = () => {
        if (!qtyDialog.batch || !qtyDialog.status) {
            return;
        }

        router.patch(
            route('tenant.production-batches.transition', qtyDialog.batch.id),
            {
                status: qtyDialog.status,
                actual_quantity: qtyDialog.quantity || null,
            },
            { preserveScroll: true },
        );
        setQtyDialog({ open: false, batch: null, status: null, quantity: '' });
    };

    const rows = batches.data ?? [];
    const board = Object.fromEntries(
        COLUMNS.map((col) => [col.key, rows.filter((batch) => batch.status === col.key)]),
    );
    const queued = rows.filter((batch) => !['baking', 'cooling', 'ready'].includes(batch.status));

    return (
        <TenantLayout title="Production">
            <Head title="Production" />

            <PageHeader
                eyebrow="Floor"
                title="Production planning"
                description="Schedule a batch, then walk it from oven to cooling rack to the ready shelf."
            />

            <SurfaceCard className="mb-6">
                <form
                    className="grid gap-4 lg:grid-cols-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        createForm.post(route('tenant.production-batches.store'), {
                            onSuccess: () => createForm.reset('planned_quantity', 'expiry_date'),
                        });
                    }}
                >
                    <div className="col-span-full">
                        <h2 className="text-lg font-semibold">Schedule a batch</h2>
                        <p className="text-sm text-muted-foreground">
                            Pick what is on the floor. The recipe and batch number are assigned automatically.
                        </p>
                    </div>
                    <div>
                        <InputLabel value="Product" />
                        <Select
                            value={String(createForm.data.product_id ?? '')}
                            onValueChange={(value) => createForm.setData('product_id', value)}
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
                        <InputError message={createForm.errors.product_id} />
                        {selectedProduct?.recipe?.expected_yield && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Recipe yield {selectedProduct.recipe.expected_yield}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputLabel value="Planned quantity" />
                        <TextInput
                            type="number"
                            step="0.001"
                            value={createForm.data.planned_quantity}
                            onChange={(e) => createForm.setData('planned_quantity', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel value="Expiry date" />
                        <TextInput
                            type="date"
                            value={createForm.data.expiry_date}
                            onChange={(e) => createForm.setData('expiry_date', e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <PrimaryButton type="submit" className="w-full" disabled={createForm.processing}>
                            Schedule batch
                        </PrimaryButton>
                    </div>
                </form>
            </SurfaceCard>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                {COLUMNS.map((col) => (
                    <SurfaceCard key={col.key} className="p-4">
                        <div className="mb-4 flex flex-row justify-between">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${col.accentClass}`}>
                                {col.label}
                            </span>
                            <span className="text-xs font-bold">{board[col.key].length}</span>
                        </div>
                        <div className="space-y-3">
                            {board[col.key].length === 0 && (
                                <p className="text-sm text-muted-foreground">None {col.label.toLowerCase()}.</p>
                            )}
                            {board[col.key].map((batch) => {
                                const next = NEXT_STATUS[batch.status];
                                return (
                                    <div
                                        key={batch.id}
                                        className="rounded-[10px] border border-border bg-wheat-light p-3"
                                    >
                                        <p className="text-sm font-semibold">{batch.product?.name}</p>
                                        <span className="block text-xs text-muted-foreground">
                                            #{batch.batch_number} · {batch.planned_quantity}
                                            {batch.actual_quantity ? ` actual ${batch.actual_quantity}` : ''}
                                        </span>
                                        {next && (
                                            <SecondaryButton
                                                size="small"
                                                onClick={() => transition(batch, next)}
                                                className="mt-2 capitalize"
                                            >
                                                → {next}
                                            </SecondaryButton>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </SurfaceCard>
                ))}
            </div>

            {queued.length > 0 && (
                <SurfaceCard>
                    <h2 className="mb-4 text-lg font-semibold">Queued & dispatched</h2>
                    <div className="space-y-3">
                        {queued.map((batch) => {
                            const next = NEXT_STATUS[batch.status];
                            return (
                                <div
                                    key={batch.id}
                                    className="flex flex-col justify-between gap-2 border-b border-border py-2 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{batch.product?.name}</p>
                                        <span className="text-xs text-muted-foreground">
                                            #{batch.batch_number} · planned {batch.planned_quantity} ·{' '}
                                            {formatDate(batch.expiry_date)}
                                        </span>
                                    </div>
                                    <div className="flex flex-row items-center gap-2">
                                        <StatusBadge status={batch.status} />
                                        {next && (
                                            <SecondaryButton
                                                size="small"
                                                onClick={() => transition(batch, next)}
                                                className="capitalize"
                                            >
                                                → {next}
                                            </SecondaryButton>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </SurfaceCard>
            )}

            <Pagination links={batches.links} />

            <Dialog
                open={qtyDialog.open}
                onOpenChange={(open) => {
                    if (!open) {
                        setQtyDialog({ open: false, batch: null, status: null, quantity: '' });
                    }
                }}
            >
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Actual quantity</DialogTitle>
                        <DialogDescription>
                            {qtyDialog.batch?.product?.name
                                ? `How many ${qtyDialog.batch.product.name} came out of this batch?`
                                : 'Optional — leave blank to keep the planned quantity.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <InputLabel value="Quantity produced" />
                        <TextInput
                            autoFocus
                            type="number"
                            value={qtyDialog.quantity}
                            onChange={(e) => setQtyDialog((prev) => ({ ...prev, quantity: e.target.value }))}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                setQtyDialog({ open: false, batch: null, status: null, quantity: '' })
                            }
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={confirmQuantity}>
                            Mark {qtyDialog.status}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TenantLayout>
    );
}
