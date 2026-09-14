import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Box, Typography } from '@mui/material';

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
}) {
    return (
        <>
            {showCostPrice && (
                <Box>
                    <InputLabel value="What you pay (TZS)" />
                    <TextInput
                        type="number"
                        inputProps={{ min: 0, step: '1' }}
                        value={data.cost_price}
                        onChange={(e) => setData('cost_price', e.target.value)}
                    />
                    <InputError message={errors.cost_price} />
                    <Typography variant="caption" color="text.secondary">
                        Buy-in cost for this hardware item. Used to tell profit from the selling price.
                    </Typography>
                </Box>
            )}

            <Box>
                {showHeading && (
                    <>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            Selling prices
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                            What the counter charges on each channel. Leave a channel blank if you do not sell there.
                        </Typography>
                    </>
                )}
                {!showHeading && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                        What the counter charges on each channel. Leave a channel blank if you do not sell there.
                    </Typography>
                )}
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                    }}
                >
                    {CHANNELS.map((channel) => (
                        <Box key={channel.key}>
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
                        </Box>
                    ))}
                </Box>
            </Box>
        </>
    );
}
