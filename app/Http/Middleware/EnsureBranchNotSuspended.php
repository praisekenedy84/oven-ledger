<?php

namespace App\Http\Middleware;

use App\Models\TenantBranchSuspension;
use App\Services\CurrentBranch;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBranchNotSuspended
{
    public function __construct(
        protected CurrentBranch $currentBranch,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $branchId = $this->currentBranch->id();

        if (! $branchId) {
            return $next($request);
        }

        $suspended = tenancy()->central(function () use ($branchId) {
            return TenantBranchSuspension::query()
                ->where('tenant_id', tenant('id'))
                ->where('branch_id', $branchId)
                ->where('suspended', true)
                ->exists();
        });

        if ($suspended) {
            abort(403, 'This branch is currently suspended.');
        }

        return $next($request);
    }
}
