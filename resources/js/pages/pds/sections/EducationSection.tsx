import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, X, GraduationCap, Pencil, CheckCircle2 } from 'lucide-react';
import type { User, PdsData, PdsEducation, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS: PdsEducation['level'][] = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies'];

const LEVEL_META: Record<string, { label: string; description: string }> = {
    'Elementary':        { label: 'Elementary',         description: 'Elementary Education' },
    'Secondary':         { label: 'Secondary',          description: 'Secondary Education' },
    'Vocational':        { label: 'Vocational / Trade', description: 'Technical-Vocational Education' },
    'College':           { label: 'College',            description: "Bachelor's Degree" },
    'Graduate Studies':  { label: 'Graduate Studies',   description: "Master's / Doctorate" },
};

const DEFAULT_EDU = (level: PdsEducation['level']): PdsEducation => ({
    level, school_name: '', course: '', period_from: '', period_to: '',
    highest_level: '', year_graduated: '', honors_received: '',
});

// ── Validation ────────────────────────────────────────────────────────────────

const REQUIRED_COLS: Array<keyof PdsEducation> = [
    'school_name', 'course', 'period_from', 'period_to',
    'highest_level', 'year_graduated', 'honors_received',
];

type RowErrors = Partial<Record<keyof PdsEducation, string>>;

function validateRow(row: PdsEducation): RowErrors {
    const errs: RowErrors = {};
    for (const key of REQUIRED_COLS) {
        const val = row[key];
        if (!val || String(val).trim() === '') errs[key] = 'Required. Write N/A if not applicable.';
    }
    return errs;
}

function isFilled(row: PdsEducation): boolean {
    return REQUIRED_COLS.every(k => {
        const v = row[k];
        return v && String(v).trim() !== '';
    });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
    open: boolean;
    onClose: () => void;
    level: PdsEducation['level'];
    draft: PdsEducation;
    errors: RowErrors;
    onChange: (key: keyof PdsEducation, val: string) => void;
    onSubmit: () => void;
    saving: boolean;
}

function EducationModal({ open, onClose, level, draft, errors, onChange, onSubmit, saving }: ModalProps) {
    const meta = LEVEL_META[level];

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const base = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors";
    const ok  = `${base} border-gray-200 focus:ring-green-500`;
    const err = `${base} border-red-400 focus:ring-red-400 bg-red-50`;
    const ic  = (k: keyof PdsEducation) => errors[k] ? err : ok;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">{meta.label}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
                    </div>
                    <button type="button" onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                    {/* School Name */}
                    <div>
                        <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                            Name of School <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.school_name ?? ''} className={ic('school_name')}
                            placeholder="Write school name in full. Do not abbreviate."
                            onChange={e => onChange('school_name', e.target.value)} />
                        {errors.school_name && <p className="mt-1 text-xs text-red-500">{errors.school_name}</p>}
                    </div>

                    {/* Degree / Course */}
                    <div>
                        <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                            Degree / Course <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.course ?? ''} className={ic('course')}
                            placeholder="e.g. Bachelor of Science in Agriculture or N/A"
                            onChange={e => onChange('course', e.target.value)} />
                        {errors.course && <p className="mt-1 text-xs text-red-500">{errors.course}</p>}
                    </div>

                    {/* Period */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                                From (Year) <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={draft.period_from ?? ''} className={ic('period_from')}
                                placeholder="e.g. 2018 or N/A"
                                onChange={e => onChange('period_from', e.target.value)} />
                            {errors.period_from && <p className="mt-1 text-xs text-red-500">{errors.period_from}</p>}
                        </div>
                        <div>
                            <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                                To (Year) <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={draft.period_to ?? ''} className={ic('period_to')}
                                placeholder="e.g. 2022 or N/A"
                                onChange={e => onChange('period_to', e.target.value)} />
                            {errors.period_to && <p className="mt-1 text-xs text-red-500">{errors.period_to}</p>}
                        </div>
                    </div>

                    {/* Highest Level & Year Graduated */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                                Highest Level / Units Earned <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={draft.highest_level ?? ''} className={ic('highest_level')}
                                placeholder="e.g. Graduate or N/A"
                                onChange={e => onChange('highest_level', e.target.value)} />
                            {errors.highest_level && <p className="mt-1 text-xs text-red-500">{errors.highest_level}</p>}
                        </div>
                        <div>
                            <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                                Year Graduated <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={draft.year_graduated ?? ''} className={ic('year_graduated')}
                                placeholder="e.g. 2022 or N/A"
                                onChange={e => onChange('year_graduated', e.target.value)} />
                            {errors.year_graduated && <p className="mt-1 text-xs text-red-500">{errors.year_graduated}</p>}
                        </div>
                    </div>

                    {/* Honors */}
                    <div>
                        <label className="uppercase block text-xs font-medium text-gray-600 mb-1">
                            Scholarship / Honors Received <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.honors_received ?? ''} className={ic('honors_received')}
                            placeholder="e.g. Cum Laude or N/A"
                            onChange={e => onChange('honors_received', e.target.value)} />
                        {errors.honors_received && <p className="mt-1 text-xs text-red-500">{errors.honors_received}</p>}
                    </div>

                    <p className="text-[11px] text-gray-400 italic">
                        Write school names and degree/course in full. Do not abbreviate. Write <strong>N/A</strong> if not applicable.
                    </p>
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

// ── Level Card ────────────────────────────────────────────────────────────────

interface CardProps {
    row: PdsEducation;
    onEdit: () => void;
}

function EducationCard({ row, onEdit }: CardProps) {
    const meta = LEVEL_META[row.level];
    const filled = isFilled(row);

    return (
        <div className="flex items-start gap-3 p-4 transition-colors min-h-27">
            {/* Icon */}
            <div className={`hidden md:flex w-10 h-10 rounded-xl items-center justify-center shrink-0 mt-0.5 ${
                filled ? 'bg-green-600' : 'bg-gray-100 border border-dashed border-gray-300'
            }`}>
                {filled
                    ? <GraduationCap className="w-5 h-5 text-white/90" />
                    : <GraduationCap className="w-5 h-5 text-gray-400" />
                }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                    {filled && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    )}
                </div>

                {filled ? (
                    <>
                        <p className="text-xs text-gray-700 mt-0.5 font-medium truncate">{row.school_name}</p>
                        <p className="text-xs text-gray-500 truncate">{row.course}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                            {(row.period_from || row.period_to) && row.period_from !== 'N/A' && (
                                <span>{row.period_from} – {row.period_to}</span>
                            )}
                            {/* {row.year_graduated && row.year_graduated !== 'N/A' && (
                                <span>Graduated {row.year_graduated}</span>
                            )} */}
                        </div>
                        <p className='text-xs'>
                            {row.honors_received && row.honors_received !== 'N/A' && (
                                <span className="text-green-600 font-medium">{row.honors_received}</span>
                            )}
                        </p>
                    </>
                ) : (
                    <p className="text-xs text-gray-400 mt-0.5 italic">{meta.description} — not yet filled</p>
                )}
            </div>

            {/* Edit button */}
            <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors cursor-pointer shrink-0"
                title={`Edit ${meta.label}`}>
                <Pencil className="w-4 h-4" />
            </button>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EducationSection({ pdsData, onSave, saving }: Props) {
    const init = LEVELS.map(level =>
        pdsData.education?.find(e => e.level === level) ?? DEFAULT_EDU(level)
    );
    const [rows, setRows] = useState<PdsEducation[]>(init);

    // Modal state
    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    const [draft, setDraft] = useState<PdsEducation>(DEFAULT_EDU('Elementary'));
    const [draftErrors, setDraftErrors] = useState<RowErrors>({});
    const [submitted, setSubmitted] = useState(false);

    const openModal = (idx: number) => {
        setDraft({ ...rows[idx] });
        setDraftErrors({});
        setSubmitted(false);
        setActiveIdx(idx);
    };

    const closeModal = () => {
        setActiveIdx(null);
        setDraftErrors({});
        setSubmitted(false);
    };

    const handleChange = (key: keyof PdsEducation, val: string) => {
        setDraft(prev => ({ ...prev, [key]: val }));
        if (submitted) setDraftErrors(prev => ({ ...prev, [key]: undefined }));
    };

    const handleSubmit = () => {
        setSubmitted(true);
        const errs = validateRow(draft);
        if (Object.keys(errs).length > 0) {
            setDraftErrors(errs);
            return;
        }

        const nextRows = rows.map((r, i) => i === activeIdx ? draft : r);
        setRows(nextRows);
        closeModal();
        onSave('education', { education: nextRows } as unknown as Record<string, unknown>);
    };

    return (
        <div className="space-y-1">
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-base font-semibold text-green-800 uppercase">III. Educational Background</h2>
                <p className="hidden sm:block text-xs text-gray-500 mt-0.5">
                    Write school names and degree/course in full. Do not abbreviate.{' '}
                    <span className="font-medium text-green-700">Write N/A if not applicable.</span>
                </p>
            </div>

            {/* Cards */}
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                {rows.map((row, i) => (
                    <EducationCard
                        key={row.level}
                        row={row}
                        onEdit={() => openModal(i)}
                    />
                ))}
            </div>

            {/* Modal */}
            {activeIdx !== null && (
                <EducationModal
                    open
                    onClose={closeModal}
                    level={rows[activeIdx].level}
                    draft={draft}
                    errors={draftErrors}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    saving={saving}
                />
            )}
        </div>
    );
}