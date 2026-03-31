import { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsWorkExperience, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

interface PositionOption {
    id: number;
    title: string;
    salary_grade: number;
}

const EMPTY: PdsWorkExperience = {
    date_from: '', date_to: '', is_present: false, position_title: '', department: '', status_of_appointment: '', is_government_service: false,
};

// Searchable Position Input

interface PositionInputProps {
    value: string;
    positions: PositionOption[];
    loading: boolean;
    onChange: (title: string, salaryGrade?: string) => void;
    inputClass: string;
}

function PositionInput({ value, positions, loading, onChange, inputClass }: PositionInputProps) {
    const [search, setSearch]     = useState(value);
    const [open, setOpen]         = useState(false);
    const [style, setStyle]       = useState<React.CSSProperties>({});
    const inputRef                = useRef<HTMLInputElement>(null);

    // Keep search in sync if parent resets the row
    useEffect(() => { setSearch(value); }, [value]);

    const filtered = search.trim().length === 0
        ? positions
        : positions.filter(p =>
            p.title.toLowerCase().includes(search.toLowerCase())
        );

    function openDropdown() {
        if (inputRef.current) {
            const r = inputRef.current.getBoundingClientRect();
            setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
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
        // Pass the typed value immediately so it's saved as-is if no match is selected
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
                placeholder={loading ? 'Loading positions...' : 'Search or type position title'}
                autoComplete="off"
                className={`${inputClass} ${loading ? 'text-gray-400' : ''} pr-6`}
            />
            {/* Backdrop */}
            {open && (
                <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setOpen(false)} />
            )}
            {/* Dropdown */}
            {open && (
                <ul style={style} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-xs">
                    {filtered.length > 0
                        ? filtered.map(p => (
                            <li
                                key={p.id}
                                onMouseDown={() => select(p)}
                                className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-green-50"
                            >
                                <span className="text-gray-800">{p.title}</span>
                                <span className="ml-3 shrink-0 text-gray-400">SG {p.salary_grade}</span>
                            </li>
                        ))
                        : (
                            <li className="px-3 py-2 text-gray-400 italic">
                                No match — your entry will be saved as typed.
                            </li>
                        )
                    }
                </ul>
            )}
        </div>
    );
}

// Main Component

export default function WorkExperienceSection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsWorkExperience[]>(
        pdsData.work_experience?.length ? pdsData.work_experience : [{ ...EMPTY }]
    );

    const [positions,  setPositions]  = useState<PositionOption[]>([]);
    const [loadingPos, setLoadingPos] = useState(true);

    useEffect(() => {
        fetch('/positions')
            .then(r => r.json())
            .then(d => { setPositions(d); setLoadingPos(false); })
            .catch(() => setLoadingPos(false));
    }, []);

    const inputClass = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";
    const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

    const setRow = (i: number, key: keyof PdsWorkExperience, val: string | boolean) =>
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

    const setPosition = (i: number, title: string, salaryGrade?: string) => {
        setRows(prev => prev.map((r, idx) => {
            if (idx !== i) return r;
            return {
                ...r,
                position_title: title,
                // Only overwrite salary_grade when a match was selected (salaryGrade defined)
                ...(salaryGrade !== undefined ? { salary_grade: salaryGrade } : {}),
            };
        }));
    };

    const addRow    = () => setRows(p => [{ ...EMPTY }, ...p]);
    const removeRow = (i: number) => setRows(p => p.filter((_, idx) => idx !== i));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('work_experience', { work_experience: rows } as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">V. Work Experience</h2>
                    <p className="text-xs text-gray-500">Include private employment. Start from your most recent work.</p>
                </div>
                <button type="button" onClick={addRow}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium mt-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>

            <div className="space-y-3">
                {rows.map((row, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                        {/* Row header */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                Entry {i + 1}
                            </span>
                            {rows.length > 1 && (
                                <button type="button" title='Remove' onClick={() => removeRow(i)}
                                    className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Department */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>Department/Agency/Company</label>
                                <input type="text" value={row.department ?? ''}
                                    onChange={e => setRow(i, 'department', e.target.value)}
                                    className={inputClass} />
                            </div>
                            
                            {/* Date From */}
                            <div>
                                <label className={labelClass}>Date From</label>
                                <input type="date" value={row.date_from ?? ''}
                                    onChange={e => setRow(i, 'date_from', e.target.value)}
                                    className={inputClass} />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className={labelClass}>Date To</label>
                                <input type="date" value={row.date_to ?? ''}
                                    onChange={e => setRow(i, 'date_to', e.target.value)}
                                    disabled={!!row.is_present}
                                    className={inputClass} />
                                <label className="flex items-center gap-1 mt-1 text-xs text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={!!row.is_present}
                                        onChange={e => setRow(i, 'is_present', e.target.checked)}
                                        className="accent-green-600" />
                                    Present
                                </label>
                            </div>

                            {/* Position Title — searchable */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>Position Title</label>
                                <PositionInput
                                    value={row.position_title ?? ''}
                                    positions={positions}
                                    loading={loadingPos}
                                    onChange={(title, sg) => setPosition(i, title, sg)}
                                    inputClass={inputClass}
                                />
                            </div>

                            {/* Status of Appointment */}
                            <div>
                                <label className={labelClass}>Status of Appointment</label>
                                <select value={row.status_of_appointment ?? ''}
                                    onChange={e => setRow(i, 'status_of_appointment', e.target.value)}
                                    className={inputClass}>
                                    <option value="">Select</option>
                                    {[
                                        'Permanent', 'Temporary', 'Casual', 'Coterminous',
                                        'Contractual', 'Substitute', 'Job Order', 'Contract of Service',
                                    ].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Government Service checkbox */}
                            <div className="flex items-end pb-1.5">
                                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={!!row.is_government_service}
                                        onChange={e => setRow(i, 'is_government_service', e.target.checked)}
                                        className="accent-green-600" />
                                    Government Service
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
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