import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from '@mui/material';
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

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                }}
            >
                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        brandForm.post(route('tenant.shop.update'), {
                            forceFormData: true,
                        });
                    }}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 1 }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        Shop brand
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                        Logo and colours apply across this shop.
                    </Typography>
                    <Stack spacing={2}>
                        <Box>
                            <InputLabel value="Shop name" />
                            <TextInput
                                value={brandForm.data.shop_name}
                                onChange={(e) => brandForm.setData('shop_name', e.target.value)}
                                placeholder="Shown next to the logo"
                            />
                            <InputError message={brandForm.errors.shop_name} />
                        </Box>
                        <Box>
                            <InputLabel value="Logo" />
                            {settings.logo_url && !brandForm.data.remove_logo && (
                                <Box
                                    component="img"
                                    src={settings.logo_url}
                                    alt=""
                                    sx={{
                                        display: 'block',
                                        width: 72,
                                        height: 72,
                                        objectFit: 'contain',
                                        mb: 1,
                                        p: 1,
                                        borderRadius: 1,
                                        bgcolor: colors.wheatLight,
                                        border: `1px solid ${colors.border}`,
                                    }}
                                />
                            )}
                            <TextInput
                                type="file"
                                inputProps={{ accept: 'image/*' }}
                                onChange={(e) => brandForm.setData('logo', e.target.files?.[0] ?? null)}
                            />
                            <InputError message={brandForm.errors.logo} />
                            {settings.logo_url && (
                                <Typography
                                    component="button"
                                    type="button"
                                    variant="caption"
                                    onClick={() => brandForm.setData('remove_logo', true)}
                                    sx={{
                                        mt: 0.75,
                                        border: 0,
                                        bgcolor: 'transparent',
                                        color: colors.jam,
                                        cursor: 'pointer',
                                        p: 0,
                                    }}
                                >
                                    Remove current logo
                                </Typography>
                            )}
                        </Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: '1fr 1fr',
                            }}
                        >
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
                        </Box>
                        <PrimaryButton type="submit" disabled={brandForm.processing}>
                            Save branding
                        </PrimaryButton>
                    </Stack>
                </Paper>

                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        categoryForm.post(route('tenant.shop.categories.store'), {
                            onSuccess: () => categoryForm.reset('name'),
                        });
                    }}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 1 }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        Add a category
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                        Baked categories require a recipe. Hardware is bought, not produced.
                    </Typography>
                    <Stack spacing={2}>
                        <Box>
                            <InputLabel value="Name" />
                            <TextInput
                                value={categoryForm.data.name}
                                onChange={(e) => categoryForm.setData('name', e.target.value)}
                            />
                            <InputError message={categoryForm.errors.name} />
                        </Box>
                        <Box>
                            <InputLabel value="Kind" />
                            <FormControl fullWidth size="small">
                                <Select
                                    value={categoryForm.data.kind}
                                    onChange={(e) => categoryForm.setData('kind', e.target.value)}
                                >
                                    <MenuItem value="produced">Baked — needs a recipe</MenuItem>
                                    <MenuItem value="hardware">Hardware — bought in</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <PrimaryButton type="submit" disabled={categoryForm.processing}>
                            Add category
                        </PrimaryButton>
                    </Stack>
                </Paper>
            </Box>

            <CategoryList title="Baked" items={baked} />
            <CategoryList title="Hardware" items={hardware} />
        </TenantLayout>
    );
}

function ColorField({ label, value, error, onChange }) {
    return (
        <Box>
            <InputLabel value={label} />
            <Stack direction="row" spacing={1} alignItems="center">
                <Box
                    component="input"
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    sx={{
                        width: 40,
                        height: 40,
                        p: 0,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 1,
                        bgcolor: colors.cream,
                        cursor: 'pointer',
                        outline: 'none',
                        '&:focus, &:focus-visible': {
                            outline: 'none',
                            borderColor: colors.jam,
                        },
                    }}
                />
                <TextInput
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                />
            </Stack>
            <InputError message={error} />
        </Box>
    );
}

function CategoryList({ title, items }) {
    return (
        <Paper variant="outlined" sx={{ mt: 3, p: 3, borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                {title}
            </Typography>
            <Stack spacing={1.25}>
                {items.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        None yet.
                    </Typography>
                )}
                {items.map((category) => (
                    <Stack
                        key={category.id}
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={1}
                        sx={{
                            py: 1,
                            borderBottom: `1px solid ${colors.border}`,
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle2">{category.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {category.products_count} product{category.products_count === 1 ? '' : 's'}
                                {category.is_system ? ' · starter' : ''}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
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
                        </Stack>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
}
