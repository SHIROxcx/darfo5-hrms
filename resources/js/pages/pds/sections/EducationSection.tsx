// EducationSection.tsx
import { useState } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsEducation } from '@/types/pds';

interface Props { user: User; pdsData: PdsData; onSave: (s: string, d: Record<string, unknown>) => void; saving: boolean; }

const LEVELS: PdsEducation['level'][] = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies'];

const DEFAULT_EDU = (level: PdsEducation['level']): PdsEducation => ({
    level, school_name: '', course: '', period_from: '', period_to: '',
    highest_level: '', year_graduated: '', honors_received: '',
});

export default function EducationSection({ pdsData, onSave, saving }: Props) {
    const init = LEVELS.map(level =>
        pdsData.education?.find(e => e.level === level) ?? DEFAULT_EDU(level)
    );
    const [rows, setRows] = useState<PdsEducation[]>(init);

    const setRow = (i: number, key: keyof PdsEducation, val: string) =>
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

    const inputClass = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('education', { education: rows } as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">III. Educational Background</h2>
                <p className="text-xs text-gray-500">Write school names in full. Do not abbreviate.</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">Level</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">School Name</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Degree/Course</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">From</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">To</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-24">Highest Level</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">Year Grad.</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Honors</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={row.level} className="border-b border-gray-100 last:border-0">
                                <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">{row.level}</td>
                                <td className="px-2 py-1.5"><input type="text" value={row.school_name ?? ''} onChange={e => setRow(i, 'school_name', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.course ?? ''} onChange={e => setRow(i, 'course', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.period_from ?? ''} onChange={e => setRow(i, 'period_from', e.target.value)} className={inputClass} placeholder="yyyy" /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.period_to ?? ''} onChange={e => setRow(i, 'period_to', e.target.value)} className={inputClass} placeholder="yyyy" /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.highest_level ?? ''} onChange={e => setRow(i, 'highest_level', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.year_graduated ?? ''} onChange={e => setRow(i, 'year_graduated', e.target.value)} className={inputClass} placeholder="yyyy" /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.honors_received ?? ''} onChange={e => setRow(i, 'honors_received', e.target.value)} className={inputClass} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Education'}
                </button>
            </div>
        </form>
    );
}