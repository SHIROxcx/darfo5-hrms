import { Head } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import PageLinks from '@/components/page-links';
import AppLayout from '@/layouts/app-layout';
import { history } from '@/routes/admin/announcements';
import type { BreadcrumbItem } from '@/types';

interface RemovedAnnouncement {
    id: number;
    title: string;
    tag: string;
    date: string;
    body: string;
    created_by_name: string | null;
    deleted_at: string | null;
    reason: 'deleted' | 'expired';
    removed_by: string | null;
}

interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    announcements: {
        data: RemovedAnnouncement[];
        links: PageLink[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Announcement History', href: history().url }];

const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function AnnouncementHistory({ announcements }: Props) {
    const [openId, setOpenId] = useState<number | null>(null);
    const rows = announcements.data;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcement History" />

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Announcement History</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Announcements that were removed or reached their auto-delete date. The text and files are kept here, and employees no longer see them.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                                <tr>
                                    <th className="px-4 py-5 text-left">Title</th>
                                    <th className="px-4 py-5 text-left">Category</th>
                                    <th className="px-4 py-5 text-left">Posted by</th>
                                    <th className="px-4 py-5 text-left">Removed on</th>
                                    <th className="px-4 py-5 text-left">Removed by</th>
                                    <th className="px-4 py-5 text-center">Text</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center italic text-gray-400">
                                            No removed announcements yet.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map(row => (
                                        <FragmentRow key={row.id} row={row} open={openId === row.id} onToggle={() => setOpenId(openId === row.id ? null : row.id)} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <PageLinks links={announcements.links} />
            </div>
        </AppLayout>
    );
}

function FragmentRow({ row, open, onToggle }: { row: RemovedAnnouncement; open: boolean; onToggle: () => void }) {
    return (
        <>
            <tr className="transition hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{row.title}</td>
                <td className="px-4 py-3 text-gray-700">{row.tag}</td>
                <td className="px-4 py-3 text-gray-700">{row.created_by_name ?? <span className="italic text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(row.deleted_at)}</td>
                <td className="px-4 py-3 text-gray-700">
                    {row.reason === 'expired' ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Auto-deleted (expired)</span>
                    ) : (
                        row.removed_by ?? <span className="italic text-gray-300">—</span>
                    )}
                </td>
                <td className="px-4 py-3 text-center">
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={open}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                    >
                        {open ? (
                            <>
                                Hide <ChevronUp className="h-3.5 w-3.5" />
                            </>
                        ) : (
                            <>
                                Show <ChevronDown className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </td>
            </tr>
            {open && (
                <tr className="bg-gray-50/60">
                    <td colSpan={6} className="px-4 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{row.body}</p>
                        <p className="mt-2 text-xs text-gray-400">Announcement date: {formatDate(row.date)}</p>
                    </td>
                </tr>
            )}
        </>
    );
}
