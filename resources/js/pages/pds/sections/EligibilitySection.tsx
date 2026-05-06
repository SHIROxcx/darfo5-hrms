import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, Plus, Trash2, ChevronDown, X, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import type { User, PdsData, PdsEligibility } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

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

type RowErrors = Partial<Record<keyof PdsEligibility, string>>;

const toDateOnly = (val?: string | null) => val ? val.slice(0, 10) : '';
const normalizeRow = (row: PdsEligibility): PdsEligibility => ({
    ...row,
    date_of_examination: toDateOnly(row.date_of_examination),
    license_validity: toDateOnly(row.license_validity),
});

const ACCEPTED = '.jpg,.jpeg,.png,.pdf';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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
                    'w-full flex items-center justify-between border rounded-lg px-2 py-1.5 text-xs bg-white text-left transition-colors focus:outline-none focus:ring-1',
                    error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-green-500',
                ].join(' ')}>
                <span className={value ? 'text-gray-800 truncate' : 'text-gray-400'}>
                    {loading ? 'Loading…' : (value || 'Select eligibility')}
                </span>
                <span className="flex items-center gap-0.5 ml-1 shrink-0">
                    {value && !loading && (
                        <span onClick={clear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>
            {dropdown}
            {error && <p className="mt-0.5 text-[10px] text-red-500">{error}</p>}
        </div>
    );
}

// ── Attachment Cell ───────────────────────────────────────────────────────────

interface AttachmentCellProps {
    rowFile: RowFile;
    onChange: (rf: RowFile) => void;
    storageBase?: string;
}

function AttachmentCell({ rowFile, onChange, storageBase = '/storage' }: AttachmentCellProps) {
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
        if (f.size > MAX_BYTES) { setSizeError('File must be under 4 MB.'); return; }
        setSizeError('');
        const preview = isImage(f.name) ? URL.createObjectURL(f) : null;
        // Revoke old preview to avoid memory leaks
        if (rowFile.preview) URL.revokeObjectURL(rowFile.preview);
        onChange({ file: f, existing: rowFile.existing, preview });
        // Reset input so the same file can be re-selected after clearing
        e.target.value = '';
    };

    const handleClear = () => {
        if (rowFile.preview) URL.revokeObjectURL(rowFile.preview);
        onChange({ file: null, existing: null, preview: null });
        setSizeError('');
    };

    // viewUrl: best URL to open the file (object URL for new picks, storage URL for saved files)
    const existingUrl = hasExisting ? `${storageBase}/${rowFile.existing}` : null;
    const viewUrl     = rowFile.preview ?? existingUrl;
    // previewSrc: only set for images (to show a thumbnail)
    const previewSrc  = viewUrl && label && isImage(label) ? viewUrl : null;

    return (
        <div className="flex flex-col gap-1 min-w-30">
            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={handleChange}
            />

            {hasAny ? (
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 group">
                    {/* Thumbnail for images, PDF icon for PDFs, generic icon otherwise */}
                    {previewSrc ? (
                        <a href={viewUrl!} target="_blank" rel="noopener noreferrer" className="shrink-0" title="View image">
                            <img src={previewSrc} alt="preview" className="w-7 h-7 rounded object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                    ) : viewUrl ? (
                        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                            className={`shrink-0 transition-colors ${label && isPdf(label) ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-green-600'}`}
                            title="Open attachment">
                            <FileText className="w-4 h-4" />
                        </a>
                    ) : (
                        <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    )}

                    {/* Filename — clickable link */}
                    <a
                        href={viewUrl ?? '#'}
                        target={viewUrl ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-[10px] text-gray-600 truncate max-w-20 hover:text-green-700 hover:underline transition-colors"
                        title={label ?? ''}
                    >
                        {label}
                    </a>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 ml-auto shrink-0">
                        {/* Replace */}
                        <button
                            type="button"
                            title="Replace file"
                            onClick={() => fileRef.current?.click()}
                            className="text-gray-400 hover:text-green-600 p-0.5 rounded transition-colors cursor-pointer">
                            <Paperclip className="w-3 h-3" />
                        </button>
                        {/* Remove */}
                        <button
                            type="button"
                            title="Remove attachment"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1 border border-dashed border-gray-300 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors cursor-pointer w-full">
                    <Paperclip className="w-3 h-3 shrink-0" />
                    <span>Attach file</span>
                </button>
            )}

            {sizeError && <p className="text-[10px] text-red-500">{sizeError}</p>}
            <p className="text-[9px] text-gray-400 leading-tight">JPG, PNG or PDF · max 4 MB</p>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EligibilitySection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsEligibility[]>(
        pdsData.eligibilities?.length
            ? pdsData.eligibilities.map(normalizeRow)
            : [{ ...EMPTY }]
    );
    const [errors, setErrors] = useState<RowErrors[]>([]);

    // Per-row file state — parallel array to rows
    const [rowFiles, setRowFiles] = useState<RowFile[]>(
        (pdsData.eligibilities?.length
            ? pdsData.eligibilities
            : [EMPTY]
        ).map(row => ({
            file: null,
            existing: row.attachment ?? null,
            preview: null,
        }))
    );

    // After Inertia reloads pdsData (post-save), sync rows + rowFiles from fresh server data
    useEffect(() => {
        const fresh = pdsData.eligibilities?.length ? pdsData.eligibilities : [{ ...EMPTY }];
        setRows(fresh.map(normalizeRow));
        setErrors([]);
        setRowFiles(prev => fresh.map((row, i) => {
            // Revoke any stale object URL for this slot
            if (prev[i]?.preview) URL.revokeObjectURL(prev[i].preview!);
            return { file: null, existing: row.attachment ?? null, preview: null };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdsData.eligibilities]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => { rowFiles.forEach(rf => { if (rf.preview) URL.revokeObjectURL(rf.preview); }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const inputCls = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";
    const errCls   = "w-full border border-red-400 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-red-50";
    const cls      = (i: number, k: keyof PdsEligibility) => errors[i]?.[k] ? errCls : inputCls;

    const setRow = (i: number, k: keyof PdsEligibility, v: string) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
        setErrors(prev => prev.map((e, idx) => idx === i ? { ...e, [k]: undefined } : e));
    };

    const setRowFile = (i: number, rf: RowFile) => {
        setRowFiles(prev => prev.map((r, idx) => idx === i ? rf : r));
    };

    const addRow = () => {
        setRows(p => [...p, { ...EMPTY }]);
        setErrors(p => [...p, {}]);
        setRowFiles(p => [...p, { file: null, existing: null, preview: null }]);
    };

    const removeRow = (i: number) => {
        // Revoke preview URL for removed row
        if (rowFiles[i]?.preview) URL.revokeObjectURL(rowFiles[i].preview!);
        setRows(p => p.filter((_, idx) => idx !== i));
        setErrors(p => p.filter((_, idx) => idx !== i));
        setRowFiles(p => p.filter((_, idx) => idx !== i));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const fd = new FormData();

        rows.forEach((row, i) => {
            // Append each row field individually so Laravel can read eligibilities[i][field]
            fd.append(`eligibilities[${i}][career_service]`,     row.career_service     ?? '');
            fd.append(`eligibilities[${i}][rating]`,             row.rating             ?? '');
            fd.append(`eligibilities[${i}][date_of_examination]`, row.date_of_examination ?? '');
            fd.append(`eligibilities[${i}][place_of_examination]`, row.place_of_examination ?? '');
            fd.append(`eligibilities[${i}][license_number]`,     row.license_number     ?? '');
            fd.append(`eligibilities[${i}][license_validity]`,   row.license_validity   ?? '');

            const rf = rowFiles[i];
            if (rf?.file) {
                // New upload
                fd.append(`attachments[${i}]`, rf.file);
            } else if (rf?.existing) {
                // Preserve existing path
                fd.append(`existing_attachments[${i}]`, rf.existing);
            }
        });

        onSave('eligibility', fd);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">IV. Civil Service Eligibility</h2>
                    <p className="text-xs text-gray-500">
                        Include CES, CSEE, Career Service, RA 1080 (BOARD/BAR), Under Special Laws, and Eligibilities for Uniformed Personnel.{' '}
                        <span className="font-medium text-green-700">Write N/A if not applicable.</span>
                    </p>
                </div>
                <button type="button" onClick={addRow}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium mt-1 cursor-pointer shrink-0 ml-3">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 uppercase">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 lg:min-w-50">License / Eligibility</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-24">Rating</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">Date of Exam</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 lg:min-w-35">Place of Examination</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">License No.</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">Validity</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-36">Attachment</th>
                            <th className="w-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => {
                            const rowErr = errors[i] ?? {};
                            return (
                                <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                                    <td className="px-2 py-1.5">
                                        <EligibilityCombobox
                                            value={row.career_service ?? ''}
                                            onChange={val => setRow(i, 'career_service', val)}
                                            error={rowErr.career_service}
                                        />
                                    </td>
                                    <td className="px-1 py-1.5">
                                        <input type="text" value={row.rating ?? ''}
                                            onChange={e => setRow(i, 'rating', e.target.value)}
                                            placeholder="e.g. 85.50" className={cls(i, 'rating')} />
                                        {rowErr.rating && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.rating}</p>}
                                    </td>
                                    <td className="px-1 py-1.5">
                                        <input type="date" value={row.date_of_examination ?? ''}
                                            onChange={e => setRow(i, 'date_of_examination', e.target.value)}
                                            className={cls(i, 'date_of_examination')} />
                                        {rowErr.date_of_examination && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.date_of_examination}</p>}
                                    </td>
                                    <td className="px-1 py-1.5">
                                        <input type="text" value={row.place_of_examination ?? ''}
                                            onChange={e => setRow(i, 'place_of_examination', e.target.value)}
                                            placeholder="City, Province" className={cls(i, 'place_of_examination')} />
                                        {rowErr.place_of_examination && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.place_of_examination}</p>}
                                    </td>
                                    <td className="px-1 py-1.5">
                                        <input type="text" value={row.license_number ?? ''}
                                            onChange={e => setRow(i, 'license_number', e.target.value)}
                                            placeholder="License No." className={inputCls} />
                                    </td>
                                    <td className="px-1 py-1.5">
                                        <input type="date" value={row.license_validity ?? ''}
                                            onChange={e => setRow(i, 'license_validity', e.target.value)}
                                            className={inputCls} />
                                    </td>
                                    <td className="px-1 py-1.5">
                                        <AttachmentCell
                                            rowFile={rowFiles[i] ?? { file: null, existing: null, preview: null }}
                                            onChange={rf => setRowFile(i, rf)}
                                        />
                                    </td>
                                    <td className="px-1 py-1.5">
                                        {rows.length > 1 && (
                                            <button type="button" onClick={() => removeRow(i)}
                                                className="text-red-400 hover:text-red-600 cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving ? <><Spinner />Saving Eligibility</> : <><Save className="w-4 h-4" />Save Eligibility</>}
                </button>
            </div>
        </form>
    );
}