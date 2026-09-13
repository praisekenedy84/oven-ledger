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

    return (
        <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgb(51 38 28 / 0.08)' }}
        >
            <Table size="medium">
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell
                                key={column.key ?? column.label}
                                className={column.className}
                                align={column.align}
                                sx={column.sx}
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

export function DataTableCell({ children, className = '', sx, ...props }) {
    return (
        <TableCell className={className} sx={sx} {...props}>
            {children}
        </TableCell>
    );
}
