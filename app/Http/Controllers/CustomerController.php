<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\PriceList;
use App\Services\CustomerLedger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerLedger $ledger,
    ) {}

    public function index(Request $request): Response
    {
        $type = $request->input('type');
        $search = trim((string) $request->input('search', ''));

        $customers = Customer::query()
            ->withOutstandingBalance()
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($search !== '', function ($q) use ($search) {
                $term = '%'.mb_strtolower($search).'%';
                $q->where(function ($inner) use ($term) {
                    $inner->whereRaw('LOWER(name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(COALESCE(phone, \'\')) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(COALESCE(email, \'\')) LIKE ?', [$term]);
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(function (Customer $customer) {
                return [
                    ...$customer->only([
                        'id', 'name', 'phone', 'email', 'type', 'tin_number',
                        'credit_limit', 'payment_terms', 'is_active',
                    ]),
                    'outstanding_balance' => round((float) ($customer->outstanding_balance ?? 0), 2),
                ];
            });

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => [
                'type' => $type,
                'search' => $search,
            ],
            'totals' => Customer::receivablesSummary(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $customer = Customer::create($this->validated($request));

        return redirect()
            ->route('tenant.customers.show', $customer)
            ->with('success', 'Customer created.');
    }

    public function show(Customer $customer): Response
    {
        $customer->load([
            'addresses' => fn ($q) => $q->latest(),
        ]);

        $ledger = $customer->ledgerEntries()
            ->with(['branch:id,name', 'order:id,total_amount,channel,status'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->paginate(20, ['*'], 'ledger_page')
            ->withQueryString();

        $orders = $customer->orders()
            ->with(['deliveryAddress', 'items.product:id,name', 'soldBy:id,name', 'voidedBy:id,name'])
            ->latest()
            ->paginate(10, ['*'], 'orders_page')
            ->withQueryString();

        $priceChannel = in_array($customer->type, ['wholesale', 'restaurant'], true)
            ? $customer->type
            : 'retail';

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'ledger' => $ledger,
            'orders' => $orders,
            'outstanding' => $this->ledger->outstandingBalance($customer),
            'aging' => $this->ledger->aging($customer),
            'priceList' => PriceList::query()
                ->with('product:id,name,type,unit_of_measure')
                ->where('channel', $priceChannel)
                ->orderBy('product_id')
                ->get(['id', 'product_id', 'channel', 'price']),
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $customer->update($this->validated($request));

        return back()->with('success', 'Customer updated.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'type' => ['required', 'in:retail,wholesale,restaurant'],
            'tin_number' => ['nullable', 'string', 'max:50'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);
    }
}
