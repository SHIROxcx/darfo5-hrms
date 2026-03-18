import { useState } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsPersonalInfo, PdsSaveCallback } from '@/types/pds';

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: PdsSaveCallback;
    saving: boolean;
}

// Extends PdsPersonalInfo to also carry the name fields from the users table
interface PersonalForm extends PdsPersonalInfo {
    last_name: string;
    first_name: string;
    middle_name: string;
    name_ext: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PersonalInfoSection({ user, pdsData, onSave, saving }: Props) {
    const profile = user.employee_profile;

    const [sameAsResidential, setSameAsResidential] = useState(() => {
        const p = pdsData.personal;
        if (!p?.perm_city) return false; // nothing filled in yet — default unchecked
        return (
            p.perm_house_no   === p.res_house_no   &&
            p.perm_street     === p.res_street     &&
            p.perm_subdivision=== p.res_subdivision&&
            p.perm_barangay   === p.res_barangay   &&
            p.perm_city       === p.res_city       &&
            p.perm_province   === p.res_province   &&
            p.perm_zipcode    === p.res_zipcode
        );
    });
    const [form, setForm] = useState<PersonalForm>({
        // Name — editable, pre-filled from users table
        last_name: user.last_name ?? '',
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        name_ext: user.name_ext ?? '',
        // Personal info (now in pds_personal_info, editable by employee)
        sex: pdsData.personal?.sex ?? '',
        birth_place: pdsData.personal?.birth_place ?? '',
        civil_status: pdsData.personal?.civil_status ?? '',
        mobile_number: pdsData.personal?.mobile_number ?? '',
        // PDS-specific
        date_of_birth: pdsData.personal?.date_of_birth?.slice(0, 10) ?? '',
        citizenship: pdsData.personal?.citizenship ?? 'Filipino',
        citizenship_type: pdsData.personal?.citizenship_type ?? '',
        citizenship_country: pdsData.personal?.citizenship_country ?? '',
        height: pdsData.personal?.height ?? '',
        weight: pdsData.personal?.weight ?? '',
        blood_type: pdsData.personal?.blood_type ?? '',
        // agency_employee_no is read-only — only admin can edit via employee profile
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
        // Government IDs (now in pds_personal_info)
        umid_number: pdsData.personal?.umid_number ?? '',
        pagibig_number: pdsData.personal?.pagibig_number ?? '',
        philhealth_number: pdsData.personal?.philhealth_number ?? '',
        philsys_number: pdsData.personal?.philsys_number ?? '',
        tin_number: pdsData.personal?.tin_number ?? '',
    });

    const RES_TO_PERM: Partial<Record<keyof PersonalForm, keyof PersonalForm>> = {
        res_house_no:    'perm_house_no',
        res_street:      'perm_street',
        res_subdivision: 'perm_subdivision',
        res_barangay:    'perm_barangay',
        res_city:        'perm_city',
        res_province:    'perm_province',
        res_zipcode:     'perm_zipcode',
    };

    const set = (key: keyof PersonalForm, value: string) =>
        setForm(prev => {
            const next: PersonalForm = { ...prev, [key]: value };
            // Mirror residential - permanent while checkbox is on
            if (sameAsResidential && key in RES_TO_PERM) {
                const permKey = RES_TO_PERM[key]!;
                next[permKey] = value as never;
            }
            return next;
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('personal', form as unknown as Record<string, unknown>);
    };

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white";
    const readonlyClass = "w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed select-none";
    const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
    const sectionClass = "mb-6";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1">I. Personal Information</h2>
                <p className="text-xs text-gray-500">
                    Some fields are pre-filled from your employee profile. Update any missing details.
                </p>
            </div>

            {/* Name — editable, pre-filled from users table */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-3">Name</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className={labelClass}>Surname *</label>
                        <input
                            type="text"
                            value={form.last_name}
                            onChange={e => set('last_name', e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>First Name *</label>
                        <input
                            type="text"
                            value={form.first_name}
                            onChange={e => set('first_name', e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Middle Name</label>
                        <input
                            type="text"
                            value={form.middle_name}
                            onChange={e => set('middle_name', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Extension (Jr./Sr.)</label>
                        <input
                            type="text"
                            value={form.name_ext}
                            onChange={e => set('name_ext', e.target.value)}
                            placeholder="Jr., Sr., II, III"
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Basic Info */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Basic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>Date of Birth *</label>
                        <input
                            type="date"
                            value={form.date_of_birth as string}
                            onChange={e => set('date_of_birth', e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Place of Birth</label>
                        <input type="text" value={form.birth_place ?? ''} onChange={e => set('birth_place', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Sex</label>
                        <select value={form.sex ?? ''} onChange={e => set('sex', e.target.value)} className={inputClass}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Civil Status</label>
                        <select value={form.civil_status ?? ''} onChange={e => set('civil_status', e.target.value)} className={inputClass}>
                            <option value="">Select</option>
                            {['Single', 'Married', 'Widowed', 'Separated', 'Other'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Height (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="3"
                            value={form.height as string}
                            onChange={e => set('height', e.target.value)}
                            placeholder="e.g. 1.65"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={form.weight as string}
                            onChange={e => set('weight', e.target.value)}
                            placeholder="e.g. 60.5"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Blood Type</label>
                        <select
                            value={form.blood_type}
                            onChange={e => set('blood_type', e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Select</option>
                            {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>
                            Agency Employee No.{' '}
                        </label>
                        <div className={readonlyClass}>{form.agency_employee_no || '—'}</div>
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
                                    <input
                                        type="radio"
                                        name="citizenship"
                                        value={c}
                                        checked={form.citizenship === c}
                                        onChange={e => set('citizenship', e.target.value)}
                                        className="accent-green-600"
                                    />
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
                                            <input
                                                type="radio"
                                                name="citizenship_type"
                                                value={t}
                                                checked={form.citizenship_type === t}
                                                onChange={e => set('citizenship_type', e.target.value)}
                                                className="accent-green-600"
                                            />
                                            {t === 'by_birth' ? 'By Birth' : 'By Naturalization'}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Country</label>
                                <input
                                    type="text"
                                    value={form.citizenship_country}
                                    onChange={e => set('citizenship_country', e.target.value)}
                                    placeholder="Indicate country"
                                    className={inputClass}
                                />
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
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={sameAsResidential}
                            onChange={e => {
                                setSameAsResidential(e.target.checked);
                                if (e.target.checked) {
                                    setForm(prev => ({
                                        ...prev,
                                        perm_house_no: prev.res_house_no,
                                        perm_street: prev.res_street,
                                        perm_subdivision: prev.res_subdivision,
                                        perm_barangay: prev.res_barangay,
                                        perm_city: prev.res_city,
                                        perm_province: prev.res_province,
                                        perm_zipcode: prev.res_zipcode,
                                    }));
                                } else {
                                    setForm(prev => ({
                                        ...prev,
                                        perm_house_no: '',
                                        perm_street: '',
                                        perm_subdivision: '',
                                        perm_barangay: '',
                                        perm_city: '',
                                        perm_province: '',
                                        perm_zipcode: '',
                                    }));
                                }
                            }}
                            className="w-3.5 h-3.5 accent-green-600"
                        />
                        Same as Residential Address
                    </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { label: 'House/Block/Lot No.', key: 'perm_house_no' as const },
                        { label: 'Street',              key: 'perm_street' as const },
                        { label: 'Subdivision/Village', key: 'perm_subdivision' as const },
                        { label: 'Barangay',            key: 'perm_barangay' as const },
                        { label: 'City/Municipality',   key: 'perm_city' as const },
                        { label: 'Province',            key: 'perm_province' as const },
                        { label: 'Zip Code',            key: 'perm_zipcode' as const, maxLength: 10 },
                    ].map(({ label, key, maxLength }) => (
                        <div key={key}>
                            <label className={labelClass}>{label}</label>
                            <input
                                type="text"
                                value={(form[key] as string) ?? ''}
                                onChange={e => !sameAsResidential && set(key, e.target.value)}
                                readOnly={sameAsResidential}
                                maxLength={maxLength}
                                className={sameAsResidential ? readonlyClass : inputClass}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact & Government IDs */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Contact & Government IDs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Telephone No.</label>
                        <input
                            type="text"
                            value={form.telephone}
                            onChange={e => set('telephone', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Mobile No.</label>
                        <input type="text" value={form.mobile_number ?? ''} onChange={e => set('mobile_number', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>GSIS ID No.</label>
                        <input type="text" value={form.umid_number ?? ''} onChange={e => set('umid_number', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>PAG-IBIG ID No.</label>
                        <input type="text" value={form.pagibig_number ?? ''} onChange={e => set('pagibig_number', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>PhilHealth No.</label>
                        <input type="text" value={form.philhealth_number ?? ''} onChange={e => set('philhealth_number', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>SSS No.</label>
                        <input type="text" value={form.philsys_number ?? ''} onChange={e => set('philsys_number', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>TIN No.</label>
                        <input type="text" value={form.tin_number ?? ''} onChange={e => set('tin_number', e.target.value)} className={inputClass} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Personal Information'}
                </button>
            </div>
        </form>
    );
}