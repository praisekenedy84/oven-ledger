<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'branch_user');
    }

    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('branch_id');
    }

    public function hasPermission(string $key, ?int $branchId = null): bool
    {
        return in_array($key, $this->permissionKeys($branchId), true);
    }

    public function permissionKeys(?int $branchId = null): array
    {
        return $this->userRoles()
            ->where(function ($query) use ($branchId) {
                $query->whereNull('branch_id');

                if ($branchId !== null) {
                    $query->orWhere('branch_id', $branchId);
                }
            })
            ->with('role.permissions')
            ->get()
            ->flatMap(fn (UserRole $userRole) => $userRole->role?->permissions->pluck('key') ?? collect())
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function isAssignedToBranch(int $branchId): bool
    {
        if ($this->hasPermission('reports.view_all_branches')) {
            return true;
        }

        return $this->branches()->where('branches.id', $branchId)->exists();
    }
}
