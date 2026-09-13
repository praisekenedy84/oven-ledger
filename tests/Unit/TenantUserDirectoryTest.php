<?php

namespace Tests\Unit;

use App\Services\TenantUserDirectory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantUserDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_normalizes_email_and_username(): void
    {
        $directory = new TenantUserDirectory;

        $this->assertSame('owner@demo.test', $directory->normalizeEmail('  Owner@Demo.TEST '));
        $this->assertSame('amina', $directory->normalizeUsername('  Amina '));
    }

    public function test_login_lookup_treats_at_sign_as_email(): void
    {
        $directory = new TenantUserDirectory;

        $this->assertNull($directory->findTenantByLogin('missing@example.test'));
        $this->assertNull($directory->findTenantByLogin('missing-user'));
        $this->assertNull($directory->findTenantByLogin(''));
    }
}
