import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageLinks from '@/components/page-links';
import AppLayout from '@/layouts/app-layout';
import { formatMemoDate } from '@/lib/memo-format';
import { history as announcementHistory } from '@/routes/admin/announcements';
import { create, edit, index, show } from '@/routes/admin/memos';
import { index as signatoriesIndex } from '@/routes/admin/signatories';
import type { BreadcrumbItem } from '@/types';
import type { MemoCounts, MemoFilters, MemoRow, MemoStatus, PageLink } from '@/types/memo';
import StatusBadge from './StatusBadge';

interface Props {
    memos: { data: MemoRow[]; links: PageLink[]; total: number };
    filters: MemoFilters;
    counts: MemoCounts;
    types: string[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Memos', href: index().url }];

const TABS: { key: MemoStatus | null; label: string }[] = [
    { key: null, label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'published', label: 'Published' },
    { key: 'withdrawn', label: 'Withdrawn' },
];

export default function MemosIndex({ memos, filters, counts, types }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    // Search as you type, a moment after you stop. Nothing is sent when the box already matches the list on screen: that covers
    // the first render, and React runs effects twice in development, so a "first render" flag cannot be trusted here.
    useEffect(() => {
        const wanted = search.trim();
        if (wanted === (filters.search ?? '')) return;
        const timer = setTimeout(() => go({ search: wanted || null }), 350);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const go = (change: Partial<MemoFilters>) => {
        const next = { ...filters, ...change };
        const query = Object.fromEntries(Object.entries(next).filter(([, value]) => value));
        router.get(index().url, query, { preserveState: true, preserveScroll: true, replace: true });
    };

    const countFor = (key: MemoStatus | null) => (key === null ? counts.draft + counts.published + counts.withdrawn : counts[key]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Memos" />

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Memos</h1>
                        <p className="mt-1 text-sm text-gray-500">Write or upload official memos for employees, and keep their history.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={signatoriesIndex().url} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                            Signatories
                        </Link>
                        <Link href={announcementHistory().url} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                            Announcement history
                        </Link>
                        <Link href={create().url} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                            <Plus className="h-4 w-4" /> New Memo
                        </Link>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div role="tablist" aria-label="Memo status" className="flex flex-wrap gap-1.5">
                        {TABS.map(tab => {
                            const active = (filters.status ?? null) === tab.key;
                            return (
                                <button
                                    key={tab.label}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => go({ status: tab.key })}
                                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                        active ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {tab.label} <span className={active ? 'text-green-100' : 'text-gray-400'}>{countFor(tab.key)}</span>
                                </button>
                            );
                        })}
                    </div>

                    <select
                        aria-label="Filter by type"
                        value={filters.type ?? ''}
                        onChange={e => go({ type: e.target.value || null })}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All types</option>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by subject..."
                            aria-label="Search memos by subject"
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                                <tr>
                                    <th className="px-4 py-5 text-left">Number</th>
                                    <th className="px-4 py-5 text-left">Subject</th>
                                    <th className="px-4 py-5 text-left">Type</th>
                                    <th className="px-4 py-5 text-left">Date</th>
                                    <th className="px-4 py-5 text-left">Status</th>
                                    <th className="px-4 py-5 text-left">Made by</th>
                                    <th className="px-4 py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {memos.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center italic text-gray-400">No memos found.</td>
                                    </tr>
                                ) : (
                                    memos.data.map(memo => (
                                        <tr key={memo.id} className="transition hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">{memo.number_label ?? <span className="italic text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                <Link href={show(memo.id).url} className="hover:text-green-700 hover:underline">{memo.subject}</Link>
                                                {memo.mode === 'uploaded' && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">File</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">{memo.type}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatMemoDate(memo.memo_date)}</td>
                                            <td className="px-4 py-3"><StatusBadge status={memo.status} /></td>
                                            <td className="px-4 py-3 text-gray-700">{memo.created_by_name ?? <span className="italic text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    {memo.status === 'draft' && (
                                                        <Link href={edit(memo.id).url} title="Edit draft" aria-label={`Edit ${memo.subject}`}
                                                            className="rounded-lg p-1.5 text-green-600 transition hover:bg-green-50">
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <PageLinks links={memos.links} />
            </div>
        </AppLayout>
    );
}
