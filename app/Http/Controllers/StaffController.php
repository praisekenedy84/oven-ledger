<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use App\Services\TenantUserDirectory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function __construct(
        protected TenantUserDirectory $userDirectory,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Staff/Index', [
            'staff' => User::query()->with(['branches', 'userRoles.role'])->latest()->paginate(20),
            'roles' => Role::all(),
            'branches' => Branch::all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'unique:users,email',
                Rule::unique('tenant_users', 'email')
                    ->connection(config('tenancy.database.central_connection')),
            ],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'exists:roles,id'],
            'branch_ids' => ['nullable', 'array'],
            'branch_ids.*' => ['exists:branches,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'role_id' => $validated['role_id'],
            'branch_id' => null,
        ]);

        if (! empty($validated['branch_ids'])) {
            $user->branches()->sync($validated['branch_ids']);
        }

        $this->userDirectory->register($validated['email'], tenant()->getTenantKey());

        return back()->with('success', 'Staff member created.');
    }
}
