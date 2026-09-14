<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ShopSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\View\View;

class SaleReceiptExporter
{
    /**
     * @return array<string, mixed>
     */
    public function payload(Order $order): array
    {
        $order->loadMissing([
            'items.product:id,name,unit_of_measure',
            'payments',
            'customer:id,name,phone',
            'soldBy:id,name',
            'branch:id,name,address,phone',
            'deliveryAddress:id,label,address_text',
        ]);

        $shop = ShopSetting::current()->toBrandArray();
        $timezone = config('app.timezone');

        return [
            'shop_name' => $shop['shop_name'] ?: (tenant('name') ?: 'Oven Ledger'),
            'logo_url' => $shop['logo_url'],
            'primary' => $shop['primary_color'] ?: ShopSetting::DEFAULT_PRIMARY,
            'accent' => $shop['accent_color'] ?: ShopSetting::DEFAULT_ACCENT,
            'branch_name' => $order->branch?->name,
            'branch_address' => $order->branch?->address,
            'branch_phone' => $order->branch?->phone,
            'order_id' => $order->id,
            'created_at' => $order->created_at
                ? Carbon::parse($order->created_at)->timezone($timezone)->format('d M Y H:i')
                : '',
            'channel' => ucfirst((string) $order->channel),
            'status' => $order->status,
            'is_pre_order' => (bool) $order->is_pre_order,
            'fulfillment_type' => $order->fulfillment_type,
            'requested_fulfillment_at' => $order->requested_fulfillment_at
                ? Carbon::parse($order->requested_fulfillment_at)->timezone($timezone)->format('d M Y H:i')
                : null,
            'customer_name' => $order->customer?->name,
            'customer_phone' => $order->customer?->phone,
            'cashier' => $order->soldBy?->name,
            'delivery_address' => $order->deliveryAddress
                ? trim(($order->deliveryAddress->label ? $order->deliveryAddress->label.' — ' : '').$order->deliveryAddress->address_text)
                : null,
            'deposit_amount' => $order->deposit_amount !== null ? (float) $order->deposit_amount : null,
            'total_amount' => (float) $order->total_amount,
            'items' => $order->items->map(fn ($item) => [
                'name' => $item->product?->name ?? 'Item',
                'quantity' => (float) $item->quantity,
                'unit' => $item->product?->unit_of_measure,
                'unit_price' => (float) $item->unit_price,
                'line_total' => (float) $item->line_total,
            ])->values()->all(),
            'payments' => $order->payments->map(fn ($payment) => [
                'method' => str_replace('_', ' ', (string) $payment->method),
                'amount' => (float) $payment->amount,
            ])->values()->all(),
            'generated_at' => now()->timezone($timezone)->format('d M Y H:i'),
        ];
    }

    /**
     * Compact summary flashed to the POS after a successful sale.
     *
     * @return array<string, mixed>
     */
    public function flashSummary(Order $order): array
    {
        $order->loadMissing(['items.product:id,name', 'payments', 'customer:id,name']);

        return [
            'id' => $order->id,
            'total_amount' => (float) $order->total_amount,
            'status' => $order->status,
            'is_pre_order' => (bool) $order->is_pre_order,
            'channel' => $order->channel,
            'customer' => $order->customer?->only(['id', 'name']),
            'items' => $order->items->map(fn ($item) => [
                'name' => $item->product?->name ?? 'Item',
                'quantity' => (float) $item->quantity,
                'line_total' => (float) $item->line_total,
            ])->values()->all(),
            'payments' => $order->payments->map(fn ($payment) => [
                'method' => $payment->method,
                'amount' => (float) $payment->amount,
            ])->values()->all(),
            'pdf_url' => route('tenant.pos.receipt.pdf', $order),
            'thermal_url' => route('tenant.pos.receipt.thermal', $order),
            'preview_url' => route('tenant.pos.receipt.preview', $order),
        ];
    }

    public function previewView(Order $order, string $layout = 'full'): View
    {
        return view('pos.receipt-preview', [
            ...$this->payload($order),
            'layout' => $layout === 'thermal' ? 'thermal' : 'full',
        ]);
    }

    public function pdf(Order $order, bool $download = false): Response
    {
        $payload = $this->payload($order);
        $pdf = Pdf::loadView('pos.receipt-pdf', $payload)->setPaper('a4', 'portrait');
        $filename = 'receipt-'.$order->id.'.pdf';

        return $download ? $pdf->download($filename) : $pdf->stream($filename);
    }

    public function thermalPdf(Order $order, bool $download = false): Response
    {
        $payload = $this->payload($order);
        // 80mm roll width; tall page so DomPDF does not clip long tickets.
        $pdf = Pdf::loadView('pos.receipt-thermal-pdf', $payload)
            ->setPaper([0, 0, 226.77, 1200], 'portrait');
        $filename = 'receipt-thermal-'.$order->id.'.pdf';

        return $download ? $pdf->download($filename) : $pdf->stream($filename);
    }

    public function thermalPrintView(Order $order): View
    {
        return view('pos.receipt-thermal', $this->payload($order));
    }
}
