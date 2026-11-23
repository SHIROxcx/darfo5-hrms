import { Save, Plus, Trash2, Paperclip, FileText, Image as ImageIcon, X, Pencil, BookOpen, AlertCircle, ExternalLink, Bookmark, BookMarked } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import LimitedInput from '@/components/limited-input';
import { Spinner } from '@/components/ui/spinner';
import { pdsFileUrl } from '@/lib/pds-file-url';
import { PDS_MAX } from '@/lib/pds-limits';
import type { User, PdsData, PdsTraining } from '@/types/pds';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { user: User; pdsData: PdsData; onSave: (section: string, data: FormData) => void; saving: boolean; }

interface RowFile {
    file:     File | null;
    existing: string | null;
    preview:  string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY: PdsTraining = { title: '', date_from: '', date_to: '', number_of_hours: '', type_of_ld: '', conducted_by: '' };
const LD_TYPES = ['Managerial', 'Supervisory', 'Technical', 'Etc.'];

const ACCEPTED  = '.jpg,.jpeg,.png,.pdf';
const MAX_BYTES = 5 * 1024 * 1024;
const isImage = (name: string) => /\.(jpe?g|png)$/i.test(name);
const isPdf   = (name: string) => /\.pdf$/i.test(name);

// ── Validation ────────────────────────────────────────────────────────────────

type RowErrors = Partial<Record<keyof PdsTraining | 'attachment_file', string>>;

function validateRow(row: PdsTraining, rowFile: RowFile): RowErrors {
    const errs: RowErrors = {};
    if (!row.title?.trim())                          errs.title           = 'Required.';
    if (!String(row.number_of_hours ?? '').trim())   errs.number_of_hours = 'Required.';
    if (!row.type_of_ld?.trim())                     errs.type_of_ld      = 'Required.';
    if (!row.conducted_by?.trim())                   errs.conducted_by    = 'Required.';
    if (!rowFile?.file && !rowFile?.existing)         errs.attachment_file = 'Please attach a supporting document.';
    return errs;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

const buildFormData = (rows: PdsTraining[], files: RowFile[]) => {
    const fd = new FormData();
    if (rows.length === 0) {
        fd.append('trainings[]', ''); // empty array signal for Laravel
    } else {
        rows.forEach((row, i) => {
            fd.append(`trainings[${i}][title]`,           row.title           ?? '');
            fd.append(`trainings[${i}][date_from]`,       row.date_from       ?? '');
            fd.append(`trainings[${i}][date_to]`,         row.date_to         ?? '');
            fd.append(`trainings[${i}][number_of_hours]`, String(row.number_of_hours ?? ''));
            fd.append(`trainings[${i}][type_of_ld]`,      row.type_of_ld      ?? '');
            fd.append(`trainings[${i}][conducted_by]`,    row.conducted_by    ?? '');
            const rf = files[i];
            if (rf?.file)          fd.append(`attachments[${i}]`,          rf.file);
            else if (rf?.existing) fd.append(`existing_attachments[${i}]`, rf.existing);
        });
    }
    return fd;
};

// ── Attachment Field ──────────────────────────────────────────────────────────

function AttachmentField({ rowFile, onChange, error }:
    { rowFile: RowFile; onChange: (rf: RowFile) => void; error?: string; }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [sizeError, setSizeError] = useState('');

    const hasFile = !!rowFile.file, hasExisting = !!rowFile.existing, hasAny = hasFile || hasExisting;
    const label = hasFile ? rowFile.file!.name : hasExisting ? rowFile.existing!.split('/').pop() ?? 'Attachment' : null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_BYTES) { setSizeError('File must be under 5 MB.'); return; }
        setSizeError('');
        const preview = URL.createObjectURL(f);
        if (rowFile.preview) URL.revokeObjectURL(rowFile.preview);
        onChange({ file: f, existing: rowFile.existing, preview });
        e.target.value = '';
    };

    const handleClear = () => {
        if (rowFile.preview) URL.revokeObjectURL(rowFile.preview);
        onChange({ file: null, existing: null, preview: null });
        setSizeError('');
    };

    const existingUrl = hasExisting ? pdsFileUrl(rowFile.existing) : null;
    const viewUrl     = rowFile.preview ?? existingUrl;
    const previewSrc  = viewUrl && label && isImage(label) ? viewUrl : null;

    return (
        <div className="flex flex-col gap-1">
            <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleChange} />

            {hasAny ? (
                <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 ${
                    error ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}>
                    {previewSrc ? (
                        <a href={viewUrl!} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img src={previewSrc} alt="preview" className="w-8 h-8 rounded object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                    ) : viewUrl ? (
                        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                            className={`shrink-0 transition-colors ${label && isPdf(label) ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-green-600'}`}>
                            <FileText className="w-5 h-5" />
                        </a>
                    ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                    <a href={viewUrl ?? '#'} target={viewUrl ? '_blank' : undefined} rel="noopener noreferrer"
                        className="text-xs text-gray-600 truncate flex-1 hover:text-green-700 hover:underline transition-colors" title={label ?? ''}>
                        {label}
                    </a>
                    <div className="flex items-center gap-1 shrink-0">
                        <button type="button" title="Replace file" onClick={() => fileRef.current?.click()}
                            className="text-gray-400 hover:text-green-600 p-1 rounded transition-colors cursor-pointer">
                            <Paperclip className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" title="Remove attachment" onClick={handleClear}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                    className={`flex items-center gap-2 border border-dashed rounded-lg px-3 py-3 text-sm transition-colors cursor-pointer w-full ${
                        error
                            ? 'border-red-400 text-red-400 bg-red-50 hover:border-red-500'
                            : 'border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50'
                    }`}>
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span>Attach supporting document</span>
                </button>
            )}

            {(sizeError || error) && (
                <p className="text-xs text-red-500 leading-tight flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />{sizeError || error}
                </p>
            )}
            <p className="text-[10px] text-gray-400">PNG, JPEG, or PDF · Max 5 MB</p>
        </div>
    );
}

// ── Training Modal ────────────────────────────────────────────────────────────

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    draft: PdsTraining;
    draftFile: RowFile;
    errors: RowErrors;
    submitted: boolean;
    onFieldChange: (k: keyof PdsTraining, v: string) => void;
    onFileChange: (rf: RowFile) => void;
    onSubmit: () => void;
    saving: boolean;
}

function TrainingModal({ open, onClose, title, draft, draftFile, errors, onFieldChange, onFileChange, onSubmit, saving }: ModalProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const base = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors";
    const ok   = `${base} border-gray-200 focus:ring-green-500`;
    const err  = `${base} border-red-400 focus:ring-red-400 bg-red-50`;
    const ic   = (k: keyof PdsTraining) => errors[k] ? err : ok;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button type="button" onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Title of Training / Intervention <span className="text-red-500">*</span>
                        </label>
                        <LimitedInput maxLength={PDS_MAX.title} value={draft.title ?? ''} className={ic('title')}
                            placeholder="Write title in full"
                            onChange={e => onFieldChange('title', e.target.value)} />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Date From & Date To */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
                            <input type="date" value={draft.date_from ?? ''} className={ic('date_from')}
                                onChange={e => onFieldChange('date_from', e.target.value)} />
                            {errors.date_from && <p className="mt-1 text-xs text-red-500">{errors.date_from}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
                            <input type="date" value={draft.date_to ?? ''} className={ic('date_to')}
                                onChange={e => onFieldChange('date_to', e.target.value)} />
                            {errors.date_to && <p className="mt-1 text-xs text-red-500">{errors.date_to}</p>}
                        </div>
                    </div>

                    {/* Hours & Type of L&D */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Number of Hours <span className="text-red-500">*</span>
                            </label>
                            <input type="number" value={draft.number_of_hours as string ?? ''} className={ic('number_of_hours')}
                                placeholder="e.g. 40"
                                onChange={e => onFieldChange('number_of_hours', e.target.value)} />
                            {errors.number_of_hours && <p className="mt-1 text-xs text-red-500">{errors.number_of_hours}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Type of L&D <span className="text-red-500">*</span>
                            </label>
                            <select value={draft.type_of_ld ?? ''} className={ic('type_of_ld')}
                                onChange={e => onFieldChange('type_of_ld', e.target.value)}>
                                <option value="">Select type</option>
                                {LD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {errors.type_of_ld && <p className="mt-1 text-xs text-red-500">{errors.type_of_ld}</p>}
                        </div>
                    </div>

                    {/* Conducted By */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Conducted / Sponsored By <span className="text-red-500">*</span>
                        </label>
                        <LimitedInput maxLength={PDS_MAX.conducted_by} value={draft.conducted_by ?? ''} className={ic('conducted_by')}
                            placeholder="Institution or organization name"
                            onChange={e => onFieldChange('conducted_by', e.target.value)} />
                        {errors.conducted_by && <p className="mt-1 text-xs text-red-500">{errors.conducted_by}</p>}
                    </div>

                    {/* Attachment */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Attachment <span className="text-red-500">*</span>
                        </label>
                        <AttachmentField
                            rowFile={draftFile}
                            onChange={onFileChange}
                            error={errors.attachment_file}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex justify-end gap-2">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button type="button" onClick={onSubmit} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                        {saving ? <><Spinner />Saving…</> : <><Save className="w-4 h-4" />Save</>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Training Card ─────────────────────────────────────────────────────────────

interface CardProps {
    row: PdsTraining & { attachment?: string };
    rowFile: RowFile;
    onEdit: () => void;
    onDelete: () => void;
}

function TrainingCard({ row, rowFile, onEdit, onDelete }: CardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const btnRef  = useRef<HTMLButtonElement>(null);

    const hasFile     = !!rowFile.file;
    const hasExisting = !!rowFile.existing;
    const label = hasFile
        ? rowFile.file!.name
        : hasExisting
            ? rowFile.existing!.split('/').pop() ?? 'Attachment'
            : null;
    const viewUrl     = rowFile.preview ?? (hasExisting ? pdsFileUrl(rowFile.existing) : null);

    const dateRange = row.date_from || row.date_to
        ? `${formatDate(row.date_from) ?? '—'} – ${formatDate(row.date_to) ?? '—'}`
        : null;

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
                setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    return (
        <div className="flex items-stretch gap-3 p-4 transition-colors overflow-hidden">
            {/* Icon */}
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
                <BookMarked className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {row.title || <span className="text-gray-400 italic">No training title</span>}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">{row.conducted_by}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {row.type_of_ld && <span>{row.type_of_ld}</span>}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {dateRange && <span>{dateRange}</span>}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {row.number_of_hours && (
                        <span className="text-green-600 font-medium">{row.number_of_hours} hours</span>
                    )}
                </p>

                {label && viewUrl && (
                    <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-700 font-medium border border-green-200 hover:bg-green-50 hover:border-green-300 px-2.5 py-1 rounded-lg transition-colors">
                        Show Credentials <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>

            {/* Ellipsis menu */}
            <div className="relative shrink-0">
                <button ref={btnRef} type="button" onClick={() => setMenuOpen(prev => !prev)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        menuOpen ? 'bg-green-50 text-green-700' : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="4" cy="10" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="16" cy="10" r="1.5" />
                    </svg>
                </button>

                {menuOpen && (
                    <div ref={menuRef} className="absolute right-0 top-5 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                        <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-green-700 hover:bg-gray-50 transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />Edit
                        </button>
                        <button type="button" onClick={() => { setMenuOpen(false); onDelete(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-gray-50 hover:text-red-700 transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ModalMode = { type: 'add' } | { type: 'edit'; index: number };

export default function TrainingSection({ pdsData, onSave, saving }: Props) {
    const initialRows = pdsData.trainings?.length ? pdsData.trainings : [];

    const [rows,     setRows]     = useState<PdsTraining[]>(initialRows);
    const [rowFiles, setRowFiles] = useState<RowFile[]>(
        initialRows.map(row => ({
            file:     null,
            existing: (row as PdsTraining & { attachment?: string }).attachment ?? null,
            preview:  null,
        }))
    );

    // Sync from server after save
    const trainingKey = JSON.stringify(
        (pdsData.trainings ?? []).map((e: PdsTraining & { id?: number; attachment?: string }) => ({ id: e.id, attachment: e.attachment }))
    );
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        const fresh = pdsData.trainings?.length ? pdsData.trainings : [];
        setRows(fresh);
        setRowFiles(prev => fresh.map((row: PdsTraining & { attachment?: string }, i: number) => {
            if (prev[i]?.preview) URL.revokeObjectURL(prev[i].preview!);
            return { file: null, existing: row.attachment ?? null, preview: null };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trainingKey]);

    useEffect(() => {
        return () => { rowFiles.forEach(rf => { if (rf.preview) URL.revokeObjectURL(rf.preview); }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Modal state ───────────────────────────────────────────────────────────

    const [modal,       setModal]       = useState<ModalMode | null>(null);
    const [draft,       setDraft]       = useState<PdsTraining>({ ...EMPTY });
    const [draftFile,   setDraftFile]   = useState<RowFile>({ file: null, existing: null, preview: null });
    const [draftErrors, setDraftErrors] = useState<RowErrors>({});
    const [submitted,   setSubmitted]   = useState(false);

    const openAdd = () => {
        setDraft({ ...EMPTY });
        setDraftFile({ file: null, existing: null, preview: null });
        setDraftErrors({});
        setSubmitted(false);
        setModal({ type: 'add' });
    };

    const openEdit = (index: number) => {
        setDraft({ ...rows[index] });
        setDraftFile({ ...rowFiles[index] });
        setDraftErrors({});
        setSubmitted(false);
        setModal({ type: 'edit', index });
    };

    const closeModal = () => { setModal(null); setDraftErrors({}); setSubmitted(false); };

    const handleFieldChange = (k: keyof PdsTraining, v: string) => {
        setDraft(prev => ({ ...prev, [k]: v }));
        if (submitted) setDraftErrors(prev => ({ ...prev, [k]: undefined }));
    };

    const handleFileChange = (rf: RowFile) => {
        setDraftFile(rf);
        if (submitted && (rf.file || rf.existing))
            setDraftErrors(prev => ({ ...prev, attachment_file: undefined }));
    };

    const handleModalSubmit = () => {
        setSubmitted(true);
        const errs = validateRow(draft, draftFile);
        if (Object.keys(errs).length > 0) { setDraftErrors(errs); return; }

        let nextRows: PdsTraining[];
        let nextFiles: RowFile[];

        if (modal?.type === 'add') {
            nextRows  = [...rows, draft];
            nextFiles = [...rowFiles, draftFile];
        } else if (modal?.type === 'edit') {
            const idx = modal.index;
            if (rowFiles[idx]?.preview && rowFiles[idx].preview !== draftFile.preview)
                URL.revokeObjectURL(rowFiles[idx].preview!);
            nextRows  = rows.map((r, i) => i === idx ? draft : r);
            nextFiles = rowFiles.map((f, i) => i === idx ? draftFile : f);
        } else { return; }

        setRows(nextRows);
        setRowFiles(nextFiles);
        closeModal();
        onSave('trainings', buildFormData(nextRows, nextFiles));
    };

    const handleDelete = async (index: number) => {
        const label = rows[index]?.title?.trim() || 'this training';

        const result = await Swal.fire({
            title: 'Delete Training?',
            html: `<span class="text-sm text-gray-600">This will permanently remove <strong>${label}</strong> from your record.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            focusCancel: true,
            customClass: {
                popup: '!rounded-2xl !shadow-xl',
                title: '!text-base !font-semibold !text-gray-800',
                confirmButton: '!rounded-lg !text-sm !font-medium !px-4 !py-2',
                cancelButton: '!rounded-lg !text-sm !font-medium !px-4 !py-2',
            },
        });

        if (!result.isConfirmed) return;

        if (rowFiles[index]?.preview) URL.revokeObjectURL(rowFiles[index].preview!);
        const nextRows  = rows.filter((_, i) => i !== index);
        const nextFiles = rowFiles.filter((_, i) => i !== index);
        setRows(nextRows);
        setRowFiles(nextFiles);
        onSave('trainings', buildFormData(nextRows, nextFiles));
    };

    return (
        <div className="space-y-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-base font-semibold text-green-800 uppercase">VI. Learning & Development Interventions</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Training programs attended. Write titles in full.</p>
                </div>
                <button type="button" onClick={openAdd}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-3">
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            {/* List */}
            {rows.length === 0 ? (
                <div onClick={openAdd}
                    className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50/50 transition-colors cursor-pointer">
                    <BookOpen className="w-8 h-8" />
                    <p className="text-sm font-medium">Add a training or L&D intervention</p>
                    <p className="text-xs">Click to get started</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                    {rows.map((row, i) => (
                        <TrainingCard
                            key={i}
                            row={row as PdsTraining & { attachment?: string }}
                            rowFile={rowFiles[i] ?? { file: null, existing: null, preview: null }}
                            onEdit={() => openEdit(i)}
                            onDelete={() => handleDelete(i)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <TrainingModal
                open={modal !== null}
                onClose={closeModal}
                title={modal?.type === 'edit' ? 'Edit Training / Intervention' : 'Add Training / Intervention'}
                draft={draft}
                draftFile={draftFile}
                errors={draftErrors}
                submitted={submitted}
                onFieldChange={handleFieldChange}
                onFileChange={handleFileChange}
                onSubmit={handleModalSubmit}
                saving={saving}
            />
        </div>
    );
}