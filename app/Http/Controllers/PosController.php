<?php

namespace App\Http\Controllers;

use App\Jobs\DecrementFinishedGoodsOnSale;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PriceList;
use App\Models\Product;
use App\Services\CurrentBranch;
use App\Services\CustomerLedger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
        protected CustomerLedger $ledger,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Pos/Index', [
            'products' => Product::query()->where('is_active', true)->orderBy('name')->get(),
            'customers' => Customer::query()
                ->where('is_active', true)
                ->with('addresses')
                ->orderBy('name')
                ->get(),
            'priceLists' => PriceList::query()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranch->id();

        if (! $branchId) {
            throw ValidationException::withMessages([
                'items' => 'Select a branch before taking a sale.',
            ]);
        }

        $validated = $request->validate([
            'channel' => ['required', 'in:retail,wholesale,restaurant,custom'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'is_pre_order' => ['boolean'],
            'fulfillment_type' => ['required', 'in:pickup,delivery'],
            'requested_fulfillment_at' => ['nullable', 'date'],
            'delivery_address_id' => ['nullable', 'exists:customer_addresses,id'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.method' => ['required', 'in:cash,card,credit_account,mobile_money'],
            'payments.*.amount' => ['required', 'numeric', 'min:0.01'],
            'payments.*.provider' => ['nullable', 'string', 'max:50'],
        ]);

        $customer = isset($validated['customer_id'])
            ? Customer::query()->find($validated['customer_id'])
            : null;

        $isPreOrder = (bool) ($validated['is_pre_order'] ?? false);
        $fulfillmentType = $validated['fulfillment_type'];
        $deliveryAddressId = $validated['delivery_address_id'] ?? null;

        if ($fulfillmentType === 'delivery') {
            if (! $customer) {
                throw ValidationException::withMessages([
                    'customer_id' => 'Choose a customer before sending a delivery.',
                ]);
            }

            if (! $deliveryAddressId) {
                throw ValidationException::withMessages([
                    'delivery_address_id' => 'Choose a delivery address.',
                ]);
            }

            $owned = CustomerAddress::query()
                ->where('id', $deliveryAddressId)
                ->where('customer_id', $customer->id)
                ->exists();

            if (! $owned) {
                throw ValidationException::withMessages([
                    'delivery_address_id' => 'That address does not belong to this customer.',
                ]);
            }
        } else {
            $deliveryAddressId = null;
        }

        $hasCreditTender = collect($validated['payments'])
            ->contains(fn (array $payment) => $payment['method'] === 'credit_account');

        if ($hasCreditTender && ! $customer) {
            throw ValidationException::withMessages([
                'customer_id' => 'Choose a customer to put a sale on account.',
            ]);
        }

        $order = DB::transaction(function () use ($validated, $branchId, $customer, $isPreOrder, $fulfillmentType, $deliveryAddressId) {
            $total = 0;
            $lineItems = [];

            foreach ($validated['items'] as $item) {
                $price = PriceList::query()
                    ->where('product_id', $item['product_id'])
                    ->where('channel', $validated['channel'] === 'custom' ? 'retail' : $validated['channel'])
                    ->value('price');

                if ($price === null) {
                    $price = 0;
                }

                $lineTotal = (float) $price * (float) $item['quantity'];
                $total += $lineTotal;

                $lineItems[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $price,
                    'line_total' => $lineTotal,
                ];
            }

            $total = round($total, 2);
            $tendered = round(collect($validated['payments'])->sum('amount'), 2);

            if ($tendered - $total > 0.009) {
                throw ValidationException::withMessages([
                    'payments' => 'Tendered amount is higher than the ticket total.',
                ]);
            }

            $shortfall = round($total - $tendered, 2);

            if ($shortfall > 0.009 && ! $customer) {
                throw ValidationException::withMessages([
                    'customer_id' => 'Unpaid balance needs a customer so it can go on their account.',
                ]);
            }

            $depositAmount = $validated['deposit_amount'] ?? null;
            if ($depositAmount === null) {
                $depositAmount = collect($validated['payments'])
                    ->reject(fn (array $payment) => $payment['method'] === 'credit_account')
                    ->sum('amount');
            }
            $depositAmount = min($total, round((float) $depositAmount, 2));

            $order = Order::create([
                'branch_id' => $branchId,
                'customer_id' => $customer?->id,
                'channel' => $validated['channel'],
                'status' => $isPreOrder ? 'pending' : 'completed',
                'deposit_amount' => $isPreOrder ? round((float) $depositAmount, 2) : null,
                'due_date' => $isPreOrder && ! empty($validated['requested_fulfillment_at'])
                    ? $validated['requested_fulfillment_at']
                    : null,
                'total_amount' => $total,
                'is_pre_order' => $isPreOrder,
                'fulfillment_type' => $fulfillmentType,
                'requested_fulfillment_at' => $validated['requested_fulfillment_at'] ?? null,
                'delivery_address_id' => $deliveryAddressId,
            ]);

            foreach ($lineItems as $line) {
                OrderItem::create([
                    'order_id' => $order->id,
                    ...$line,
                ]);
            }

            foreach ($validated['payments'] as $payment) {
                Payment::create([
                    'order_id' => $order->id,
                    'method' => $payment['method'],
                    'amount' => $payment['amount'],
                    'provider' => $payment['provider'] ?? null,
                    'paid_at' => now(),
                ]);
            }

            $creditAmount = collect($validated['payments'])
                ->where('method', 'credit_account')
                ->sum('amount');

            if ($shortfall > 0.009) {
                Payment::create([
                    'order_id' => $order->id,
                    'method' => 'credit_account',
                    'amount' => $shortfall,
                    'paid_at' => now(),
                ]);
                $creditAmount += $shortfall;
            }

            if ($creditAmount > 0.009 && $customer) {
                $this->ledger->recordCharge(
                    $customer,
                    round((float) $creditAmount, 2),
                    $branchId,
                    $order->id,
                    'Sale #'.$order->id,
                );
            }

            return $order;
        });

        DecrementFinishedGoodsOnSale::dispatch($order->id);

        return back()->with('success', $order->is_pre_order
            ? 'Pre-order recorded.'
            : 'Sale recorded successfully.');
    }
}
