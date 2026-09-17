import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { roleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

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

function MatrixCheckbox({ state, onToggle, className, ariaLabel }) {
    return (
        <Checkbox
            className={cn(
                'border-border data-[state=checked]:border-jam data-[state=checked]:bg-jam data-[state=indeterminate]:border-butter data-[state=indeterminate]:bg-butter',
                className,
            )}
            checked={state.indeterminate ? 'indeterminate' : state.checked}
            onCheckedChange={onToggle}
            aria-label={ariaLabel}
        />
    );
}

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const onChange = (event) => setIsDesktop(event.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return isDesktop;
}

export default function AccessMatrix({ columns, rows, value, onChange }) {
    const isDesktop = useIsDesktop();

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
            <div className="grid gap-4">
                {columns.map((role) => {
                    const selected = value[role.id] ?? [];
                    return (
                        <div
                            key={role.id}
                            className="overflow-hidden rounded-md border border-border bg-surface-raised"
                        >
                            <div className="flex items-center justify-between gap-2 bg-ink px-4 py-3 text-cream">
                                <p className="font-bold">{roleLabel(role.name)}</p>
                                <Badge variant="warning">{selected.length} on</Badge>
                            </div>
                            {rows.map((row, index) => {
                                const related = descendantIds(rows, index);
                                const state = selectionState(selected, related);

                                if (row.isSection) {
                                    return (
                                        <div key={`${role.id}-${row.id}`} className="bg-surface px-4 pb-1 pt-4">
                                            <label className="flex cursor-pointer items-center gap-2">
                                                <MatrixCheckbox
                                                    state={state}
                                                    onToggle={() => toggleCell(role.id, index)}
                                                />
                                                <span className="text-xs font-bold tracking-widest">
                                                    {row.label.toUpperCase()}
                                                </span>
                                            </label>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={`${role.id}-${row.id}`}
                                        className="border-t border-border px-4 py-1"
                                        style={{ paddingLeft: `${16 + row.depth * 24}px` }}
                                    >
                                        <label className="flex w-full cursor-pointer items-center justify-between gap-3">
                                            <span className="text-sm font-semibold">{row.label}</span>
                                            <MatrixCheckbox
                                                state={state}
                                                onToggle={() => toggleCell(role.id, index)}
                                            />
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="max-h-[70vh] overflow-auto rounded-md border border-border bg-surface-raised">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 z-[3] min-w-[240px] bg-surface">Access</TableHead>
                        {columns.map((role) => {
                            const selected = value[role.id] ?? [];
                            const allIds = rows.filter((row) => !row.isSection).map((row) => row.id);
                            const state = selectionState(selected, allIds);

                            return (
                                <TableHead key={role.id} className="min-w-32 bg-surface text-center">
                                    <p className="text-sm font-bold">{roleLabel(role.name)}</p>
                                    <div className="mt-1 flex justify-center">
                                        <MatrixCheckbox
                                            state={state}
                                            onToggle={() => toggleColumn(role.id)}
                                            ariaLabel={`Toggle all for ${role.name}`}
                                        />
                                    </div>
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, index) => (
                        <TableRow
                            key={row.id}
                            className={cn(row.isSection && 'bg-surface hover:bg-surface')}
                        >
                            <TableCell
                                className={cn(
                                    'sticky left-0 z-[1] border-r border-border',
                                    row.isSection ? 'bg-surface' : 'bg-surface-raised',
                                    row.isSection
                                        ? 'text-xs font-bold uppercase tracking-wide text-muted-foreground'
                                        : 'text-sm font-medium text-charcoal',
                                    row.has_children && !row.isSection && 'font-bold',
                                )}
                                style={{ paddingLeft: `${16 + row.depth * 16}px` }}
                            >
                                {row.label}
                            </TableCell>
                            {columns.map((role) => {
                                const selected = value[role.id] ?? [];
                                const related = descendantIds(rows, index);
                                const state = selectionState(selected, related);

                                return (
                                    <TableCell key={`${role.id}-${row.id}`} className="text-center">
                                        <div className="flex justify-center">
                                            <MatrixCheckbox
                                                state={state}
                                                onToggle={() => toggleCell(role.id, index)}
                                            />
                                        </div>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
