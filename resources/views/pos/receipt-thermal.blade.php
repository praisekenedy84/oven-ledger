<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt #{{ $order_id }}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #111;
            font-family: "Courier New", Courier, monospace;
            font-size: 12px;
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .toolbar {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            gap: 8px;
            padding: 10px 12px;
            background: #33261C;
            color: #FBF6EA;
        }
        .toolbar button {
            flex: 1;
            border: 0;
            border-radius: 8px;
            padding: 10px 12px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
        }
        .toolbar .print { background: #E3A72B; color: #33261C; }
        .toolbar .close { background: transparent; color: #FBF6EA; border: 1px solid rgba(251,246,234,0.35); }
        .hint {
            padding: 8px 12px 0;
            font-family: system-ui, sans-serif;
            font-size: 12px;
            color: #6B5848;
        }
        .ticket {
            width: 72mm;
            max-width: 100%;
            margin: 12px auto 24px;
            padding: 0 2mm;
        }
        .center { text-align: center; }
        .strong { font-weight: 700; }
        .shop { font-size: 15px; font-weight: 700; text-transform: uppercase; }
        .muted { opacity: 0.85; }
        .rule {
            border: 0;
            border-top: 1px dashed #111;
            margin: 8px 0;
        }
        .row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
        }
        .row span:last-child { text-align: right; white-space: nowrap; }
        .item { margin: 6px 0; }
        .item .name { font-weight: 700; }
        .total {
            font-size: 14px;
            font-weight: 700;
            margin-top: 4px;
        }
        .caps { text-transform: uppercase; }
        @media print {
            .toolbar, .hint { display: none !important; }
            html, body { background: #fff; }
            .ticket { margin: 0 auto; width: 72mm; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button type="button" class="print" onclick="window.print()">Print receipt</button>
        <button type="button" class="close" onclick="window.close()">Close</button>
    </div>
    <p class="hint">
        Choose your Bluetooth thermal printer in the print dialog. Use 80&nbsp;mm paper width and disable headers/footers.
    </p>

    <div class="ticket">
        <div class="center">
            <div class="shop">{{ $shop_name }}</div>
            @if($branch_name)
                <div class="muted">{{ $branch_name }}</div>
            @endif
            @if($branch_address)
                <div class="muted">{{ $branch_address }}</div>
            @endif
            @if($branch_phone)
                <div class="muted">{{ $branch_phone }}</div>
            @endif
            <div class="strong" style="margin-top:6px">SALE RECEIPT</div>
            @if($is_pre_order)
                <div class="caps">*** Pre-order ***</div>
            @endif
        </div>

        <hr class="rule">

        <div class="row"><span>Ticket</span><span>#{{ $order_id }}</span></div>
        <div class="row"><span>Date</span><span>{{ $created_at }}</span></div>
        <div class="row"><span>Channel</span><span>{{ $channel }}</span></div>
        @if($cashier)
            <div class="row"><span>Cashier</span><span>{{ $cashier }}</span></div>
        @endif
        @if($customer_name)
            <div class="row"><span>Customer</span><span>{{ $customer_name }}</span></div>
        @endif
        @if($fulfillment_type)
            <div class="row"><span>Fulfill</span><span class="caps">{{ $fulfillment_type }}</span></div>
        @endif
        @if($requested_fulfillment_at)
            <div class="row"><span>Due</span><span>{{ $requested_fulfillment_at }}</span></div>
        @endif

        <hr class="rule">

        @foreach($items as $item)
            <div class="item">
                <div class="name">{{ $item['name'] }}</div>
                <div class="row">
                    <span>
                        {{ rtrim(rtrim(number_format($item['quantity'], 3, '.', ''), '0'), '.') }}
                        x {{ number_format($item['unit_price'], 0) }}
                    </span>
                    <span>{{ number_format($item['line_total'], 0) }}</span>
                </div>
            </div>
        @endforeach

        <hr class="rule">

        @if($deposit_amount !== null && $is_pre_order)
            <div class="row"><span>Deposit</span><span>{{ number_format($deposit_amount, 0) }}</span></div>
        @endif
        <div class="row total"><span>TOTAL</span><span>TZS {{ number_format($total_amount, 0) }}</span></div>

        @if(count($payments))
            <hr class="rule">
            @foreach($payments as $payment)
                <div class="row">
                    <span class="caps">{{ $payment['method'] }}</span>
                    <span>{{ number_format($payment['amount'], 0) }}</span>
                </div>
            @endforeach
        @endif

        <hr class="rule">
        <div class="center muted">
            Thank you<br>
            {{ $generated_at }}
        </div>
    </div>

    <script>
        window.addEventListener('load', function () {
            if (new URLSearchParams(window.location.search).get('autoprint') === '1') {
                setTimeout(function () { window.print(); }, 250);
            }
        });
    </script>
</body>
</html>
