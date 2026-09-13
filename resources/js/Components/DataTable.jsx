import { radius, shadow } from '@/theme/bakeryTheme';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

export default function DataTable({ columns, children, emptyMessage = 'No records found.' }) {
    const isEmpty = !children || (Array.isArray(children) && children.length === 0);
    const minWidth = Math.max(columns.length * 120, 480);

    return (
        <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
                borderRadius: `${radius}px`,
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                boxShadow: shadow,
            }}
        >
            <Table
                size="medium"
                sx={{
                    minWidth,
                    ...(columns.some((column) => column.label === '') && {
                        '& tbody td:last-child': { textAlign: 'right' },
                    }),
                }}
            >
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell
                                key={column.key ?? column.label}
                                className={column.className}
                                align={column.align ?? (column.label === '' ? 'right' : 'left')}
                                sx={{
                                    whiteSpace: 'nowrap',
                                    ...column.sx,
                                }}
                            >
                                {column.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isEmpty ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {emptyMessage}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        children
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export function DataTableRow({ children, onClick, className = '', sx, ...props }) {
    return (
        <TableRow
            hover={Boolean(onClick)}
            onClick={onClick}
            className={className}
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                ...sx,
            }}
            {...props}
        >
            {children}
        </TableRow>
    );
}

export function DataTableCell({ children, className = '', sx, align, ...props }) {
    return (
        <TableCell className={className} align={align} sx={sx} {...props}>
            {children}
        </TableCell>
    );
}
