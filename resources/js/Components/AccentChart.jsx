import { colors, chartPalette } from '@/theme/bakeryTheme';
import { Box, Stack, Typography } from '@mui/material';

function formatTick(value) {
    const n = Number(value ?? 0);
    if (n >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(1)}m`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    }
    return String(Math.round(n));
}

export function BarChart({ items = [], height = 196 }) {
    const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

    return (
        <Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
                    alignItems: 'end',
                    gap: 1.5,
                    height,
                    px: 0.5,
                }}
            >
                {items.map((item, index) => {
                    const value = Number(item.value) || 0;
                    const color = item.color ?? chartPalette[index % chartPalette.length];
                    return (
                        <Stack key={item.label} alignItems="center" spacing={1} sx={{ height: '100%' }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color }}>
                                {formatTick(value)}
                            </Typography>
                            <Box
                                sx={{
                                    width: '100%',
                                    maxWidth: 56,
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: `${Math.max((value / max) * 100, value > 0 ? 6 : 0)}%`,
                                        bgcolor: color,
                                        borderRadius: '8px 8px 2px 2px',
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="overline"
                                sx={{ color: colors.muted, textAlign: 'center', lineHeight: 1.2 }}
                            >
                                {item.label}
                            </Typography>
                        </Stack>
                    );
                })}
            </Box>
        </Box>
    );
}

export function LineChart({ labels = [], series = [], height = 220 }) {
    const width = 640;
    const pad = { top: 16, right: 12, bottom: 28, left: 40 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const values = series.flatMap((s) => s.values.map((v) => Number(v) || 0));
    const max = Math.max(...values, 1);
    const stepX = labels.length > 1 ? innerW / (labels.length - 1) : innerW;

    const pointsFor = (vals) =>
        vals
            .map((value, i) => {
                const x = pad.left + i * stepX;
                const y = pad.top + innerH - ((Number(value) || 0) / max) * innerH;
                return `${x},${y}`;
            })
            .join(' ');

    const ticks = [0, 0.5, 1];

    return (
        <Box>
            <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: '100%', height, display: 'block' }}>
                {ticks.map((t) => {
                    const y = pad.top + innerH - t * innerH;
                    return (
                        <g key={t}>
                            <line
                                x1={pad.left}
                                x2={width - pad.right}
                                y1={y}
                                y2={y}
                                stroke={colors.border}
                                strokeWidth="1"
                            />
                            <text
                                x={pad.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                fill={colors.muted}
                                fontSize="11"
                                fontFamily="Archivo, Helvetica, sans-serif"
                            >
                                {formatTick(max * t)}
                            </text>
                        </g>
                    );
                })}
                {series.map((s, index) => (
                    <polyline
                        key={s.key ?? s.label}
                        fill="none"
                        stroke={s.color ?? chartPalette[index % chartPalette.length]}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={pointsFor(s.values)}
                    />
                ))}
                {labels.map((label, i) => (
                    <text
                        key={`${label}-${i}`}
                        x={pad.left + i * stepX}
                        y={height - 8}
                        textAnchor="middle"
                        fill={colors.muted}
                        fontSize="11"
                        fontFamily="Archivo, Helvetica, sans-serif"
                    >
                        {label}
                    </text>
                ))}
            </Box>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                {series.map((s, index) => (
                    <Stack key={s.key ?? s.label} direction="row" spacing={0.75} alignItems="center">
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '2px',
                                bgcolor: s.color ?? chartPalette[index % chartPalette.length],
                            }}
                        />
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                            {s.label}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
}
