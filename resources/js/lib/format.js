export function formatQuantity(value) {
    const amount = Number(value ?? 0);

    if (!Number.isFinite(amount)) {
        return '0';
    }

    return new Intl.NumberFormat('en-TZ', {
        maximumFractionDigits: 3,
    }).format(amount);
}

export function formatMoney(amount, { prefix = 'TZS ' } = {}) {
    const value = Number(amount ?? 0);
    const formatted = new Intl.NumberFormat('en-TZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

    return `${prefix}${formatted}`;
}

/**
 * Strip grouping commas / currency noise and return a plain numeric string for forms.
 * Keeps a trailing "." while the user is still typing decimals.
 */
export function parseNumberInput(value) {
    if (value === null || value === undefined) {
        return '';
    }

    let raw = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '');

    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
        return raw;
    }

    const negative = raw.startsWith('-');
    raw = raw.replace(/-/g, '');
    if (negative) {
        raw = `-${raw}`;
    }

    const parts = raw.split('.');
    if (parts.length > 2) {
        raw = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    return raw;
}

/**
 * Format a numeric form value with thousand separators for display in inputs.
 */
export function formatNumberInput(value, { maximumFractionDigits = 3 } = {}) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const raw = parseNumberInput(value);

    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
        return raw;
    }

    const trailingDot = raw.endsWith('.');
    const numeric = Number(trailingDot ? raw.slice(0, -1) : raw);

    if (!Number.isFinite(numeric)) {
        return '';
    }

    const formatted = new Intl.NumberFormat('en-TZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits,
    }).format(numeric);

    return trailingDot ? `${formatted}.` : formatted;
}

export function formatDate(value) {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('en-TZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(value) {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString('en-TZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
