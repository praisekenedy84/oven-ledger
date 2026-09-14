import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { Button, Divider, ListItemIcon, ListItemText, ListSubheader, Menu, MenuItem } from '@mui/material';
import { Fragment, useState } from 'react';

const OPTIONS = [
    { kind: 'sales', format: 'pdf', group: 'Sales report', label: 'Download PDF', icon: PictureAsPdfOutlinedIcon },
    { kind: 'sales', format: 'xlsx', group: 'Sales report', label: 'Download Excel', icon: TableChartOutlinedIcon },
    { kind: 'expenses', format: 'pdf', group: 'Expenses report', label: 'Download PDF', icon: PictureAsPdfOutlinedIcon },
    { kind: 'expenses', format: 'xlsx', group: 'Expenses report', label: 'Download Excel', icon: TableChartOutlinedIcon },
];

export default function ReportExportMenu({ filters }) {
    const [anchor, setAnchor] = useState(null);

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
        <>
            <Button
                size="small"
                variant="contained"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={(event) => setAnchor(event.currentTarget)}
            >
                Export
            </Button>
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                slotProps={{ paper: { sx: { minWidth: 240 } } }}
            >
                {OPTIONS.map((option, index) => {
                    const showHeader = index === 0 || OPTIONS[index - 1].group !== option.group;
                    const Icon = option.icon;

                    return (
                        <Fragment key={`${option.kind}-${option.format}`}>
                            {showHeader && index > 0 ? <Divider sx={{ my: 0.5 }} /> : null}
                            {showHeader ? <ListSubheader disableSticky>{option.group}</ListSubheader> : null}
                            <MenuItem
                                component="a"
                                href={hrefFor(option.kind, option.format)}
                                onClick={() => setAnchor(null)}
                            >
                                <ListItemIcon>
                                    <Icon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={option.label} />
                            </MenuItem>
                        </Fragment>
                    );
                })}
            </Menu>
        </>
    );
}
