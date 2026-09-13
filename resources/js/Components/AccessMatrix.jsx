import { roleLabel } from '@/lib/roles';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    Checkbox,
    Chip,
    FormControlLabel,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

function descendantIds(rows, index) {
    const row = rows[index];
    const ids = [];

    if (!row.isSection) {
        ids.push(row.id);
    } else if (row.childIds) {
        return row.childIds;
    }

    for (let i = index + 1; i < rows.length; i += 1) {
        if (rows[i].depth <= row.depth) {
            break;
        }
        if (!rows[i].isSection) {
            ids.push(rows[i].id);
        }
    }

    return ids;
}

function ancestorIds(rows, index) {
    const ids = [];
    let depth = rows[index].depth;

    for (let i = index - 1; i >= 0 && depth > 0; i -= 1) {
        if (rows[i].depth < depth) {
            if (!rows[i].isSection) {
                ids.push(rows[i].id);
            }
            depth = rows[i].depth;
        }
    }

    return ids;
}

function selectionState(selected, ids) {
    const hit = ids.filter((id) => selected.includes(id)).length;
    return {
        checked: ids.length > 0 && hit === ids.length,
        indeterminate: hit > 0 && hit < ids.length,
    };
}

function toggleIds(selected, ids, checked) {
    const next = new Set(selected);

    ids.forEach((id) => {
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
    });

    return [...next];
}

export default function AccessMatrix({ columns, rows, value, onChange }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const setRoleIds = (roleId, ids) => onChange(roleId, ids);

    const toggleCell = (roleId, rowIndex, force) => {
        const selected = value[roleId] ?? [];
        const row = rows[rowIndex];
        const related = descendantIds(rows, rowIndex);
        const current = selectionState(selected, related);
        const nextChecked = force ?? !current.checked;
        let next = toggleIds(selected, related, nextChecked);

        if (nextChecked) {
            next = toggleIds(next, ancestorIds(rows, rowIndex), true);
        }

        setRoleIds(roleId, next);
    };

    const toggleColumn = (roleId) => {
        const selected = value[roleId] ?? [];
        const allIds = rows.filter((row) => !row.isSection).map((row) => row.id);
        const current = selectionState(selected, allIds);
        setRoleIds(roleId, current.checked ? [] : allIds);
    };

    if (!isDesktop) {
        return (
            <Box sx={{ display: 'grid', gap: 2 }}>
                {columns.map((role) => {
                    const selected = value[role.id] ?? [];
                    return (
                        <Box
                            key={role.id}
                            sx={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: 3,
                                overflow: 'hidden',
                                bgcolor: colors.surfaceRaised,
                            }}
                        >
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    bgcolor: colors.ink,
                                    color: colors.cream,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Typography fontWeight={700}>{roleLabel(role.name)}</Typography>
                                <Chip
                                    size="small"
                                    label={`${selected.length} on`}
                                    sx={{ bgcolor: colors.butter, color: colors.ink, fontWeight: 700 }}
                                />
                            </Box>
                            {rows.map((row, index) => {
                                const related = descendantIds(rows, index);
                                const state = selectionState(selected, related);

                                if (row.isSection) {
                                    return (
                                        <Box
                                            key={`${role.id}-${row.id}`}
                                            sx={{
                                                px: 2,
                                                pt: 1.5,
                                                pb: 0.5,
                                                bgcolor: colors.surface,
                                            }}
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={state.checked}
                                                        indeterminate={state.indeterminate}
                                                        onChange={() => toggleCell(role.id, index)}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="caption" fontWeight={700} letterSpacing="0.06em">
                                                        {row.label.toUpperCase()}
                                                    </Typography>
                                                }
                                            />
                                        </Box>
                                    );
                                }

                                return (
                                    <Box
                                        key={`${role.id}-${row.id}`}
                                        sx={{
                                            px: 2,
                                            py: 0.5,
                                            pl: 2 + row.depth * 1.5,
                                            borderTop: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        <FormControlLabel
                                            sx={{ width: '100%', justifyContent: 'space-between', ml: 0 }}
                                            labelPlacement="start"
                                            control={
                                                <Switch
                                                    checked={state.checked}
                                                    onChange={() => toggleCell(role.id, index)}
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" fontWeight={600}>
                                                    {row.label}
                                                </Typography>
                                            }
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    );
                })}
            </Box>
        );
    }

    return (
        <TableContainer
            sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: 3,
                maxHeight: '70vh',
                bgcolor: colors.surfaceRaised,
            }}
        >
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell
                            sx={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 3,
                                minWidth: 240,
                                bgcolor: colors.surface,
                            }}
                        >
                            Access
                        </TableCell>
                        {columns.map((role) => {
                            const selected = value[role.id] ?? [];
                            const allIds = rows.filter((row) => !row.isSection).map((row) => row.id);
                            const state = selectionState(selected, allIds);

                            return (
                                <TableCell key={role.id} align="center" sx={{ minWidth: 128, bgcolor: colors.surface }}>
                                    <Typography variant="body2" fontWeight={700}>
                                        {roleLabel(role.name)}
                                    </Typography>
                                    <Checkbox
                                        size="small"
                                        checked={state.checked}
                                        indeterminate={state.indeterminate}
                                        onChange={() => toggleColumn(role.id)}
                                        inputProps={{ 'aria-label': `Toggle all for ${role.name}` }}
                                    />
                                </TableCell>
                            );
                        })}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, index) => (
                        <TableRow
                            key={row.id}
                            hover={!row.isSection}
                            sx={{
                                bgcolor: row.isSection ? colors.surface : 'transparent',
                            }}
                        >
                            <TableCell
                                sx={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 1,
                                    bgcolor: row.isSection ? colors.surface : colors.surfaceRaised,
                                    pl: 2 + row.depth * 2,
                                    fontWeight: row.isSection || row.has_children ? 700 : 500,
                                    letterSpacing: row.isSection ? '0.04em' : 0,
                                    textTransform: row.isSection ? 'uppercase' : 'none',
                                    fontSize: row.isSection ? 12 : 14,
                                    color: row.isSection ? colors.muted : colors.charcoal,
                                    borderRight: `1px solid ${colors.border}`,
                                }}
                            >
                                {row.label}
                            </TableCell>
                            {columns.map((role) => {
                                const selected = value[role.id] ?? [];
                                const related = descendantIds(rows, index);
                                const state = selectionState(selected, related);

                                return (
                                    <TableCell key={`${role.id}-${row.id}`} align="center">
                                        <Checkbox
                                            size="small"
                                            checked={state.checked}
                                            indeterminate={state.indeterminate}
                                            onChange={() => toggleCell(role.id, index)}
                                            sx={{
                                                color: colors.border,
                                                '&.Mui-checked': { color: colors.jam },
                                                '&.MuiCheckbox-indeterminate': { color: colors.butter },
                                            }}
                                        />
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
