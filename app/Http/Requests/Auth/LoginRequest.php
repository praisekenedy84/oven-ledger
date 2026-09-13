<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Services\TenantUserDirectory;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required_without:email', 'string'],
            'email' => ['required_without:login', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * Resolves the tenant from the central user directory, initializes
     * tenancy, then authenticates against that tenant's users table.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $directory = app(TenantUserDirectory::class);
        $identifier = $this->loginIdentifier();
        $tenant = $directory->findTenantByLogin($identifier);

        if (! $tenant) {
            $this->failAuthentication();
        }

        if (method_exists($tenant, 'isSuspended') && $tenant->isSuspended()) {
            throw ValidationException::withMessages([
                $this->credentialField() => 'Account suspended — contact support.',
            ]);
        }

        tenancy()->initialize($tenant);

        $user = $this->findUserForLogin($directory, $identifier);

        if (! $user || ! Hash::check($this->string('password')->toString(), $user->password)) {
            tenancy()->end();
            $this->failAuthentication();
        }

        Auth::login($user, $this->boolean('remember'));

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * @throws ValidationException
     */
    protected function failAuthentication(): never
    {
        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages([
            $this->credentialField() => trans('auth.failed'),
        ]);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            $this->credentialField() => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->loginIdentifier()).'|'.$this->ip());
    }

    protected function loginIdentifier(): string
    {
        return trim((string) ($this->input('login') ?: $this->input('email') ?: ''));
    }

    protected function credentialField(): string
    {
        return $this->exists('login') ? 'login' : 'email';
    }

    protected function findUserForLogin(TenantUserDirectory $directory, string $identifier): ?User
    {
        if (str_contains($identifier, '@')) {
            return User::query()
                ->where('email', $directory->normalizeEmail($identifier))
                ->first();
        }

        return User::query()
            ->where('username', $directory->normalizeUsername($identifier))
            ->first();
    }
}
