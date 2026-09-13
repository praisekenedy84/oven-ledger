import Checkbox from '@/Components/Checkbox';
import FeatureBadge from '@/Components/FeatureBadge';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { featureLabel } from '@/lib/features';
import { colors } from '@/theme/bakeryTheme';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ featureKeys }) {
    const initialFlags = Object.fromEntries(featureKeys.map((key) => [key, true]));

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        owner_password: '',
        max_branches: 1,
        feature_flags: initialFlags,
    });

    const toggleFlag = (key) => {
        setData('feature_flags', {
            ...data.feature_flags,
            [key]: !data.feature_flags[key],
        });
    };

    return (
        <PlatformLayout title="New Tenant">
            <Head title="New Tenant" />

            <PageHeader
                title="Provision tenant"
                description="Create a new bakery tenant with owner account and feature flags."
                backHref={route('platform.tenants.index')}
            />

            <Box
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('platform.tenants.store'));
                }}
                sx={{ mx: 'auto', maxWidth: 720 }}
            >
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                            Business
                        </Typography>
                        <Stack spacing={2}>
                            <Box>
                                <InputLabel value="Business name" />
                                <TextInput
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </Box>
                            <Box>
                                <InputLabel value="Max branches" />
                                <TextInput
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={data.max_branches}
                                    onChange={(e) =>
                                        setData('max_branches', Number(e.target.value))
                                    }
                                />
                                <InputError message={errors.max_branches} />
                            </Box>
                        </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                            Owner account
                        </Typography>
                        <Stack spacing={2}>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                }}
                            >
                                <Box>
                                    <InputLabel value="Owner name" />
                                    <TextInput
                                        value={data.owner_name}
                                        onChange={(e) => setData('owner_name', e.target.value)}
                                    />
                                    <InputError message={errors.owner_name} />
                                </Box>
                                <Box>
                                    <InputLabel value="Phone" />
                                    <TextInput
                                        value={data.owner_phone}
                                        onChange={(e) => setData('owner_phone', e.target.value)}
                                    />
                                    <InputError message={errors.owner_phone} />
                                </Box>
                            </Box>
                            <Box>
                                <InputLabel value="Owner email" />
                                <TextInput
                                    type="email"
                                    value={data.owner_email}
                                    onChange={(e) => setData('owner_email', e.target.value)}
                                />
                                <InputError message={errors.owner_email} />
                                <Typography variant="caption" color="text.secondary">
                                    Used to sign in at the shared Oven Ledger URL. Must be unique
                                    across all tenants.
                                </Typography>
                            </Box>
                            <Box>
                                <InputLabel value="Initial password" />
                                <TextInput
                                    type="password"
                                    value={data.owner_password}
                                    onChange={(e) => setData('owner_password', e.target.value)}
                                />
                                <InputError message={errors.owner_password} />
                            </Box>
                        </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                            Feature flags
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 1.5,
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            }}
                        >
                            {featureKeys.map((key) => (
                                <Box
                                    key={key}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: 2,
                                        p: 1.5,
                                    }}
                                >
                                    <FeatureBadge
                                        featureKey={key}
                                        enabled={data.feature_flags[key]}
                                    />
                                    <Checkbox
                                        checked={!!data.feature_flags[key]}
                                        onChange={() => toggleFlag(key)}
                                        inputProps={{ 'aria-label': featureLabel(key) }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Paper>

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <SecondaryButton component={Link} href={route('platform.tenants.index')}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            Provision tenant
                        </PrimaryButton>
                    </Stack>
                </Stack>
            </Box>
        </PlatformLayout>
    );
}
