<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $shop_name }} sales ledger</title>
    <style>
        @page { margin: 14mm 12mm 16mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #33261C;
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            line-height: 1.4;
        }
        .masthead {
            background: {{ $primary }};
            color: #FBF6EA;
            padding: 14px 16px 12px;
        }
        .kicker {
            letter-spacing: 0.16em;
            font-size: 8px;
            text-transform: uppercase;
            opacity: 0.85;
        }
        h1 {
            margin: 4px 0 0;
            font-size: 18px;
            letter-spacing: -0.02em;
        }
        .meta {
            background: #F4E8C8;
            border-bottom: 3px solid {{ $accent }};
            padding: 8px 16px 10px;
        }
        .meta td { padding: 2px 16px 2px 0; vertical-align: top; }
        .label { color: #6B5848; font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; }
        .value { font-weight: 700; }
        .kpis { width: 100%; border-collapse: collapse; margin: 12px 0 14px; }
        .kpis td {
            width: 25%;
            background: #FBF6EA;
            border: 1px solid #E0D2B4;
            padding: 8px 10px;
        }
        .kpis .figure { font-size: 14px; font-weight: 700; }
        table.grid { width: 100%; border-collapse: collapse; }
        table.grid th {
            text-align: left;
            background: {{ $primary }};
            color: #FBF6EA;
            font-size: 8px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 5px 6px;
        }
        table.grid td {
            padding: 5px 6px;
            border-bottom: 1px solid #EDE3CC;
            vertical-align: top;
        }
        table.grid tr:nth-child(even) td { background: #FBF6EA; }
        .num, table.grid th.num, table.grid td.num { text-align: right; }
        .footer {
            margin-top: 12px;
            font-size: 8px;
            color: #6B5848;
        }
    </style>
</head>
<body>
    <div class="masthead">
        <div class="kicker">Sales ledger</div>
        <h1>{{ $shop_name }}</h1>
    </div>

    <div class="meta">
        <table>
            <tr>
                <td>
                    <div class="label">Branch</div>
                    <div class="value">{{ $branch_name }}</div>
                </td>
                <td>
                    <div class="label">Period</div>
                    <div class="value">{{ $period_label }}</div>
                </td>
                <td>
                    <div class="label">Status</div>
                    <div class="value">{{ ucfirst($status) }}</div>
                </td>
                <td>
                    <div class="label">Generated</div>
                    <div class="value">{{ $generated_at }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="kpis">
        <tr>
            <td>
                <div class="label">Tickets</div>
                <div class="figure">{{ number_format($ticket_count) }}</div>
            </td>
            <td>
                <div class="label">Sold total</div>
                <div class="figure">{{ number_format($sold_total, 0) }}</div>
            </td>
            <td>
                <div class="label">Channel</div>
                <div class="figure">{{ $channel }}</div>
            </td>
            <td>
                <div class="label">Staff filter</div>
                <div class="figure">{{ $staff_search !== '' ? $staff_search : 'All staff' }}</div>
            </td>
        </tr>
    </table>

    <table class="grid">
        <thead>
            <tr>
                <th>When</th>
                <th>Ticket</th>
                <th>Cashier</th>
                <th>Customer</th>
                <th>Channel</th>
                <th>Items</th>
                <th>Status</th>
                <th class="num">Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $sale)
                <tr>
                    <td>{{ \Illuminate\Support\Carbon::parse($sale['created_at'])->format('d M Y H:i') }}</td>
                    <td>#{{ $sale['id'] }}</td>
                    <td>{{ $sale['cashier']['name'] ?? 'Unassigned' }}</td>
                    <td>{{ $sale['customer']['name'] ?? '—' }}</td>
                    <td>{{ $sale['channel'] }}</td>
                    <td>
                        {{ collect($sale['items'] ?? [])->map(fn ($item) => trim(($item['quantity'] ?? '').' '.($item['name'] ?? '')))->filter()->implode(', ') }}
                    </td>
                    <td>{{ $sale['status'] }}</td>
                    <td class="num">{{ number_format((float) $sale['total_amount'], 0) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8">No sales in this range.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Oven Ledger sales export · {{ $shop_name }} · {{ $period_label }}
    </div>
</body>
</html>
