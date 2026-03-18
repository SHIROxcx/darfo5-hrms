import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsWorkExperience, PdsSaveCallback } from '@/types/pds';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

const EMPTY: PdsWorkExperience = {
    date_from: '', date_to: '', is_present: false, position_title: '', department: '',
    monthly_salary: '', salary_grade: '', status_of_appointment: '', is_government_service: false,
};

export default function WorkExperienceSection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsWorkExperience[]>(
        pdsData.work_experience?.length ? pdsData.work_experience : [{ ...EMPTY }]
    );

    const inputClass = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white";

    const setRow = (i: number, key: keyof PdsWorkExperience, val: string | boolean) =>
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('work_experience', { work_experience: rows } as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-1">V. Work Experience</h2>
                    <p className="text-xs text-gray-500">Include private employment. Start from your most recent work.</p>
                </div>
                <button type="button" onClick={() => setRows(p => [{ ...EMPTY }, ...p])}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>
            <div className="space-y-3">
                {rows.map((row, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry {i + 1}</span>
                            {rows.length > 1 && (
                                <button type="button" onClick={() => setRows(p => p.filter((_, idx) => idx !== i))}
                                    className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs">
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date From</label>
                                <input type="date" value={row.date_from ?? ''} onChange={e => setRow(i, 'date_from', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date To</label>
                                <input type="date" value={row.date_to ?? ''} onChange={e => setRow(i, 'date_to', e.target.value)}
                                    disabled={!!row.is_present} className={inputClass} />
                                <label className="flex items-center gap-1 mt-1 text-xs text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={!!row.is_present} onChange={e => setRow(i, 'is_present', e.target.checked)}
                                        className="accent-blue-600" />
                                    Present
                                </label>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Position Title</label>
                                <input type="text" value={row.position_title ?? ''} onChange={e => setRow(i, 'position_title', e.target.value)} className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Department/Agency/Company</label>
                                <input type="text" value={row.department ?? ''} onChange={e => setRow(i, 'department', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Monthly Salary</label>
                                <input type="number" step="0.01" value={row.monthly_salary as string ?? ''} onChange={e => setRow(i, 'monthly_salary', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Salary Grade/Step</label>
                                <input type="text" value={row.salary_grade ?? ''} onChange={e => setRow(i, 'salary_grade', e.target.value)} className={inputClass} placeholder="e.g. 15-3" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status of Appointment</label>
                                <select value={row.status_of_appointment ?? ''} onChange={e => setRow(i, 'status_of_appointment', e.target.value)} className={inputClass}>
                                    <option value="">Select</option>
                                    {['Permanent', 'Temporary', 'Casual', 'Coterminous', 'Contractual', 'Substitute', 'Job Order', 'Contract of Service'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end pb-1.5">
                                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={!!row.is_government_service} onChange={e => setRow(i, 'is_government_service', e.target.checked)}
                                        className="accent-blue-600" />
                                    Government Service
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Work Experience'}
                </button>
            </div>
        </form>
    );
}