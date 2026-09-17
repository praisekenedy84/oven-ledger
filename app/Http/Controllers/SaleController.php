<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Order;
use App\Models\User;
use App\Services\CurrentBranch;
use App\Services\SaleLedgerExporter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SaleController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
        protected SaleLedgerExporter $exporter,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->resolvedFilters($request);
        $from = Carbon::parse($filters['date_from'])->startOfDay();
        $to = Carbon::parse($filters['date_to'])->endOfDay();
        $branchId = $filters['branch_id'];
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();

        $salesQuery = $this->salesQuery($filters, $from, $to);

        $sales = (clone $salesQuery)
            ->with(['soldBy:id,name', 'voidedBy:id,name', 'customer:id,name', 'items.product:id,name'])
            ->latest('created_at')
            ->latest('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (Order $order) => $order->toTicketArray());

        $completedBase = Order::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'completed');

        $periodCompleted = (clone $completedBase)
            ->whereBetween('created_at', [$from, $to])
            ->when($filters['staff_user_id'] !== null, function ($q) use ($filters) {
                $filters['staff_user_id'] === 0
                    ? $q->whereNull('created_by')
                    : $q->where('created_by', $filters['staff_user_id']);
            })
            ->when($filters['staff_search'] !== '', function ($q) use ($filters) {
                $term = '%'.mb_strtolower($filters['staff_search']).'%';
                $q->whereHas('soldBy', fn ($staff) => $staff->whereRaw('LOWER(name) LIKE ?', [$term]));
            })
            ->when($filters['channel'] !== '', fn ($q) => $q->where('channel', $filters['channel']));

        $todayCompleted = (clone $completedBase)->whereBetween('created_at', [$todayStart, $todayEnd]);

        $todayStats = (clone $todayCompleted)
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total, COUNT(*) as ticket_count')
            ->first();

        $periodStats = (clone $periodCompleted)
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total, COUNT(*) as ticket_count')
            ->first();

        $statusCounts = Order::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("SUM(CASE WHEN status = 'voided' THEN 1 ELSE 0 END) as voided_count")
            ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count")
            ->first();

        $summary = [
            'today_total' => round((float) ($todayStats?->total ?? 0), 2),
            'today_count' => (int) ($todayStats?->ticket_count ?? 0),
            'period_total' => round((float) ($periodStats?->total ?? 0), 2),
            'period_count' => (int) ($periodStats?->ticket_count ?? 0),
            'voided_count' => (int) ($statusCounts?->voided_count ?? 0),
            'pending_count' => (int) ($statusCounts?->pending_count ?? 0),
        ];

        $staffOptions = User::query()
            ->whereIn('id', Order::query()
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->whereNotNull('created_by')
                ->distinct()
                ->pluck('created_by'))
            ->orderBy('name')
            ->get(['id', 'name']);

        $byChannel = Order::query()
            ->select('channel', DB::raw('SUM(total_amount) as total'), DB::raw('COUNT(*) as tickets'))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->when($filters['staff_user_id'] !== null, function ($q) use ($filters) {
                $filters['staff_user_id'] === 0
                    ? $q->whereNull('created_by')
                    : $q->where('created_by', $filters['staff_user_id']);
            })
            ->groupBy('channel')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'channel' => (string) $row->channel,
                'total' => round((float) $row->total, 2),
                'tickets' => (int) $row->tickets,
            ]);

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'summary' => $summary,
            'byChannel' => $byChannel,
            'staffOptions' => $staffOptions,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $filters,
            'refreshedAt' => now()->toIso8601String(),
        ]);
    }

    public function export(Request $request): HttpResponse|StreamedResponse
    {
        $format = $request->input('format') === 'xlsx' ? 'xlsx' : 'pdf';
        $filters = $this->resolvedFilters($request);
        $from = Carbon::parse($filters['date_from'])->startOfDay();
        $to = Carbon::parse($filters['date_to'])->endOfDay();

        $rows = $this->salesQuery($filters, $from, $to)
            ->with(['soldBy:id,name', 'customer:id,name', 'items.product:id,name'])
            ->latest('created_at')
            ->latest('id')
            ->limit(2000)
            ->get()
            ->map(fn (Order $order) => $order->toTicketArray())
            ->all();

        return $this->exporter->download($format, $filters, $rows);
    }

    /**
     * @param  array{branch_id: int|null, date_from: string, date_to: string, staff_user_id: int|null, staff_search: string, channel: string, status: string}  $filters
     */
    protected function salesQuery(array $filters, Carbon $from, Carbon $to)
    {
        $statuses = match ($filters['status']) {
            'completed' => ['completed'],
            'voided' => ['voided'],
            'pending' => ['pending'],
            default => ['completed', 'voided'],
        };

        return Order::query()
            ->when($filters['branch_id'], fn ($q) => $q->where('branch_id', $filters['branch_id']))
            ->whereIn('status', $statuses)
            ->whereBetween('created_at', [$from, $to])
            ->when($filters['staff_user_id'] !== null, function ($q) use ($filters) {
                $filters['staff_user_id'] === 0
                    ? $q->whereNull('created_by')
                    : $q->where('created_by', $filters['staff_user_id']);
            })
            ->when($filters['staff_search'] !== '', function ($q) use ($filters) {
                $term = '%'.mb_strtolower($filters['staff_search']).'%';
                $q->whereHas('soldBy', fn ($staff) => $staff->whereRaw('LOWER(name) LIKE ?', [$term]));
            })
            ->when($filters['channel'] !== '', fn ($q) => $q->where('channel', $filters['channel']));
    }

    /**
     * @return array{branch_id: int|null, date_from: string, date_to: string, staff_user_id: int|null, staff_search: string, channel: string, status: string}
     */
    protected function resolvedFilters(Request $request): array
    {
        $branchId = $request->input('branch_id', $this->currentBranch->id());
        $staffUserId = $request->input('staff_user_id');
        $status = (string) $request->input('status', 'completed');
        $channel = (string) $request->input('channel', '');

        if (! in_array($status, ['completed', 'voided', 'pending', 'all'], true)) {
            $status = 'completed';
        }

        if (! in_array($channel, ['', 'retail', 'wholesale', 'restaurant', 'custom'], true)) {
            $channel = '';
        }

        return [
            'branch_id' => $branchId === '' || $branchId === null ? null : (int) $branchId,
            'date_from' => $this->parseDate($request->input('date_from'), now()->toDateString()),
            'date_to' => $this->parseDate($request->input('date_to'), now()->toDateString()),
            'staff_user_id' => $staffUserId === '' || $staffUserId === null ? null : (int) $staffUserId,
            'staff_search' => trim((string) $request->input('staff_search', '')),
            'channel' => $channel,
            'status' => $status,
        ];
    }

    protected function parseDate(mixed $value, string $fallback): string
    {
        if (! is_string($value) || trim($value) === '') {
            return $fallback;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return $fallback;
        }
    }
}
