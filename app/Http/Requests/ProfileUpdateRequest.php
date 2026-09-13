<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Services\TenantUserDirectory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $directory = app(TenantUserDirectory::class);

        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => $directory->usernameRules(
                $this->user()->id,
                $this->user()->email,
            ),
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $directory = app(TenantUserDirectory::class);

        if ($this->has('username')) {
            $this->merge([
                'username' => $directory->normalizeUsername((string) $this->input('username')),
            ]);
        }

        if ($this->has('email')) {
            $this->merge([
                'email' => $directory->normalizeEmail((string) $this->input('email')),
            ]);
        }
    }
}
