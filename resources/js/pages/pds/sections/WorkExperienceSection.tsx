import { Save, Plus, Trash2, Paperclip, FileText, Image as ImageIcon, X, Pencil, AlertCircle, BriefcaseBusiness, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import LimitedInput, { CharCounter, useFocusTracking } from '@/components/limited-input';
import { Spinner } from '@/components/ui/spinner';
import { pdsFileUrl } from '@/lib/pds-file-url';
import { PDS_MAX, acceptsEdit, clipPaste } from '@/lib/pds-limits';
import { splitGradeStep, joinGradeStep, cleanMoney } from '@/lib/pds-salary';
import type { User, PdsData, PdsWorkExperience } from '@/types/pds';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { user: User; pdsData: PdsData; onSave: (section: string, data: FormData) => void; saving: boolean; }

interface PositionOption {
    id: number;
    title: string;
    salary_grade: number;
}

interface RowFile {
    file:     File | null;
    existing: string | null;
    preview:  string | null;
}

// Extended work experience with new fields
interface WorkExperienceEntry extends PdsWorkExperience {
    office?:            string;
    supervisor?:        string;
    location?:          string;
    attachment?:        string;
    accomplishments?:   string;
    actual_duties?:     string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY: WorkExperienceEntry = {
    date_from: '', date_to: '', is_present: false, position_title: '', office: '', department: '',
    supervisor: '', location: '', monthly_salary: '', salary_grade: '',
    status_of_appointment: '', is_government_service: false,
    accomplishments: '', actual_duties: '',
};

const ACCEPTED  = '.jpg,.jpeg,.png,.pdf';
const MAX_BYTES = 5 * 1024 * 1024;

const isImage = (name: string) => /\.(jpe?g|png)$/i.test(name);
const isPdf   = (name: string) => /\.pdf$/i.test(name);

const APPOINTMENT_STATUSES = [
    'Permanent', 'Temporary', 'Casual', 'Coterminous',
    'Contractual', 'Substitute', 'Job Order', 'Contract of Service', 'Pakyaw'
];

const BULLET  = '• ';
const BULLET_LEN = BULLET.length;

// ── Validation ────────────────────────────────────────────────────────────────

type RowErrors = Partial<Record<keyof WorkExperienceEntry | 'attachment_file', string>>;

function validateRow(row: WorkExperienceEntry, rowFile: RowFile): RowErrors {
    const errs: RowErrors = {};
    if (!row.position_title?.trim())                errs.position_title = 'Required.';
    if (!row.office?.trim())                        errs.office = 'Required.';
    if (!row.department?.trim())                    errs.department = 'Required.';
    if (!row.supervisor?.trim())                    errs.supervisor = 'Required.';
    if (!row.location?.trim())                      errs.location = 'Required.';
    if (!row.accomplishments?.trim())               errs.accomplishments = 'Required.';
    if (!row.actual_duties?.trim())                 errs.actual_duties = 'Required.';
    if (!row.date_from?.trim())                     errs.date_from = 'Required.';
    if (!row.is_present && !row.date_to?.trim())    errs.date_to = 'Required, or check Present.';
    if (!row.status_of_appointment?.trim())         errs.status_of_appointment = 'Required.';
    const { grade, step } = splitGradeStep(row.salary_grade);
    if (grade && !step)                             errs.salary_grade = 'Add the step increment, e.g. 24-2.';
    else if (row.salary_grade && !/^\d{1,2}-\d$/.test(row.salary_grade))
                                                    errs.salary_grade = 'Salary grade and step must look like 24-2.';
    if (!rowFile?.file && !rowFile?.existing)       errs.attachment_file = 'Please attach a supporting document.';
    return errs;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' }) : null;

const buildFormData = (rows: WorkExperienceEntry[], files: RowFile[]) => {
    const fd = new FormData();
    rows.forEach((row, i) => {
        fd.append(`work_experience[${i}][date_from]`,             row.date_from             ?? '');
        fd.append(`work_experience[${i}][date_to]`,               row.date_to               ?? '');
        fd.append(`work_experience[${i}][is_present]`,            row.is_present            ?  '1' : '0');
        fd.append(`work_experience[${i}][position_title]`,        row.position_title        ?? '');
        fd.append(`work_experience[${i}][office]`,                row.office                ?? '');
        fd.append(`work_experience[${i}][department]`,            row.department            ?? '');
        fd.append(`work_experience[${i}][supervisor]`,            row.supervisor            ?? '');
        fd.append(`work_experience[${i}][location]`,              row.location              ?? '');
        fd.append(`work_experience[${i}][monthly_salary]`,        row.monthly_salary == null ? '' : String(row.monthly_salary));
        fd.append(`work_experience[${i}][salary_grade]`,          row.salary_grade ?? '');
        fd.append(`work_experience[${i}][status_of_appointment]`, row.status_of_appointment ?? '');
        fd.append(`work_experience[${i}][is_government_service]`, row.is_government_service ? '1' : '0');
        fd.append(`work_experience[${i}][accomplishments]`,       row.accomplishments       ?? '');
        fd.append(`work_experience[${i}][actual_duties]`,         row.actual_duties         ?? '');
        const rf = files[i];
        if (rf?.file)          fd.append(`attachments[${i}]`,          rf.file);
        else if (rf?.existing) fd.append(`existing_attachments[${i}]`, rf.existing);
    });
    return fd;
};

// ── Searchable Position Input ─────────────────────────────────────────────────

interface PositionInputProps {
    value: string;
    positions: PositionOption[];
    loading: boolean;
    onChange: (title: string, salaryGrade?: string) => void;
    hasError: boolean;
}

function PositionInput({ value, positions, loading, onChange, hasError }: PositionInputProps) {
    const [search, setSearch] = useState(value);
    const [open,   setOpen]   = useState(false);
    const [style,  setStyle]  = useState<React.CSSProperties>({});
    const inputRef            = useRef<HTMLInputElement>(null);
    const { focused, focusProps } = useFocusTracking();

    const base = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors";
    const ok   = `${base} border-gray-200 focus:ring-green-500`;
    const err  = `${base} border-red-400 focus:ring-red-400 bg-red-50`;

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
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="h-3.5 w-3.5 animate-spin text-green-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
            )}
            <input
                ref={inputRef}
                maxLength={PDS_MAX.position_title}
                value={search}
                onChange={handleChange}
                onFocus={() => { openDropdown(); focusProps.onFocus(); }}
                onBlur={focusProps.onBlur}
                disabled={loading}
                placeholder={loading ? 'Loading positions…' : 'Search or type position'}
                autoComplete="off"
                className={`${hasError ? err : ok} ${loading ? 'text-gray-400' : ''} pr-8`}
            />
            <CharCounter length={search.length} max={PDS_MAX.position_title} focused={focused} />
            {open && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setOpen(false)} />}
            {open && (
                <ul style={style} className="max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl text-sm">
                    {filtered.length > 0
                        ? filtered.map(p => (
                            <li key={p.id} onMouseDown={() => select(p)}
                                className="flex cursor-pointer items-center justify-between px-3 py-2.5 hover:bg-green-50 transition-colors">
                                <span className="text-gray-800 text-xs">{p.title}</span>
                                <span className="ml-3 shrink-0 text-gray-400 text-xs">SG {p.salary_grade}</span>
                            </li>
                        ))
                        : <li className="px-3 py-2.5 text-gray-400 italic text-xs">No match — will be saved as typed.</li>
                    }
                </ul>
            )}
        </div>
    );
}

// ── Attachment Field ──────────────────────────────────────────────────────────

interface AttachmentFieldProps {
    rowFile:      RowFile;
    onChange:     (rf: RowFile) => void;
    error?:       string;
}

function AttachmentField({ rowFile, onChange, error }: AttachmentFieldProps) {
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

// ── Bullet Textarea ─────────────────────────────────────────────────────────────────

interface BulletTextareaProps {
    /** Clean value (no bullets) — matches what you store in draft state */
    value:       string;
    onChange:    (clean: string) => void;
    /** Longest stored text; typing or pasting past it is cut off. */
    maxLength?:  number;
    rows?:       number;
    placeholder?: string;
    className?:  string;
    disabled?:   boolean;
}

/** Add a bullet to every non-empty line, preserve empty lines as-is */
function addBullets(raw: string): string {
    return raw
        .split('\n')
        .map(line => (line.length > 0 && !line.startsWith(BULLET) ? BULLET + line : line))
        .join('\n');
}
 
/** Strip bullets from every line to get the clean stored value */
function stripBullets(bulleted: string): string {
    return bulleted
        .split('\n')
        .map(line => (line.startsWith(BULLET) ? line.slice(BULLET_LEN) : line))
        .join('\n');
}

 
function BulletTextarea({
    value,
    onChange: onChangeValue,
    maxLength,
    rows = 4,
    placeholder,
    className = '',
    disabled  = false,
}: BulletTextareaProps) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const { focused, focusProps } = useFocusTracking();
    // Refuse an edit that would grow the text past the limit (never cut the end off); shrinking is always fine.
    const onChange = useCallback(
        (clean: string) => { if (acceptsEdit(clean, value, maxLength)) onChangeValue(clean); },
        [onChangeValue, maxLength, value],
    );
 
    // Convert clean value into bulleted display value
    const displayValue = addBullets(value);
 
    // Keep cursor position stable after React re-render
    const cursorRef = useRef<number | null>(null);
 
    useEffect(() => {
        const el = ref.current;
        if (el && cursorRef.current !== null) {
            el.selectionStart = cursorRef.current;
            el.selectionEnd   = cursorRef.current;
            cursorRef.current = null;
        }
    });
 
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const raw = e.target.value;
        const pos = e.target.selectionStart ?? 0;
 
        // Split into lines at cursor position
        const lines = raw.split('\n');
        const bulleted = lines.map(line => {
            if (line === '') return '';
            if (line.startsWith(BULLET)) return line;
            return BULLET + line;
        }).join('\n');
 
        // Adjust cursor: if we just added a bullet on this line, push cursor right
        const beforeCursor = raw.slice(0, pos);
        const linesBefore  = beforeCursor.split('\n');
        const currentLine  = linesBefore[linesBefore.length - 1];
 
        let newPos = pos;
        if (currentLine.length > 0 && !currentLine.startsWith(BULLET)) {
            newPos = pos + BULLET_LEN;
        }
 
        cursorRef.current = newPos;
        onChange(stripBullets(bulleted));
    }, [onChange]);
 
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const el = ref.current;
        if (!el) return;
 
        // Enter: insert newline + bullet
        if (e.key === 'Enter') {
            e.preventDefault();
            const start = el.selectionStart;
            const end   = el.selectionEnd;
            const val   = el.value;
 
            const newVal = val.slice(0, start) + '\n' + BULLET + val.slice(end);
            const newPos = start + 1 + BULLET_LEN;
 
            cursorRef.current = newPos;
            onChange(stripBullets(newVal));
            return;
        }
 
        // Backspace on an empty bulleted line: delete the bullet too
        if (e.key === 'Backspace') {
            const start = el.selectionStart;
            const end   = el.selectionEnd;
            if (start !== end) return; // has selection — let browser handle
 
            const val  = el.value;
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            const lineContent = val.slice(lineStart, start);
 
            // If caret is right after the bullet prefix on an otherwise empty line
            if (lineContent === BULLET) {
                e.preventDefault();
                const newVal = val.slice(0, lineStart - 1) + val.slice(start); // remove \n + bullet
                const newPos = lineStart - 1;
                cursorRef.current = newPos;
                onChange(stripBullets(newVal));
            }
        }
    }, [onChange]);
 
    // Paste: strip any existing bullets from pasted text so we don't double-bullet
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const el = ref.current;
        if (!el) return;
 
        const pasted = e.clipboardData.getData('text');
        const cleaned = pasted
            .split('\n')
            .map(l => l.replace(/^[•\-\*]\s?/, '').trim())
            .join('\n');
 
        const start  = el.selectionStart;
        const end    = el.selectionEnd;
        const before = el.value.slice(0, start);
        const after  = el.value.slice(end);
        const clean  = clipPaste(cleaned, value, stripBullets(el.value.slice(start, end)).length, maxLength);
 
        const newVal = before + clean + after;
        const newPos = start + clean.length;
 
        cursorRef.current = newPos;
        onChange(stripBullets(addBullets(newVal)));
    }, [onChange, value, maxLength]);
 
    return (
        <>
            <textarea
                ref={ref}
                {...focusProps}
                rows={rows}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={disabled}
                placeholder={placeholder ? `${BULLET}${placeholder}` : BULLET}
                className={className}
                spellCheck
            />
            {maxLength ? <CharCounter length={value.length} max={maxLength} focused={focused} /> : null}
        </>
    );
}

// ── Work Experience Modal ─────────────────────────────────────────────────────

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    draft: WorkExperienceEntry;
    draftFile: RowFile;
    errors: RowErrors;
    submitted: boolean;
    positions: PositionOption[];
    loadingPos: boolean;
    onFieldChange: (k: keyof WorkExperienceEntry, v: string | boolean) => void;
    onPositionChange: (title: string, sg?: string) => void;
    onFileChange: (rf: RowFile) => void;
    onSubmit: () => void;
    saving: boolean;
}

function WorkExperienceModal({
    open, onClose, title,
    draft, draftFile, errors, submitted,
    positions, loadingPos,
    onFieldChange, onPositionChange, onFileChange,
    onSubmit, saving,
}: ModalProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const base = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors resize-none";
    const ok   = `${base} border-gray-200 focus:ring-green-500`;
    const err  = `${base} border-red-400 focus:ring-red-400 bg-red-50`;
    const ic   = (k: keyof WorkExperienceEntry) => errors[k] ? err : ok;
    const { grade, step } = splitGradeStep(draft.salary_grade);

    const taBase = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors resize-none";
    const taOk   = `${taBase} border-gray-200 focus:ring-green-500`;

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

                    {/* Position Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Position Title <span className="text-red-500">*</span>
                        </label>
                        <PositionInput
                            value={draft.position_title ?? ''}
                            positions={positions}
                            loading={loadingPos}
                            onChange={onPositionChange}
                            hasError={!!errors.position_title}
                        />
                        {errors.position_title && <p className="mt-1 text-xs text-red-500">{errors.position_title}</p>}
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Department / Agency / Company <span className="text-red-500">*</span>
                        </label>
                        <LimitedInput maxLength={PDS_MAX.department} value={draft.department ?? ''} className={ic('department')}
                            placeholder="Agency or Company name"
                            onChange={e => onFieldChange('department', e.target.value)} />
                        {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                    </div>

                    {/* Office */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Office / Section / Unit <span className="text-red-500">*</span>
                        </label>
                        <LimitedInput maxLength={PDS_MAX.office} value={draft.office ?? ''} className={ic('office')}
                            placeholder="Office or Unit"
                            onChange={e => onFieldChange('office', e.target.value)} />
                        {errors.office && <p className="mt-1 text-xs text-red-500">{errors.office}</p>}
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
                                disabled={!!draft.is_present}
                                onChange={e => onFieldChange('date_to', e.target.value)} />
                            <label className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 cursor-pointer select-none">
                                <input type="checkbox" checked={!!draft.is_present}
                                    onChange={e => onFieldChange('is_present', e.target.checked)}
                                    className="accent-green-600" />
                                Present
                            </label>
                            {errors.date_to && <p className="mt-1 text-xs text-red-500">{errors.date_to}</p>}
                        </div>
                    </div>

                    {/* Status of Appointment */}
                    <div className='flex items-center gap-4'>
                        <div className='grow'>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Status of Appointment <span className="text-red-500">*</span>
                            </label>
                            <select value={draft.status_of_appointment ?? ''} className={ic('status_of_appointment')}
                                onChange={e => onFieldChange('status_of_appointment', e.target.value)}>
                                <option value="">Select status</option>
                                {APPOINTMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.status_of_appointment && <p className="mt-1 text-xs text-red-500">{errors.status_of_appointment}</p>}
                        </div>
                        <div className='mt-3'>
                            {/* Government Service */}
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input type="checkbox" checked={!!draft.is_government_service}
                                    onChange={e => onFieldChange('is_government_service', e.target.checked)}
                                    className="accent-green-600 w-4 h-4 cursor-pointer" />
                                <span className="text-sm text-gray-700">Government Service</span>
                            </label>
                        </div>
                    </div>

                    {/* Monthly Salary */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                            Monthly Salary
                        </label>
                        <input type="text" inputMode="decimal"
                            value={draft.monthly_salary == null ? '' : String(draft.monthly_salary)}
                            className={ic('monthly_salary')} placeholder="e.g. 21877.00"
                            onChange={e => onFieldChange('monthly_salary', cleanMoney(e.target.value))} />
                        {errors.monthly_salary && <p className="mt-1 text-xs text-red-500">{errors.monthly_salary}</p>}
                    </div>

                    {/* Salary/Job/Pay Grade & Step Increment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Salary/Job/Pay Grade
                            </label>
                            <input type="number" min="1" max="33" value={grade}
                                className={ic('salary_grade')} placeholder="e.g. 24"
                                onChange={e => onFieldChange('salary_grade', joinGradeStep(e.target.value, step))} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Step
                            </label>
                            <input type="number" min="1" max="8" value={step} disabled={!grade}
                                className={ic('salary_grade')} placeholder="e.g. 2"
                                onChange={e => onFieldChange('salary_grade', joinGradeStep(grade, e.target.value))} />
                            {errors.salary_grade && <p className="mt-1 text-xs text-red-500">{errors.salary_grade}</p>}
                        </div>
                    </div>

                    {/* ── Work Experience Sheet ── */}
                    <div className="border-t border-dashed border-gray-200 pt-4 space-y-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Work Experience Sheet Details</p>

                        {/* Supervisor */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Immediate Supervisor <span className="text-red-500">*</span>
                            </label>
                            <LimitedInput maxLength={PDS_MAX.supervisor} value={draft.supervisor ?? ''} className={ic('supervisor')}
                                placeholder="Write full name"
                                onChange={e => onFieldChange('supervisor', e.target.value)} />
                            {errors.supervisor && <p className="mt-1 text-xs text-red-500">{errors.supervisor}</p>}
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Location of Agency <span className="text-red-500">*</span>
                            </label>
                            <LimitedInput maxLength={PDS_MAX.location} value={draft.location ?? ''} className={ic('location')}
                                placeholder="e.g. Pili, Camarines Sur"
                                onChange={e => onFieldChange('location', e.target.value)} />
                            {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                        </div>

                        {/* Accomplishments */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                List of Accomplishments and Contributions <span className="text-red-500">*</span>
                            </label>
                            <BulletTextarea
                                rows={4}
                                maxLength={PDS_MAX.accomplishments}
                                value={draft.accomplishments ?? ''}
                                onChange={val => onFieldChange('accomplishments', val)}
                                placeholder="Developed recruitment plan"
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors resize-none ${
                                    errors.accomplishments
                                        ? 'border-red-400 focus:ring-red-400 bg-red-50'
                                        : 'border-gray-200 focus:ring-green-500'
                                }`}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Each line will appear as a bullet point in the Work Experience Sheet.</p>
                            {errors.accomplishments && <p className="mt-1 text-xs text-red-500">{errors.accomplishments}</p>}
                        </div>

                        {/* Actual Duties */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                                Summary of Actual Duties <span className="text-red-500">*</span>
                            </label>
                            <BulletTextarea
                                rows={4}
                                maxLength={PDS_MAX.actual_duties}
                                value={draft.actual_duties ?? ''}
                                onChange={val => onFieldChange('actual_duties', val)}
                                placeholder="Responsible for management of recruitment and selection process"
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors resize-none ${
                                    errors.actual_duties
                                        ? 'border-red-400 focus:ring-red-400 bg-red-50'
                                        : 'border-gray-200 focus:ring-green-500'
                                }`}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Each line will appear as a bullet point in the Work Experience Sheet.</p>
                            {errors.actual_duties && <p className="mt-1 text-xs text-red-500">{errors.actual_duties}</p>}
                        </div>
                    </div>

                    {/* Attachment */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
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

// ── Work Experience Card ──────────────────────────────────────────────────────

interface CardProps {
    row: WorkExperienceEntry;
    rowFile: RowFile;
    onEdit: () => void;
    onDelete: () => void;
}

function WorkExperienceCard({ row, rowFile, onEdit, onDelete }: CardProps) {
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
    const viewUrl = rowFile.preview ?? (hasExisting ? pdsFileUrl(rowFile.existing) : null);

    const dateRange = row.is_present
        ? `${formatDate(row.date_from)} – Present`
        : `${formatDate(row.date_from)} – ${formatDate(row.date_to)}`;

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
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
                <BriefcaseBusiness className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {row.position_title || <span className="text-gray-400 italic">No position title</span>}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">{row.department}</p>
                <p className="text-xs text-gray-500 mt-0.5">{row.status_of_appointment}</p>
                {(row.monthly_salary || row.salary_grade) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                        {[
                            row.monthly_salary ? `P${Number(row.monthly_salary).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
                            row.salary_grade ? `SG ${row.salary_grade}` : null,
                        ].filter(Boolean).join(' · ')}
                    </p>
                )}
                <p className="text-xs text-gray-600 mt-0.5">{(row.date_from || row.is_present) && dateRange}</p>
                {row.is_government_service && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">Government Service</p>
                )}

                {label && viewUrl && (
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-700 font-medium border border-green-200 hover:bg-green-50 hover:border-green-300 px-2.5 py-1 rounded-lg transition-colors">
                        Show Credentials <ExternalLink className='w-3 h-3' />
                    </a>
                )}
            </div>

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

export default function WorkExperienceSection({ pdsData, onSave, saving }: Props) {
    const initialRows = (pdsData.work_experience?.length ? pdsData.work_experience : []) as WorkExperienceEntry[];

    const [rows,     setRows]     = useState<WorkExperienceEntry[]>(initialRows);
    const [rowFiles, setRowFiles] = useState<RowFile[]>(
        initialRows.map(row => ({
            file:     null,
            existing: row.attachment ?? null,
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
        (pdsData.work_experience ?? []).map((e: any) => ({ id: e.id, attachment: e.attachment }))
    );
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        const fresh = (pdsData.work_experience?.length ? pdsData.work_experience : []) as WorkExperienceEntry[];
        setRows(fresh);
        setRowFiles(prev => fresh.map((row, i) => {
            if (prev[i]?.preview) URL.revokeObjectURL(prev[i].preview!);
            return { file: null, existing: row.attachment ?? null, preview: null };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workKey]);

    useEffect(() => {
        return () => { rowFiles.forEach(rf => { if (rf.preview) URL.revokeObjectURL(rf.preview); }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [modal,       setModal]       = useState<ModalMode | null>(null);
    const [draft,       setDraft]       = useState<WorkExperienceEntry>({ ...EMPTY });
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

    const handleFieldChange = (k: keyof WorkExperienceEntry, v: string | boolean) => {
        setDraft(prev => ({ ...prev, [k]: v }));
        if (submitted) setDraftErrors(prev => ({ ...prev, [k]: undefined }));
    };

    const handlePositionChange = (title: string, sg?: string) => {
        setDraft(prev => ({
            ...prev,
            position_title: title,
            ...(sg !== undefined ? { salary_grade: joinGradeStep(sg, splitGradeStep(prev.salary_grade).step) } : {}),
        }));
        if (submitted) setDraftErrors(prev => ({ ...prev, position_title: undefined }));
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

        let nextRows: WorkExperienceEntry[];
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
        onSave('work_experience', buildFormData(nextRows, nextFiles));
    };

    const handleDelete = async (index: number) => {
        const label = rows[index]?.position_title?.trim() || 'this work experience';
        const result = await Swal.fire({
            title: 'Delete Work Experience?',
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
        onSave('work_experience', buildFormData(nextRows, nextFiles));
    };

    return (
        <div className="space-y-1">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-base font-semibold text-green-800 uppercase">V. Work Experience</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Include private employment. Start from your most recent work.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-3">
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            {rows.length === 0 ? (
                <div onClick={openAdd}
                    className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50/50 transition-colors cursor-pointer">
                    <BriefcaseBusiness className="w-8 h-8" />
                    <p className="text-sm font-medium">Add your Work Experience</p>
                    <p className="text-xs">Click to get started</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                    {rows.map((row, i) => (
                        <WorkExperienceCard
                            key={i}
                            row={row}
                            rowFile={rowFiles[i] ?? { file: null, existing: null, preview: null }}
                            onEdit={() => openEdit(i)}
                            onDelete={() => handleDelete(i)}
                        />
                    ))}
                </div>
            )}

            <WorkExperienceModal
                open={modal !== null}
                onClose={closeModal}
                title={modal?.type === 'edit' ? 'Edit Work Experience' : 'Add Work Experience'}
                draft={draft}
                draftFile={draftFile}
                errors={draftErrors}
                submitted={submitted}
                positions={positions}
                loadingPos={loadingPos}
                onFieldChange={handleFieldChange}
                onPositionChange={handlePositionChange}
                onFileChange={handleFileChange}
                onSubmit={handleModalSubmit}
                saving={saving}
            />
        </div>
    );
}