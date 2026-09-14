<?php

namespace Tests\Feature\Platform;

use App\Models\PlatformAdmin;
use App\Models\PlatformAuditLog;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Impersonation;
use App\Services\TenantProvisioner;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ImpersonationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PlatformSeeder::class);
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        foreach (glob(database_path('tenant*')) ?: [] as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
    }

    public function test_platform_admin_can_impersonate_and_stop(): void
    {
        [$admin, $tenant, $userId] = $this->provisionedTenant();

        $this->actingAs($admin, 'platform')
            ->post(route('platform.tenants.impersonate', $tenant), [
                'user_id' => $userId,
            ])
            ->assertRedirect(route('tenant.dashboard'));

        $this->assertAuthenticated('platform');
        $this->assertAuthenticated('web');
        $this->assertSame($tenant->getTenantKey(), session('tenant_id'));
        $this->assertSame($userId, session(Impersonation::SESSION_KEY)['user_id']);
        $this->assertDatabaseHas('platform_audit_log', [
            'action' => 'tenant.user_impersonated',
            'target_id' => $tenant->getTenantKey(),
            'platform_admin_id' => $admin->id,
        ]);

        $this->get(route('tenant.dashboard'))->assertOk();

        $this->post(route('impersonation.stop'))
            ->assertRedirect(route('platform.tenants.show', $tenant));

        $this->assertAuthenticated('platform');
        $this->assertGuest('web');
        $this->assertNull(session('tenant_id'));
        $this->assertNull(session(Impersonation::SESSION_KEY));
        $this->assertTrue(
            PlatformAuditLog::query()->where('action', 'tenant.user_impersonation_stopped')->exists()
        );
    }

    public function test_tenant_logout_stops_impersonation_and_keeps_platform_session(): void
    {
        [$admin, $tenant, $userId] = $this->provisionedTenant();

        $this->actingAs($admin, 'platform')
            ->post(route('platform.tenants.impersonate', $tenant), [
                'user_id' => $userId,
            ])
            ->assertRedirect(route('tenant.dashboard'));

        $this->post(route('logout'))
            ->assertRedirect(route('platform.tenants.show', $tenant));

        $this->assertAuthenticated('platform');
        $this->assertGuest('web');
        $this->assertNull(session(Impersonation::SESSION_KEY));
    }

    public function test_impersonation_requires_permission(): void
    {
        [, $tenant, $userId] = $this->provisionedTenant();

        $limited = PlatformAdmin::query()->create([
            'name' => 'Limited Admin',
            'email' => 'limited@mernet.co.tz',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($limited, 'platform')
            ->post(route('platform.tenants.impersonate', $tenant), [
                'user_id' => $userId,
            ])
            ->assertForbidden();

        $this->assertGuest('web');
    }

    public function test_cannot_impersonate_on_a_suspended_tenant(): void
    {
        [$admin, $tenant, $userId] = $this->provisionedTenant();
        $tenant->update(['status' => 'suspended']);

        $this->actingAs($admin, 'platform')
            ->from(route('platform.tenants.show', $tenant))
            ->post(route('platform.tenants.impersonate', $tenant), [
                'user_id' => $userId,
            ])
            ->assertRedirect(route('platform.tenants.show', $tenant))
            ->assertSessionHas('error');

        $this->assertGuest('web');
    }

    public function test_cannot_change_password_while_impersonating(): void
    {
        [$admin, $tenant, $userId] = $this->provisionedTenant();

        $this->actingAs($admin, 'platform')
            ->post(route('platform.tenants.impersonate', $tenant), [
                'user_id' => $userId,
            ]);

        $this->from(route('profile.edit'))
            ->put(route('password.update'), [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHas('error');

        $hash = $tenant->run(fn () => User::query()->find($userId)?->password);
        $this->assertTrue(Hash::check('password', $hash));
    }

    /**
     * @return array{0: PlatformAdmin, 1: Tenant, 2: int}
     */
    protected function provisionedTenant(): array
    {
        $admin = PlatformAdmin::query()->where('email', 'admin@mernet.co.tz')->firstOrFail();

        $tenant = app(TenantProvisioner::class)->provision([
            'name' => 'Impersonation Bakery',
            'owner_name' => 'Amina Owner',
            'owner_username' => 'amina_impersonate',
            'owner_email' => 'amina.impersonate@example.test',
            'owner_password' => 'password',
            'max_branches' => 1,
        ], $admin->id);

        $userId = $tenant->run(
            fn () => User::query()->where('email', 'amina.impersonate@example.test')->value('id')
        );

        $this->assertNotNull($userId);

        return [$admin, $tenant, (int) $userId];
    }
}
