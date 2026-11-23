import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { formatMemoDate, formatMemoDateTime, formatMemoTime } from '@/lib/memo-format';
import { MEMO_MAX } from '@/lib/memo-limits';
import { destroy, edit, file, index, preview, publish, restore, show, withdraw } from '@/routes/admin/memos';
import type { BreadcrumbItem } from '@/types';
import type { MemoCan, MemoDetail, MemoEvent, MemoSignatoryDetail } from '@/types/memo';
import StatusBadge from './StatusBadge';

interface Props {
    memo: MemoDetail;
    signatories: MemoSignatoryDetail[];
    events: MemoEvent[];
    can: MemoCan;
}

function toast(text: string) {
    Swal.fire({ icon: 'success', text, toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true });
}

const secondaryBtn = 'inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60';
const primaryBtn = 'inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60';

export default function MemosShow({ memo, signatories, events, can }: Props) {
    const [busy, setBusy] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Memos', href: index().url },
        { title: memo.subject, href: show(memo.id).url },
    ];

    // One place for every action: show the server's plain messages when it refuses, a toast when it works.
    const send = (run: (options: Parameters<typeof router.post>[2]) => void, failTitle: string, done: string) => {
        setBusy(true);
        run({
            preserveScroll: true,
            onSuccess: () => toast(done),
            onError: errs => Swal.fire({ icon: 'error', title: failTitle, text: Object.values(errs).join(' '), confirmButtonColor: '#dc2626' }),
            onFinish: () => setBusy(false),
        });
    };

    const publishMemo = async () => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Publish this memo?',
            text: 'Employees are told by a bell notice and an email. After publishing it cannot be edited: to correct it, withdraw it and publish a new memo.',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Publish',
        });
        if (!result.isConfirmed) return;
        send(options => router.post(publish(memo.id).url, {}, options), 'Could not publish', 'Memo published. Employees have been notified.');
    };

    const withdrawMemo = async () => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Withdraw this memo?',
            text: 'Employees will no longer see it and its notices are removed. HR keeps it and can restore it later.',
            input: 'textarea',
            inputLabel: 'Why is it being withdrawn?',
            inputAttributes: { maxlength: String(MEMO_MAX.withdraw_reason), 'aria-label': 'Reason for withdrawing' },
            inputValidator: value => (value.trim() ? undefined : 'Please say why.'),
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Withdraw',
        });
        if (!result.isConfirmed) return;
        send(options => router.post(withdraw(memo.id).url, { reason: result.value }, options), 'Could not withdraw', 'Memo withdrawn.');
    };

    const restoreMemo = async () => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Restore this memo?',
            text: 'Employees can see it again. They are not notified a second time.',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Restore',
        });
        if (!result.isConfirmed) return;
        send(options => router.post(restore(memo.id).url, {}, options), 'Could not restore', 'Memo restored.');
    };

    const deleteDraft = async () => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete this draft?',
            text: 'Its files are removed. The history keeps a line saying it was deleted.',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
        });
        if (!result.isConfirmed) return;
        setBusy(true);
        router.delete(destroy(memo.id).url, {
            onSuccess: () => toast('Draft deleted.'),
            onError: errs => Swal.fire({ icon: 'error', title: 'Could not delete', text: Object.values(errs).join(' '), confirmButtonColor: '#dc2626' }),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={memo.subject} />

            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <Link href={index().url} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-green-700">
                    <ArrowLeft className="h-4 w-4" /> Back to memos
                </Link>

                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={memo.status} />
                            <span className="text-xs font-semibold uppercase tracking-wider text-green-700">
                                {memo.type}
                                {memo.number_label && <span className="text-gray-500"> · {memo.number_label}</span>}
                            </span>
                        </div>
                        <h1 className="mt-2 break-words text-2xl font-bold text-gray-900">{memo.subject}</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {can.edit && (
                            <Link href={edit(memo.id).url} className={secondaryBtn}>
                                <Pencil className="h-4 w-4" /> Edit
                            </Link>
                        )}
                        {memo.status === 'draft' && memo.mode === 'written' && (
                            <a href={preview(memo.id).url} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
                                <ExternalLink className="h-4 w-4" /> Preview PDF
                            </a>
                        )}
                        {memo.has_file && (
                            <a href={file(memo.id).url} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
                                <ExternalLink className="h-4 w-4" /> View file
                            </a>
                        )}
                        {can.publish && (
                            <button type="button" onClick={publishMemo} disabled={busy} className={`cursor-pointer ${primaryBtn}`}>
                                Publish
                            </button>
                        )}
                        {can.restore && (
                            <button type="button" onClick={restoreMemo} disabled={busy} className={`cursor-pointer ${primaryBtn}`}>
                                Restore
                            </button>
                        )}
                        {can.withdraw && (
                            <button type="button" onClick={withdrawMemo} disabled={busy}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                                Withdraw
                            </button>
                        )}
                        {can.delete && (
                            <button type="button" onClick={deleteDraft} disabled={busy} aria-label="Delete draft" title="Delete draft"
                                className="cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {memo.status === 'withdrawn' && (
                    <div role="status" className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                        <p className="font-semibold">Withdrawn. Employees cannot see this memo.</p>
                        {memo.withdrawn_reason && <p className="mt-0.5 break-words">Reason: {memo.withdrawn_reason}</p>}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="space-y-6">
                        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-label="Memo">
                            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                                <dt className="font-semibold text-gray-600">To:</dt>
                                <dd className="break-words text-gray-800">{memo.addressed_to}</dd>
                                <dt className="font-semibold text-gray-600">Date:</dt>
                                <dd className="text-gray-800">
                                    {formatMemoDate(memo.memo_date)}
                                    {memo.memo_time && <>, {formatMemoTime(memo.memo_time)}</>}
                                </dd>
                                {memo.reference && (
                                    <>
                                        <dt className="font-semibold text-gray-600">Reference:</dt>
                                        <dd className="break-words text-gray-800">{memo.reference}</dd>
                                    </>
                                )}
                                {memo.published_at && (
                                    <>
                                        <dt className="font-semibold text-gray-600">Published:</dt>
                                        <dd className="text-gray-800">
                                            {formatMemoDateTime(memo.published_at)}
                                            {memo.published_by_name && <> by {memo.published_by_name}</>}
                                        </dd>
                                    </>
                                )}
                                {memo.mode === 'uploaded' && (
                                    <>
                                        <dt className="font-semibold text-gray-600">File:</dt>
                                        <dd className="break-all text-gray-800">{memo.file_name ?? <span className="italic text-gray-400">None yet</span>}</dd>
                                    </>
                                )}
                            </dl>

                            {memo.body && (
                                <div className="mt-5 whitespace-pre-line break-words border-t border-gray-100 pt-5 text-sm leading-relaxed text-gray-800">
                                    {memo.body}
                                </div>
                            )}
                        </section>

                        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-label="Signatories">
                            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-600">Signatories</h2>
                            {signatories.length === 0 ? (
                                <p className="text-sm italic text-gray-400">No signatories added.</p>
                            ) : (
                                <ul className="grid gap-5 sm:grid-cols-2">
                                    {signatories.map((signatory, i) => (
                                        <li key={i} className="text-sm">
                                            {signatory.label && <p className="text-xs italic text-gray-500">{signatory.label}</p>}
                                            <p className="font-semibold text-gray-900">{signatory.name}</p>
                                            <p className="text-gray-600">{signatory.position}</p>
                                            <p className="mt-0.5 text-xs text-gray-400">{signatory.has_signature ? 'Signature picture on the memo' : 'No signature picture'}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    <section className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-label="History">
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-600">History</h2>
                        {events.length === 0 ? (
                            <p className="text-sm italic text-gray-400">No history yet.</p>
                        ) : (
                            <ol className="space-y-4 border-l-2 border-gray-100 pl-4">
                                {events.map(event => (
                                    <li key={event.id} className="relative text-sm">
                                        <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                                        <p className="break-words font-medium text-gray-800">{event.label}</p>
                                        <p className="text-xs text-gray-500">
                                            {event.user_name ?? 'System'} · {formatMemoDateTime(event.created_at)}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
