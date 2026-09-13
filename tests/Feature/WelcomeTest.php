<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WelcomeTest extends TestCase
{
    public function test_welcome_page_renders(): void
    {
        $this->get('/')
            ->assertOk();
    }

    public function test_contact_inquiry_is_accepted(): void
    {
        Mail::fake();

        $this->from('/')
            ->post('/contact', [
                'name' => 'Asha Mushi',
                'bakery' => 'Asha Breads',
                'email' => 'asha@example.com',
                'phone' => '255754000000',
                'message' => 'We run two branches in Dar and need the wholesale book.',
            ])
            ->assertRedirect('/#contact')
            ->assertSessionHas('success');
    }

    public function test_contact_inquiry_requires_fields(): void
    {
        $this->from('/')
            ->post('/contact', [])
            ->assertRedirect('/')
            ->assertSessionHasErrors(['name', 'bakery', 'email', 'message']);
    }
}
