import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsEligibility } from '@/types/pds';

interface Props { user: User; pdsData: PdsData; onSave: (s: string, d: Record<string, unknown>) => void; saving: boolean; }

const EMPTY: PdsEligibility = { career_service: '', rating: '', date_of_examination: '', place_of_examination: '', license_number: '', license_validity: '' };

export default function EligibilitySection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsEligibility[]>(
        pdsData.eligibilities?.length ? pdsData.eligibilities : [{ ...EMPTY }]
    );

    const inputClass = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";

    const setRow = (i: number, key: keyof PdsEligibility, val: string) =>
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('eligibility', { eligibilities: rows } as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-1">IV. Civil Service Eligibility</h2>
                    <p className="text-xs text-gray-500">Include Career Service, RA 1080, Special Laws, CES, CSEE, Barangay Eligibility, Driver's License.</p>
                </div>
                <button type="button" onClick={() => setRows(p => [...p, { ...EMPTY }])}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium mt-1">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Career Service / Eligibility</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">Rating</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">Date of Exam</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Place of Exam</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">License No.</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">Validity</th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="px-2 py-1.5"><input type="text" value={row.career_service ?? ''} onChange={e => setRow(i, 'career_service', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.rating ?? ''} onChange={e => setRow(i, 'rating', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="date" value={row.date_of_examination ?? ''} onChange={e => setRow(i, 'date_of_examination', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.place_of_examination ?? ''} onChange={e => setRow(i, 'place_of_examination', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.license_number ?? ''} onChange={e => setRow(i, 'license_number', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="date" value={row.license_validity ?? ''} onChange={e => setRow(i, 'license_validity', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5">
                                    {rows.length > 1 && (
                                        <button type="button" onClick={() => setRows(p => p.filter((_, idx) => idx !== i))}
                                            className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Eligibilities'}
                </button>
            </div>
        </form>
    );
}