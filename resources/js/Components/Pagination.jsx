import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            {links.map((link, index) => {
                const disabled = !link.url;
                const content = <span dangerouslySetInnerHTML={{ __html: link.label }} />;

                if (disabled) {
                    return (
                        <Button key={index} size="sm" disabled variant="outline" className="min-h-10 min-w-10">
                            {content}
                        </Button>
                    );
                }

                return (
                    <Button
                        key={index}
                        asChild
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        className={cn('min-h-10 min-w-10', link.active && 'pointer-events-none')}
                    >
                        <Link href={link.url} preserveScroll prefetch>
                            {content}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}
