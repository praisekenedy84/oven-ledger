import { colors } from '@/theme/bakeryTheme';
import { Chip } from '@mui/material';

const STATUS_COLORS = {
    active: { bg: `${colors.sage}1f`, color: colors.sage },
    suspended: { bg: `${colors.jam}1a`, color: colors.jam },
    inactive: { bg: colors.wheatLight, color: colors.muted, border: colors.border },
    planned: { bg: colors.wheatLight, color: colors.muted, border: colors.border },
    baking: { bg: `${colors.jam}1a`, color: colors.jam },
    cooling: { bg: `${colors.butter}24`, color: '#8A6410' },
    ready: { bg: `${colors.sage}1f`, color: colors.sage },
    dispatched: { bg: `${colors.ink}14`, color: colors.ink },
    completed: { bg: `${colors.sage}1f`, color: colors.sage },
    voided: { bg: `${colors.jam}1a`, color: colors.jam },
    reversal: { bg: `${colors.jam}1a`, color: colors.jam },
    wholesale: { bg: `${colors.butter}24`, color: '#8A6410' },
    restaurant: { bg: `${colors.sage}1f`, color: colors.sage },
    produced: { bg: `${colors.jam}1a`, color: colors.jam },
    trading: { bg: colors.wheatLight, color: colors.muted, border: colors.border },
    hardware: { bg: colors.wheatLight, color: colors.muted, border: colors.border },
    retail: { bg: `${colors.sage}1f`, color: colors.sage },
    custom: { bg: `${colors.butter}24`, color: '#8A6410' },
    charge: { bg: `${colors.butter}24`, color: '#8A6410' },
    payment: { bg: `${colors.sage}1f`, color: colors.sage },
    open: { bg: `${colors.butter}24`, color: '#8A6410' },
    settled: { bg: `${colors.sage}1f`, color: colors.sage },
    pending: { bg: `${colors.butter}24`, color: '#8A6410' },
    pickup: { bg: colors.wheatLight, color: colors.ink },
    delivery: { bg: `${colors.ink}14`, color: colors.ink },
    supplier_credit: { bg: colors.wheatLight, color: colors.ink },
    loan: { bg: `${colors.ink}14`, color: colors.ink },
    other: { bg: colors.wheatLight, color: colors.muted, border: colors.border },
    capital_injection: { bg: `${colors.sage}1f`, color: colors.sage },
    drawing: { bg: `${colors.jam}1a`, color: colors.jam },
};

export default function StatusBadge({ status, label }) {
    const normalized = String(status ?? '').toLowerCase();
    const style = STATUS_COLORS[normalized] ?? {
        bg: colors.wheatLight,
        color: colors.muted,
        border: colors.border,
    };

    return (
        <Chip
            size="small"
            label={label ?? normalized.replace(/_/g, ' ')}
            sx={{
                height: 24,
                fontWeight: 600,
                textTransform: 'capitalize',
                bgcolor: style.bg,
                color: style.color,
                border: style.border ? `1px solid ${style.border}` : 'none',
            }}
        />
    );
}
