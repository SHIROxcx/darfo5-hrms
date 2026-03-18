import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsReference, PdsGovernmentId, PdsSaveCallback } from '@/types/pds';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

const GOV_IDS = ['Passport', 'GSIS e-Card', 'SSS Card', 'PRC ID', "Driver's License", 'NBI Clearance', 'Police Clearance', 'Postal ID', 'Voter\'s ID', 'PhilHealth ID', 'Senior Citizen ID', 'UMID', 'PWD ID', 'Solo Parent ID', 'Others'];

export default function ReferencesSection({ pdsData, onSave, saving }: Props) {
    const [refs, setRefs] = useState<PdsReference[]>(
        pdsData.references?.length ? pdsData.references : [
            { name: '', address: '', telephone: '' },
            { name: '', address: '', telephone: '' },
            { name: '', address: '', telephone: '' },
        ]
    );
    const [govId, setGovId] = useState<PdsGovernmentId>({
        id_type: pdsData.government_id?.id_type ?? '',
        id_number: pdsData.government_id?.id_number ?? '',
        date_of_issuance: pdsData.government_id?.date_of_issuance ?? '',
        place_of_issuance: pdsData.government_id?.place_of_issuance ?? '',
    });

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";
    const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

    const setRef = (i: number, key: keyof PdsReference, val: string) =>
        setRefs(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Save references
        onSave('references', { references: refs } as unknown as Record<string, unknown>);
        // Save government ID
        onSave('government_id', govId as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">X. References & Government ID</h2>
                <p className="text-xs text-gray-500">References must not be related by consanguinity or affinity to the applicant/appointee.</p>
            </div>

            {/* References */}
            <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">41. References</h3>
                    <button type="button" onClick={() => setRefs(p => [...p, { name: '', address: '', telephone: '' }])}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add Reference
                    </button>
                </div>
                <div className="space-y-3">
                    {refs.map((ref, i) => (
                        <div key={i} className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference {i + 1}</span>
                                {refs.length > 1 && (
                                    <button type="button" onClick={() => setRefs(p => p.filter((_, idx) => idx !== i))}
                                        className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className={labelClass}>Name</label>
                                    <input type="text" value={ref.name ?? ''} onChange={e => setRef(i, 'name', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Address</label>
                                    <input type="text" value={ref.address ?? ''} onChange={e => setRef(i, 'address', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Telephone No.</label>
                                    <input type="text" value={ref.telephone ?? ''} onChange={e => setRef(i, 'telephone', e.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Government ID */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Government Issued ID</h3>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-xs text-gray-500 mb-3">i.e. Passport, GSIS, SSS, PRC, Driver's License, etc. Indicate ID Number and Date of Issuance.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Government Issued ID</label>
                            <select value={govId.id_type ?? ''} onChange={e => setGovId(p => ({ ...p, id_type: e.target.value }))} className={inputClass}>
                                <option value="">Select ID type</option>
                                {GOV_IDS.map(id => <option key={id} value={id}>{id}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>ID / License / Passport No.</label>
                            <input type="text" value={govId.id_number ?? ''} onChange={e => setGovId(p => ({ ...p, id_number: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Date of Issuance</label>
                            <input type="text" value={govId.date_of_issuance ?? ''} onChange={e => setGovId(p => ({ ...p, date_of_issuance: e.target.value }))} className={inputClass} placeholder="mm/dd/yyyy or Month DD, YYYY" />
                        </div>
                        <div>
                            <label className={labelClass}>Place of Issuance</label>
                            <input type="text" value={govId.place_of_issuance ?? ''} onChange={e => setGovId(p => ({ ...p, place_of_issuance: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Declaration note */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Declaration:</strong> I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
                </p>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save References & ID'}
                </button>
            </div>
        </form>
    );
}