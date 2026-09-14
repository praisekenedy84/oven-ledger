<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class CurrentBranch
{
    public const SESSION_KEY = 'current_branch_id';

    protected bool $idResolved = false;

    protected ?int $resolvedId = null;

    protected Branch|null|false $branchCache = false;

    protected ?array $availableBranchesCache = null;

    public function id(): ?int
    {
        if ($this->idResolved) {
            return $this->resolvedId;
        }

        $branchId = session(self::SESSION_KEY);

        if ($branchId === null) {
            $this->resolvedId = $this->defaultBranchId();
        } elseif (! $this->userCanAccessBranch((int) $branchId)) {
            $this->resolvedId = $this->defaultBranchId();
        } else {
            $this->resolvedId = (int) $branchId;
        }

        $this->idResolved = true;

        return $this->resolvedId;
    }

    public function branch(): ?Branch
    {
        if ($this->branchCache !== false) {
            return $this->branchCache;
        }

        $branchId = $this->id();
        $this->branchCache = $branchId ? Branch::query()->find($branchId) : null;

        return $this->branchCache;
    }

    public function set(int $branchId): void
    {
        if (! $this->userCanAccessBranch($branchId)) {
            abort(403, 'You are not assigned to this branch.');
        }

        session([self::SESSION_KEY => $branchId]);
        $this->idResolved = true;
        $this->resolvedId = $branchId;
        $this->branchCache = false;
    }

    public function availableBranches(): array
    {
        if ($this->availableBranchesCache !== null) {
            return $this->availableBranchesCache;
        }

        $user = Auth::guard('web')->user();

        if (! $user instanceof User) {
            return $this->availableBranchesCache = [];
        }

        if ($user->hasPermission('reports.view_all_branches')) {
            return $this->availableBranchesCache = Branch::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->all();
        }

        return $this->availableBranchesCache = $user->branches()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->all();
    }

    public function userCanAccessBranch(int $branchId): bool
    {
        $user = Auth::guard('web')->user();

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
