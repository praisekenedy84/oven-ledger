import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { cn } from '@/lib/utils';

export default function DataTable({ columns, children, emptyMessage = 'No records found.', className }) {
    const isEmpty = !children || (Array.isArray(children) && children.length === 0);
    const minWidth = Math.max(columns.length * 120, 480);

    return (
        <div className={cn('overflow-hidden rounded-card border border-border bg-card shadow-card', className)}>
            <div className="overflow-x-auto">
                <Table style={{ minWidth }}>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key ?? column.label}
                                    className={cn(
                                        'whitespace-nowrap',
                                        column.align === 'right' || column.label === '' ? 'text-right' : '',
                                        column.className,
                                    )}
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isEmpty ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            children
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export function DataTableRow({ children, onClick, className = '', ...props }) {
    return (
        <TableRow
            onClick={onClick}
            className={cn(onClick && 'cursor-pointer', className)}
            {...props}
        >
            {children}
        </TableRow>
    );
}

export function DataTableCell({ children, className = '', align, ...props }) {
    return (
        <TableCell
            className={cn(align === 'right' && 'text-right', className)}
            {...props}
        >
            {children}
        </TableCell>
    );
}
