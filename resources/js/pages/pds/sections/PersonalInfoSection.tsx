import { useState } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsPersonalInfo, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: PdsSaveCallback;
    saving: boolean;
}

interface PersonalForm extends PdsPersonalInfo {
    last_name: string;
    first_name: string;
    middle_name: string;
    name_ext: string;
}

type FormErrors = Partial<Record<keyof PersonalForm, string>>;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const REQUIRED_FIELDS: Array<{ key: keyof PersonalForm; label: string }> = [
    { key: 'last_name',        label: 'Surname' },
    { key: 'first_name',       label: 'First Name' },
    { key: 'date_of_birth',    label: 'Date of Birth' },
    { key: 'birth_place',      label: 'Place of Birth' },
    { key: 'sex',              label: 'Sex' },
    { key: 'civil_status',     label: 'Civil Status' },
    { key: 'citizenship',      label: 'Citizenship' },
    { key: 'res_house_no',     label: 'Residential House/Block/Lot No.' },
    { key: 'res_street',       label: 'Residential Street' },
    { key: 'res_barangay',     label: 'Residential Barangay' },
    { key: 'res_city',         label: 'Residential City/Municipality' },
    { key: 'res_province',     label: 'Residential Province' },
    { key: 'perm_house_no',    label: 'Permanent House/Block/Lot No.' },
    { key: 'perm_street',      label: 'Permanent Street' },
    { key: 'perm_barangay',    label: 'Permanent Barangay' },
    { key: 'perm_city',        label: 'Permanent City/Municipality' },
    { key: 'perm_province',    label: 'Permanent Province' },
    { key: 'mobile_number',    label: 'Mobile No.' },
    { key: 'pagibig_number',   label: 'PAG-IBIG ID No.' },
    { key: 'philhealth_number',label: 'PhilHealth No.' },
    { key: 'philsys_number',   label: 'PhilSys No.' },
    { key: 'tin_number',       label: 'TIN No.' },
];

function validate(form: PersonalForm): FormErrors {
    const errors: FormErrors = {};
    for (const { key, label } of REQUIRED_FIELDS) {
        const val = form[key];
        if (!val || String(val).trim() === '') {
            errors[key] = `${label} is required.`;
        }
    }
    return errors;
}

export default function PersonalInfoSection({ user, pdsData, onSave, saving }: Props) {
    const profile = user.employee_profile;

    const [sameAsResidential, setSameAsResidential] = useState(() => {
        const p = pdsData.personal;
        if (!p?.perm_city) return false;
        return (
            p.perm_house_no    === p.res_house_no    &&
            p.perm_street      === p.res_street      &&
            p.perm_subdivision === p.res_subdivision &&
            p.perm_barangay    === p.res_barangay    &&
            p.perm_city        === p.res_city        &&
            p.perm_province    === p.res_province    &&
            p.perm_zipcode     === p.res_zipcode
        );
    });

    const [form, setForm] = useState<PersonalForm>({
        last_name:          user.last_name ?? '',
        first_name:         user.first_name ?? '',
        middle_name:        user.middle_name ?? '',
        name_ext:           user.name_ext ?? '',
        sex:                pdsData.personal?.sex ?? '',
        birth_place:        pdsData.personal?.birth_place ?? '',
        civil_status:       pdsData.personal?.civil_status ?? '',
        mobile_number:      pdsData.personal?.mobile_number ?? '',
        date_of_birth:      pdsData.personal?.date_of_birth?.slice(0, 10) ?? '',
        citizenship:        pdsData.personal?.citizenship ?? 'Filipino',
        citizenship_type:   pdsData.personal?.citizenship_type ?? '',
        citizenship_country:pdsData.personal?.citizenship_country ?? '',
        height:             pdsData.personal?.height ?? '',
        weight:             pdsData.personal?.weight ?? '',
        blood_type:         pdsData.personal?.blood_type ?? '',
        agency_employee_no: pdsData.personal?.agency_employee_no ?? profile?.employee_number ?? '',
        res_house_no:       pdsData.personal?.res_house_no ?? '',
        res_street:         pdsData.personal?.res_street ?? '',
        res_subdivision:    pdsData.personal?.res_subdivision ?? '',
        res_barangay:       pdsData.personal?.res_barangay ?? '',
        res_city:           pdsData.personal?.res_city ?? '',
        res_province:       pdsData.personal?.res_province ?? '',
        res_zipcode:        pdsData.personal?.res_zipcode ?? '',
        perm_house_no:      pdsData.personal?.perm_house_no ?? '',
        perm_street:        pdsData.personal?.perm_street ?? '',
        perm_subdivision:   pdsData.personal?.perm_subdivision ?? '',
        perm_barangay:      pdsData.personal?.perm_barangay ?? '',
        perm_city:          pdsData.personal?.perm_city ?? '',
        perm_province:      pdsData.personal?.perm_province ?? '',
        perm_zipcode:       pdsData.personal?.perm_zipcode ?? '',
        telephone:          pdsData.personal?.telephone ?? '',
        email:              pdsData.personal?.email ?? user.email ?? '',
        umid_number:        pdsData.personal?.umid_number ?? '',
        pagibig_number:     pdsData.personal?.pagibig_number ?? '',
        philhealth_number:  pdsData.personal?.philhealth_number ?? '',
        philsys_number:     pdsData.personal?.philsys_number ?? '',
        tin_number:         pdsData.personal?.tin_number ?? '',
    });

    // Only show errors after first submit attempt
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const RES_TO_PERM: Partial<Record<keyof PersonalForm, keyof PersonalForm>> = {
        res_house_no:    'perm_house_no',
        res_street:      'perm_street',
        res_subdivision: 'perm_subdivision',
        res_barangay:    'perm_barangay',
        res_city:        'perm_city',
        res_province:    'perm_province',
        res_zipcode:     'perm_zipcode',
    };

    const set = (key: keyof PersonalForm, value: string) => {
        setForm(prev => {
            const next: PersonalForm = { ...prev, [key]: value };
            if (sameAsResidential && key in RES_TO_PERM) {
                next[RES_TO_PERM[key]!] = value as never;
            }
            return next;
        });
        // Clear error on change if we've already submitted once
        if (submitted) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            // Scroll to first error
            const firstKey = Object.keys(errs)[0];
            document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setErrors({});
        onSave('personal', form as unknown as Record<string, unknown>);
    };

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white";
    const errorInputClass = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-white";
    const readonlyClass = "w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed select-none";
    const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
    const sectionClass = "mb-6";

    const ic = (key: keyof PersonalForm) => errors[key] ? errorInputClass : inputClass;
    const err = (key: keyof PersonalForm) => errors[key]
        ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
        : null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">I. Personal Information</h2>
            </div>

            {/* Name */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-3">Name</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div id="field-last_name">
                        <label className={labelClass}>Surname *</label>
                        <input type="text" value={form.last_name}
                            onChange={e => set('last_name', e.target.value)}
                            className={ic('last_name')} />
                        {err('last_name')}
                    </div>
                    <div id="field-first_name">
                        <label className={labelClass}>First Name *</label>
                        <input type="text" value={form.first_name}
                            onChange={e => set('first_name', e.target.value)}
                            className={ic('first_name')} />
                        {err('first_name')}
                    </div>
                    <div>
                        <label className={labelClass}>Middle Name</label>
                        <input type="text" value={form.middle_name}
                            onChange={e => set('middle_name', e.target.value)}
                            className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Extension (Jr./Sr.)</label>
                        <input type="text" value={form.name_ext}
                            onChange={e => set('name_ext', e.target.value)}
                            placeholder="Jr., Sr., II, III"
                            className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Basic Info */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 mb-3 pb-2 border-b border-gray-100 uppercase">Basic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div id="field-date_of_birth">
                        <label className={labelClass}>Date of Birth *</label>
                        <input type="date" value={form.date_of_birth as string}
                            onChange={e => set('date_of_birth', e.target.value)}
                            className={ic('date_of_birth')} />
                        {err('date_of_birth')}
                    </div>
                    <div id="field-birth_place">
                        <label className={labelClass}>Place of Birth *</label>
                        <input type="text" value={form.birth_place ?? ''}
                            onChange={e => set('birth_place', e.target.value)}
                            className={ic('birth_place')} />
                        {err('birth_place')}
                    </div>
                    <div id="field-sex">
                        <label className={labelClass}>Sex *</label>
                        <select value={form.sex ?? ''} onChange={e => set('sex', e.target.value)}
                            className={ic('sex')}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        {err('sex')}
                    </div>
                    <div id="field-civil_status">
                        <label className={labelClass}>Civil Status *</label>
                        <select value={form.civil_status ?? ''} onChange={e => set('civil_status', e.target.value)}
                            className={ic('civil_status')}>
                            <option value="">Select</option>
                            {['Single', 'Married', 'Widowed', 'Separated', 'Other'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        {err('civil_status')}
                    </div>
                    <div>
                        <label className={labelClass}>Height (m)</label>
                        <input type="number" step="0.01" min="0" max="3"
                            value={form.height as string}
                            onChange={e => set('height', e.target.value)}
                            placeholder="e.g. 1.65" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Weight (kg)</label>
                        <input type="number" step="0.1" min="0"
                            value={form.weight as string}
                            onChange={e => set('weight', e.target.value)}
                            placeholder="e.g. 60.5" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Blood Type</label>
                        <select value={form.blood_type} onChange={e => set('blood_type', e.target.value)}
                            className={inputClass}>
                            <option value="">Select</option>
                            {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Agency Employee No.</label>
                        <div className={readonlyClass}>{form.agency_employee_no || '—'}</div>
                    </div>
                </div>
            </div>

            {/* Citizenship */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 mb-3 pb-2 border-b border-gray-100 uppercase">Citizenship</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div id="field-citizenship">
                        <label className={labelClass}>Citizenship *</label>
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
                        {err('citizenship')}
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
                                <input type="text" value={form.citizenship_country}
                                    onChange={e => set('citizenship_country', e.target.value)}
                                    placeholder="Indicate country" className={inputClass} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Residential Address */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 mb-3 pb-2 border-b border-gray-100 uppercase">Residential Address</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {([ 
                        { label: 'House/Block/Lot No. *', key: 'res_house_no' as const,   maxLength: undefined },
                        { label: 'Street *',              key: 'res_street' as const,      maxLength: undefined },
                        { label: 'Subdivision/Village',   key: 'res_subdivision' as const, maxLength: undefined },
                        { label: 'Barangay *',            key: 'res_barangay' as const,    maxLength: undefined },
                        { label: 'City/Municipality *',   key: 'res_city' as const,        maxLength: undefined },
                        { label: 'Province *',            key: 'res_province' as const,    maxLength: undefined },
                        { label: 'Zip Code',              key: 'res_zipcode' as const,     maxLength: 10 },
                    ] as Array<{ label: string; key: keyof PersonalForm; maxLength?: number }>).map(({ label, key, maxLength }) => (
                        <div key={key} id={`field-${key}`}>
                            <label className={labelClass}>{label}</label>
                            <input type="text" value={(form[key] as string) ?? ''}
                                onChange={e => set(key, e.target.value)}
                                maxLength={maxLength}
                                className={ic(key)} />
                            {err(key)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Permanent Address */}
            <div className={sectionClass}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-green-800 border-gray-100 uppercase">Permanent Address</h3>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none text-green-700">
                        <input type="checkbox" checked={sameAsResidential}
                            onChange={e => {
                                setSameAsResidential(e.target.checked);
                                if (e.target.checked) {
                                    setForm(prev => ({
                                        ...prev,
                                        perm_house_no:    prev.res_house_no,
                                        perm_street:      prev.res_street,
                                        perm_subdivision: prev.res_subdivision,
                                        perm_barangay:    prev.res_barangay,
                                        perm_city:        prev.res_city,
                                        perm_province:    prev.res_province,
                                        perm_zipcode:     prev.res_zipcode,
                                    }));
                                    // Clear perm address errors when synced
                                    setErrors(prev => ({
                                        ...prev,
                                        perm_house_no: undefined, perm_street: undefined,
                                        perm_barangay: undefined, perm_city: undefined,
                                        perm_province: undefined,
                                    }));
                                } else {
                                    setForm(prev => ({
                                        ...prev,
                                        perm_house_no: '', perm_street: '', perm_subdivision: '',
                                        perm_barangay: '', perm_city: '', perm_province: '', perm_zipcode: '',
                                    }));
                                }
                            }}
                            className="w-3.5 h-3.5 accent-green-600 cursor-pointer text-gree" />
                        Same as Residential Address
                    </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {([
                        { label: 'House/Block/Lot No. *', key: 'perm_house_no' as const,   maxLength: undefined },
                        { label: 'Street *',              key: 'perm_street' as const,      maxLength: undefined },
                        { label: 'Subdivision/Village',   key: 'perm_subdivision' as const, maxLength: undefined },
                        { label: 'Barangay *',            key: 'perm_barangay' as const,    maxLength: undefined },
                        { label: 'City/Municipality *',   key: 'perm_city' as const,        maxLength: undefined },
                        { label: 'Province *',            key: 'perm_province' as const,    maxLength: undefined },
                        { label: 'Zip Code',              key: 'perm_zipcode' as const,     maxLength: 10 },
                    ] as Array<{ label: string; key: keyof PersonalForm; maxLength?: number }>).map(({ label, key, maxLength }) => (
                        <div key={key} id={`field-${key}`}>
                            <label className={labelClass}>{label}</label>
                            <input type="text"
                                value={(form[key] as string) ?? ''}
                                onChange={e => !sameAsResidential && set(key, e.target.value)}
                                readOnly={sameAsResidential}
                                maxLength={maxLength}
                                className={sameAsResidential ? readonlyClass : ic(key)} />
                            {!sameAsResidential && err(key)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact & Government IDs */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 pb-2 mb-3 border-b border-gray-100 uppercase">Contact & Government IDs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Telephone No.</label>
                        <input type="text" value={form.telephone}
                            onChange={e => set('telephone', e.target.value)}
                            className={inputClass} />
                    </div>
                    <div id="field-mobile_number">
                        <label className={labelClass}>Mobile No. *</label>
                        <input type="text" value={form.mobile_number ?? ''}
                            onChange={e => set('mobile_number', e.target.value)}
                            className={ic('mobile_number')} />
                        {err('mobile_number')}
                    </div>
                    <div>
                        <label className={labelClass}>
                            Email Address
                        </label>
                        <div className={readonlyClass}>{form.email || '—'}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>UMID ID No.</label>
                        <input type="text" value={form.umid_number ?? ''}
                            onChange={e => set('umid_number', e.target.value)}
                            className={inputClass} />
                    </div>
                    <div id="field-pagibig_number">
                        <label className={labelClass}>PAG-IBIG ID No. *</label>
                        <input type="text" value={form.pagibig_number ?? ''}
                            onChange={e => set('pagibig_number', e.target.value)}
                            className={ic('pagibig_number')} />
                        {err('pagibig_number')}
                    </div>
                    <div id="field-philhealth_number">
                        <label className={labelClass}>PhilHealth No. *</label>
                        <input type="text" value={form.philhealth_number ?? ''}
                            onChange={e => set('philhealth_number', e.target.value)}
                            className={ic('philhealth_number')} />
                        {err('philhealth_number')}
                    </div>
                    <div id="field-philsys_number">
                        <label className={labelClass}>PhilSys No. *</label>
                        <input type="text" value={form.philsys_number ?? ''}
                            onChange={e => set('philsys_number', e.target.value)}
                            className={ic('philsys_number')} />
                        {err('philsys_number')}
                    </div>
                    <div id="field-tin_number">
                        <label className={labelClass}>TIN No. *</label>
                        <input type="text" value={form.tin_number ?? ''}
                            onChange={e => set('tin_number', e.target.value)}
                            className={ic('tin_number')} />
                        {err('tin_number')}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    
                    {saving ? <><Spinner />Saving...</> : <><Save className="w-4 h-4" />Save Personal Information</>}
                </button>
            </div>
        </form>
    );
}