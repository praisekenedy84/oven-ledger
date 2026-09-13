import { formatMoney } from '@/lib/format';
import { colors, chartPalette } from '@/theme/bakeryTheme';
import { useMediaQuery } from '@mui/material';
import { BarChart as MuiBarChart, barClasses } from '@mui/x-charts/BarChart';
import { LineChart as MuiLineChart, lineClasses } from '@mui/x-charts/LineChart';
import { PieChart as MuiPieChart, pieClasses } from '@mui/x-charts/PieChart';

const axisTickStyle = {
    fontFamily: 'Poppins, Helvetica, sans-serif',
    fontSize: 11,
    fill: colors.muted,
};

const chartSx = {
    '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
        stroke: colors.border,
    },
    '& .MuiChartsGrid-line': {
        stroke: colors.border,
        strokeDasharray: '3 6',
    },
    '& .MuiChartsLegend-label, & .MuiChartsLegend-series text': {
        fill: colors.ink,
        fontFamily: 'Poppins, Helvetica, sans-serif',
        fontSize: 12,
    },
};

function useSkipAnimation() {
    return useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
}

export function formatTick(value) {
    const n = Number(value ?? 0);
    if (n >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(1)}m`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    }

    return String(Math.round(n));
}

export function LineChart({ labels = [], series = [], height = 268 }) {
    const skipAnimation = useSkipAnimation();
    const hasData = series.some((item) => (item.values ?? []).some((value) => Number(value) > 0));

    return (
        <MuiLineChart
            height={height}
            skipAnimation={skipAnimation}
            grid={{ horizontal: true }}
            colors={chartPalette}
            hideLegend={!hasData}
            localeText={{ noData: 'No completed sales this week yet.' }}
            xAxis={[
                {
                    data: labels,
                    scaleType: 'point',
                    tickLabelStyle: axisTickStyle,
                    disableLine: true,
                    disableTicks: true,
                },
            ]}
            yAxis={[
                {
                    valueFormatter: (value) => formatTick(value),
                    tickLabelStyle: axisTickStyle,
                    disableLine: true,
                    disableTicks: true,
                    width: 44,
                },
            ]}
            series={
                hasData
                    ? series.map((item, index) => ({
                          id: item.key ?? item.label ?? String(index),
                          label: item.label,
                          data: (item.values ?? []).map((value) => Number(value) || 0),
                          color: item.color ?? chartPalette[index % chartPalette.length],
                          area: true,
                          curve: 'monotoneX',
                          showMark: true,
                          valueFormatter: (value) => formatMoney(value),
                      }))
                    : []
            }
            slotProps={{
                legend: {
                    direction: 'horizontal',
                },
            }}
            margin={{ top: 12, right: 12, bottom: 8, left: 4 }}
            sx={{
                ...chartSx,
                [`& .${lineClasses.area}`]: { opacity: 0.14 },
                [`& .${lineClasses.line}`]: { strokeWidth: 2.6 },
                [`& .${lineClasses.mark}`]: { strokeWidth: 1.5 },
            }}
        />
    );
}

export function BarChart({ items = [], height = 196 }) {
    const skipAnimation = useSkipAnimation();
    const labels = items.map((item) => item.label);
    const colorsForItems = items.map((item, index) => item.color ?? chartPalette[index % chartPalette.length]);

    return (
        <MuiBarChart
            height={height}
            skipAnimation={skipAnimation}
            borderRadius={8}
            grid={{ horizontal: true }}
            hideLegend
            localeText={{ noData: 'No totals to plot yet.' }}
            xAxis={[
                {
                    scaleType: 'band',
                    data: labels,
                    colorMap: {
                        type: 'ordinal',
                        values: labels,
                        colors: colorsForItems,
                    },
                    tickLabelStyle: axisTickStyle,
                    disableLine: true,
                    disableTicks: true,
                    categoryGapRatio: 0.42,
                    barGapRatio: 0.15,
                },
            ]}
            yAxis={[
                {
                    valueFormatter: (value) => formatTick(value),
                    tickLabelStyle: axisTickStyle,
                    disableLine: true,
                    disableTicks: true,
                    width: 44,
                },
            ]}
            series={[
                {
                    id: 'totals',
                    data: items.map((item) => Number(item.value) || 0),
                    valueFormatter: (value) => formatMoney(value),
                },
            ]}
            margin={{ top: 16, right: 8, bottom: 4, left: 4 }}
            sx={{
                ...chartSx,
                [`& .${barClasses.element}`]: {
                    filter: 'drop-shadow(0 6px 10px rgba(51, 38, 28, 0.12))',
                },
            }}
        />
    );
}

export function PieChart({
    items = [],
    height = 268,
    innerRadius = '58%',
    valueFormatter,
    arcLabel,
}) {
    const skipAnimation = useSkipAnimation();
    const data = items.map((item, index) => ({
        id: item.id ?? item.label ?? index,
        label: item.label,
        value: Number(item.value) || 0,
        color: item.color ?? chartPalette[index % chartPalette.length],
    }));

    return (
        <MuiPieChart
            height={height}
            skipAnimation={skipAnimation}
            hideLegend
            colors={chartPalette}
            localeText={{ noData: 'Sell a few tickets and this ring fills in.' }}
            series={[
                {
                    id: 'share',
                    data,
                    innerRadius,
                    outerRadius: '92%',
                    cx: '50%',
                    cy: '50%',
                    paddingAngle: 3,
                    cornerRadius: 6,
                    highlightScope: { fade: 'global', highlight: 'item' },
                    highlighted: { additionalRadius: 6 },
                    faded: { additionalRadius: -10 },
                    arcLabel: arcLabel ?? ((item) => (item.value > 0 ? formatTick(item.value) : '')),
                    arcLabelMinAngle: 28,
                    valueFormatter: valueFormatter ?? ((item) => `${formatTick(item.value)} sold`),
                },
            ]}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            sx={{
                ...chartSx,
                [`& .${pieClasses.arcLabel}`]: {
                    fill: colors.cream,
                    fontFamily: 'Poppins, Helvetica, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                },
            }}
        />
    );
}
