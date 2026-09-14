<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt #{{ $order_id }} — {{ $shop_name }}</title>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            background: {{ $layout === 'thermal' ? '#f3efe6' : '#f7f1e4' }};
            color: #33261C;
            font-family: "Segoe UI", system-ui, sans-serif;
            font-size: 13px;
            line-height: 1.45;
        }
        .frame {
            padding: {{ $layout === 'thermal' ? '16px 12px 24px' : '18px 14px 28px' }};
        }
        .sheet {
            max-width: {{ $layout === 'thermal' ? '280px' : '440px' }};
            margin: 0 auto;
            background: #fff;
            border: 1px solid #E0D2B4;
            box-shadow: 0 10px 28px rgba(51, 38, 28, 0.08);
            overflow: hidden;
        }
        .masthead {
            background: {{ $primary }};
            color: #FBF6EA;
            padding: {{ $layout === 'thermal' ? '14px 14px 12px' : '18px 20px 14px' }};
            text-align: center;
        }
        .kicker {
            letter-spacing: 0.18em;
            font-size: 10px;
            text-transform: uppercase;
            opacity: 0.85;
        }
        .shop {
            margin: 6px 0 4px;
            font-size: {{ $layout === 'thermal' ? '16px' : '22px' }};
            font-weight: 700;
            letter-spacing: -0.02em;
        }
        .branch { font-size: 11px; opacity: 0.92; }
        .badge {
            display: inline-block;
            margin-top: 8px;
            padding: 3px 8px;
            border-radius: 999px;
            background: {{ $accent }};
            color: #33261C;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .meta {
            background: #F4E8C8;
            border-bottom: 3px solid {{ $accent }};
            padding: 12px 16px;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 2px 0;
        }
        .meta-row .label {
            color: #6B5848;
            font-size: 10px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .meta-row .value { font-weight: 700; text-align: right; }
        .body { padding: 14px 16px 18px; }
        .section {
            margin: 0 0 8px;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: {{ $primary }};
            font-weight: 700;
        }
        .item {
            padding: 8px 0;
            border-bottom: 1px solid #F0E6D0;
        }
        .item-top {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            font-weight: 700;
        }
        .item-meta {
            color: #6B5848;
            font-size: 12px;
            margin-top: 2px;
        }
        .totals { margin-top: 10px; }
        .total-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 3px 0;
        }
        .grand {
            margin-top: 8px;
            padding-top: 10px;
            border-top: 2px solid {{ $primary }};
            color: {{ $primary }};
            font-size: 16px;
            font-weight: 700;
        }
        .payments {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px dashed #E0D2B4;
        }
        .note {
            margin-top: 16px;
            text-align: center;
            color: #6B5848;
            font-size: 11px;
        }
        .thermal .masthead,
        .thermal .meta {
            background: #fff;
            color: #111;
            border-bottom: 1px dashed #111;
        }
        .thermal .sheet {
            font-family: "Courier New", Courier, monospace;
            border-style: dashed;
        }
        .thermal .shop { text-transform: uppercase; }
        .thermal .kicker,
        .thermal .section,
        .thermal .grand,
        .thermal .badge { color: #111; background: transparent; border: 0; padding: 0; }
        .thermal .meta { padding-top: 10px; }
        .thermal .body { padding-top: 8px; }
    </style>
</head>
<body class="{{ $layout === 'thermal' ? 'thermal' : 'full' }}">
    <div class="frame">
        <div class="sheet">
            <div class="masthead">
                <div class="kicker">Sale receipt</div>
                <div class="shop">{{ $shop_name }}</div>
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
                <div class="meta-row"><span class="label">Ticket</span><span class="value">#{{ $order_id }}</span></div>
                <div class="meta-row"><span class="label">Date</span><span class="value">{{ $created_at }}</span></div>
                <div class="meta-row"><span class="label">Channel</span><span class="value">{{ $channel }}</span></div>
                @if($cashier)
                    <div class="meta-row"><span class="label">Cashier</span><span class="value">{{ $cashier }}</span></div>
                @endif
                @if($customer_name)
                    <div class="meta-row">
                        <span class="label">Customer</span>
                        <span class="value">
                            {{ $customer_name }}
                            @if($customer_phone)<br><span style="font-weight:400">{{ $customer_phone }}</span>@endif
                        </span>
                    </div>
                @endif
                @if($fulfillment_type)
                    <div class="meta-row">
                        <span class="label">Fulfillment</span>
                        <span class="value">
                            {{ ucfirst($fulfillment_type) }}
                            @if($requested_fulfillment_at) · {{ $requested_fulfillment_at }}@endif
                        </span>
                    </div>
                @endif
                @if($delivery_address)
                    <div class="meta-row"><span class="label">Deliver to</span><span class="value">{{ $delivery_address }}</span></div>
                @endif
            </div>

            <div class="body">
                <div class="section">Items</div>
                @foreach($items as $item)
                    <div class="item">
                        <div class="item-top">
                            <span>{{ $item['name'] }}</span>
                            <span>{{ number_format($item['line_total'], 0) }}</span>
                        </div>
                        <div class="item-meta">
                            {{ rtrim(rtrim(number_format($item['quantity'], 3, '.', ''), '0'), '.') }}
                            × {{ number_format($item['unit_price'], 0) }}
                            @if($item['unit']) / {{ $item['unit'] }}@endif
                        </div>
                    </div>
                @endforeach

                <div class="totals">
                    @if($deposit_amount !== null && $is_pre_order)
                        <div class="total-row">
                            <span>Deposit</span>
                            <span>TZS {{ number_format($deposit_amount, 0) }}</span>
                        </div>
                    @endif
                    <div class="total-row grand">
                        <span>Total</span>
                        <span>TZS {{ number_format($total_amount, 0) }}</span>
                    </div>
                </div>

                @if(count($payments))
                    <div class="payments">
                        <div class="section">Payments</div>
                        @foreach($payments as $payment)
                            <div class="total-row">
                                <span style="text-transform:capitalize">{{ $payment['method'] }}</span>
                                <span>TZS {{ number_format($payment['amount'], 0) }}</span>
                            </div>
                        @endforeach
                    </div>
                @endif

                <div class="note">
                    Thank you for your purchase.<br>
                    {{ $generated_at }}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
