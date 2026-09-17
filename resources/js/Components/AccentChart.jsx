import { formatMoney } from '@/lib/format';
import { colors, chartPalette } from '@/theme/bakeryTheme';
import {
    ResponsiveContainer,
    Area,
    AreaChart,
    BarChart as RBarChart,
    Bar,
    PieChart as RPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

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

const tooltipStyle = {
    background: colors.cream,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'Poppins, Helvetica, sans-serif',
};

function EmptyState({ message = 'No totals to plot yet.', height }) {
    return (
        <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
            {message}
        </div>
    );
}

export function LineChart({ labels = [], series = [], height = 268 }) {
    const hasData = series.some((item) => (item.values ?? []).some((value) => Number(value) > 0));

    if (!hasData) {
        return <EmptyState message="No completed sales this week yet." height={height} />;
    }

    const data = labels.map((label, index) => {
        const row = { label };
        series.forEach((s) => {
            row[s.key ?? s.label] = Number(s.values?.[index] ?? 0);
        });
        return row;
    });

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke={colors.border} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fill: colors.muted, fontSize: 11, fontFamily: 'Poppins, Helvetica, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tickFormatter={formatTick}
                    tick={{ fill: colors.muted, fontSize: 11, fontFamily: 'Poppins, Helvetica, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(value)} />
                <Legend />
                {series.map((s, index) => {
                    const color = s.color ?? chartPalette[index % chartPalette.length];
                    const key = s.key ?? s.label;
                    return (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={s.label ?? s.key}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.14}
                            strokeWidth={2.6}
                            dot={{ r: 3, strokeWidth: 1.5 }}
                            activeDot={{ r: 4 }}
                        />
                    );
                })}
            </AreaChart>
        </ResponsiveContainer>
    );
}

/** Single-series categorical bars via `items: [{ label, value, color? }]` */
export function BarChart({ items = [], height = 196 }) {
    const hasData = items.some((item) => Number(item.value) > 0);

    if (!hasData) {
        return <EmptyState height={height} />;
    }

    const data = items.map((item) => ({
        label: item.label,
        value: Number(item.value) || 0,
        fill: item.color ?? chartPalette[0],
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RBarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 6" stroke={colors.border} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fill: colors.muted, fontSize: 11, fontFamily: 'Poppins, Helvetica, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tickFormatter={formatTick}
                    tick={{ fill: colors.muted, fontSize: 11, fontFamily: 'Poppins, Helvetica, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(value)} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={entry.label} fill={entry.fill ?? chartPalette[index % chartPalette.length]} />
                    ))}
                </Bar>
            </RBarChart>
        </ResponsiveContainer>
    );
}

export function PieChart({
    items = [],
    height = 268,
    valueFormatter,
}) {
    const chartData = items
        .map((item, index) => ({
            id: item.id ?? item.label ?? index,
            name: item.label,
            value: Number(item.value) || 0,
            color: item.color ?? chartPalette[index % chartPalette.length],
        }))
        .filter((item) => item.value > 0);

    if (chartData.length === 0) {
        return <EmptyState message="Sell a few tickets and this ring fills in." height={height} />;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RPieChart>
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="92%"
                    paddingAngle={3}
                    cornerRadius={6}
                >
                    {chartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, props) =>
                        valueFormatter
                            ? valueFormatter({ value, label: props?.payload?.name })
                            : `${formatTick(value)} sold`
                    }
                />
            </RPieChart>
        </ResponsiveContainer>
    );
}

export default { LineChart, BarChart, PieChart, formatTick };
