import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { cn } from '@/lib/utils';
import { Bluetooth, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function openThermalPrint(url) {
    const printUrl = url.includes('?') ? `${url}&autoprint=1` : `${url}?autoprint=1`;
    window.open(printUrl, '_blank', 'noopener,noreferrer,width=420,height=720');
}

function withQuery(url, params) {
    const next = new URL(url, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        next.searchParams.set(key, String(value));
    });
    return next.pathname + next.search;
}

export default function SaleReceiptDialog({ sale, open, onClose }) {
    const [layout, setLayout] = useState('full');

    useEffect(() => {
        if (open) {
            setLayout('full');
        }
    }, [open, sale?.id]);

    const urls = useMemo(() => {
        if (!sale) {
            return null;
        }

        const previewBase = sale.preview_url || route('tenant.pos.receipt.preview', sale.id);
        const pdfBase = sale.pdf_url || route('tenant.pos.receipt.pdf', sale.id);
        const thermalPdfBase = route('tenant.pos.receipt.thermal-pdf', sale.id);
        const thermalUrl = sale.thermal_url || route('tenant.pos.receipt.thermal', sale.id);

        return {
            preview: withQuery(previewBase, { layout }),
            pdfDownload: withQuery(pdfBase, { download: 1 }),
            pdfView: pdfBase,
            thermalPdfDownload: withQuery(thermalPdfBase, { download: 1 }),
            thermalUrl,
        };
    }, [sale, layout]);

    if (!sale || !urls) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose();
                }
            }}
        >
            <DialogContent
                className={cn(
                    'flex max-h-[100dvh] w-full max-w-lg flex-col gap-4 overflow-hidden p-0 sm:max-h-[92dvh] sm:rounded-card',
                    'left-0 top-0 h-[100dvh] max-w-none translate-x-0 translate-y-0 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%]',
                )}
            >
                <DialogHeader className="space-y-1 px-4 pb-0 pt-6 text-left sm:px-6">
                    <DialogTitle>{sale.is_pre_order ? 'Pre-order receipt' : 'Sale receipt'}</DialogTitle>
                    <DialogDescription>
                        Ticket #{sale.id} · preview before you download or print
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 sm:px-6">
                    <Tabs value={layout} onValueChange={setLayout}>
                        <TabsList className="grid h-auto w-full grid-cols-2 border border-border bg-cream p-1">
                            <TabsTrigger value="full" className="py-2 font-semibold">
                                Full receipt
                            </TabsTrigger>
                            <TabsTrigger value="thermal" className="py-2 font-semibold">
                                Thermal 80mm
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="min-h-[52dvh] flex-1 overflow-hidden rounded-lg border border-border bg-kraft sm:min-h-[420px]">
                        <iframe
                            key={urls.preview}
                            title={`Receipt preview #${sale.id}`}
                            src={urls.preview}
                            className="block h-[52dvh] w-full border-0 bg-white sm:h-[420px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Button asChild className="min-h-12 w-full">
                            <a href={layout === 'thermal' ? urls.thermalPdfDownload : urls.pdfDownload}>
                                <FileText className="h-4 w-4" />
                                {layout === 'thermal' ? 'Download thermal PDF' : 'Download PDF'}
                            </a>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-12 w-full"
                            onClick={() => openThermalPrint(urls.thermalUrl)}
                        >
                            <Bluetooth className="h-4 w-4" />
                            Print thermal / Bluetooth
                        </Button>
                    </div>
                </div>

                <DialogFooter className="px-4 pb-6 pt-0 sm:px-6">
                    <Button variant="secondary" className="min-h-11 w-full" onClick={onClose}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { openThermalPrint };
