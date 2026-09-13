<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ContactInquiryRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(ContactInquiryRequest $request): RedirectResponse
    {
        $inquiry = $request->validated();
        $to = (string) config('ovenledger.contact_email');

        Mail::raw(
            implode("\n", [
                "Name: {$inquiry['name']}",
                "Bakery: {$inquiry['bakery']}",
                "Email: {$inquiry['email']}",
                'Phone: '.($inquiry['phone'] ?: '—'),
                '',
                $inquiry['message'],
            ]),
            function ($message) use ($inquiry, $to): void {
                $message
                    ->to($to)
                    ->replyTo($inquiry['email'], $inquiry['name'])
                    ->subject("Oven Ledger inquiry from {$inquiry['bakery']}");
            },
        );

        return redirect()
            ->to('/#contact')
            ->with('success', 'Message received. We will get back to you shortly.');
    }
}
