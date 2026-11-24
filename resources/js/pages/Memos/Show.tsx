import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatMemoDate } from '@/lib/memo-format';
import { index, show } from '@/routes/memos';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeMemoDetail } from '@/types/memo';

interface Props {
    memo: EmployeeMemoDetail;
    file_url: string | null;
}

export default function MemosShow({ memo, file_url }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Memos', href: index().url },
        { title: memo.subject, href: show(memo.id).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={memo.subject} />

            <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                <Link href={index().url} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-green-700">
                    <ArrowLeft className="h-4 w-4" /> Back to memos
                </Link>

                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="break-words text-2xl font-bold text-gray-900">{memo.subject}</h1>

                    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                        <dt className="font-semibold text-gray-600">Date:</dt>
                        <dd className="text-gray-800">{formatMemoDate(memo.memo_date)}</dd>
                    </dl>

                    {file_url && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
                            <a
                                href={file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                                <ExternalLink className="h-4 w-4" /> View / Download
                            </a>
                            {memo.file_name && (
                                <span className="break-all text-sm text-gray-500">{memo.file_name}</span>
                            )}
                        </div>
                    )}


                </article>
            </div>
        </AppLayout>
    );
}
