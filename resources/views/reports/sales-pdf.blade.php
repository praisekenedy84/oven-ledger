<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $shop_name }} sales report</title>
    <style>
        @page { margin: 22mm 16mm 20mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #33261C;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.45;
        }
        .masthead {
            background: {{ $primary }};
            color: #FBF6EA;
            padding: 18px 20px 16px;
        }
        .kicker {
            letter-spacing: 0.18em;
            font-size: 9px;
            text-transform: uppercase;
            opacity: 0.82;
        }
        h1 {
            margin: 4px 0 0;
            font-size: 22px;
            letter-spacing: -0.03em;
        }
        .meta {
            background: #F4E8C8;
            border-bottom: 4px solid {{ $accent }};
            padding: 10px 20px 12px;
        }
        .meta td { padding: 2px 18px 2px 0; vertical-align: top; }
        .label { color: #6B5848; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; }
        .value { font-weight: 700; }
        .kpis { width: 100%; border-collapse: collapse; margin: 16px 0 18px; }
        .kpis td {
            width: 25%;
            background: #FBF6EA;
            border: 1px solid #E0D2B4;
            padding: 10px 12px;
        }
        .kpis .label { display: block; margin-bottom: 4px; }
        .kpis .figure { font-size: 15px; font-weight: 700; }
        h2 {
            margin: 18px 0 8px;
            font-size: 13px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: {{ $primary }};
            border-bottom: 1px solid #E0D2B4;
            padding-bottom: 4px;
        }
        table.grid { width: 100%; border-collapse: collapse; }
        table.grid th {
            text-align: left;
            background: {{ $primary }};
            color: #FBF6EA;
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 6px 7px;
        }
        table.grid td {
            padding: 6px 7px;
            border-bottom: 1px solid #EDE3CC;
        }
        table.grid tr:nth-child(even) td { background: #FBF6EA; }
        .num, table.grid th.num, table.grid td.num { text-align: right; }
        .loss { color: {{ $primary }}; font-weight: 700; }
        .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: -12mm;
            font-size: 9px;
            color: #6B5848;
            border-top: 1px solid #E0D2B4;
            padding-top: 6px;
        }
        .empty { color: #6B5848; font-style: italic; }
    </style>
</head>
<body>
    <div class="masthead">
        <div class="kicker">Oven Ledger · Counter take</div>
        <h1>{{ $shop_name }}</h1>
    </div>
    <table class="meta">
        <tr>
            <td>
                <div class="label">Sales report</div>
                <div class="value">{{ $period_label }}</div>
            </td>
            <td>
                <div class="label">Branch</div>
                <div class="value">{{ $branch_name }}</div>
            </td>
            <td>
                <div class="label">Printed</div>
                <div class="value">{{ $generated_at }}</div>
            </td>
            @if ($product_search !== '')
                <td>
                    <div class="label">Product filter</div>
                    <div class="value">{{ $product_search }}</div>
                </td>
            @endif
        </tr>
    </table>

    <table class="kpis">
        <tr>
            <td>
                <span class="label">Sales</span>
                <span class="figure">TZS {{ number_format($statement['revenue']) }}</span>
            </td>
            <td>
                <span class="label">{{ $statement['is_loss'] ? 'Loss' : 'Profit' }}</span>
                <span class="figure">TZS {{ number_format($statement['profit']) }}</span>
            </td>
            <td>
                <span class="label">Cash in</span>
                <span class="figure">TZS {{ number_format($statement['cash_collected']) }}</span>
            </td>
            <td>
                <span class="label">On credit</span>
                <span class="figure">TZS {{ number_format($statement['credit_sales']) }}</span>
            </td>
        </tr>
    </table>

    <h2>Each day’s take</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Day</th>
                <th class="num">Tickets</th>
                <th class="num">Sales</th>
                <th class="num">Cash</th>
                <th class="num">Credit</th>
                <th class="num">Cost</th>
                <th class="num">Waste</th>
                <th class="num">Profit</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($daily_sales as $day)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($day['date'])->format('D d M') }}</td>
                    <td class="num">{{ $day['tickets'] }}</td>
                    <td class="num">{{ number_format($day['revenue']) }}</td>
                    <td class="num">{{ number_format($day['cash']) }}</td>
                    <td class="num">{{ number_format($day['credit']) }}</td>
                    <td class="num">{{ number_format($day['ingredient_cost']) }}</td>
                    <td class="num">{{ number_format($day['waste_cost']) }}</td>
                    <td class="num {{ $day['is_loss'] ? 'loss' : '' }}">{{ number_format($day['profit']) }}</td>
                </tr>
            @empty
                <tr><td colspan="8" class="empty">No completed tickets in this range.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>What sold</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Product</th>
                <th>Type</th>
                <th class="num">Qty</th>
                <th class="num">Sales</th>
                <th class="num">Cost</th>
                <th class="num">Profit</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($sales_by_product as $row)
                <tr>
                    <td>{{ $row['name'] }}</td>
                    <td>{{ $row['type'] }}</td>
                    <td class="num">{{ rtrim(rtrim(number_format($row['quantity'], 3), '0'), '.') }} {{ $row['unit'] }}</td>
                    <td class="num">{{ number_format($row['revenue']) }}</td>
                    <td class="num">{{ number_format($row['cost']) }}</td>
                    <td class="num">{{ number_format($row['profit']) }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="empty">No product sales match this view.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Sales by channel</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Channel</th>
                <th class="num">Sales</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($sales_by_channel as $row)
                <tr>
                    <td>{{ ucfirst($row['channel']) }}</td>
                    <td class="num">TZS {{ number_format($row['total']) }}</td>
                </tr>
            @empty
                <tr><td colspan="2" class="empty">No channel totals in this range.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        {{ $shop_name }} · Sales report {{ $period_label }} · Figures in TZS
    </div>
</body>
</html>
