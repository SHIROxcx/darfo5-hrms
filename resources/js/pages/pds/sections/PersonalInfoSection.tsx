import { useState } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsPersonalInfo } from '@/types/pds';

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: (section: string, data: Record<string, unknown>) => void;
    saving: boolean;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PersonalInfoSection({ user, pdsData, onSave, saving }: Props) {
    const profile = user.employee_profile;

    const [form, setForm] = useState<PdsPersonalInfo>({
        date_of_birth: pdsData.personal?.date_of_birth ?? '',
        citizenship: pdsData.personal?.citizenship ?? 'Filipino',
        citizenship_type: pdsData.personal?.citizenship_type ?? '',
        citizenship_country: pdsData.personal?.citizenship_country ?? '',
        height: pdsData.personal?.height ?? '',
        weight: pdsData.personal?.weight ?? '',
        blood_type: pdsData.personal?.blood_type ?? '',
        agency_employee_no: pdsData.personal?.agency_employee_no ?? profile?.employee_number ?? '',
        res_house_no: pdsData.personal?.res_house_no ?? '',
        res_street: pdsData.personal?.res_street ?? '',
        res_subdivision: pdsData.personal?.res_subdivision ?? '',
        res_barangay: pdsData.personal?.res_barangay ?? '',
        res_city: pdsData.personal?.res_city ?? '',
        res_province: pdsData.personal?.res_province ?? '',
        res_zipcode: pdsData.personal?.res_zipcode ?? '',
        perm_house_no: pdsData.personal?.perm_house_no ?? '',
        perm_street: pdsData.personal?.perm_street ?? '',
        perm_subdivision: pdsData.personal?.perm_subdivision ?? '',
        perm_barangay: pdsData.personal?.perm_barangay ?? '',
        perm_city: pdsData.personal?.perm_city ?? '',
        perm_province: pdsData.personal?.perm_province ?? '',
        perm_zipcode: pdsData.personal?.perm_zipcode ?? '',
        telephone: pdsData.personal?.telephone ?? '',
        email: pdsData.personal?.email ?? user.email ?? '',
    });

    const set = (key: keyof PdsPersonalInfo, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('personal', form as Record<string, unknown>);
    };

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white";
    const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
    const sectionClass = "mb-6";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">I. Personal Information</h2>
                <p className="text-xs text-gray-500">
                    Some fields are pre-filled from your employee profile. Update any missing details.
                </p>
            </div>

            {/* Name — Read-only from users table */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-3">Name (from employee profile)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className={labelClass}>Surname</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>{user.last_name ?? '—'}</div>
                    </div>
                    <div>
                        <label className={labelClass}>First Name</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>{user.first_name ?? '—'}</div>
                    </div>
                    <div>
                        <label className={labelClass}>Middle Name</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>{user.middle_name ?? '—'}</div>
                    </div>
                    <div>
                        <label className={labelClass}>Extension (Jr./Sr.)</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>{user.name_ext ?? '—'}</div>
                    </div>
                </div>
            </div>

            {/* Basic Info */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Basic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>Date of Birth *</label>
                        <input type="date" value={form.date_of_birth as string} onChange={e => set('date_of_birth', e.target.value)}
                            className={inputClass} required />
                    </div>
                    <div>
                        <label className={labelClass}>Place of Birth</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>
                            {profile?.birth_place ?? '—'}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Sex</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>
                            {profile?.sex ?? '—'}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Civil Status</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>
                            {profile?.civil_status ?? '—'}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Height (m)</label>
                        <input type="number" step="0.01" min="0" max="3"
                            value={form.height as string} onChange={e => set('height', e.target.value)}
                            placeholder="e.g. 1.65" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Weight (kg)</label>
                        <input type="number" step="0.1" min="0"
                            value={form.weight as string} onChange={e => set('weight', e.target.value)}
                            placeholder="e.g. 60.5" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Blood Type</label>
                        <select value={form.blood_type} onChange={e => set('blood_type', e.target.value)} className={inputClass}>
                            <option value="">Select</option>
                            {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Agency Employee No.</label>
                        <input type="text" value={form.agency_employee_no} onChange={e => set('agency_employee_no', e.target.value)}
                            className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Citizenship */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Citizenship</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Citizenship</label>
                        <div className="flex gap-4 mt-2">
                            {['Filipino', 'Dual Citizenship'].map(c => (
                                <label key={c} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                    <input type="radio" name="citizenship" value={c}
                                        checked={form.citizenship === c}
                                        onChange={e => set('citizenship', e.target.value)}
                                        className="accent-green-600" />
                                    {c}
                                </label>
                            ))}
                        </div>
                    </div>
                    {form.citizenship === 'Dual Citizenship' && (
                        <>
                            <div>
                                <label className={labelClass}>Type</label>
                                <div className="flex gap-4 mt-2">
                                    {['by_birth', 'by_naturalization'].map(t => (
                                        <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                            <input type="radio" name="citizenship_type" value={t}
                                                checked={form.citizenship_type === t}
                                                onChange={e => set('citizenship_type', e.target.value)}
                                                className="accent-green-600" />
                                            {t === 'by_birth' ? 'By Birth' : 'By Naturalization'}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Country</label>
                                <input type="text" value={form.citizenship_country} onChange={e => set('citizenship_country', e.target.value)}
                                    placeholder="Indicate country" className={inputClass} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Residential Address */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Residential Address</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>House/Block/Lot No.</label>
                        <input type="text" value={form.res_house_no} onChange={e => set('res_house_no', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Street</label>
                        <input type="text" value={form.res_street} onChange={e => set('res_street', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Subdivision/Village</label>
                        <input type="text" value={form.res_subdivision} onChange={e => set('res_subdivision', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Barangay</label>
                        <input type="text" value={form.res_barangay} onChange={e => set('res_barangay', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>City/Municipality</label>
                        <input type="text" value={form.res_city} onChange={e => set('res_city', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Province</label>
                        <input type="text" value={form.res_province} onChange={e => set('res_province', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Zip Code</label>
                        <input type="text" value={form.res_zipcode} onChange={e => set('res_zipcode', e.target.value)} className={inputClass} maxLength={10} />
                    </div>
                </div>
            </div>

            {/* Permanent Address */}
            <div className={sectionClass}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">Permanent Address</h3>
                    <button type="button" onClick={() => setForm(prev => ({
                        ...prev,
                        perm_house_no: prev.res_house_no, perm_street: prev.res_street,
                        perm_subdivision: prev.res_subdivision, perm_barangay: prev.res_barangay,
                        perm_city: prev.res_city, perm_province: prev.res_province, perm_zipcode: prev.res_zipcode,
                    }))}
                        className="text-xs text-green-600 hover:text-green-800 font-medium">
                        Same as Residential ↑
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>House/Block/Lot No.</label>
                        <input type="text" value={form.perm_house_no} onChange={e => set('perm_house_no', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Street</label>
                        <input type="text" value={form.perm_street} onChange={e => set('perm_street', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Subdivision/Village</label>
                        <input type="text" value={form.perm_subdivision} onChange={e => set('perm_subdivision', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Barangay</label>
                        <input type="text" value={form.perm_barangay} onChange={e => set('perm_barangay', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>City/Municipality</label>
                        <input type="text" value={form.perm_city} onChange={e => set('perm_city', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Province</label>
                        <input type="text" value={form.perm_province} onChange={e => set('perm_province', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Zip Code</label>
                        <input type="text" value={form.perm_zipcode} onChange={e => set('perm_zipcode', e.target.value)} className={inputClass} maxLength={10} />
                    </div>
                </div>
            </div>

            {/* Contact / Government IDs */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Contact & Government IDs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Telephone No.</label>
                        <input type="text" value={form.telephone} onChange={e => set('telephone', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Mobile No.</label>
                        <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>{profile?.mobile_number ?? '—'}</div>
                    </div>
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {[
                        { label: 'GSIS ID No.', val: profile?.gsis_number },
                        { label: 'PAG-IBIG ID No.', val: profile?.pagibig_number },
                        { label: 'PhilHealth No.', val: profile?.philhealth_number },
                        { label: 'SSS No.', val: profile?.sss_number },
                        { label: 'TIN No.', val: profile?.tin_number },
                    ].map(({ label, val }) => (
                        <div key={label}>
                            <label className={labelClass}>{label}</label>
                            <div className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}>{val ?? '—'}</div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Government IDs are managed through your employee profile.</p>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Personal Information'}
                </button>
            </div>
        </form>
    );
}