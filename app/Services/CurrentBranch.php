<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class CurrentBranch
{
    public const SESSION_KEY = 'current_branch_id';

    public function id(): ?int
    {
        $branchId = session(self::SESSION_KEY);

        if ($branchId === null) {
            return $this->defaultBranchId();
        }

        if (! $this->userCanAccessBranch((int) $branchId)) {
            return $this->defaultBranchId();
        }

        return (int) $branchId;
    }

    public function branch(): ?Branch
    {
        $branchId = $this->id();

        return $branchId ? Branch::query()->find($branchId) : null;
    }

    public function set(int $branchId): void
    {
        if (! $this->userCanAccessBranch($branchId)) {
            abort(403, 'You are not assigned to this branch.');
        }

        session([self::SESSION_KEY => $branchId]);
    }

    public function availableBranches(): array
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            return [];
        }

        if ($user->hasPermission('reports.view_all_branches')) {
            return Branch::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->all();
        }

        return $user->branches()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->all();
    }

    public function userCanAccessBranch(int $branchId): bool
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            return false;
        }

        return $user->isAssignedToBranch($branchId);
    }

    protected function defaultBranchId(): ?int
    {
        $branches = $this->availableBranches();

        if (empty($branches)) {
            return null;
        }

        $branchId = $branches[0]->id;
        session([self::SESSION_KEY => $branchId]);

        return $branchId;
    }
}
