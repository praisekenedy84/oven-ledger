<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $shop_name }} expenses report</title>
    <style>
        @page { margin: 20mm 14mm 18mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #2A3328;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            background: #F7F3EA;
        }
        .sheet {
            border: 2px solid #3D4F38;
        }
        .head {
            padding: 16px 18px 12px;
            border-bottom: 8px solid #C46B3A;
            background: #3D4F38;
            color: #F4EFE4;
        }
        .kicker {
            font-size: 9px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
        }
        h1 { margin: 6px 0 0; font-size: 21px; }
        .period {
            float: right;
            text-align: right;
            font-size: 11px;
            margin-top: -38px;
        }
        .body { padding: 16px 18px 20px; }
        .note {
            color: #5A6854;
            margin: 0 0 14px;
            font-size: 10px;
        }
        .tally { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        .tally th {
            text-align: left;
            font-size: 9px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #5A6854;
            padding: 0 0 8px;
            border-bottom: 1px solid #C9C1AE;
        }
        .tally td {
            padding: 10px 0;
            border-bottom: 1px dashed #C9C1AE;
            vertical-align: middle;
        }
        .tally tr:last-child td {
            border-bottom: 2px solid #3D4F38;
            font-weight: 700;
            font-size: 13px;
        }
        .bar-wrap { height: 8px; background: #E6DFD0; width: 160px; }
        .bar { height: 8px; background: #C46B3A; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        h2 {
            margin: 8px 0 8px;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #3D4F38;
        }
        table.grid { width: 100%; border-collapse: collapse; }
        table.grid th {
            text-align: left;
            background: #3D4F38;
            color: #F4EFE4;
            font-size: 8px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 6px 6px;
        }
        table.grid td {
            padding: 6px;
            border-bottom: 1px solid #DDD4C0;
            background: #FFFdf7;
        }
        table.grid tr:nth-child(even) td { background: #F1EADA; }
        table.grid th.num, table.grid td.num { text-align: right; }
        .meta { margin-bottom: 12px; color: #5A6854; font-size: 10px; }
        .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: -10mm;
            font-size: 9px;
            color: #5A6854;
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="head">
            <div class="kicker">Kitchen cost sheet</div>
            <h1>{{ $shop_name }}</h1>
            <div class="period">
                <div>Expenses report</div>
                <strong>{{ $period_label }}</strong>
            </div>
        </div>
        <div class="body">
            <div class="meta">{{ $branch_name }} · Printed {{ $generated_at }}</div>
            <p class="note">
                Money that left the business in this range: the cost of goods sold, waste written off,
                rent and other shop bills, payments to creditors, and owner drawings. This is a cost sheet, not a full set of accounts.
            </p>

            @php
                $max = max((float) $expenses['total'], 1);
            @endphp

            <table class="tally">
                <thead>
                    <tr>
                        <th>Where the money went</th>
                        <th></th>
                        <th class="num">TZS</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($expenses['lines'] as $line)
                        <tr>
                            <td>{{ $line['label'] }}</td>
                            <td>
                                <div class="bar-wrap">
                                    <div class="bar" style="width: {{ min(100, round(((float) $line['amount'] / $max) * 100)) }}%;"></div>
                                </div>
                            </td>
                            <td class="num">{{ number_format($line['amount']) }}</td>
                        </tr>
                    @endforeach
                    <tr>
                        <td>Money used</td>
                        <td></td>
                        <td class="num">{{ number_format($expenses['total']) }}</td>
                    </tr>
                </tbody>
            </table>

            <h2>Day-by-day outflow</h2>
            <table class="grid">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th class="num">Ingredient cost</th>
                        <th class="num">Waste</th>
                        <th class="num">Shop costs</th>
                        <th class="num">Creditors</th>
                        <th class="num">Drawings</th>
                        <th class="num">Total out</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($expenses['daily'] as $day)
                        <tr>
                            <td>{{ \Carbon\Carbon::parse($day['date'])->format('D d M') }}</td>
                            <td class="num">{{ number_format($day['ingredient_cost']) }}</td>
                            <td class="num">{{ number_format($day['waste_cost']) }}</td>
                            <td class="num">{{ number_format($day['operating_expenses'] ?? 0) }}</td>
                            <td class="num">{{ number_format($day['debt_payments']) }}</td>
                            <td class="num">{{ number_format($day['drawings']) }}</td>
                            <td class="num"><strong>{{ number_format($day['total']) }}</strong></td>
                        </tr>
                    @empty
                        <tr><td colspan="7">No costs recorded in this range.</td></tr>
                    @endforelse
                </tbody>
            </table>

            <h2>Rent, fees, and other shop costs</h2>
            <table class="grid">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Type</th>
                        <th>Paid to / for</th>
                        <th class="num">TZS</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($operating_expenses ?? [] as $row)
                        <tr>
                            <td>{{ \Carbon\Carbon::parse($row['date'])->format('D d M') }}</td>
                            <td>{{ $row['label'] }}</td>
                            <td>{{ $row['payee'] }}@if (! empty($row['notes'])) — {{ $row['notes'] }}@endif</td>
                            <td class="num">{{ number_format($row['amount']) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="4">No rent, fees, or other shop bills in this range.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
    <div class="footer">{{ $shop_name }} · Expenses report · Figures in TZS</div>
</body>
</html>
