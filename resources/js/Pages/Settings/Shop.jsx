import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import { colors } from '@/theme/bakeryTheme';
import { Head, router, useForm } from '@inertiajs/react';

export default function Shop({ settings, categories = [] }) {
    const brandForm = useForm({
        shop_name: settings.shop_name ?? '',
        primary_color: settings.primary_color ?? colors.jam,
        accent_color: settings.accent_color ?? colors.butter,
        logo: null,
        remove_logo: false,
    });

    const categoryForm = useForm({
        name: '',
        kind: 'produced',
    });

    const baked = categories.filter((category) => category.kind === 'produced');
    const hardware = categories.filter((category) => category.kind === 'hardware');

    return (
        <TenantLayout title="Shop">
            <Head title="Shop settings" />

            <PageHeader
                title="Shop settings"
                description="Categories split baked goods from hardware. Branding is what the team sees on this shop."
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <SurfaceCard>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            brandForm.post(route('tenant.shop.update'), {
                                forceFormData: true,
                            });
                        }}
                        className="flex flex-col gap-4"
                    >
                        <div>
                            <p className="text-base font-bold">Shop brand</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Logo and colours apply across this shop.
                            </p>
                        </div>
                        <div>
                            <InputLabel value="Shop name" />
                            <TextInput
                                value={brandForm.data.shop_name}
                                onChange={(e) => brandForm.setData('shop_name', e.target.value)}
                                placeholder="Shown next to the logo"
                            />
                            <InputError message={brandForm.errors.shop_name} />
                        </div>
                        <div>
                            <InputLabel value="Logo" />
                            {settings.logo_url && !brandForm.data.remove_logo && (
                                <img
                                    src={settings.logo_url}
                                    alt=""
                                    className="mb-2 block h-[72px] w-[72px] rounded-md border border-border bg-wheat-light object-contain p-2"
                                />
                            )}
                            <TextInput
                                type="file"
                                accept="image/*"
                                onChange={(e) => brandForm.setData('logo', e.target.files?.[0] ?? null)}
                            />
                            <InputError message={brandForm.errors.logo} />
                            {settings.logo_url && (
                                <button
                                    type="button"
                                    className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-xs text-jam"
                                    onClick={() => brandForm.setData('remove_logo', true)}
                                >
                                    Remove current logo
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ColorField
                                label="Primary colour"
                                value={brandForm.data.primary_color}
                                error={brandForm.errors.primary_color}
                                onChange={(value) => brandForm.setData('primary_color', value)}
                            />
                            <ColorField
                                label="Accent colour"
                                value={brandForm.data.accent_color}
                                error={brandForm.errors.accent_color}
                                onChange={(value) => brandForm.setData('accent_color', value)}
                            />
                        </div>
                        <PrimaryButton type="submit" disabled={brandForm.processing}>
                            Save branding
                        </PrimaryButton>
                    </form>
                </SurfaceCard>

                <SurfaceCard>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            categoryForm.post(route('tenant.shop.categories.store'), {
                                onSuccess: () => categoryForm.reset('name'),
                            });
                        }}
                        className="flex flex-col gap-4"
                    >
                        <div>
                            <p className="text-base font-bold">Add a category</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Baked categories require a recipe. Hardware is bought, not produced.
                            </p>
                        </div>
                        <div>
                            <InputLabel value="Name" />
                            <TextInput
                                value={categoryForm.data.name}
                                onChange={(e) => categoryForm.setData('name', e.target.value)}
                            />
                            <InputError message={categoryForm.errors.name} />
                        </div>
                        <div>
                            <InputLabel value="Kind" />
                            <Select
                                value={categoryForm.data.kind}
                                onValueChange={(value) => categoryForm.setData('kind', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="produced">Baked — needs a recipe</SelectItem>
                                    <SelectItem value="hardware">Hardware — bought in</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <PrimaryButton type="submit" disabled={categoryForm.processing}>
                            Add category
                        </PrimaryButton>
                    </form>
                </SurfaceCard>
            </div>

            <CategoryList title="Baked" items={baked} />
            <CategoryList title="Hardware" items={hardware} />
        </TenantLayout>
    );
}

function ColorField({ label, value, error, onChange }) {
    return (
        <div>
            <InputLabel value={label} />
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    className="h-10 w-10 cursor-pointer rounded-md border border-border bg-cream p-0 outline-none focus:border-jam focus-visible:outline-none"
                />
                <TextInput
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                />
            </div>
            <InputError message={error} />
        </div>
    );
}

function CategoryList({ title, items }) {
    return (
        <SurfaceCard className="mt-6">
            <p className="mb-4 text-base font-bold">{title}</p>
            <div className="flex flex-col gap-3">
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground">None yet.</p>
                )}
                {items.map((category) => (
                    <div
                        key={category.id}
                        className="flex flex-col justify-between gap-2 border-b border-border py-2 sm:flex-row sm:items-center"
                    >
                        <div>
                            <p className="text-sm font-semibold">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {category.products_count} product{category.products_count === 1 ? '' : 's'}
                                {category.is_system ? ' · starter' : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge
                                status={category.kind}
                                label={category.kind === 'hardware' ? 'Hardware' : 'Baked'}
                            />
                            {!category.is_system && (
                                <ConfirmButton
                                    size="small"
                                    variant="danger"
                                    confirmTitle="Delete category"
                                    confirmMessage={`Delete ${category.name}?`}
                                    onConfirm={() =>
                                        router.delete(route('tenant.shop.categories.destroy', category.id), {
                                            preserveScroll: true,
                                        })
                                    }
                                >
                                    Delete
                                </ConfirmButton>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </SurfaceCard>
    );
}
