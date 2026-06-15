import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, Plus, Trash2, Pencil, X, HeartHandshake, Paperclip, FileText, Image as ImageIcon, AlertCircle, ExternalLink } from 'lucide-react';
import type { User, PdsData, PdsVoluntaryWork } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';
import Swal from 'sweetalert2';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { user: User; pdsData: PdsData; onSave: (section: string, data: FormData) => void; saving: boolean; }

interface RowFile {
    file:     File | null;
    existing: string | null;
    preview:  string | null;
}

interface VoluntaryWorkEntry extends PdsVoluntaryWork {
    attachment?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY: VoluntaryWorkEntry = {
    organization_name: '', organization_address: '',
    date_from: '', date_to: '', number_of_hours: '', position: '',
};

const EMPTY_FILE: RowFile = { file: null, existing: null, preview: null };

const ACCEPTED  = '.jpg,.jpeg,.png,.pdf';
const MAX_BYTES = 5 * 1024 * 1024;
const isImage   = (name: string) => /\.(jpe?g|png)$/i.test(name);
const isPdf     = (name: string) => /\.pdf$/i.test(name);

// ── Validation ────────────────────────────────────────────────────────────────

type RowErrors = Partial<Record<keyof VoluntaryWorkEntry | 'attachment_file', string>>;

function validateRow(row: VoluntaryWorkEntry, rowFile: RowFile): RowErrors {
    const errs: RowErrors = {};
    if (!row.organization_name?.trim())    errs.organization_name    = 'Required.';
    if (!row.organization_address?.trim()) errs.organization_address = 'Required.';
    if (!row.date_from?.trim())            errs.date_from            = 'Required.';
    if (!row.date_to?.trim())              errs.date_to              = 'Required.';
    if (!row.position?.trim())             errs.position             = 'Required.';
    // attachment is optional — no check
    return errs;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

const buildFormData = (rows: VoluntaryWorkEntry[], files: RowFile[]) => {
    const fd = new FormData();
    rows.forEach((row, i) => {
        fd.append(`voluntary_work[${i}][organization_name]`,    row.organization_name    ?? '');
        fd.append(`voluntary_work[${i}][organization_address]`, row.organization_address ?? '');
        fd.append(`voluntary_work[${i}][date_from]`,            row.date_from            ?? '');
        fd.append(`voluntary_work[${i}][date_to]`,              row.date_to              ?? '');
        fd.append(`voluntary_work[${i}][number_of_hours]`,      String(row.number_of_hours ?? ''));
        fd.append(`voluntary_work[${i}][position]`,             row.position             ?? '');
        const rf = files[i];
        if (rf?.file)          fd.append(`attachments[${i}]`,          rf.file);
        else if (rf?.existing) fd.append(`existing_attachments[${i}]`, rf.existing);
    });
    return fd;
};

// ── Attachment Field ──────────────────────────────────────────────────────────

interface AttachmentFieldProps {
    rowFile:      RowFile;
    onChange:     (rf: RowFile) => void;
    storageBase?: string;
    error?:       string;
    optional?:    boolean;
}

function AttachmentField({ rowFile, onChange, storageBase = '/storage', error, optional = false }: AttachmentFieldProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [sizeError, setSizeError] = useState('');

    const hasFile     = !!rowFile.file;
    const hasExisting = !!rowFile.existing;
    const hasAny      = hasFile || hasExisting;

    const label = hasFile
        ? rowFile.file!.name
        : hasExisting
            ? rowFile.existing!.split('/').pop() ?? 'Attachment'
            : null;

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

    const existingUrl = hasExisting ? `${storageBase}/${rowFile.existing}` : null;
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
                        className="text-xs text-gray-600 truncate flex-1 hover:text-green-700 hover:underline transition-colors"
                        title={label ?? ''}>
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
                    <span>Attach supporting document{optional ? <span className="text-xs text-gray-400 ml-1 upper">(optional)</span> : ''}</span>
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

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
    open:          boolean;
    onClose:       () => void;
    title:         string;
    draft:         VoluntaryWorkEntry;
    draftFile:     RowFile;
    errors:        RowErrors;
    onFieldChange: (k: keyof VoluntaryWorkEntry, v: string) => void;
    onFileChange:  (rf: RowFile) => void;
    onSubmit:      () => void;
    saving:        boolean;
}

function VoluntaryWorkModal({ open, onClose, title, draft, draftFile, errors, onFieldChange, onFileChange, onSubmit, saving }: ModalProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const base = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors";
    const ok   = `${base} border-gray-200 focus:ring-green-500`;
    const err  = `${base} border-red-400 focus:ring-red-400 bg-red-50`;
    const ic   = (k: keyof VoluntaryWorkEntry) => errors[k] ? err : ok;

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

                    {/* Organization Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.organization_name ?? ''} className={ic('organization_name')}
                            placeholder="Write organization name in full"
                            onChange={e => onFieldChange('organization_name', e.target.value)} />
                        {errors.organization_name && <p className="mt-1 text-xs text-red-500">{errors.organization_name}</p>}
                    </div>

                    {/* Organization Address */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Organization Address <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.organization_address ?? ''} className={ic('organization_address')}
                            placeholder="Write address in full"
                            onChange={e => onFieldChange('organization_address', e.target.value)} />
                        {errors.organization_address && <p className="mt-1 text-xs text-red-500">{errors.organization_address}</p>}
                    </div>

                    {/* Date From & Date To */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Date From <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={draft.date_from ?? ''} className={ic('date_from')}
                                onChange={e => onFieldChange('date_from', e.target.value)} />
                            {errors.date_from && <p className="mt-1 text-xs text-red-500">{errors.date_from}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Date To <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={draft.date_to ?? ''} className={ic('date_to')}
                                onChange={e => onFieldChange('date_to', e.target.value)} />
                            {errors.date_to && <p className="mt-1 text-xs text-red-500">{errors.date_to}</p>}
                        </div>
                    </div>

                    {/* Number of Hours */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">Number of Hours</label>
                        <input type="number" value={draft.number_of_hours as string ?? ''} className={ok}
                            placeholder="e.g. 40"
                            onChange={e => onFieldChange('number_of_hours', e.target.value)} />
                    </div>

                    {/* Position / Nature of Work */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Position / Nature of Work <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.position ?? ''} className={ic('position')}
                            placeholder="e.g. Volunteer Coordinator"
                            onChange={e => onFieldChange('position', e.target.value)} />
                        {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position}</p>}
                    </div>

                    {/* Attachment — optional */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Attachment <span className="normal-case text-gray-400 font-normal text-xs">(optional)</span>
                        </label>
                        <AttachmentField
                            rowFile={draftFile}
                            onChange={onFileChange}
                            optional
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

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
    row:         VoluntaryWorkEntry;
    rowFile:     RowFile;
    onEdit:      () => void;
    onDelete:    () => void;
    storageBase?: string;
}

function VoluntaryWorkCard({ row, rowFile, onEdit, onDelete, storageBase = '/storage' }: CardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const btnRef  = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
                setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const dateRange = row.date_from || row.date_to
        ? `${formatDate(row.date_from) ?? '—'} – ${formatDate(row.date_to) ?? '—'}`
        : null;

    const hasFile     = !!rowFile.file;
    const hasExisting = !!rowFile.existing;
    const label       = hasFile
        ? rowFile.file!.name
        : hasExisting
            ? rowFile.existing!.split('/').pop() ?? 'Attachment'
            : null;
    const viewUrl = rowFile.preview ?? (hasExisting ? `${storageBase}/${rowFile.existing}` : null);

    return (
        <div className="flex items-stretch gap-3 p-4 transition-colors overflow-hidden">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white mt-0.5">
                <HeartHandshake className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {row.organization_name || <span className="text-gray-400 italic">No organization</span>}
                </p>
                {row.position && <p className="text-xs text-gray-600 mt-0.5">{row.position}</p>}
                {row.organization_address && <p className="text-xs text-gray-400 mt-0.5 truncate">{row.organization_address}</p>}
                {dateRange && <p className="text-xs text-gray-400 mt-0.5">{dateRange}</p>}
                {row.number_of_hours && <p className="text-xs text-gray-500 mt-0.5">{row.number_of_hours} hrs</p>}

                {/* Attachment badge */}
                {label && viewUrl && (
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-700 font-medium border border-green-200 hover:bg-green-50 hover:border-green-300 px-2.5 py-1 rounded-lg transition-colors">
                        Show Certificate <ExternalLink className="w-3 h-3" />
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

export default function VoluntaryWorkSection({ pdsData, onSave, saving }: Props) {
    const initialRows = (pdsData.voluntary_work?.length ? pdsData.voluntary_work : []) as VoluntaryWorkEntry[];

    const [rows,     setRows]     = useState<VoluntaryWorkEntry[]>(initialRows);
    const [rowFiles, setRowFiles] = useState<RowFile[]>(
        initialRows.map(row => ({ file: null, existing: row.attachment ?? null, preview: null }))
    );

    // Sync after Inertia reload
    const vwKey = JSON.stringify(
        (pdsData.voluntary_work ?? []).map((e: any) => ({ id: e.id, attachment: e.attachment }))
    );
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        const fresh = (pdsData.voluntary_work?.length ? pdsData.voluntary_work : []) as VoluntaryWorkEntry[];
        setRows(fresh);
        setRowFiles(prev => fresh.map((row, i) => {
            if (prev[i]?.preview) URL.revokeObjectURL(prev[i].preview!);
            return { file: null, existing: row.attachment ?? null, preview: null };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vwKey]);

    useEffect(() => {
        return () => { rowFiles.forEach(rf => { if (rf.preview) URL.revokeObjectURL(rf.preview); }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [modal,       setModal]       = useState<ModalMode | null>(null);
    const [draft,       setDraft]       = useState<VoluntaryWorkEntry>({ ...EMPTY });
    const [draftFile,   setDraftFile]   = useState<RowFile>({ ...EMPTY_FILE });
    const [draftErrors, setDraftErrors] = useState<RowErrors>({});
    const [submitted,   setSubmitted]   = useState(false);

    const openAdd = () => {
        setDraft({ ...EMPTY });
        setDraftFile({ ...EMPTY_FILE });
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

    const handleFieldChange = (k: keyof VoluntaryWorkEntry, v: string) => {
        setDraft(prev => ({ ...prev, [k]: v }));
        if (submitted) setDraftErrors(prev => ({ ...prev, [k]: undefined }));
    };

    const handleFileChange = (rf: RowFile) => {
        setDraftFile(rf);
        if (submitted) setDraftErrors(prev => ({ ...prev, attachment_file: undefined }));
    };

    const handleModalSubmit = () => {
        setSubmitted(true);
        const errs = validateRow(draft, draftFile);
        if (Object.keys(errs).length > 0) { setDraftErrors(errs); return; }

        let nextRows: VoluntaryWorkEntry[];
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
        onSave('voluntary_work', buildFormData(nextRows, nextFiles));
    };

    const handleDelete = async (index: number) => {
        const label = rows[index]?.organization_name?.trim() || 'this voluntary work';
        const result = await Swal.fire({
            title: 'Delete Voluntary Work?',
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
        onSave('voluntary_work', buildFormData(nextRows, nextFiles));
    };

    return (
        <div className="space-y-1">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-base font-semibold text-green-800 uppercase">VI. Voluntary Work</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Involvement in Civic / Non-government / People / Voluntary Organizations.{' '}
                        <span className="font-medium text-green-700">Write N/A if not applicable.</span>
                    </p>
                </div>
                <button type="button" onClick={openAdd}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-3">
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            {rows.length === 0 ? (
                <div onClick={openAdd}
                    className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50/50 transition-colors cursor-pointer">
                    <HeartHandshake className="w-8 h-8" />
                    <p className="text-sm font-medium">Add your Voluntary Work</p>
                    <p className="text-xs">Click to get started</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                    {rows.map((row, i) => (
                        <VoluntaryWorkCard
                            key={i}
                            row={row}
                            rowFile={rowFiles[i] ?? EMPTY_FILE}
                            onEdit={() => openEdit(i)}
                            onDelete={() => handleDelete(i)}
                        />
                    ))}
                </div>
            )}

            <VoluntaryWorkModal
                open={modal !== null}
                onClose={closeModal}
                title={modal?.type === 'edit' ? 'Edit Voluntary Work' : 'Add Voluntary Work'}
                draft={draft}
                draftFile={draftFile}
                errors={draftErrors}
                onFieldChange={handleFieldChange}
                onFileChange={handleFileChange}
                onSubmit={handleModalSubmit}
                saving={saving}
            />
        </div>
    );
}