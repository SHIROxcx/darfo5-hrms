import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, Plus, Trash2, ChevronDown, X, Paperclip, FileText, Image as ImageIcon, Pencil, Award, ExternalLink, Ellipsis } from 'lucide-react';
import type { User, PdsData, PdsEligibility } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';
import Swal from 'sweetalert2';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: (section: string, data: FormData) => void;
    saving: boolean;
}

interface EligibilityOption {
    id: number;
    category: string;
    title: string;
}

interface RowFile {
    file: File | null;
    existing: string | null;
    preview: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY: PdsEligibility = {
    career_service: '',
    rating: '',
    date_of_examination: '',
    place_of_examination: '',
    license_number: '',
    license_validity: '',
    attachment: '',
};

type RowErrors = Partial<Record<keyof PdsEligibility | 'attachment_file', string>>;

// ── Validation ────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: Array<keyof PdsEligibility> = [
    'career_service',
    'rating',
    'date_of_examination',
    'place_of_examination',
    'license_number',
];

function validateRow(row: PdsEligibility, rowFile: RowFile): RowErrors {
    const errs: RowErrors = {};
    for (const key of REQUIRED_FIELDS) {
        const val = row[key];
        if (!val || String(val).trim() === '') {
            errs[key] = 'Required.';
        }
    }
    if (!rowFile?.file && !rowFile?.existing) {
        errs['attachment_file'] = 'Please attach a supporting document.';
    }
    return errs;
}

// ── Other helpers ─────────────────────────────────────────────────────────────

const toDateOnly = (val?: string | null) => val ? val.slice(0, 10) : '';
const normalizeRow = (row: PdsEligibility): PdsEligibility => ({
    ...row,
    date_of_examination: toDateOnly(row.date_of_examination),
    license_validity: toDateOnly(row.license_validity),
});

const ACCEPTED = '.jpg,.jpeg,.png,.pdf';
const MAX_BYTES = 5 * 1024 * 1024;

// ── Module-level cache ────────────────────────────────────────────────────────

let _cache: EligibilityOption[] | null = null;
let _inflight: Promise<EligibilityOption[]> | null = null;

function fetchOptions(): Promise<EligibilityOption[]> {
    if (_cache) return Promise.resolve(_cache);
    if (_inflight) return _inflight;
    _inflight = fetch('/api/eligibilities')
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then((data: EligibilityOption[]) => { _cache = data; _inflight = null; return data; })
        .catch(err => { _inflight = null; console.error('Failed to load eligibilities:', err); return []; });
    return _inflight;
}

// ── Combobox ──────────────────────────────────────────────────────────────────

interface ComboboxProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
}

function EligibilityCombobox({ value, onChange, error }: ComboboxProps) {
    const [options, setOptions] = useState<EligibilityOption[]>(_cache ?? []);
    const [loading, setLoading] = useState(!_cache);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [style, setStyle] = useState<React.CSSProperties>({});

    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (_cache) { setOptions(_cache); setLoading(false); return; }
        fetchOptions().then(data => { setOptions(data); setLoading(false); });
    }, []);

    const filtered = query.trim()
        ? options.filter(o => o.title.toLowerCase().includes(query.toLowerCase()))
        : options;

    const updatePos = () => {
        if (!triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        const below = window.innerHeight - r.bottom;
        const up = below < 240 && r.top > 240;
        setStyle({
            position: 'fixed', left: r.left, width: Math.max(r.width, 280), zIndex: 9999,
            ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
        });
    };

    const openDropdown = () => { updatePos(); setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); };

    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) && !dropdownRef.current?.contains(e.target as Node)) {
                setOpen(false); setQuery('');
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const h = () => updatePos();
        window.addEventListener('scroll', h, true);
        window.addEventListener('resize', h);
        return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
    }, [open]);

    const select = (title: string) => { onChange(title); setOpen(false); setQuery(''); };
    const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(''); setQuery(''); };

    const dropdown = open ? createPortal(
        <div ref={dropdownRef} style={style} className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-1.5 border-b border-gray-100">
                <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search eligibility or category…"
                    className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
                {loading ? (
                    <p className="px-3 py-2 text-xs text-gray-400 text-center">Loading…</p>
                ) : filtered.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400 italic text-center">No results</p>
                ) : filtered.map(opt => (
                    <button key={opt.id} type="button" onMouseDown={() => select(opt.title)}
                        className={[
                            'w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer',
                            value === opt.title ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-700 hover:bg-green-50 hover:text-green-800',
                        ].join(' ')}>
                        {opt.title}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="relative w-full">
            <button ref={triggerRef} type="button"
                onClick={() => open ? (setOpen(false), setQuery('')) : openDropdown()}
                className={[
                    'w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm bg-white text-left transition-colors focus:outline-none focus:ring-1',
                    error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-green-500',
                ].join(' ')}>
                <span className={value ? 'text-gray-800 truncate' : 'text-gray-400'}>
                    {loading ? 'Loading…' : (value || 'Select eligibility')}
                </span>
                <span className="flex items-center gap-0.5 ml-1 shrink-0">
                    {value && !loading && (
                        <span onClick={clear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>
            {dropdown}
            {error && <p className="mt-1 text-xs text-red-500 leading-tight">{error}</p>}
        </div>
    );
}

// ── Attachment Cell ───────────────────────────────────────────────────────────

interface AttachmentCellProps {
    rowFile: RowFile;
    onChange: (rf: RowFile) => void;
    storageBase?: string;
    error?: string;
}

function AttachmentCell({ rowFile, onChange, storageBase = '/storage', error }: AttachmentCellProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [sizeError, setSizeError] = useState('');

    const hasFile = !!rowFile.file;
    const hasExisting = !!rowFile.existing;
    const hasAny = hasFile || hasExisting;

    const label = hasFile
        ? rowFile.file!.name
        : hasExisting
            ? rowFile.existing!.split('/').pop() ?? 'Attachment'
            : null;

    const isImage = (name: string) => /\.(jpe?g|png)$/i.test(name);
    const isPdf   = (name: string) => /\.pdf$/i.test(name);

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
                    <span>Attach File</span>
                </button>
            )}

            {(sizeError || error) && (
                <p className="text-xs text-red-500 leading-tight flex items-center gap-1">
                   {sizeError || error}
                </p>
            )}
            <p className="text-[10px] text-gray-400">PNG, JPEG, or PDF · Max 5 MB</p>
        </div>
    );
}

// ── Eligibility Modal ─────────────────────────────────────────────────────────

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    row: PdsEligibility;
    rowFile: RowFile;
    errors: RowErrors;
    onFieldChange: (k: keyof PdsEligibility, v: string) => void;
    onFileChange: (rf: RowFile) => void;
    onSubmit: () => void;
    saving: boolean;
}

function EligibilityModal({
    open, onClose, title,
    row, rowFile, errors,
    onFieldChange, onFileChange,
    onSubmit, saving,
}: ModalProps) {
    const baseInput = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors";
    const inputCls  = `${baseInput} border-gray-200 focus:ring-green-500`;
    const errCls    = `${baseInput} border-red-400 focus:ring-red-400 bg-red-50`;
    const cls       = (k: keyof PdsEligibility) => errors[k] ? errCls : inputCls;

    // Lock body scroll
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-none shadow-2xl flex flex-col h-full sm:h-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {/* License / Eligibility */}
                    <div>
                        <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                            License / Eligibility <span className="text-red-500">*</span>
                        </label>
                        <EligibilityCombobox
                            value={row.career_service ?? ''}
                            onChange={val => onFieldChange('career_service', val)}
                            error={errors.career_service}
                        />
                    </div>

                    {/* Rating & Date of Examination */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                           <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                                Rating <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={row.rating ?? ''}
                                onChange={e => onFieldChange('rating', e.target.value)}
                                placeholder="e.g. 85.5"
                                className={cls('rating')}
                            />
                            {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
                        </div>
                        <div>
                            <label className="uppercase block text-xs font-medium text-gray-600 mb-1">Date of Examination <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={row.date_of_examination ?? ''}
                                onChange={e => onFieldChange('date_of_examination', e.target.value)}
                                className={cls('date_of_examination')}
                            />
                            {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.date_of_examination}</p>}
                        </div>
                    </div>

                    {/* Place of Examination */}
                    <div>
                        <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                            Place of Examination <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={row.place_of_examination ?? ''}
                            onChange={e => onFieldChange('place_of_examination', e.target.value)}
                            placeholder="City, Province"
                            className={cls('place_of_examination')}
                        />
                        {errors.place_of_examination && <p className="mt-1 text-xs text-red-500">{errors.place_of_examination}</p>}
                    </div>

                    {/* License No. & Validity side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                                License No. <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={row.license_number ?? ''}
                                onChange={e => onFieldChange('license_number', e.target.value)}
                                placeholder="License No. or N/A"
                                className={cls('license_number')}
                            />
                            {errors.license_number && <p className="mt-1 text-xs text-red-500">{errors.license_number}</p>}
                        </div>
                        <div>
                            <label className="uppercase block text-xs font-medium text-gray-600 mb-1">Validity</label>
                            <input
                                type="date"
                                value={row.license_validity ?? ''}
                                onChange={e => onFieldChange('license_validity', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Attachment */}
                    <div>
                        <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                            Attachment <span className="text-red-500">*</span>
                        </label>
                        <AttachmentCell
                            rowFile={rowFile}
                            onChange={onFileChange}
                            error={errors.attachment_file}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                        {saving ? <><Spinner />Saving…</> : <><Save className="w-4 h-4" />Save</>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Eligibility Card ──────────────────────────────────────────────────────────

interface CardProps {
    row: PdsEligibility;
    rowFile: RowFile;
    onEdit: () => void;
    onDelete: () => void;
    storageBase?: string;
}

function EligibilityCard({ row, rowFile, onEdit, onDelete, storageBase = '/storage' }: CardProps) {
    const hasFile = !!rowFile.file;
    const hasExisting = !!rowFile.existing;
    const label = hasFile
        ? rowFile.file!.name
        : hasExisting
            ? rowFile.existing!.split('/').pop() ?? 'Attachment'
            : null;
    const viewUrl = rowFile.preview ?? (hasExisting ? `${storageBase}/${rowFile.existing}` : null);

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    const formatDate = (val?: string | null) =>
        val ? new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

    // Close on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    return (
        <div className="flex items-stretch gap-3 p-4 overflow-hidden">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white"><Award className="h-5 w-5" /></div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {row.career_service || <span className="text-gray-400 italic">No eligibility selected</span>}
                </p>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    {row.license_number && (
                        <span>License No.: <span className="text-gray-700 font-medium">{row.license_number}</span></span>
                    )}
                    {row.rating && (
                        <span>Rating: <span className="text-gray-700 font-medium">{row.rating}</span></span>
                    )}
                </div>

                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                    {row.date_of_examination && (
                        <span>Date of Examination: <span className="text-gray-700 font-medium">{formatDate(row.date_of_examination)}</span></span>
                    )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                    {row.place_of_examination && (
                        <span>Place of Examination: <span className="text-gray-700 font-medium">{row.place_of_examination}</span></span>
                    )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                    {row.license_validity && (
                        <span>Valid Until: <span className="text-gray-700 font-medium">{formatDate(row.license_validity)}</span></span>
                    )}
                </div>

                {label && viewUrl && (
                    <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-700 font-medium border border-green-200 hover:bg-green-50 hover:border-green-300 px-2.5 py-1 rounded-lg transition-colors">
                        Show Credentials <ExternalLink className='w-3 h-3' />
                    </a>
                )}
            </div>

            {/* Ellipsis menu */}
            <div className="relative shrink-0">
                <button
                    ref={btnRef}
                    type="button"
                    onClick={() => setMenuOpen(prev => !prev)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        menuOpen
                            ? 'bg-green-50 text-green-700'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}>
                    <Ellipsis className='w-4 h-4' />
                </button>

                {menuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute right-0 top-5 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                        <button
                            type="button"
                            onClick={() => { setMenuOpen(false); onEdit(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-green-700 hover:bg-gray-50 transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMenuOpen(false); onDelete(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-gray-50 hover:text-red-700 transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ModalMode = { type: 'add' } | { type: 'edit'; index: number };

export default function EligibilitySection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsEligibility[]>(
        pdsData.eligibilities?.length
            ? pdsData.eligibilities.map(normalizeRow)
            : []
    );
    const [rowFiles, setRowFiles] = useState<RowFile[]>(
        (pdsData.eligibilities?.length ? pdsData.eligibilities : []).map(row => ({
            file: null,
            existing: row.attachment ?? null,
            preview: null,
        }))
    );

    // Modal state
    const [modal, setModal] = useState<ModalMode | null>(null);
    const [draftRow, setDraftRow] = useState<PdsEligibility>({ ...EMPTY });
    const [draftFile, setDraftFile] = useState<RowFile>({ file: null, existing: null, preview: null });
    const [draftErrors, setDraftErrors] = useState<RowErrors>({});
    const [submitted, setSubmitted] = useState(false);

    // Sync from server after save
    useEffect(() => {
        const fresh = pdsData.eligibilities?.length ? pdsData.eligibilities : [];
        setRows(fresh.map(normalizeRow));
        setRowFiles(prev => fresh.map((row, i) => {
            if (prev[i]?.preview) URL.revokeObjectURL(prev[i].preview!);
            return { file: null, existing: row.attachment ?? null, preview: null };
        }));
    }, [pdsData.eligibilities]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { rowFiles.forEach(rf => { if (rf.preview) URL.revokeObjectURL(rf.preview); }); };
    }, []);

    const openAdd = () => {
        setDraftRow({ ...EMPTY });
        setDraftFile({ file: null, existing: null, preview: null });
        setDraftErrors({});
        setSubmitted(false);
        setModal({ type: 'add' });
    };

    const openEdit = (index: number) => {
        setDraftRow({ ...rows[index] });
        setDraftFile({ ...rowFiles[index] });
        setDraftErrors({});
        setSubmitted(false);
        setModal({ type: 'edit', index });
    };

    const closeModal = () => {
        setModal(null);
        setDraftErrors({});
        setSubmitted(false);
    };

    const handleDraftField = (k: keyof PdsEligibility, v: string) => {
        setDraftRow(prev => ({ ...prev, [k]: v }));
        if (submitted) {
            setDraftErrors(prev => ({ ...prev, [k]: undefined }));
        }
    };

    const handleDraftFile = (rf: RowFile) => {
        setDraftFile(rf);
        if (submitted && (rf.file || rf.existing)) {
            setDraftErrors(prev => ({ ...prev, attachment_file: undefined }));
        }
    };

    const handleModalSubmit = () => {
        setSubmitted(true);
        const errs = validateRow(draftRow, draftFile);
        if (Object.keys(errs).length > 0) {
            setDraftErrors(errs);
            return;
        }

        let nextRows: PdsEligibility[];
        let nextFiles: RowFile[];

        if (modal?.type === 'add') {
            nextRows = [...rows, draftRow];
            nextFiles = [...rowFiles, draftFile];
        } else if (modal?.type === 'edit') {
            const idx = modal.index;
            if (rowFiles[idx]?.preview && rowFiles[idx].preview !== draftFile.preview) {
                URL.revokeObjectURL(rowFiles[idx].preview!);
            }
            nextRows = rows.map((r, i) => i === idx ? draftRow : r);
            nextFiles = rowFiles.map((f, i) => i === idx ? draftFile : f);
        } else {
            return;
        }

        setRows(nextRows);
        setRowFiles(nextFiles);
        closeModal();

        // Build FormData and save
        const fd = new FormData();
        nextRows.forEach((row, i) => {
            fd.append(`eligibilities[${i}][career_service]`,      row.career_service      ?? '');
            fd.append(`eligibilities[${i}][rating]`,              row.rating              ?? '');
            fd.append(`eligibilities[${i}][date_of_examination]`,  row.date_of_examination ?? '');
            fd.append(`eligibilities[${i}][place_of_examination]`, row.place_of_examination ?? '');
            fd.append(`eligibilities[${i}][license_number]`,      row.license_number      ?? '');
            fd.append(`eligibilities[${i}][license_validity]`,    row.license_validity    ?? '');

            const rf = nextFiles[i];
            if (rf?.file) {
                fd.append(`attachments[${i}]`, rf.file);
            } else if (rf?.existing) {
                fd.append(`existing_attachments[${i}]`, rf.existing);
            }
        });

        onSave('eligibility', fd);
    };

    const handleDelete = async (index: number) => {
        const label = rows[index]?.career_service?.trim() || 'this eligibility';

        const result = await Swal.fire({
            title: 'Delete Eligibility?',
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
        const nextRows = rows.filter((_, i) => i !== index);
        const nextFiles = rowFiles.filter((_, i) => i !== index);
        setRows(nextRows);
        setRowFiles(nextFiles);

        // Save after delete
        const fd = new FormData();
        nextRows.forEach((row, i) => {
            fd.append(`eligibilities[${i}][career_service]`,      row.career_service      ?? '');
            fd.append(`eligibilities[${i}][rating]`,              row.rating              ?? '');
            fd.append(`eligibilities[${i}][date_of_examination]`,  row.date_of_examination ?? '');
            fd.append(`eligibilities[${i}][place_of_examination]`, row.place_of_examination ?? '');
            fd.append(`eligibilities[${i}][license_number]`,      row.license_number      ?? '');
            fd.append(`eligibilities[${i}][license_validity]`,    row.license_validity    ?? '');
            const rf = nextFiles[i];
            if (rf?.file) fd.append(`attachments[${i}]`, rf.file);
            else if (rf?.existing) fd.append(`existing_attachments[${i}]`, rf.existing);
        });
        onSave('eligibility', fd);
    };

    return (
        <div className="space-y-1">
            {/* Section header */}
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h2 className="text-base font-semibold text-green-800 uppercase">IV. Licenses & Eligibilities</h2>
                    <p className="hidden sm:block text-xs text-gray-500 mt-0.5">Include CES / CSEE / Career Service / RA 1080 (BOARD / BAR).{' '}
                    <span className="font-medium text-green-700">Write N/A if not applicable.</span>
                </p>
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-3">
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            {/* List */}
            {rows.length === 0 ? (
                <div
                    onClick={openAdd}
                    className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50/50 transition-colors cursor-pointer">
                    <Award className="w-8 h-8" />
                    <p className="text-sm font-medium text-center">Add your Career Service Eligibility and or License</p>
                    <p className="text-xs">Click here to add</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                    {rows.map((row, i) => (
                        <EligibilityCard
                            key={i}
                            row={row}
                            rowFile={rowFiles[i] ?? { file: null, existing: null, preview: null }}
                            onEdit={() => openEdit(i)}
                            onDelete={() => handleDelete(i)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <EligibilityModal
                open={modal !== null}
                onClose={closeModal}
                title={modal?.type === 'edit' ? 'Edit Eligibility' : 'Add Eligibility'}
                row={draftRow}
                rowFile={draftFile}
                errors={draftErrors}
                onFieldChange={handleDraftField}
                onFileChange={handleDraftFile}
                onSubmit={handleModalSubmit}
                saving={saving}
            />
        </div>
    );
}