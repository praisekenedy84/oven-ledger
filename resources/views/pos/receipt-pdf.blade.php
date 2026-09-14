<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Receipt #{{ $order_id }} — {{ $shop_name }}</title>
    <style>
        @page { margin: 16mm 18mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #33261C;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.45;
        }
        .sheet {
            max-width: 520px;
            margin: 0 auto;
            border: 1px solid #E0D2B4;
        }
        .masthead {
            background: {{ $primary }};
            color: #FBF6EA;
            padding: 20px 22px 16px;
            text-align: center;
        }
        .kicker {
            letter-spacing: 0.2em;
            font-size: 9px;
            text-transform: uppercase;
            opacity: 0.85;
        }
        h1 {
            margin: 6px 0 4px;
            font-size: 22px;
            letter-spacing: -0.02em;
        }
        .branch {
            font-size: 10px;
            opacity: 0.9;
        }
        .meta {
            background: #F4E8C8;
            border-bottom: 3px solid {{ $accent }};
            padding: 12px 22px;
        }
        .meta table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 2px 0; vertical-align: top; }
        .meta .label {
            color: #6B5848;
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            width: 34%;
        }
        .meta .value { font-weight: 700; }
        .body { padding: 16px 22px 20px; }
        h2 {
            margin: 0 0 8px;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: {{ $primary }};
        }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        table.items th {
            text-align: left;
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6B5848;
            border-bottom: 1px solid #E0D2B4;
            padding: 4px 0;
        }
        table.items th.num, table.items td.num { text-align: right; }
        table.items td {
            padding: 8px 0;
            border-bottom: 1px solid #F0E6D0;
            vertical-align: top;
        }
        .item-name { font-weight: 700; }
        .item-meta { color: #6B5848; font-size: 10px; }
        .totals { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .totals td { padding: 4px 0; }
        .totals .grand td {
            padding-top: 10px;
            border-top: 2px solid {{ $primary }};
            font-size: 14px;
            font-weight: 700;
            color: {{ $primary }};
        }
        .payments {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px dashed #E0D2B4;
        }
        .note {
            margin-top: 18px;
            text-align: center;
            color: #6B5848;
            font-size: 10px;
        }
        .badge {
            display: inline-block;
            margin-top: 8px;
            padding: 3px 8px;
            border-radius: 999px;
            background: {{ $accent }};
            color: #33261C;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="masthead">
            <div class="kicker">Sale receipt</div>
            <h1>{{ $shop_name }}</h1>
            @if($branch_name || $branch_address || $branch_phone)
                <div class="branch">
                    @if($branch_name){{ $branch_name }}@endif
                    @if($branch_address)<br>{{ $branch_address }}@endif
                    @if($branch_phone)<br>{{ $branch_phone }}@endif
                </div>
            @endif
            @if($is_pre_order)
                <div class="badge">Pre-order</div>
            @endif
        </div>

        <div class="meta">
            <table>
                <tr>
                    <td class="label">Ticket</td>
                    <td class="value">#{{ $order_id }}</td>
                </tr>
                <tr>
                    <td class="label">Date</td>
                    <td class="value">{{ $created_at }}</td>
                </tr>
                <tr>
                    <td class="label">Channel</td>
                    <td class="value">{{ $channel }}</td>
                </tr>
                @if($cashier)
                    <tr>
                        <td class="label">Cashier</td>
                        <td class="value">{{ $cashier }}</td>
                    </tr>
                @endif
                @if($customer_name)
                    <tr>
                        <td class="label">Customer</td>
                        <td class="value">
                            {{ $customer_name }}
                            @if($customer_phone)<br><span style="font-weight:400">{{ $customer_phone }}</span>@endif
                        </td>
                    </tr>
                @endif
                @if($fulfillment_type)
                    <tr>
                        <td class="label">Fulfillment</td>
                        <td class="value">
                            {{ ucfirst($fulfillment_type) }}
                            @if($requested_fulfillment_at) · {{ $requested_fulfillment_at }}@endif
                        </td>
                    </tr>
                @endif
                @if($delivery_address)
                    <tr>
                        <td class="label">Deliver to</td>
                        <td class="value">{{ $delivery_address }}</td>
                    </tr>
                @endif
            </table>
        </div>

        <div class="body">
            <h2>Items</h2>
            <table class="items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="num">Qty</th>
                        <th class="num">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $item)
                        <tr>
                            <td>
                                <div class="item-name">{{ $item['name'] }}</div>
                                <div class="item-meta">
                                    {{ number_format($item['unit_price'], 0) }}
                                    @if($item['unit']) / {{ $item['unit'] }}@endif
                                </div>
                            </td>
                            <td class="num">{{ rtrim(rtrim(number_format($item['quantity'], 3, '.', ''), '0'), '.') }}</td>
                            <td class="num">{{ number_format($item['line_total'], 0) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <table class="totals">
                @if($deposit_amount !== null && $is_pre_order)
                    <tr>
                        <td>Deposit</td>
                        <td class="num" style="text-align:right">TZS {{ number_format($deposit_amount, 0) }}</td>
                    </tr>
                @endif
                <tr class="grand">
                    <td>Total</td>
                    <td class="num" style="text-align:right">TZS {{ number_format($total_amount, 0) }}</td>
                </tr>
            </table>

            @if(count($payments))
                <div class="payments">
                    <h2>Payments</h2>
                    <table class="totals">
                        @foreach($payments as $payment)
                            <tr>
                                <td style="text-transform:capitalize">{{ $payment['method'] }}</td>
                                <td class="num" style="text-align:right">TZS {{ number_format($payment['amount'], 0) }}</td>
                            </tr>
                        @endforeach
                    </table>
                </div>
            @endif

            <div class="note">
                Thank you for your purchase.<br>
                Printed {{ $generated_at }}
            </div>
        </div>
    </div>
</body>
</html>
