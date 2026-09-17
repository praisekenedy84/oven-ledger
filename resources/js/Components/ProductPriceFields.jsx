import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { cn } from '@/lib/utils';

const CHANNELS = [
    { key: 'retail', label: 'Retail (TZS)' },
    { key: 'wholesale', label: 'Wholesale (TZS)' },
    { key: 'restaurant', label: 'Restaurant (TZS)' },
];

export default function ProductPriceFields({
    data,
    setData,
    errors,
    showCostPrice = false,
    showHeading = true,
    className,
}) {
    return (
        <div className={cn('space-y-4', className)}>
            {showCostPrice && (
                <div>
                    <InputLabel value="What you pay (TZS)" />
                    <TextInput
                        type="number"
                        inputProps={{ min: 0, step: '1' }}
                        value={data.cost_price}
                        onChange={(e) => setData('cost_price', e.target.value)}
                    />
                    <InputError message={errors.cost_price} />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Buy-in cost for this hardware item. Used to tell profit from the selling price.
                    </p>
                </div>
            )}

            <div>
                {showHeading && (
                    <>
                        <p className="mb-1 text-sm font-semibold">Selling prices</p>
                        <p className="mb-3 block text-xs text-muted-foreground">
                            What the counter charges on each channel. Leave a channel blank if you do not sell there.
                        </p>
                    </>
                )}
                {!showHeading && (
                    <p className="mb-3 block text-xs text-muted-foreground">
                        What the counter charges on each channel. Leave a channel blank if you do not sell there.
                    </p>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                    {CHANNELS.map((channel) => (
                        <div key={channel.key}>
                            <InputLabel value={channel.label} />
                            <TextInput
                                type="number"
                                inputProps={{ min: 0, step: '1' }}
                                value={data.prices?.[channel.key] ?? ''}
                                onChange={(e) =>
                                    setData('prices', {
                                        ...data.prices,
                                        [channel.key]: e.target.value,
                                    })
                                }
                            />
                            <InputError message={errors[`prices.${channel.key}`]} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
