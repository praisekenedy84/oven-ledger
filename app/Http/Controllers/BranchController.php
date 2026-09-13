<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Tenant;
use App\Services\FeatureGate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function __construct(
        protected FeatureGate $featureGate,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Branches/Index', [
            'branches' => Branch::query()->orderBy('name')->get(),
            'maxBranches' => $this->maxBranches(),
            'branchCount' => Branch::count(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $this->featureGate->enabled('multi_branch') && Branch::count() >= 1) {
            return back()->withErrors(['name' => 'Multi-branch is not enabled for your account.']);
        }

        if (Branch::count() >= $this->maxBranches()) {
            return back()->withErrors([
                'name' => 'You have reached your branch limit. Contact support to increase it.',
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        Branch::create([
            ...$validated,
            'is_active' => true,
        ]);

        return back()->with('success', 'Branch created.');
    }

    protected function maxBranches(): int
    {
        $tenant = tenant();

        if ($tenant instanceof Tenant) {
            return (int) $tenant->max_branches;
        }

        return 1;
    }
}
