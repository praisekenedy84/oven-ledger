export default function ApplicationLogo({ showText = true, className = '' }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
                <rect x="4" y="18" width="32" height="16" rx="3" fill="currentColor" opacity="0.92" />
                <path
                    d="M8 18 C8 10 14 6 20 6 C26 6 32 10 32 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx="20" cy="26" r="3" fill="var(--color-jam)" />
            </svg>
            {showText && (
                <span className="font-brand text-[1.15rem] font-semibold leading-none tracking-tight">
                    Oven Ledger
                </span>
            )}
        </div>
    );
}
