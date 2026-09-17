import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatQuantity } from '@/lib/format';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

function todayInput() {
    return new Date().toISOString().slice(0, 10);
}

export default function Index({ rawMaterials }) {
    const [panel, setPanel] = useState(null);

    const createForm = useForm({
        name: '',
        unit_of_measure: 'kg',
        reorder_threshold: '',
        unit_cost: '',
        current_stock: '',
    });

    const editForm = useForm({
        name: '',
        unit_of_measure: '',
        reorder_threshold: '',
        unit_cost: '',
    });

    const restockForm = useForm({
        raw_material_id: '',
        quantity: '',
        unit_cost: '',
        occurred_at: todayInput(),
        notes: '',
    });

    const closePanel = () => setPanel(null);

    const startEdit = (item) => {
        setPanel({ type: 'edit', id: item.id });
        editForm.clearErrors();
        editForm.setData({
            name: item.name,
            unit_of_measure: item.unit_of_measure,
            reorder_threshold: item.reorder_threshold ?? '',
            unit_cost: item.unit_cost ?? '',
        });
    };

    const startRestock = (item) => {
        setPanel({ type: 'restock', id: item.id, unit: item.unit_of_measure, name: item.name });
        restockForm.clearErrors();
        restockForm.setData({
            raw_material_id: item.id,
            quantity: '',
            unit_cost: item.unit_cost ?? '',
            occurred_at: todayInput(),
            notes: '',
        });
    };

    return (
        <TenantLayout title="Raw Materials">
            <Head title="Raw Materials" />

            <PageHeader
                title="Raw materials"
                description="Ingredients and supplies used in production. Restock from the table, edit details inline, or open history for the full lifecycle."
            />

            <SurfaceCard className="mb-6">
                <form
                    className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        createForm.post(route('tenant.raw-materials.store'), {
                            onSuccess: () => createForm.reset(),
                        });
                    }}
                >
                <div>
                    <InputLabel value="Name" />
                    <TextInput
                        value={createForm.data.name}
                        onChange={(e) => createForm.setData('name', e.target.value)}
                    />
                    <InputError message={createForm.errors.name} />
                </div>
                <div>
                    <InputLabel value="Unit" />
                    <TextInput
                        value={createForm.data.unit_of_measure}
                        onChange={(e) => createForm.setData('unit_of_measure', e.target.value)}
                    />
                </div>
                <div>
                    <InputLabel value="Current stock" />
                    <TextInput
                        type="number"
                        min={0}
                        step="0.001"
                        value={createForm.data.current_stock}
                        onChange={(e) => createForm.setData('current_stock', e.target.value)}
                        placeholder="Optional"
                    />
                    <InputError message={createForm.errors.current_stock} />
                </div>
                <div>
                    <InputLabel value="Reorder at" />
                    <TextInput
                        type="number"
                        step="0.001"
                        value={createForm.data.reorder_threshold}
                        onChange={(e) => createForm.setData('reorder_threshold', e.target.value)}
                    />
                </div>
                <div>
                    <InputLabel value="Price per unit (TZS)" />
                    <TextInput
                        type="number"
                        min={0}
                        step="1"
                        value={createForm.data.unit_cost}
                        onChange={(e) => createForm.setData('unit_cost', e.target.value)}
                    />
                    <InputError message={createForm.errors.unit_cost} />
                </div>
                <div className="col-span-full">
                    <PrimaryButton type="submit" disabled={createForm.processing}>
                        Add raw material
                    </PrimaryButton>
                </div>
                </form>
            </SurfaceCard>

            <TooltipProvider>
                <DataTable
                    columns={[
                        { label: 'Name' },
                        { label: 'On hand' },
                        { label: 'Unit' },
                        { label: 'Reorder threshold' },
                        { label: 'Price / unit' },
                        { label: 'Actions' },
                    ]}
                >
                    {rawMaterials.data.map((item) => {
                        const isEditing = panel?.type === 'edit' && panel.id === item.id;
                        const isRestocking = panel?.type === 'restock' && panel.id === item.id;

                        return (
                            <Fragment key={item.id}>
                                <DataTableRow>
                                    <DataTableCell className="font-semibold">{item.name}</DataTableCell>
                                    <DataTableCell>
                                        {formatQuantity(item.quantity_on_hand ?? 0)}
                                    </DataTableCell>
                                    <DataTableCell>{item.unit_of_measure}</DataTableCell>
                                    <DataTableCell>{item.reorder_threshold ?? '—'}</DataTableCell>
                                    <DataTableCell>
                                        {item.unit_cost ? <Money amount={item.unit_cost} /> : '—'}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={isRestocking ? 'default' : 'outline'}
                                                onClick={() =>
                                                    isRestocking ? closePanel() : startRestock(item)
                                                }
                                            >
                                                Restock
                                            </Button>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant={isEditing ? 'default' : 'ghost'}
                                                        className="h-8 w-8"
                                                        aria-label={`Edit ${item.name}`}
                                                        onClick={() =>
                                                            isEditing ? closePanel() : startEdit(item)
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        asChild
                                                        aria-label={`View history for ${item.name}`}
                                                    >
                                                        <Link href={route('tenant.raw-materials.show', item.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>View history</TooltipContent>
                                            </Tooltip>
                                            <ConfirmButton
                                                size="small"
                                                variant="danger"
                                                confirmTitle="Delete raw material"
                                                confirmMessage={`Delete ${item.name}?`}
                                                onConfirm={() =>
                                                    router.delete(
                                                        route('tenant.raw-materials.destroy', item.id),
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                className="min-w-9 px-2"
                                                aria-label={`Delete ${item.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </ConfirmButton>
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>

                                {(isEditing || isRestocking) && (
                                    <DataTableRow>
                                        <DataTableCell
                                            colSpan={6}
                                            className="border-t border-border bg-wheat-light py-5"
                                        >
                                            {isEditing ? (
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        editForm.put(
                                                            route('tenant.raw-materials.update', item.id),
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess: closePanel,
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <p className="text-sm font-bold">Edit {item.name}</p>
                                                    <p className="mb-4 mt-0.5 block text-xs text-muted-foreground">
                                                        Adjust name, unit, reorder point, or buy-in price. Stock
                                                        changes go through Restock.
                                                    </p>
                                                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                                                        <div>
                                                            <InputLabel value="Name" />
                                                            <TextInput
                                                                value={editForm.data.name}
                                                                onChange={(e) =>
                                                                    editForm.setData('name', e.target.value)
                                                                }
                                                            />
                                                            <InputError message={editForm.errors.name} />
                                                        </div>
                                                        <div>
                                                            <InputLabel value="Unit" />
                                                            <TextInput
                                                                value={editForm.data.unit_of_measure}
                                                                onChange={(e) =>
                                                                    editForm.setData(
                                                                        'unit_of_measure',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError message={editForm.errors.unit_of_measure} />
                                                        </div>
                                                        <div>
                                                            <InputLabel value="Reorder at" />
                                                            <TextInput
                                                                type="number"
                                                                step="0.001"
                                                                value={editForm.data.reorder_threshold}
                                                                onChange={(e) =>
                                                                    editForm.setData(
                                                                        'reorder_threshold',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={editForm.errors.reorder_threshold}
                                                            />
                                                        </div>
                                                        <div>
                                                            <InputLabel value="Price per unit (TZS)" />
                                                            <TextInput
                                                                type="number"
                                                                min={0}
                                                                step="1"
                                                                value={editForm.data.unit_cost}
                                                                onChange={(e) =>
                                                                    editForm.setData('unit_cost', e.target.value)
                                                                }
                                                            />
                                                            <InputError message={editForm.errors.unit_cost} />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex gap-2">
                                                        <PrimaryButton
                                                            type="submit"
                                                            size="small"
                                                            disabled={editForm.processing}
                                                        >
                                                            Save changes
                                                        </PrimaryButton>
                                                        <SecondaryButton size="small" onClick={closePanel}>
                                                            Cancel
                                                        </SecondaryButton>
                                                    </div>
                                                </form>
                                            ) : (
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        restockForm.post(route('tenant.inventory.restock'), {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                restockForm.reset('quantity', 'notes');
                                                                closePanel();
                                                            },
                                                        });
                                                    }}
                                                >
                                                    <p className="text-sm font-bold">Restock {item.name}</p>
                                                    <p className="mb-4 mt-0.5 block text-xs text-muted-foreground">
                                                        Add what you received. On-hand quantity and price update when
                                                        you save.
                                                    </p>
                                                    <div className="grid gap-4 sm:grid-cols-4">
                                                        <div>
                                                            <InputLabel
                                                                value={`Quantity (${item.unit_of_measure})`}
                                                            />
                                                            <TextInput
                                                                type="number"
                                                                min={0}
                                                                step="0.001"
                                                                value={restockForm.data.quantity}
                                                                onChange={(e) =>
                                                                    restockForm.setData('quantity', e.target.value)
                                                                }
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
                                                                onChange={(e) =>
                                                                    restockForm.setData('unit_cost', e.target.value)
                                                                }
                                                            />
                                                            <InputError message={restockForm.errors.unit_cost} />
                                                        </div>
                                                        <div>
                                                            <InputLabel value="Received on" />
                                                            <TextInput
                                                                type="date"
                                                                value={restockForm.data.occurred_at}
                                                                onChange={(e) =>
                                                                    restockForm.setData(
                                                                        'occurred_at',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError message={restockForm.errors.occurred_at} />
                                                        </div>
                                                        <div>
                                                            <InputLabel value="Notes" />
                                                            <TextInput
                                                                value={restockForm.data.notes}
                                                                onChange={(e) =>
                                                                    restockForm.setData('notes', e.target.value)
                                                                }
                                                                placeholder="Supplier, invoice…"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex gap-2">
                                                        <PrimaryButton
                                                            type="submit"
                                                            size="small"
                                                            disabled={restockForm.processing}
                                                        >
                                                            Record restock
                                                        </PrimaryButton>
                                                        <SecondaryButton size="small" onClick={closePanel}>
                                                            Cancel
                                                        </SecondaryButton>
                                                    </div>
                                                </form>
                                            )}
                                        </DataTableCell>
                                    </DataTableRow>
                                )}
                            </Fragment>
                        );
                    })}
                </DataTable>
            </TooltipProvider>

            <Pagination links={rawMaterials.links} />
        </TenantLayout>
    );
}
