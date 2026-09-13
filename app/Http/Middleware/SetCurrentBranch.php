<?php

namespace App\Http\Middleware;

use App\Services\CurrentBranch;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentBranch
{
    public function __construct(
        protected CurrentBranch $currentBranch,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->has('branch_id')) {
            $this->currentBranch->set((int) $request->input('branch_id'));
        } else {
            $this->currentBranch->id();
        }

        return $next($request);
    }
}
