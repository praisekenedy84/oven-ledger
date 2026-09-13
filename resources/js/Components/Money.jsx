import { formatMoney } from '@/lib/format';

export default function Money({ amount, className = '' }) {
    return <span className={className}>{formatMoney(amount)}</span>;
}
