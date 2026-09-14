<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\ShopSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SaleLedgerExporter
{
    /**
     * @param  array{branch_id: int|null, date_from: string, date_to: string, staff_user_id: int|null, staff_search: string, channel: string, status: string}  $filters
     * @param  list<array<string, mixed>>  $rows
     */
    public function download(string $format, array $filters, array $rows): Response|StreamedResponse
    {
        $payload = $this->payload($filters, $rows);

        return $format === 'xlsx'
            ? $this->excel($payload)
            : $this->pdf($payload);
    }

    /**
     * @param  array{branch_id: int|null, date_from: string, date_to: string, staff_user_id: int|null, staff_search: string, channel: string, status: string}  $filters
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    protected function payload(array $filters, array $rows): array
    {
        $shop = ShopSetting::current()->toBrandArray();
        $branch = $filters['branch_id'] ? Branch::query()->find($filters['branch_id']) : null;
        $soldTotal = collect($rows)
            ->where('status', 'completed')
            ->sum(fn (array $row) => (float) $row['total_amount']);

        return [
            'shop_name' => $shop['shop_name'] ?: (tenant('name') ?: 'Oven Ledger'),
            'primary' => $shop['primary_color'] ?: ShopSetting::DEFAULT_PRIMARY,
            'accent' => $shop['accent_color'] ?: ShopSetting::DEFAULT_ACCENT,
            'branch_name' => $branch?->name ?? 'All branches',
            'date_from' => $filters['date_from'],
            'date_to' => $filters['date_to'],
            'period_label' => $filters['date_from'].' – '.$filters['date_to'],
            'generated_at' => now()->timezone(config('app.timezone'))->format('d M Y H:i'),
            'status' => $filters['status'],
            'channel' => $filters['channel'] ?: 'All channels',
            'staff_search' => $filters['staff_search'],
            'sold_total' => round((float) $soldTotal, 2),
            'ticket_count' => count($rows),
            'rows' => $rows,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function pdf(array $payload): Response
    {
        $pdf = Pdf::loadView('reports.sales-ledger-pdf', $payload)->setPaper('a4', 'landscape');

        $filename = 'sales-'.$payload['date_from'].'-to-'.$payload['date_to'].'.pdf';

        return $pdf->download($filename);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function excel(array $payload): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Sales');

        $headers = ['When', 'Ticket', 'Cashier', 'Customer', 'Channel', 'Items', 'Status', 'Total'];
        foreach ($headers as $index => $header) {
            $sheet->setCellValue([$index + 1, 1], $header);
        }

        $headerRange = 'A1:H1';
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->getColor()->setRGB('FBF6EA');
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB(ltrim((string) $payload['primary'], '#'));
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        $rowNumber = 2;
        foreach ($payload['rows'] as $sale) {
            $items = collect($sale['items'] ?? [])
                ->map(fn (array $item) => trim(($item['quantity'] ?? '').' '.($item['name'] ?? '')))
                ->filter()
                ->implode(', ');

            $sheet->setCellValue([1, $rowNumber], (string) ($sale['created_at'] ?? ''));
            $sheet->setCellValue([2, $rowNumber], '#'.($sale['id'] ?? ''));
            $sheet->setCellValue([3, $rowNumber], $sale['cashier']['name'] ?? 'Unassigned');
            $sheet->setCellValue([4, $rowNumber], $sale['customer']['name'] ?? '—');
            $sheet->setCellValue([5, $rowNumber], (string) ($sale['channel'] ?? ''));
            $sheet->setCellValue([6, $rowNumber], $items);
            $sheet->setCellValue([7, $rowNumber], (string) ($sale['status'] ?? ''));
            $sheet->setCellValue([8, $rowNumber], (float) ($sale['total_amount'] ?? 0));
            $rowNumber++;
        }

        $sheet->setCellValue([7, $rowNumber + 1], 'Sold total');
        $sheet->setCellValue([8, $rowNumber + 1], (float) $payload['sold_total']);
        $sheet->getStyle('G'.($rowNumber + 1).':H'.($rowNumber + 1))->getFont()->setBold(true);

        foreach (range(1, 8) as $column) {
            $sheet->getColumnDimensionByColumn($column)->setAutoSize(true);
        }

        $sheet->getStyle('A1:H'.max(1, $rowNumber - 1))
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        $filename = 'sales-'.$payload['date_from'].'-to-'.$payload['date_to'].'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            (new Xlsx($spreadsheet))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
