import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function BuildUpdatePrompt() {
    const { appVersion } = usePage().props;
    const initialVersion = useRef(appVersion);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const checkVersion = () => {
            if (appVersion && initialVersion.current && appVersion !== initialVersion.current) {
                setShowPrompt(true);
            }
        };

        const onFocus = () => checkVersion();
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                checkVersion();
            }
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        const removeNavigateListener = router.on('navigate', () => {
            checkVersion();
        });

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            removeNavigateListener();
        };
    }, [appVersion]);

    if (!showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg border border-wheat bg-cocoa px-4 py-3 text-sm text-white shadow-xl">
            <p className="font-medium">A new version of Oven Ledger is available.</p>
            <p className="mt-1 text-wheat-light">Refresh to load the latest updates.</p>
            <div className="mt-3 flex gap-2">
                <button
                    type="button"
                    className="rounded-md bg-wheat px-3 py-1.5 text-xs font-semibold text-cocoa hover:bg-wheat-light"
                    onClick={() => window.location.reload()}
                >
                    Refresh now
                </button>
                <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-xs text-wheat-light hover:text-white"
                    onClick={() => setShowPrompt(false)}
                >
                    Later
                </button>
            </div>
        </div>
    );
}
