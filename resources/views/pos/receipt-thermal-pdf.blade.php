<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Receipt #{{ $order_id }}</title>
    <style>
        @page { margin: 3mm 3mm 4mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #111;
            font-family: DejaVu Sans Mono, DejaVu Sans, monospace;
            font-size: 9px;
            line-height: 1.35;
        }
        .center { text-align: center; }
        .shop { font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .muted { font-size: 8px; }
        .rule {
            border: 0;
            border-top: 1px dashed #111;
            margin: 6px 0;
        }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 1px 0; }
        td.r { text-align: right; white-space: nowrap; }
        .item-name { font-weight: 700; }
        .total td { font-size: 10px; font-weight: 700; padding-top: 3px; }
        .caps { text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="center">
        <div class="shop">{{ $shop_name }}</div>
        @if($branch_name)<div class="muted">{{ $branch_name }}</div>@endif
        @if($branch_address)<div class="muted">{{ $branch_address }}</div>@endif
        @if($branch_phone)<div class="muted">{{ $branch_phone }}</div>@endif
        <div style="margin-top:4px;font-weight:700">SALE RECEIPT</div>
        @if($is_pre_order)<div class="caps">*** Pre-order ***</div>@endif
    </div>

    <hr class="rule">

    <table>
        <tr><td>Ticket</td><td class="r">#{{ $order_id }}</td></tr>
        <tr><td>Date</td><td class="r">{{ $created_at }}</td></tr>
        <tr><td>Channel</td><td class="r">{{ $channel }}</td></tr>
        @if($cashier)<tr><td>Cashier</td><td class="r">{{ $cashier }}</td></tr>@endif
        @if($customer_name)<tr><td>Customer</td><td class="r">{{ $customer_name }}</td></tr>@endif
        @if($fulfillment_type)<tr><td>Fulfill</td><td class="r caps">{{ $fulfillment_type }}</td></tr>@endif
    </table>

    <hr class="rule">

    @foreach($items as $item)
        <div class="item-name">{{ $item['name'] }}</div>
        <table>
            <tr>
                <td>
                    {{ rtrim(rtrim(number_format($item['quantity'], 3, '.', ''), '0'), '.') }}
                    x {{ number_format($item['unit_price'], 0) }}
                </td>
                <td class="r">{{ number_format($item['line_total'], 0) }}</td>
            </tr>
        </table>
    @endforeach

    <hr class="rule">

    <table>
        @if($deposit_amount !== null && $is_pre_order)
            <tr><td>Deposit</td><td class="r">{{ number_format($deposit_amount, 0) }}</td></tr>
        @endif
        <tr class="total"><td>TOTAL</td><td class="r">TZS {{ number_format($total_amount, 0) }}</td></tr>
    </table>

    @if(count($payments))
        <hr class="rule">
        <table>
            @foreach($payments as $payment)
                <tr>
                    <td class="caps">{{ $payment['method'] }}</td>
                    <td class="r">{{ number_format($payment['amount'], 0) }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    <hr class="rule">
    <div class="center muted">
        Thank you<br>
        {{ $generated_at }}
    </div>
</body>
</html>
