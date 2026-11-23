import { Link, router } from '@inertiajs/react';
import { FileText, PenLine, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Swal from 'sweetalert2';
import LimitedInput, { CharCounter, useFocusTracking } from '@/components/limited-input';
import { MEMO_FILE_EXTENSIONS, MEMO_FILE_MAX_MB, MEMO_MAX } from '@/lib/memo-limits';
import { index as memosIndex, show, store, update } from '@/routes/admin/memos';
import type { MemoFormData, MemoMode, PickableSignatory, PickedSignatory } from '@/types/memo';
import SignatoryPicker from './SignatoryPicker';

interface Props {
    /** The draft being edited; absent when writing a new memo. */
    memo?: MemoFormData;
    types: string[];
    signatories: PickableSignatory[];
    /** Starting values for a new memo. */
    defaults?: { addressed_to: string; memo_date: string };
}

const FILE_TYPES_MESSAGE = 'The file must be a PDF, Word document or picture (pdf, doc, docx, jpg, png).';

const labelCls = 'mb-1 block text-xs font-medium text-gray-500';
const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600';
const errorInputCls = 'w-full rounded-lg border border-red-400 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-400';
const cardCls = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

// The server names its boxes type, subject, memo_date and so on, and signatories.N.signatory_id for a row. Anything it says
// that has no spot of its own goes to `form`, shown beside the Save button, so a refused save is never silent.
function readErrors(errs: Record<string, string>): Record<string, string> {
    const spots = ['type', 'subject', 'addressed_to', 'memo_date', 'memo_time', 'mode', 'body', 'reference', 'file', 'signatories'];
    const out: Record<string, string> = {};
    const add = (spot: string, message: string) => {
        if (!out[spot]) out[spot] = message;
        else if (!out[spot].includes(message)) out[spot] += ` ${message}`;
    };

    for (const [key, message] of Object.entries(errs)) {
        const row = key.match(/^signatories\.(\d+)\./);
        if (row) add(`signatory_${row[1]}`, message);
        else add(spots.includes(key) ? key : 'form', message);
    }
    return out;
}

function toast(text: string) {
    Swal.fire({ icon: 'success', text, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });
}

/** The form for writing or uploading a memo, as a draft. Used by the Create and Edit pages. */
export default function MemoForm({ memo, types, signatories, defaults }: Props) {
    const isEdit = memo !== undefined;

    const [type, setType] = useState(memo?.type ?? types[0] ?? '');
    const [subject, setSubject] = useState(memo?.subject ?? '');
    const [addressedTo, setAddressedTo] = useState(memo?.addressed_to ?? defaults?.addressed_to ?? '');
    const [memoDate, setMemoDate] = useState(memo?.memo_date ?? defaults?.memo_date ?? '');
    const [memoTime, setMemoTime] = useState(memo?.memo_time ?? '');
    const [mode, setMode] = useState<MemoMode>(memo?.mode ?? 'written');
    const [body, setBody] = useState(memo?.body ?? '');
    const [reference, setReference] = useState(memo?.reference ?? '');
    const [file, setFile] = useState<File | null>(null);
    const [picked, setPicked] = useState<PickedSignatory[]>((memo?.signatories ?? []).map(row => ({ signatory_id: row.signatory_id, label: row.label ?? '' })));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const bodyFocus = useFocusTracking();

    const clear = (...keys: string[]) => setErrors(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !keys.includes(k))));

    const pickFile = (chosen: File) => {
        const extension = chosen.name.split('.').pop()?.toLowerCase() ?? '';
        if (!MEMO_FILE_EXTENSIONS.includes(extension)) {
            setErrors(prev => ({ ...prev, file: FILE_TYPES_MESSAGE }));
            return;
        }
        if (chosen.size > MEMO_FILE_MAX_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, file: `The file must not be larger than ${MEMO_FILE_MAX_MB} MB.` }));
            return;
        }
        clear('file');
        setFile(chosen);
    };

    const validate = (): Record<string, string> => {
        const found: Record<string, string> = {};
        if (!subject.trim()) found.subject = 'Subject is required.';
        if (!memoDate) found.memo_date = 'Date is required.';
        if (mode === 'written' && !body.trim()) found.body = 'Write the memo, or switch to uploading a file.';
        if (mode === 'uploaded' && !file && !memo?.file_name) found.file = 'Attach the memo file.';
        return found;
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const found = validate();
        if (Object.keys(found).length) {
            setErrors(found);
            return;
        }

        const data = new FormData();
        data.append('type', type);
        data.append('subject', subject.trim());
        data.append('addressed_to', addressedTo.trim());
        data.append('memo_date', memoDate);
        if (memoTime) data.append('memo_time', memoTime);
        data.append('mode', mode);
        if (mode === 'written') {
            data.append('body', body);
        } else {
            if (reference.trim()) data.append('reference', reference.trim());
            if (file) data.append('file', file);
        }
        picked.forEach((row, i) => {
            data.append(`signatories[${i}][signatory_id]`, String(row.signatory_id));
            data.append(`signatories[${i}][label]`, row.label);
        });
        if (isEdit) data.append('_method', 'put');

        setSaving(true);
        setErrors({});
        router.post(isEdit ? update(memo.id).url : store().url, data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setFile(null);
                if (isEdit) toast('Draft saved.');
            },
            onError: errs => setErrors(readErrors(errs as Record<string, string>)),
            onFinish: () => setSaving(false),
        });
    };

    const rowErrors: Record<number, string> = {};
    picked.forEach((_, i) => {
        if (errors[`signatory_${i}`]) rowErrors[i] = errors[`signatory_${i}`];
    });

    const modeButton = (value: MemoMode, label: string, Icon: typeof PenLine) => (
        <button
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => { setMode(value); clear('body', 'file'); }}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                mode === value ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
        >
            <Icon className="h-4 w-4" /> {label}
        </button>
    );

    return (
        <form onSubmit={submit} noValidate className="space-y-5">
            <section className={cardCls}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-green-800">Memo details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="memo-type" className={labelCls}>Type</label>
                        <select id="memo-type" value={type} onChange={e => { setType(e.target.value); clear('type'); }} className={errors.type ? errorInputCls : inputCls}>
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="memo-date" className={labelCls}>Date <span className="text-red-500">*</span></label>
                            <input id="memo-date" type="date" value={memoDate} onChange={e => { setMemoDate(e.target.value); clear('memo_date'); }} className={errors.memo_date ? errorInputCls : inputCls} />
                            {errors.memo_date && <p className="mt-1 text-xs text-red-500">{errors.memo_date}</p>}
                        </div>
                        <div>
                            <label htmlFor="memo-time" className={labelCls}>Time <span className="font-normal text-gray-400">(optional)</span></label>
                            <input id="memo-time" type="time" value={memoTime} onChange={e => { setMemoTime(e.target.value); clear('memo_time'); }} className={errors.memo_time ? errorInputCls : inputCls} />
                            {errors.memo_time && <p className="mt-1 text-xs text-red-500">{errors.memo_time}</p>}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="memo-subject" className={labelCls}>Subject <span className="text-red-500">*</span></label>
                        <LimitedInput id="memo-subject" maxLength={MEMO_MAX.subject} value={subject} placeholder="e.g. Submission of IPCR for the first semester"
                            onChange={e => { setSubject(e.target.value); clear('subject'); }} className={errors.subject ? errorInputCls : inputCls} />
                        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="memo-to" className={labelCls}>To (addressed to)</label>
                        <LimitedInput id="memo-to" maxLength={MEMO_MAX.addressed_to} value={addressedTo} placeholder="All DA RFO 5 Employees"
                            onChange={e => { setAddressedTo(e.target.value); clear('addressed_to'); }} className={errors.addressed_to ? errorInputCls : inputCls} />
                        {errors.addressed_to && <p className="mt-1 text-xs text-red-500">{errors.addressed_to}</p>}
                    </div>
                </div>
            </section>

            <section className={cardCls}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-green-800">Content</h2>
                <div role="radiogroup" aria-label="How the memo is made" className="mb-4 flex gap-3">
                    {modeButton('written', 'Write it here', PenLine)}
                    {modeButton('uploaded', 'Upload a file', Upload)}
                </div>
                {errors.mode && <p className="mb-3 text-xs text-red-500">{errors.mode}</p>}

                {mode === 'written' ? (
                    <div>
                        <label htmlFor="memo-body" className={labelCls}>Memo text <span className="text-red-500">*</span></label>
                        <textarea
                            id="memo-body"
                            rows={14}
                            maxLength={MEMO_MAX.body}
                            value={body}
                            onChange={e => { setBody(e.target.value); clear('body'); }}
                            {...bodyFocus.focusProps}
                            placeholder="Write the memo here. Blank lines make new paragraphs."
                            className={`${errors.body ? errorInputCls : inputCls} resize-y leading-relaxed`}
                        />
                        <CharCounter length={body.length} max={MEMO_MAX.body} focused={bodyFocus.focused} />
                        {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <span className={labelCls}>Memo file <span className="text-red-500">*</span></span>
                            <div className={`rounded-xl border-2 border-dashed p-4 ${errors.file ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                                {file || memo?.file_name ? (
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 shrink-0 text-green-600" />
                                        <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{file ? file.name : memo?.file_name}</span>
                                        {file && (
                                            <button type="button" onClick={() => setFile(null)} aria-label="Remove the chosen file" className="cursor-pointer text-gray-400 hover:text-gray-600">
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No file chosen yet.</p>
                                )}
                                <button type="button" onClick={() => fileInput.current?.click()}
                                    className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50">
                                    <Upload className="h-3.5 w-3.5" /> {file || memo?.file_name ? 'Choose a different file' : 'Choose file'}
                                </button>
                                <input ref={fileInput} type="file" className="hidden" accept={MEMO_FILE_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                                    onChange={e => { const chosen = e.target.files?.[0]; e.target.value = ''; if (chosen) pickFile(chosen); }} />
                            </div>
                            <p className="mt-1 text-[10px] text-gray-400">PDF, Word document or picture, up to {MEMO_FILE_MAX_MB} MB.</p>
                            {errors.file && <p role="alert" className="mt-1 text-xs text-red-500">{errors.file}</p>}
                        </div>
                        <div>
                            <label htmlFor="memo-reference" className={labelCls}>Memo number on the file <span className="font-normal text-gray-400">(optional)</span></label>
                            <LimitedInput id="memo-reference" maxLength={MEMO_MAX.reference} value={reference} placeholder="e.g. MC No. 58, s. 2026"
                                onChange={e => { setReference(e.target.value); clear('reference'); }} className={errors.reference ? errorInputCls : inputCls} />
                            {errors.reference && <p className="mt-1 text-xs text-red-500">{errors.reference}</p>}
                        </div>
                    </div>
                )}
            </section>

            <section className={cardCls}>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-green-800">Signatories</h2>
                <p className="mb-4 text-xs text-gray-500">
                    {mode === 'written'
                        ? 'They print under the memo, in this order. Their name, position and signature picture are copied when you publish, so the memo never changes later.'
                        : 'Optional for an uploaded memo, since the file already carries its signatures.'}
                </p>
                <SignatoryPicker available={signatories} value={picked} onChange={next => { setPicked(next); clear('signatories', ...next.map((_, i) => `signatory_${i}`)); }}
                    rowErrors={rowErrors} listError={errors.signatories} />
            </section>

            <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/95 px-1 py-3 backdrop-blur">
                {errors.form && <p role="alert" className="mr-auto min-w-0 text-xs text-red-500">{errors.form}</p>}
                {isEdit && (
                    <Link href={show(memo.id).url} title="Save your changes first: unsaved edits are not kept"
                        className="shrink-0 rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50">
                        Review and publish
                    </Link>
                )}
                <Link href={memosIndex().url} className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                    {isEdit ? 'Back to memos' : 'Cancel'}
                </Link>
                <button type="submit" disabled={saving}
                    className="shrink-0 cursor-pointer whitespace-nowrap rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save draft'}
                </button>
            </div>
        </form>
    );
}
