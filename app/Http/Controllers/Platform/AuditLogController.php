<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(): Response
    {
        $logs = PlatformAuditLog::query()
            ->with('platformAdmin')
            ->latest('created_at')
            ->paginate(50);

        return Inertia::render('Platform/Audit/Index', [
            'logs' => $logs,
        ]);
    }
}
