import Checkbox from '@/Components/Checkbox';
import FeatureBadge from '@/Components/FeatureBadge';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { businessSizeLabel, featureLabel } from '@/lib/features';
import { Head, Link, useForm } from '@inertiajs/react';

function flagsForSize(featureKeys, defaultFeatureFlags, businessSizePresets, size) {
    const base = Object.fromEntries(
        featureKeys.map((key) => [key, defaultFeatureFlags?.[key] ?? false]),
    );

    return {
        ...base,
        ...(businessSizePresets?.[size] ?? {}),
    };
}

export default function Create({
    featureKeys,
    defaultFeatureFlags = {},
    businessSizes = ['small', 'medium', 'large'],
    businessSizePresets = {},
}) {
    const initialSize = 'medium';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        owner_name: '',
        owner_username: '',
        owner_email: '',
        owner_phone: '',
        owner_password: '',
        max_branches: 1,
        business_size: initialSize,
        feature_flags: flagsForSize(
            featureKeys,
            defaultFeatureFlags,
            businessSizePresets,
            initialSize,
        ),
    });

    const setBusinessSize = (size) => {
        setData({
            ...data,
            business_size: size,
            feature_flags: flagsForSize(
                featureKeys,
                defaultFeatureFlags,
                businessSizePresets,
                size,
            ),
            max_branches: size === 'large' ? Math.max(Number(data.max_branches) || 1, 2) : data.max_branches,
        });
    };

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
                description="Create a new bakery tenant with owner account, bakery size, and feature flags."
                backHref={route('platform.tenants.index')}
            />

            <form
                className="mx-auto max-w-[720px]"
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('platform.tenants.store'));
                }}
            >
                <div className="space-y-6">
                    <SurfaceCard>
                        <h2 className="mb-4 text-base font-bold">Business</h2>
                        <div className="space-y-4">
                            <div>
                                <InputLabel value="Business name" />
                                <TextInput
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div>
                                <InputLabel value="Bakery size" />
                                <Select
                                    value={data.business_size}
                                    onValueChange={(value) => setBusinessSize(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessSizes.map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {businessSizeLabel(size)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="mt-2 block text-xs text-muted-foreground">
                                    Small bakeries skip production batches and add finished goods straight to the
                                    shelf. Recipes still drive profit and loss.
                                </p>
                                <InputError message={errors.business_size} />
                            </div>
                            <div>
                                <InputLabel value="Max branches" />
                                <TextInput
                                    type="number"
                                    min={1}
                                    value={data.max_branches}
                                    onChange={(e) => setData('max_branches', Number(e.target.value))}
                                />
                                <InputError message={errors.max_branches} />
                            </div>
                        </div>
                    </SurfaceCard>

                    <SurfaceCard>
                        <h2 className="mb-4 text-base font-bold">Owner account</h2>
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Owner name" />
                                    <TextInput
                                        value={data.owner_name}
                                        onChange={(e) => setData('owner_name', e.target.value)}
                                    />
                                    <InputError message={errors.owner_name} />
                                </div>
                                <div>
                                    <InputLabel value="Username" />
                                    <TextInput
                                        value={data.owner_username}
                                        autoComplete="username"
                                        onChange={(e) => setData('owner_username', e.target.value)}
                                    />
                                    <InputError message={errors.owner_username} />
                                </div>
                                <div>
                                    <InputLabel value="Phone" />
                                    <TextInput
                                        value={data.owner_phone}
                                        onChange={(e) => setData('owner_phone', e.target.value)}
                                    />
                                    <InputError message={errors.owner_phone} />
                                </div>
                            </div>
                            <div>
                                <InputLabel value="Owner email" />
                                <TextInput
                                    type="email"
                                    value={data.owner_email}
                                    onChange={(e) => setData('owner_email', e.target.value)}
                                />
                                <InputError message={errors.owner_email} />
                                <p className="text-xs text-muted-foreground">
                                    Sign in with this email or the username above. Both must be unique across all
                                    tenants.
                                </p>
                            </div>
                            <div>
                                <InputLabel value="Initial password" />
                                <TextInput
                                    type="password"
                                    value={data.owner_password}
                                    onChange={(e) => setData('owner_password', e.target.value)}
                                />
                                <InputError message={errors.owner_password} />
                            </div>
                        </div>
                    </SurfaceCard>

                    <SurfaceCard>
                        <h2 className="text-base font-bold">Feature flags</h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Size presets are applied first. Tweak individual modules below if needed.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {featureKeys.map((key) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                                >
                                    <FeatureBadge featureKey={key} enabled={data.feature_flags[key]} />
                                    <Checkbox
                                        checked={!!data.feature_flags[key]}
                                        onChange={() => toggleFlag(key)}
                                        inputProps={{ 'aria-label': featureLabel(key) }}
                                    />
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>

                    <div className="flex flex-row justify-end gap-2">
                        <SecondaryButton asChild>
                            <Link href={route('platform.tenants.index')}>Cancel</Link>
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            Provision tenant
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </PlatformLayout>
    );
}
