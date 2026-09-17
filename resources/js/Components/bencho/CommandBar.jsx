import { useEffect, useState } from 'react';
import { Command } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Bencho-inspired command bar (keyboard-triggered hint / shortcut strip).
 */
export default function CommandBar({
    open: controlledOpen,
    onOpenChange,
    placeholder = 'Search or jump…',
    shortcuts = [],
    className,
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(!open);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, setOpen]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/40 pt-[15vh]"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        className={cn(
                            'w-full max-w-lg overflow-hidden rounded-card border border-border bg-card shadow-card',
                            className,
                        )}
                        initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
                            <Command className="h-4 w-4 text-muted-foreground" />
                            <input
                                autoFocus
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                placeholder={placeholder}
                                readOnly
                            />
                            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                esc
                            </kbd>
                        </div>
                        {shortcuts.length > 0 && (
                            <ul className="max-h-64 overflow-auto p-2">
                                {shortcuts.map((item) => (
                                    <li key={item.id ?? item.label}>
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                                            onClick={() => {
                                                item.onSelect?.();
                                                setOpen(false);
                                            }}
                                        >
                                            <span>{item.label}</span>
                                            {item.hint && (
                                                <span className="text-xs text-muted-foreground">{item.hint}</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
