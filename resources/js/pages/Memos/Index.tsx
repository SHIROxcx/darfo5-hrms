import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageLinks from '@/components/page-links';
import AppLayout from '@/layouts/app-layout';
import { formatMemoDate, formatMemoTime } from '@/lib/memo-format';
import { index, show } from '@/routes/memos';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeMemoFilters, EmployeeMemoRow, PageLink } from '@/types/memo';

interface Props {
    memos: { data: EmployeeMemoRow[]; links: PageLink[]; total: number };
    filters: EmployeeMemoFilters;
    years: number[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Memos', href: index().url }];

export default function MemosIndex({ memos, filters, years }: Props) {
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

    const go = (change: Partial<EmployeeMemoFilters>) => {
        const next = { ...filters, ...change };
        const query = Object.fromEntries(Object.entries(next).filter(([, value]) => value));
        router.get(index().url, query, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Memos" />

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Memos</h1>
                    <p className="mt-1 text-sm text-gray-500">Official memos and memorandum circulars from HR.</p>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <select
                        aria-label="Filter by year"
                        value={filters.year ?? ''}
                        onChange={e => go({ year: e.target.value ? Number(e.target.value) : null })}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All years</option>
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {memos.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center italic text-gray-400">No memos found.</td>
                                    </tr>
                                ) : (
                                    memos.data.map(memo => (
                                        <tr key={memo.id} className="transition hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">{memo.number_label ?? <span className="italic text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3">
                                                <Link href={show(memo.id).url} className="font-medium text-gray-800 hover:text-green-700 hover:underline">
                                                    {memo.subject}
                                                </Link>
                                                <p className="mt-0.5 text-xs text-gray-500">To: {memo.addressed_to}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">{memo.type}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                {formatMemoDate(memo.memo_date)}
                                                {memo.memo_time && <span className="text-gray-400">, {formatMemoTime(memo.memo_time)}</span>}
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
