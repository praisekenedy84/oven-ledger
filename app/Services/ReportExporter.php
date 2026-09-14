<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Order;
use App\Models\ShopSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExporter
{
    public function __construct(
        protected BusinessReport $reports,
    ) {}

    public function download(
        string $kind,
        string $format,
        Carbon $from,
        Carbon $to,
        ?int $branchId,
        ?string $productSearch = null,
        ?int $productId = null,
    ): Response|StreamedResponse {
        $payload = $this->payload($kind, $from, $to, $branchId, $productSearch, $productId);

        return $format === 'xlsx'
            ? $this->excel($payload)
            : $this->pdf($payload);
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(
        string $kind,
        Carbon $from,
        Carbon $to,
        ?int $branchId,
        ?string $productSearch = null,
        ?int $productId = null,
    ): array {
        $shop = ShopSetting::current()->toBrandArray();
        $branch = $branchId ? Branch::query()->find($branchId) : null;
        $statement = $this->reports->statement($from, $to, $branchId);
        $dailySales = $this->reports->dailySales($from, $to, $branchId);

        return [
            'kind' => $kind,
            'shop_name' => $shop['shop_name'] ?: (tenant('name') ?: 'Oven Ledger'),
            'primary' => $shop['primary_color'] ?: ShopSetting::DEFAULT_PRIMARY,
            'accent' => $shop['accent_color'] ?: ShopSetting::DEFAULT_ACCENT,
            'branch_name' => $branch?->name ?? 'All branches',
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'period_label' => $from->format('d M Y').' – '.$to->format('d M Y'),
            'generated_at' => now()->timezone(config('app.timezone'))->format('d M Y H:i'),
            'product_search' => trim((string) $productSearch),
            'statement' => $statement,
            'daily_sales' => $dailySales,
            'sales_by_channel' => $this->channelTotals($from, $to, $branchId),
            'sales_by_product' => $this->reports->productSales($from, $to, $branchId, $productSearch, $productId),
            'expenses' => $this->reports->expenseBreakdown($statement, $dailySales),
            'operating_expenses' => $this->reports->operatingExpenseEntries($from, $to, $branchId),
        ];
    }

    /**
     * @return list<array{channel: string, total: float}>
     */
    protected function channelTotals(Carbon $from, Carbon $to, ?int $branchId): array
    {
        return Order::query()
            ->select('channel')
            ->selectRaw('SUM(total_amount) as total')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('channel')
            ->get()
            ->map(fn ($row) => [
                'channel' => (string) $row->channel,
                'total' => round((float) $row->total, 2),
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function pdf(array $payload): Response
    {
        $view = $payload['kind'] === 'expenses' ? 'reports.expenses-pdf' : 'reports.sales-pdf';
        $filename = $this->filename($payload, 'pdf');

        return Pdf::loadView($view, $payload)
            ->setPaper('a4', 'portrait')
            ->download($filename);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function excel(array $payload): StreamedResponse
    {
        $spreadsheet = $payload['kind'] === 'expenses'
            ? $this->expensesWorkbook($payload)
            : $this->salesWorkbook($payload);

        $filename = $this->filename($payload, 'xlsx');

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function salesWorkbook(array $payload): Spreadsheet
    {
        $book = new Spreadsheet;
        $theme = $this->theme($payload['primary'], $payload['accent']);

        $summary = $book->getActiveSheet();
        $summary->setTitle('Summary');
        $this->paintCover($summary, $payload, $theme, 'Sales report', [
            ['Sales', $payload['statement']['revenue']],
            ['Ingredient and stock cost', $payload['statement']['ingredient_cost']],
            ['Waste write-off', $payload['statement']['waste_cost']],
            ['Operating profit', $payload['statement']['profit']],
            ['Cash collected', $payload['statement']['cash_collected']],
            ['Sold on credit', $payload['statement']['credit_sales']],
        ]);

        $daily = $book->createSheet();
        $daily->setTitle('Daily sales');
        $this->paintTable($daily, $payload, $theme, 'Daily sales', [
            'Day', 'Tickets', 'Sales', 'Cash in', 'Credit', 'Cost', 'Waste', 'Profit',
        ], collect($payload['daily_sales'])->map(fn (array $day) => [
            $day['date'],
            $day['tickets'],
            $day['revenue'],
            $day['cash'],
            $day['credit'],
            $day['ingredient_cost'],
            $day['waste_cost'],
            $day['profit'],
        ])->all(), [2, 3, 4, 5, 6, 7]);

        $products = $book->createSheet();
        $products->setTitle('Products');
        $this->paintTable($products, $payload, $theme, 'Product sales', [
            'Product', 'Type', 'Qty', 'Unit', 'Sales', 'Cost', 'Profit',
        ], collect($payload['sales_by_product'])->map(fn (array $row) => [
            $row['name'],
            $row['type'],
            $row['quantity'],
            $row['unit'],
            $row['revenue'],
            $row['cost'],
            $row['profit'],
        ])->all(), [4, 5, 6]);

        $channels = $book->createSheet();
        $channels->setTitle('Channels');
        $this->paintTable($channels, $payload, $theme, 'Sales by channel', [
            'Channel', 'Sales',
        ], collect($payload['sales_by_channel'])->map(fn (array $row) => [
            $row['channel'],
            $row['total'],
        ])->all(), [1]);

        $book->setActiveSheetIndex(0);

        return $book;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function expensesWorkbook(array $payload): Spreadsheet
    {
        $book = new Spreadsheet;
        $theme = $this->theme('#3D4F38', '#C46B3A');

        $summary = $book->getActiveSheet();
        $summary->setTitle('Cost summary');
        $this->paintCover($summary, $payload, $theme, 'Expenses report', collect($payload['expenses']['lines'])
            ->map(fn (array $line) => [$line['label'], $line['amount']])
            ->push(['Money used', $payload['expenses']['total']])
            ->all());

        $daily = $book->createSheet();
        $daily->setTitle('Daily costs');
        $this->paintTable($daily, $payload, $theme, 'Money going out each day', [
            'Day', 'Ingredient cost', 'Waste', 'Shop costs', 'Creditor payments', 'Owner drawings', 'Total out',
        ], collect($payload['expenses']['daily'])->map(fn (array $day) => [
            $day['date'],
            $day['ingredient_cost'],
            $day['waste_cost'],
            $day['operating_expenses'] ?? 0,
            $day['debt_payments'],
            $day['drawings'],
            $day['total'],
        ])->all(), [1, 2, 3, 4, 5, 6]);

        $shop = $book->createSheet();
        $shop->setTitle('Rent and fees');
        $this->paintTable($shop, $payload, $theme, 'Rent, fees, and other shop costs', [
            'Day', 'Type', 'Paid to / for', 'Amount', 'Notes',
        ], collect($payload['operating_expenses'] ?? [])->map(fn (array $row) => [
            $row['date'],
            $row['label'],
            $row['payee'],
            $row['amount'],
            $row['notes'] ?? '',
        ])->all(), [3]);

        $book->setActiveSheetIndex(0);

        return $book;
    }

    /**
     * @return array{header: string, accent: string, ink: string, paper: string, stripe: string, money: string}
     */
    protected function theme(string $primary, string $accent): array
    {
        return [
            'header' => $primary,
            'accent' => $accent,
            'ink' => '33261C',
            'paper' => 'FBF6EA',
            'stripe' => 'F4E8C8',
            'money' => '#,##0.00',
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array{header: string, accent: string, ink: string, paper: string, stripe: string, money: string}  $theme
     * @param  list<array{0: string, 1: float}>  $rows
     */
    protected function paintCover(Worksheet $sheet, array $payload, array $theme, string $title, array $rows): void
    {
        $sheet->getParent()?->getDefaultStyle()->getFont()->setName('Calibri')->setSize(11);
        $sheet->setShowGridLines(false);
        $sheet->getColumnDimension('A')->setWidth(38);
        $sheet->getColumnDimension('B')->setWidth(22);

        $sheet->mergeCells('A1:B1');
        $sheet->setCellValue('A1', $payload['shop_name']);
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 20, 'color' => ['rgb' => 'FFFFFF'], 'name' => 'Calibri'],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => ltrim($theme['header'], '#')]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        $sheet->mergeCells('A2:B2');
        $sheet->setCellValue('A2', strtoupper($title));
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '33261C']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => ltrim($theme['accent'], '#')]],
        ]);

        $sheet->setCellValue('A3', 'Period');
        $sheet->setCellValue('B3', $payload['period_label']);
        $sheet->setCellValue('A4', 'Branch');
        $sheet->setCellValue('B4', $payload['branch_name']);
        $sheet->setCellValue('A5', 'Printed');
        $sheet->setCellValue('B5', $payload['generated_at']);
        if ($payload['product_search'] !== '') {
            $sheet->setCellValue('A6', 'Product filter');
            $sheet->setCellValue('B6', $payload['product_search']);
        }

        $start = $payload['product_search'] !== '' ? 8 : 7;
        $sheet->setCellValue("A{$start}", 'Line');
        $sheet->setCellValue("B{$start}", 'TZS');
        $this->styleHeaderRow($sheet, "A{$start}:B{$start}", $theme);

        foreach ($rows as $index => [$label, $amount]) {
            $row = $start + 1 + $index;
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", (float) $amount);
            $sheet->getStyle("B{$row}")->getNumberFormat()->setFormatCode('"TZS "#,##0');
            if ($index % 2 === 1) {
                $sheet->getStyle("A{$row}:B{$row}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB($theme['stripe']);
            }
        }

        $last = $start + count($rows);
        $sheet->getStyle("A{$start}:B{$last}")->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E0D2B4']],
            ],
        ]);
        $sheet->getStyle("A{$last}:B{$last}")->getFont()->setBold(true);
        $sheet->getStyle("A{$start}:B{$last}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array{header: string, accent: string, ink: string, paper: string, stripe: string, money: string}  $theme
     * @param  list<string>  $headers
     * @param  list<list<mixed>>  $rows
     * @param  list<int>  $moneyColumns  zero-based
     */
    protected function paintTable(
        Worksheet $sheet,
        array $payload,
        array $theme,
        string $title,
        array $headers,
        array $rows,
        array $moneyColumns,
    ): void {
        $lastCol = chr(64 + count($headers));
        $sheet->setShowGridLines(false);
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->setCellValue('A1', $payload['shop_name'].' · '.$title);
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => ltrim($theme['header'], '#')]],
        ]);
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->setCellValue('A2', $payload['period_label'].' · '.$payload['branch_name']);
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setColor(new Color('FF6B5848'));

        foreach ($headers as $index => $header) {
            $sheet->setCellValue($this->cell($index + 1, 4), $header);
        }
        $this->styleHeaderRow($sheet, "A4:{$lastCol}4", $theme);

        foreach ($rows as $rowIndex => $values) {
            $excelRow = 5 + $rowIndex;
            foreach ($values as $colIndex => $value) {
                $address = $this->cell($colIndex + 1, $excelRow);
                $sheet->setCellValue($address, $value);
                if (in_array($colIndex, $moneyColumns, true)) {
                    $sheet->getStyle($address)
                        ->getNumberFormat()
                        ->setFormatCode('"TZS "#,##0');
                }
            }
            if ($rowIndex % 2 === 1) {
                $sheet->getStyle("A{$excelRow}:{$lastCol}{$excelRow}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB($theme['stripe']);
            }
        }

        $end = 4 + max(count($rows), 1);
        $sheet->getStyle("A4:{$lastCol}{$end}")->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E0D2B4']],
            ],
        ]);

        foreach (range('A', $lastCol) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        $sheet->freezePane('A5');
    }

    /**
     * @param  array{header: string, accent: string, ink: string, paper: string, stripe: string, money: string}  $theme
     */
    protected function styleHeaderRow(Worksheet $sheet, string $range, array $theme): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => ltrim($theme['header'], '#')]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
    }

    protected function cell(int $column, int $row): string
    {
        return Coordinate::stringFromColumnIndex($column).$row;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function filename(array $payload, string $extension): string
    {
        $kind = $payload['kind'] === 'expenses' ? 'expenses' : 'sales';

        return sprintf(
            '%s-%s-%s-to-%s.%s',
            $kind,
            Str::slug($payload['shop_name']),
            $payload['date_from'],
            $payload['date_to'],
            $extension,
        );
    }
}
