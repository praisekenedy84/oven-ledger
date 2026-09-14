import { colors } from '@/theme/bakeryTheme';
import BluetoothOutlinedIcon from '@mui/icons-material/BluetoothOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
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
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={false}
            PaperProps={{
                sx: {
                    maxHeight: { xs: '100dvh', sm: '92dvh' },
                    m: { xs: 0, sm: 2 },
                    width: { xs: '100%', sm: 'auto' },
                    borderRadius: { xs: 0, sm: 2 },
                },
            }}
        >
            <DialogTitle sx={{ pr: 6, pb: 1.25 }}>
                {sale.is_pre_order ? 'Pre-order receipt' : 'Sale receipt'}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Ticket #{sale.id} · preview before you download or print
                </Typography>
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 12, top: 12 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    pt: 1,
                    px: { xs: 1.5, sm: 3 },
                }}
            >
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    fullWidth
                    value={layout}
                    onChange={(_event, value) => {
                        if (value) {
                            setLayout(value);
                        }
                    }}
                    sx={{
                        bgcolor: colors.cream,
                        border: `1px solid ${colors.border}`,
                        '& .MuiToggleButton-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1,
                        },
                    }}
                >
                    <ToggleButton value="full">Full receipt</ToggleButton>
                    <ToggleButton value="thermal">Thermal 80mm</ToggleButton>
                </ToggleButtonGroup>

                <Box
                    sx={{
                        flex: 1,
                        minHeight: { xs: '52dvh', sm: 420 },
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${colors.border}`,
                        bgcolor: colors.kraft,
                    }}
                >
                    <Box
                        component="iframe"
                        key={urls.preview}
                        title={`Receipt preview #${sale.id}`}
                        src={urls.preview}
                        sx={{
                            display: 'block',
                            width: '100%',
                            height: { xs: '52dvh', sm: 420 },
                            border: 0,
                            bgcolor: '#fff',
                        }}
                    />
                </Box>

                <Stack spacing={1}>
                    <Button
                        component="a"
                        href={layout === 'thermal' ? urls.thermalPdfDownload : urls.pdfDownload}
                        variant="contained"
                        startIcon={<PictureAsPdfOutlinedIcon />}
                        sx={{ minHeight: 48 }}
                    >
                        {layout === 'thermal' ? 'Download thermal PDF' : 'Download PDF'}
                    </Button>
                    <Button
                        type="button"
                        variant="outlined"
                        startIcon={<BluetoothOutlinedIcon />}
                        onClick={() => openThermalPrint(urls.thermalUrl)}
                        sx={{ minHeight: 48 }}
                    >
                        Print thermal / Bluetooth
                    </Button>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                <Button onClick={onClose} variant="contained" color="inherit" fullWidth sx={{ minHeight: 44 }}>
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export { openThermalPrint };
