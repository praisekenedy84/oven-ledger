import { lazy, Suspense } from 'react';

const LineChart = lazy(() =>
    import('@/Components/AccentChart').then((module) => ({ default: module.LineChart })),
);
const BarChart = lazy(() =>
    import('@/Components/AccentChart').then((module) => ({ default: module.BarChart })),
);
const PieChart = lazy(() =>
    import('@/Components/AccentChart').then((module) => ({ default: module.PieChart })),
);

function ChartFallback({ height = 200 }) {
    return (
        <div
            className="animate-pulse rounded-md bg-muted/40"
            style={{ height }}
            aria-hidden="true"
        />
    );
}

export function LazyLineChart(props) {
    return (
        <Suspense fallback={<ChartFallback height={props.height ?? 268} />}>
            <LineChart {...props} />
        </Suspense>
    );
}

export function LazyBarChart(props) {
    return (
        <Suspense fallback={<ChartFallback height={props.height ?? 196} />}>
            <BarChart {...props} />
        </Suspense>
    );
}

export function LazyPieChart(props) {
    return (
        <Suspense fallback={<ChartFallback height={props.height ?? 268} />}>
            <PieChart {...props} />
        </Suspense>
    );
}
