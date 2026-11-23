import { Link } from '@inertiajs/react';
import type { PageLink } from '@/types/memo';

/**
 * The numbered page buttons under a table. They show only when there is more than one page.
 * The labels come from Laravel's paginator ("&laquo; Previous", "2"), so they are trusted HTML.
 */
export default function PageLinks({ links }: { links: PageLink[] }) {
    // One page gives [Previous, 1, Next]; two pages give four items, and that second page must stay reachable.
    if (links.length <= 3) return null;

    const shown = links.filter(link => link.url !== null || link.active);

    return (
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-1" aria-label="Pages">
            {shown.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                            link.active ? 'border-green-600 bg-green-600 font-semibold text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span key={i} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                ),
            )}
        </nav>
    );
}
