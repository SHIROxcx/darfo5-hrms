import { Link, router } from '@inertiajs/react';
import { FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Swal from 'sweetalert2';
import { MEMO_FILE_EXTENSIONS, MEMO_FILE_MAX_MB } from '@/lib/memo-limits';
import { index as memosIndex, show, store, update } from '@/routes/admin/memos';
import type { MemoFormData } from '@/types/memo';

interface Props {
    /** The draft being edited; absent when adding a new memo. */
    memo?: MemoFormData;
}

const FILE_TYPES_MESSAGE = 'The file must be a PDF, Word document or picture (pdf, doc, docx, jpg, png).';

const cardCls = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

function toast(text: string) {
    Swal.fire({ icon: 'success', text, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });
}

/** The form for a memo: just its file. The memo is titled with the file's name and dated by the system. */
export default function MemoForm({ memo }: Props) {
    const isEdit = memo !== undefined;

    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    // The file the draft has now, which stays until a different one is chosen and saved.
    const [savedFileName, setSavedFileName] = useState(memo?.file_name ?? null);
    const shownFileName = file ? file.name : savedFileName;

    const pickFile = (chosen: File) => {
        const extension = chosen.name.split('.').pop()?.toLowerCase() ?? '';
        if (!MEMO_FILE_EXTENSIONS.includes(extension)) {
            setError(FILE_TYPES_MESSAGE);
            return;
        }
        if (chosen.size > MEMO_FILE_MAX_MB * 1024 * 1024) {
            setError(`The file must not be larger than ${MEMO_FILE_MAX_MB} MB.`);
            return;
        }
        setError('');
        setFile(chosen);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError(isEdit ? 'Choose the new file to replace the current one.' : 'Attach the memo file.');
            return;
        }

        const data = new FormData();
        data.append('file', file);
        if (isEdit) data.append('_method', 'put');

        setSaving(true);
        setError('');
        router.post(isEdit ? update(memo.id).url : store().url, data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSavedFileName(file.name);
                setFile(null);
                if (isEdit) toast('Draft saved.');
            },
            // The server names its boxes `file` and `form`; whatever it says is shown, so a refused save is never silent.
            onError: errs => setError(Object.values(errs as Record<string, string>).join(' ')),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-5">
            <section className={cardCls}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-green-800">Memo file</h2>
                <span className="mb-1 block text-xs font-medium text-gray-500">
                    {isEdit ? 'Replace the file' : 'File'} {!isEdit && <span className="text-red-500">*</span>}
                </span>
                <div className={`rounded-xl border-2 border-dashed p-4 ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                    {shownFileName ? (
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 shrink-0 text-green-600" />
                            <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{shownFileName}</span>
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
                        <Upload className="h-3.5 w-3.5" /> {shownFileName ? 'Choose a different file' : 'Choose file'}
                    </button>
                    <input ref={fileInput} type="file" className="hidden" accept={MEMO_FILE_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                        onChange={e => { const chosen = e.target.files?.[0]; e.target.value = ''; if (chosen) pickFile(chosen); }} />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                    PDF, Word document or picture, up to {MEMO_FILE_MAX_MB} MB. The memo is titled with the file&apos;s name, so name the file the way you want it to read.
                </p>
                {error && <p role="alert" className="mt-1 text-xs text-red-500">{error}</p>}
            </section>

            <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/95 px-1 py-3 backdrop-blur">
                {isEdit && (
                    <Link href={show(memo.id).url} title="Save your changes first: an unsaved file is not kept"
                        className="shrink-0 rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50">
                        Review and publish
                    </Link>
                )}
                <Link href={memosIndex().url} className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                    {isEdit ? 'Back to memos' : 'Cancel'}
                </Link>
                <button type="submit" disabled={saving}
                    className="shrink-0 cursor-pointer whitespace-nowrap rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                    {saving ? 'Saving...' : isEdit ? 'Save new file' : 'Save draft'}
                </button>
            </div>
        </form>
    );
}
