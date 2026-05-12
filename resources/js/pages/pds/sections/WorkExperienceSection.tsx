import { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';
import type { User, PdsData, PdsWorkExperience } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: (section: string, data: FormData) => void; saving: boolean; }

interface PositionOption {
    id: number;
    title: string;
    salary_grade: number;
}

// ── RowFile ───────────────────────────────────────────────────────────────────

interface RowFile {
    file:     File | null;
    existing: string | null;
    preview:  string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY: PdsWorkExperience = {
    date_from: '', date_to: '', is_present: false, position_title: '', department: '', status_of_appointment: '', is_government_service: false,
};

const ACCEPTED  = '.jpg,.jpeg,.png,.pdf';
const MAX_BYTES = 5 * 1024 * 1024;

const isImage = (name: string) => /\.(jpe?g|png)$/i.test(name);
const isPdf   = (name: string) => /\.pdf$/i.test(name);

// ── Validation ────────────────────────────────────────────────────────────────

type RowErrors = Partial<Record<keyof PdsWorkExperience | 'attachment_file', string>>;
type FormErrors = RowErrors[];

function validate(rows: PdsWorkExperience[], rowFiles: RowFile[]): FormErrors {
    return rows.map((row, i) => {
        const errs: RowErrors = {};

        if (!row.position_title?.trim())
            errs.position_title = 'Required.';
        if (!row.department?.trim())
            errs.department = 'Required.';
        if (!row.date_from?.trim())
            errs.date_from = 'Required.';
        // date_to required only when is_present is unchecked
        if (!row.is_present && !row.date_to?.trim())
            errs.date_to = 'Required, or check Present.';
        if (!row.status_of_appointment?.trim())
            errs.status_of_appointment = 'Required.';

        const rf = rowFiles[i];
        if (!rf?.file && !rf?.existing)
            errs.attachment_file = 'Please attach a supporting document.';

        return errs;
    });
}

function hasErrors(errors: FormErrors): boolean {
    return errors.some(e => Object.keys(e).length > 0);
}

// ── Searchable Position Input ─────────────────────────────────────────────────

interface PositionInputProps {
    value: string;
    positions: PositionOption[];
    loading: boolean;
    onChange: (title: string, salaryGrade?: string) => void;
    inputClass: string;
    errorClass: string;
    hasError: boolean;
}

function PositionInput({ value, positions, loading, onChange, inputClass, errorClass, hasError }: PositionInputProps) {
    const [search, setSearch] = useState(value);
    const [open,   setOpen]   = useState(false);
    const [style,  setStyle]  = useState<React.CSSProperties>({});
    const inputRef            = useRef<HTMLInputElement>(null);

    useEffect(() => { setSearch(value); }, [value]);

    const filtered = search.trim().length === 0
        ? positions
        : positions.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    function openDropdown() {
        if (inputRef.current) {
            const r = inputRef.current.getBoundingClientRect();
            setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: Math.max(r.width, 260), zIndex: 9999 });
        }
        setOpen(true);
    }

    function select(p: PositionOption) {
        setSearch(p.title);
        onChange(p.title, String(p.salary_grade));
        setOpen(false);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setSearch(val);
        onChange(val, undefined);
        openDropdown();
    }

    return (
        <div className="relative">
            {loading && (
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 animate-spin text-green-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
            )}
            <input
                ref={inputRef}
                value={search}
                onChange={handleChange}
                onFocus={openDropdown}
                disabled={loading}
                placeholder={loading ? 'Loading...' : 'Search or type position'}
                autoComplete="off"
                className={`${hasError ? errorClass : inputClass} ${loading ? 'text-gray-400' : ''} pr-6`}
            />
            {open && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setOpen(false)} />}
            {open && (
                <ul style={style} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-xs">
                    {filtered.length > 0
                        ? filtered.map(p => (
                            <li key={p.id} onMouseDown={() => select(p)}
                                className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-green-50">
                                <span className="text-gray-800">{p.title}</span>
                                <span className="ml-3 shrink-0 text-gray-400">SG {p.salary_grade}</span>
                            </li>
                        ))
                        : <li className="px-3 py-2 text-gray-400 italic">No match — will be saved as typed.</li>
                    }
                </ul>
            )}
        </div>
    );
}

// ── Attachment Cell ───────────────────────────────────────────────────────────

interface AttachmentCellProps {
    rowFile:      RowFile;
    onChange:     (rf: RowFile) => void;
    storageBase?: string;
    error?:       string;
}

function AttachmentCell({ rowFile, onChange, storageBase = '/storage', error }: AttachmentCellProps) {
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
        <div className="flex flex-col gap-1 min-w-30">
            <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleChange} />

            {hasAny ? (
                <div className={`flex items-center gap-1 border rounded-lg px-2 py-1 bg-gray-50 group ${
                    error ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}>
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

                    <a href={viewUrl ?? '#'} target={viewUrl ? '_blank' : undefined} rel="noopener noreferrer"
                        className="text-[10px] text-gray-600 truncate max-w-20 hover:text-green-700 hover:underline transition-colors"
                        title={label ?? ''}>
                        {label}
                    </a>

                    <div className="flex items-center gap-0.5 ml-auto shrink-0 min-h-7 max-h-5">
                        <button type="button" title="Replace file"
                            onClick={() => fileRef.current?.click()}
                            className="text-gray-400 hover:text-green-600 p-0.5 rounded transition-colors cursor-pointer">
                            <Paperclip className="w-3 h-3" />
                        </button>
                        <button type="button" title="Remove attachment"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                    className={`flex items-center gap-1 border border-dashed rounded-lg px-2 py-1.5 text-[11px] transition-colors cursor-pointer min-h-8 w-full ${
                        error
                            ? 'border-red-400 text-red-400 bg-red-50 hover:border-red-500 hover:text-red-600'
                            : 'border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50'
                    }`}>
                    <Paperclip className="w-3 h-3 shrink-0" />
                    <span className="text-xs">Attach File</span>
                </button>
            )}

            {(sizeError || error) && (
                <p className="text-[10px] text-red-500 leading-tight">{sizeError || error}</p>
            )}
            <p className='text-[9px] text-gray-600'>PNG, JPEG, or PDF Max 5MB</p>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WorkExperienceSection({ pdsData, onSave, saving }: Props) {
    // ── Derive initial rows ───────────────────────────────────────────────────
    const initialRows = pdsData.work_experience?.length ? pdsData.work_experience : [{ ...EMPTY }];

    const [rows,      setRows]      = useState<PdsWorkExperience[]>(initialRows);
    const [errors,    setErrors]    = useState<FormErrors>(initialRows.map(() => ({}))); // ← fixed: one entry per row
    const [submitted, setSubmitted] = useState(false);

    const [rowFiles, setRowFiles] = useState<RowFile[]>(
        initialRows.map(row => ({
            file:     null,
            existing: (row as PdsWorkExperience & { attachment?: string }).attachment ?? null,
            preview:  null,
        }))
    );

    const [positions,  setPositions]  = useState<PositionOption[]>([]);
    const [loadingPos, setLoadingPos] = useState(true);

    useEffect(() => {
        fetch('/positions')
            .then(r => r.json())
            .then(d => { setPositions(d); setLoadingPos(false); })
            .catch(() => setLoadingPos(false));
    }, []);

    const workKey = JSON.stringify(
        (pdsData.work_experience ?? []).map((e: PdsWorkExperience & { id?: number; attachment?: string }) => ({ id: e.id, attachment: e.attachment }))
    );
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        const fresh = pdsData.work_experience?.length ? pdsData.work_experience : [{ ...EMPTY }];
        setRows(fresh);
        setErrors(fresh.map(() => ({})));
        setSubmitted(false);
        setRowFiles(prev => fresh.map((row: PdsWorkExperience & { attachment?: string }, i: number) => {
            if (prev[i]?.preview) URL.revokeObjectURL(prev[i].preview!);
            return { file: null, existing: row.attachment ?? null, preview: null };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workKey]);

    useEffect(() => {
        return () => { rowFiles.forEach(rf => { if (rf.preview) URL.revokeObjectURL(rf.preview); }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const baseInput = "w-full border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 bg-white transition-colors";
    const inputCls  = `${baseInput} border-gray-200 focus:ring-green-500`;
    const errCls    = `${baseInput} border-red-400 focus:ring-red-400 bg-red-50`;
    const cls       = (i: number, k: keyof PdsWorkExperience) => errors[i]?.[k] ? errCls : inputCls;

    const setRow = (i: number, key: keyof PdsWorkExperience, val: string | boolean) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
        if (submitted) {
            setErrors(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: undefined } : e));
        }
    };

    const setRowFile = (i: number, rf: RowFile) => {
        setRowFiles(prev => prev.map((r, idx) => idx === i ? rf : r));
        // Clear attachment error live once a file is picked
        if (submitted && (rf.file || rf.existing)) {
            setErrors(prev => prev.map((e, idx) => idx === i ? { ...e, attachment_file: undefined } : e));
        }
    };

    const setPosition = (i: number, title: string, salaryGrade?: string) => {
        setRows(prev => prev.map((r, idx) => {
            if (idx !== i) return r;
            return { ...r, position_title: title, ...(salaryGrade !== undefined ? { salary_grade: salaryGrade } : {}) };
        }));
        if (submitted) {
            setErrors(prev => prev.map((e, idx) => idx === i ? { ...e, position_title: undefined } : e));
        }
    };

    const addRow = () => {
        setRows(p => [...p, { ...EMPTY }]);
        setErrors(p => [...p, {}]);
        setRowFiles(p => [...p, { file: null, existing: null, preview: null }]);
    };

    const removeRow = (i: number) => {
        if (rowFiles[i]?.preview) URL.revokeObjectURL(rowFiles[i].preview!);
        setRows(p => p.filter((_, idx) => idx !== i));
        setErrors(p => p.filter((_, idx) => idx !== i));
        setRowFiles(p => p.filter((_, idx) => idx !== i));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const errs = validate(rows, rowFiles);
        if (hasErrors(errs)) {
            setErrors(errs);
            const firstRowIdx = errs.findIndex(e => Object.keys(e).length > 0);
            if (firstRowIdx >= 0) {
                const firstKey = Object.keys(errs[firstRowIdx])[0];
                document.getElementById(`work-${firstRowIdx}-${firstKey}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setErrors(rows.map(() => ({})));

        const fd = new FormData();
        rows.forEach((row, i) => {
            fd.append(`work_experience[${i}][date_from]`,             row.date_from             ?? '');
            fd.append(`work_experience[${i}][date_to]`,               row.date_to               ?? '');
            fd.append(`work_experience[${i}][is_present]`,            row.is_present ? '1' : '0');
            fd.append(`work_experience[${i}][position_title]`,        row.position_title        ?? '');
            fd.append(`work_experience[${i}][department]`,            row.department            ?? '');
            fd.append(`work_experience[${i}][salary_grade]`,          (row as PdsWorkExperience & { salary_grade?: string }).salary_grade ?? '');
            fd.append(`work_experience[${i}][status_of_appointment]`, row.status_of_appointment ?? '');
            fd.append(`work_experience[${i}][is_government_service]`, row.is_government_service ? '1' : '0');

            const rf = rowFiles[i];
            if (rf?.file)          fd.append(`attachments[${i}]`,          rf.file);
            else if (rf?.existing) fd.append(`existing_attachments[${i}]`, rf.existing);
        });

        onSave('work_experience', fd);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">V. Work Experience</h2>
                    <p className="text-xs text-gray-500">Include private employment. Start from your most recent work.</p>
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
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 lg:min-w-36">
                                Position Title <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 lg:min-w-36">
                                Department / Agency / Company <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">
                                Date From <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">
                                Date To <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-36">
                                Status of Appointment <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-center font-medium text-gray-600 w-20">Gov't Service</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-36">
                                Attachment <span className="text-red-500">*</span>
                            </th>
                            <th className="w-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => {
                            const rowErr = errors[i] ?? {};
                            const rowHasError = Object.keys(rowErr).length > 0;
                            return (
                                <tr key={i} className={`align-top ${
                                    rowHasError ? 'bg-red-50/30' : ''
                                }`}>
                                    {/* Position Title */}
                                    <td className="px-1 py-1.5" id={`work-${i}-position_title`}>
                                        <PositionInput
                                            value={row.position_title ?? ''}
                                            positions={positions}
                                            loading={loadingPos}
                                            onChange={(title, sg) => setPosition(i, title, sg)}
                                            inputClass={inputCls}
                                            errorClass={errCls}
                                            hasError={!!rowErr.position_title}
                                        />
                                        {rowErr.position_title && (
                                            <p className="mt-0.5 text-[10px] text-red-500 leading-tight">{rowErr.position_title}</p>
                                        )}
                                    </td>

                                    {/* Department */}
                                    <td className="px-1 py-1.5">
                                        <input
                                            id={`work-${i}-department`}
                                            type="text"
                                            value={row.department ?? ''}
                                            onChange={e => setRow(i, 'department', e.target.value)}
                                            placeholder="Agency / Company"
                                            className={cls(i, 'department')}
                                        />
                                        {rowErr.department && (
                                            <p className="mt-0.5 text-[10px] text-red-500 leading-tight">{rowErr.department}</p>
                                        )}
                                    </td>

                                    {/* Date From */}
                                    <td className="px-1 py-1.5">
                                        <input
                                            id={`work-${i}-date_from`}
                                            type="date"
                                            value={row.date_from ?? ''}
                                            onChange={e => setRow(i, 'date_from', e.target.value)}
                                            className={cls(i, 'date_from')}
                                        />
                                        {rowErr.date_from && (
                                            <p className="mt-0.5 text-[10px] text-red-500 leading-tight">{rowErr.date_from}</p>
                                        )}
                                    </td>

                                    {/* Date To + Present checkbox */}
                                    <td className="px-1 py-1.5">
                                        <input
                                            id={`work-${i}-date_to`}
                                            type="date"
                                            value={row.date_to ?? ''}
                                            onChange={e => setRow(i, 'date_to', e.target.value)}
                                            disabled={!!row.is_present}
                                            className={cls(i, 'date_to')}
                                        />
                                        <label className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!row.is_present}
                                                onChange={e => {
                                                    setRow(i, 'is_present', e.target.checked);
                                                    if (e.target.checked && submitted) {
                                                        setErrors(prev => prev.map((er, idx) =>
                                                            idx === i ? { ...er, date_to: undefined } : er
                                                        ));
                                                    }
                                                }}
                                                className="accent-green-600"
                                            />
                                            Present
                                        </label>
                                        {rowErr.date_to && (
                                            <p className="mt-0.5 text-[10px] text-red-500 leading-tight">{rowErr.date_to}</p>
                                        )}
                                    </td>

                                    {/* Status of Appointment */}
                                    <td className="px-1 py-1.5">
                                        <select
                                            id={`work-${i}-status_of_appointment`}
                                            value={row.status_of_appointment ?? ''}
                                            onChange={e => setRow(i, 'status_of_appointment', e.target.value)}
                                            className={cls(i, 'status_of_appointment')}
                                        >
                                            <option value="">Select</option>
                                            {[
                                                'Permanent', 'Temporary', 'Casual', 'Coterminous',
                                                'Contractual', 'Substitute', 'Job Order', 'Contract of Service',
                                            ].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        {rowErr.status_of_appointment && (
                                            <p className="mt-0.5 text-[10px] text-red-500 leading-tight">{rowErr.status_of_appointment}</p>
                                        )}
                                    </td>

                                    {/* Government Service */}
                                    <td className="px-1 py-1.5 text-center">
                                        <input
                                            type="checkbox"
                                            checked={!!row.is_government_service}
                                            onChange={e => setRow(i, 'is_government_service', e.target.checked)}
                                            className="accent-green-600 mt-2"
                                        />
                                    </td>

                                    {/* Attachment */}
                                    <td className="px-1 py-1.5">
                                        <AttachmentCell
                                            rowFile={rowFiles[i] ?? { file: null, existing: null, preview: null }}
                                            onChange={rf => setRowFile(i, rf)}
                                            error={rowErr.attachment_file}
                                        />
                                    </td>

                                    {/* Remove */}
                                    <td className="px-1 py-4">
                                        {rows.length > 1 && (
                                            <button type="button" onClick={() => removeRow(i)}
                                                title="Remove"
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
                    {saving
                        ? <><Spinner />Saving Work Experience</>
                        : <><Save className="w-4 h-4" />Save Work Experience</>
                    }
                </button>
            </div>
        </form>
    );
}