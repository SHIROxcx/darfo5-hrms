import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsFamilyBackground, PdsChild, PdsSaveCallback } from '@/types/pds';

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: PdsSaveCallback;
    saving: boolean;
}

export default function FamilyBackgroundSection({ pdsData, onSave, saving }: Props) {
    const [form, setForm] = useState<PdsFamilyBackground>({
        spouse_surname: pdsData.family?.spouse_surname ?? '',
        spouse_first_name: pdsData.family?.spouse_first_name ?? '',
        spouse_middle_name: pdsData.family?.spouse_middle_name ?? '',
        spouse_name_ext: pdsData.family?.spouse_name_ext ?? '',
        spouse_occupation: pdsData.family?.spouse_occupation ?? '',
        spouse_employer: pdsData.family?.spouse_employer ?? '',
        spouse_business_address: pdsData.family?.spouse_business_address ?? '',
        spouse_telephone: pdsData.family?.spouse_telephone ?? '',
        father_surname: pdsData.family?.father_surname ?? '',
        father_first_name: pdsData.family?.father_first_name ?? '',
        father_middle_name: pdsData.family?.father_middle_name ?? '',
        father_name_ext: pdsData.family?.father_name_ext ?? '',
        mother_surname: pdsData.family?.mother_surname ?? '',
        mother_first_name: pdsData.family?.mother_first_name ?? '',
        mother_middle_name: pdsData.family?.mother_middle_name ?? '',
    });

    const [children, setChildren] = useState<PdsChild[]>(
        pdsData.children?.length ? pdsData.children : [{ full_name: '', date_of_birth: '' }]
    );

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";
    const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

    const setField = (key: keyof PdsFamilyBackground, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const addChild = () => setChildren(prev => [...prev, { full_name: '', date_of_birth: '' }]);
    const removeChild = (i: number) => setChildren(prev => prev.filter((_, idx) => idx !== i));
    const setChild = (i: number, key: keyof PdsChild, value: string) =>
        setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('family', { ...form, children } as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">II. Family Background</h2>
                <p className="text-xs text-gray-500">Enter N/A if not applicable.</p>
            </div>

            {/* Spouse */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">22. Spouse's Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>Surname</label>
                        <input type="text" value={form.spouse_surname} onChange={e => setField('spouse_surname', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>First Name</label>
                        <input type="text" value={form.spouse_first_name} onChange={e => setField('spouse_first_name', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Middle Name</label>
                        <input type="text" value={form.spouse_middle_name} onChange={e => setField('spouse_middle_name', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Name Extension</label>
                        <input type="text" value={form.spouse_name_ext} onChange={e => setField('spouse_name_ext', e.target.value)} className={inputClass} placeholder="Jr., Sr." />
                    </div>
                    <div>
                        <label className={labelClass}>Occupation</label>
                        <input type="text" value={form.spouse_occupation} onChange={e => setField('spouse_occupation', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Employer/Business Name</label>
                        <input type="text" value={form.spouse_employer} onChange={e => setField('spouse_employer', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Business Address</label>
                        <input type="text" value={form.spouse_business_address} onChange={e => setField('spouse_business_address', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Telephone No.</label>
                        <input type="text" value={form.spouse_telephone} onChange={e => setField('spouse_telephone', e.target.value)} className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Father */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">24. Father's Name</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>Surname</label>
                        <input type="text" value={form.father_surname} onChange={e => setField('father_surname', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>First Name</label>
                        <input type="text" value={form.father_first_name} onChange={e => setField('father_first_name', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Middle Name</label>
                        <input type="text" value={form.father_middle_name} onChange={e => setField('father_middle_name', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Name Extension</label>
                        <input type="text" value={form.father_name_ext} onChange={e => setField('father_name_ext', e.target.value)} className={inputClass} placeholder="Jr., Sr." />
                    </div>
                </div>
            </div>

            {/* Mother */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">25. Mother's Maiden Name</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Surname</label>
                        <input type="text" value={form.mother_surname} onChange={e => setField('mother_surname', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>First Name</label>
                        <input type="text" value={form.mother_first_name} onChange={e => setField('mother_first_name', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Middle Name</label>
                        <input type="text" value={form.mother_middle_name} onChange={e => setField('mother_middle_name', e.target.value)} className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Children */}
            <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">23. Children</h3>
                    <button type="button" onClick={addChild}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add Child
                    </button>
                </div>
                <div className="space-y-2">
                    {children.map((child, i) => (
                        <div key={i} className="flex gap-3 items-center">
                            <span className="text-xs text-gray-400 w-5 text-center">{i + 1}</span>
                            <input type="text" value={child.full_name}
                                onChange={e => setChild(i, 'full_name', e.target.value)}
                                placeholder="Full name (write in full)" className={`${inputClass} flex-1`} />
                            <input type="date" value={child.date_of_birth ?? ''}
                                onChange={e => setChild(i, 'date_of_birth', e.target.value)}
                                className={`${inputClass} w-40`} />
                            {children.length > 1 && (
                                <button type="button" onClick={() => removeChild(i)}
                                    className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Family Background'}
                </button>
            </div>
        </form>
    );
}