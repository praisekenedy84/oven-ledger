import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import RawMaterialLifecycleTable from '@/Components/RawMaterialLifecycleTable';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatQuantity } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

function todayInput() {
    return new Date().toISOString().slice(0, 10);
}

export default function Show({ rawMaterial, movements }) {
    const restockForm = useForm({
        raw_material_id: rawMaterial.id,
        quantity: '',
        unit_cost: rawMaterial.unit_cost ?? '',
        occurred_at: todayInput(),
        notes: '',
    });

    return (
        <TenantLayout title={rawMaterial.name}>
            <Head title={rawMaterial.name} />

            <PageHeader
                eyebrow="Raw material"
                title={rawMaterial.name}
                description="Every restock, bake, and write-off for this ingredient at the current branch."
                backHref={route('tenant.raw-materials.index')}
            />

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                {[
                    {
                        label: 'On hand',
                        value: `${formatQuantity(rawMaterial.quantity_on_hand)} ${rawMaterial.unit_of_measure}`,
                    },
                    {
                        label: 'Reorder at',
                        value: rawMaterial.reorder_threshold ?? '—',
                    },
                    {
                        label: 'Price per unit',
                        value: rawMaterial.unit_cost ? <Money amount={rawMaterial.unit_cost} /> : '—',
                    },
                ].map((card) => (
                    <SurfaceCard key={card.label}>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-lg font-bold text-cocoa">{card.value}</p>
                    </SurfaceCard>
                ))}
            </div>

            <SurfaceCard className="mb-8">
                <form
                    className="grid gap-4 sm:grid-cols-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        restockForm.post(route('tenant.inventory.restock'), {
                            preserveScroll: true,
                            onSuccess: () => restockForm.reset('quantity', 'notes'),
                        });
                    }}
                >
                    <h2 className="col-span-full text-lg font-semibold">Restock</h2>
                    <div>
                        <InputLabel value={`Quantity (${rawMaterial.unit_of_measure})`} />
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
                            onChange={(e) => restockForm.setData('occurred_at', e.target.value)}
                        />
                    </div>
                    <div className="sm:col-span-full">
                        <InputLabel value="Notes" />
                        <TextInput
                            value={restockForm.data.notes}
                            onChange={(e) => restockForm.setData('notes', e.target.value)}
                            placeholder="Supplier, invoice, bag count…"
                        />
                    </div>
                    <div className="col-span-full">
                        <PrimaryButton type="submit" disabled={restockForm.processing}>
                            Record restock
                        </PrimaryButton>
                    </div>
                </form>
            </SurfaceCard>

            <h2 className="mb-3 text-lg font-semibold">Lifecycle</h2>
            <RawMaterialLifecycleTable
                movements={movements}
                emptyMessage="No restocks or usage yet for this material."
            />
        </TenantLayout>
    );
}
