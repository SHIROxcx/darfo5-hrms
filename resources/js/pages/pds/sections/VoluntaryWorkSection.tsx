// VoluntaryWorkSection.tsx
import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsVoluntaryWork, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

const EMPTY_VW: PdsVoluntaryWork = { organization_name: '', organization_address: '', date_from: '', date_to: '', number_of_hours: '', position: '' };

export default function VoluntaryWorkSection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsVoluntaryWork[]>(
        pdsData.voluntary_work?.length ? pdsData.voluntary_work : [{ ...EMPTY_VW }]
    );
    const inputClass = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";
    const setRow = (i: number, key: keyof PdsVoluntaryWork, val: string) =>
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('voluntary_work', { voluntary_work: rows } as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">VI. VOLUNTARY WORK</h2>
                    <p className="text-xs text-gray-500">Involvement in Civic / Non-government / People / Voluntary Organizations.
                        <span className="font-medium text-green-700"> Write N/A if not applicable.</span>
                    </p>
                    
                </div>
                <button type="button" onClick={() => setRows(p => [...p, { ...EMPTY_VW }])}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium mt-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Name and Address of Organization</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">Date From</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">Date To</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">Hours</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Position/Nature of Work</th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="px-2 py-1.5">
                                    <input type="text" value={row.organization_name ?? ''} onChange={e => setRow(i, 'organization_name', e.target.value)} placeholder="Organization name (Write in full)" className={inputClass} />
                                    <input type="text" value={row.organization_address ?? ''} onChange={e => setRow(i, 'organization_address', e.target.value)} placeholder="Address (Write in full)" className={`${inputClass} mt-1`} />
                                </td>
                                <td className="px-2 py-1.5"><input type="date" value={row.date_from ?? ''} onChange={e => setRow(i, 'date_from', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="date" value={row.date_to ?? ''} onChange={e => setRow(i, 'date_to', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="number" value={row.number_of_hours as string ?? ''} onChange={e => setRow(i, 'number_of_hours', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="text" value={row.position ?? ''} onChange={e => setRow(i, 'position', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5">
                                    {rows.length > 1 && <button type="button" onClick={() => setRows(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving
                        ? <><Spinner />Saving Volunatary Work</>
                        : <><Save className="w-4 h-4" />Save Volunatary Work</>
                    }
                </button>
            </div>
        </form>
    );
}