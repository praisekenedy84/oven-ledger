<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CustomerAddressController extends Controller
{
    public function store(Request $request, Customer $customer): RedirectResponse
    {
        $customer->addresses()->create($this->validated($request));

        return back()->with('success', 'Address saved.');
    }

    public function update(Request $request, Customer $customer, CustomerAddress $address): RedirectResponse
    {
        $this->assertOwned($customer, $address);
        $address->update($this->validated($request));

        return back()->with('success', 'Address updated.');
    }

    public function destroy(Customer $customer, CustomerAddress $address): RedirectResponse
    {
        $this->assertOwned($customer, $address);
        $address->delete();

        return back()->with('success', 'Address removed.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'address_text' => ['required', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    protected function assertOwned(Customer $customer, CustomerAddress $address): void
    {
        abort_unless($address->customer_id === $customer->id, 404);
    }
}
