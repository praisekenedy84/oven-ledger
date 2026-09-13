import { featureLabel } from '@/lib/features';
import { colors } from '@/theme/bakeryTheme';
import { Chip } from '@mui/material';

export default function FeatureBadge({ featureKey, enabled }) {
    return (
        <Chip
            size="small"
            label={featureLabel(featureKey)}
            sx={{
                height: 24,
                fontWeight: 600,
                bgcolor: enabled ? `${colors.sage}1f` : colors.wheatLight,
                color: enabled ? colors.sage : colors.muted,
                border: enabled ? 'none' : `1px solid ${colors.border}`,
            }}
        />
    );
}
