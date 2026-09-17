import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Fragment } from 'react';

const OPTIONS = [
    { kind: 'sales', format: 'pdf', group: 'Sales report', label: 'Download PDF', icon: FileText },
    { kind: 'sales', format: 'xlsx', group: 'Sales report', label: 'Download Excel', icon: FileSpreadsheet },
    { kind: 'expenses', format: 'pdf', group: 'Expenses report', label: 'Download PDF', icon: FileText },
    { kind: 'expenses', format: 'xlsx', group: 'Expenses report', label: 'Download Excel', icon: FileSpreadsheet },
];

export default function ReportExportMenu({ filters }) {
    const hrefFor = (kind, format) =>
        route('tenant.reports.export', {
            kind,
            format,
            branch_id: filters.branch_id ?? '',
            date_from: filters.date_from,
            date_to: filters.date_to,
            product_search: filters.product_search ?? '',
            product_id: filters.product_id ?? '',
        });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[240px]">
                {OPTIONS.map((option, index) => {
                    const showHeader = index === 0 || OPTIONS[index - 1].group !== option.group;
                    const Icon = option.icon;

                    return (
                        <Fragment key={`${option.kind}-${option.format}`}>
                            {showHeader && index > 0 ? <DropdownMenuSeparator /> : null}
                            {showHeader ? (
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    {option.group}
                                </DropdownMenuLabel>
                            ) : null}
                            <DropdownMenuItem asChild>
                                <a
                                    href={hrefFor(option.kind, option.format)}
                                    className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-muted focus:text-foreground"
                                >
                                    <Icon className="h-4 w-4" />
                                    {option.label}
                                </a>
                            </DropdownMenuItem>
                        </Fragment>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
