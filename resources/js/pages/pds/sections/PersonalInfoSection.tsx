import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsPersonalInfo, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';
import SearchableSelect from '@/components/searchable-select';
import type { SelectOption } from '@/components/searchable-select';
import { usePhLocations } from '@/hooks/usePhLocations';

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
    res_province_id: number | null;
    res_city_id: number | null;
    res_barangay_id: number | null;
    perm_province_id: number | null;
    perm_city_id: number | null;
    perm_barangay_id: number | null;
}

type FormErrors = Partial<Record<keyof PersonalForm, string>>;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const REQUIRED_FIELDS: Array<{ key: keyof PersonalForm; label: string }> = [
    { key: 'last_name',         label: 'Surname' },
    { key: 'first_name',        label: 'First Name' },
    { key: 'date_of_birth',     label: 'Date of Birth' },
    { key: 'birth_place',       label: 'Place of Birth' },
    { key: 'sex',               label: 'Sex' },
    { key: 'civil_status',      label: 'Civil Status' },
    { key: 'agency_employee_no',label: 'Agency Employee No.' },
    { key: 'citizenship',       label: 'Citizenship' },
    { key: 'res_house_no',      label: 'Residential House/Block/Lot No.' },
    { key: 'res_street',        label: 'Residential Street' },
    { key: 'res_province',      label: 'Residential Province' },
    { key: 'res_city',          label: 'Residential City/Municipality' },
    { key: 'res_barangay',      label: 'Residential Barangay' },
    { key: 'perm_house_no',     label: 'Permanent House/Block/Lot No.' },
    { key: 'perm_street',       label: 'Permanent Street' },
    { key: 'perm_province',     label: 'Permanent Province' },
    { key: 'perm_city',         label: 'Permanent City/Municipality' },
    { key: 'perm_barangay',     label: 'Permanent Barangay' },
    { key: 'mobile_number',     label: 'Mobile No.' },
    { key: 'pagibig_number',    label: 'PAG-IBIG ID No.' },
    { key: 'philhealth_number', label: 'PhilHealth No.' },
    { key: 'philsys_number',    label: 'PhilSys No.' },
    { key: 'tin_number',        label: 'TIN No.' },
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

    const res  = usePhLocations();
    const perm = usePhLocations();

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
        last_name:           user.last_name   ?? '',
        first_name:          user.first_name  ?? '',
        middle_name:         user.middle_name ?? '',
        name_ext:            user.name_ext    ?? '',
        sex:                 pdsData.personal?.sex          ?? '',
        birth_place:         pdsData.personal?.birth_place  ?? '',
        civil_status:        pdsData.personal?.civil_status ?? '',
        mobile_number:       pdsData.personal?.mobile_number ?? '',
        date_of_birth:       pdsData.personal?.date_of_birth?.slice(0, 10) ?? '',
        citizenship:         pdsData.personal?.citizenship   ?? 'Filipino',
        citizenship_type:    pdsData.personal?.citizenship_type    ?? '',
        citizenship_country: pdsData.personal?.citizenship_country ?? '',
        height:              pdsData.personal?.height     ?? '',
        weight:              pdsData.personal?.weight     ?? '',
        blood_type:          pdsData.personal?.blood_type ?? '',
        agency_employee_no:  pdsData.personal?.agency_employee_no ?? profile?.employee_number ?? '',
        res_house_no:        pdsData.personal?.res_house_no    ?? '',
        res_street:          pdsData.personal?.res_street      ?? '',
        res_subdivision:     pdsData.personal?.res_subdivision ?? '',
        res_barangay:        pdsData.personal?.res_barangay    ?? '',
        res_city:            pdsData.personal?.res_city        ?? '',
        res_province:        pdsData.personal?.res_province    ?? '',
        res_zipcode:         pdsData.personal?.res_zipcode     ?? '',
        res_province_id:     null,
        res_city_id:         null,
        res_barangay_id:     null,
        perm_house_no:       pdsData.personal?.perm_house_no    ?? '',
        perm_street:         pdsData.personal?.perm_street      ?? '',
        perm_subdivision:    pdsData.personal?.perm_subdivision ?? '',
        perm_barangay:       pdsData.personal?.perm_barangay    ?? '',
        perm_city:           pdsData.personal?.perm_city        ?? '',
        perm_province:       pdsData.personal?.perm_province    ?? '',
        perm_zipcode:        pdsData.personal?.perm_zipcode     ?? '',
        perm_province_id:    null,
        perm_city_id:        null,
        perm_barangay_id:    null,
        telephone:           pdsData.personal?.telephone    ?? '',
        email:               pdsData.personal?.email ?? user.email ?? '',
        umid_number:         pdsData.personal?.umid_number        ?? '',
        pagibig_number:      pdsData.personal?.pagibig_number     ?? '',
        philhealth_number:   pdsData.personal?.philhealth_number  ?? '',
        philsys_number:      pdsData.personal?.philsys_number     ?? '',
        tin_number:          pdsData.personal?.tin_number         ?? '',
    });

    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors]       = useState<FormErrors>({});
    
    // RESIDENTIAL
    useEffect(() => {
        if (!res.provinces.length || !form.res_province || form.res_province_id !== null) return;
        const match = res.provinces.find(
            p => p.label.toLowerCase() === form.res_province!.toLowerCase()
        );
        if (match) {
            const id = Number(match.value);
            res.setProvinceId(id);
            setForm(prev => ({ ...prev, res_province_id: id }));
        }
    }, [res.provinces]);

    // RESIDENTIAL
    useEffect(() => {
        if (!res.cities.length || !form.res_city || form.res_city_id !== null) return;
        const match = res.cities.find(
            c => c.label.toLowerCase() === form.res_city!.toLowerCase()
        );
        if (match) {
            const id = Number(match.value);
            res.setCityId(id);
            setForm(prev => ({ ...prev, res_city_id: id }));
        }
    }, [res.cities]);

    // RESIDENTIAL
    useEffect(() => {
        if (!res.barangays.length || !form.res_barangay || form.res_barangay_id !== null) return;
        const match = res.barangays.find(
            b => b.label.toLowerCase() === form.res_barangay!.toLowerCase()
        );
        if (match) {
            setForm(prev => ({ ...prev, res_barangay_id: Number(match.value) }));
        }
    }, [res.barangays]);

    // PERMANENT
    useEffect(() => {
        if (!perm.provinces.length || !form.perm_province || form.perm_province_id !== null) return;
        const match = perm.provinces.find(
            p => p.label.toLowerCase() === form.perm_province!.toLowerCase()
        );
        if (match) {
            const id = Number(match.value);
            perm.setProvinceId(id);
            setForm(prev => ({ ...prev, perm_province_id: id }));
        }
    }, [perm.provinces]);

    // PERMANENT
    useEffect(() => {
        if (!perm.cities.length || !form.perm_city || form.perm_city_id !== null) return;
        const match = perm.cities.find(
            c => c.label.toLowerCase() === form.perm_city!.toLowerCase()
        );
        if (match) {
            const id = Number(match.value);
            perm.setCityId(id);
            setForm(prev => ({ ...prev, perm_city_id: id }));
        }
    }, [perm.cities]);

    // PERMANENT
    useEffect(() => {
        if (!perm.barangays.length || !form.perm_barangay || form.perm_barangay_id !== null) return;
        const match = perm.barangays.find(
            b => b.label.toLowerCase() === form.perm_barangay!.toLowerCase()
        );
        if (match) {
            setForm(prev => ({ ...prev, perm_barangay_id: Number(match.value) }));
        }
    }, [perm.barangays]);

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
        if (submitted) setErrors(prev => ({ ...prev, [key]: undefined }));
    };

    // Location select handlers

    const handleResProvince = (opt: SelectOption | null) => {
        res.setProvinceId(opt ? Number(opt.value) : null);
        setForm(prev => ({
            ...prev,
            res_province_id:  opt ? Number(opt.value) : null,
            res_province:     opt?.label ?? '',
            res_city_id:      null, res_city: '',
            res_barangay_id:  null, res_barangay: '',
            res_zipcode:      '',
            ...(sameAsResidential ? {
                perm_province_id: opt ? Number(opt.value) : null,
                perm_province:    opt?.label ?? '',
                perm_city_id:     null, perm_city: '',
                perm_barangay_id: null, perm_barangay: '',
                perm_zipcode:     '',
            } : {}),
        }));
        if (sameAsResidential && opt) perm.setProvinceId(Number(opt.value));
        if (submitted) setErrors(prev => ({ ...prev, res_province: undefined }));
    };

    const handleResCity = (opt: SelectOption | null) => {
        res.setCityId(opt ? Number(opt.value) : null);
        const zip = opt ? res.getZipCode(opt.value) : '';
        setForm(prev => ({
            ...prev,
            res_city_id:      opt ? Number(opt.value) : null,
            res_city:         opt?.label ?? '',
            res_zipcode:      zip,
            res_barangay_id:  null, res_barangay: '',
            ...(sameAsResidential ? {
                perm_city_id:     opt ? Number(opt.value) : null,
                perm_city:        opt?.label ?? '',
                perm_zipcode:     zip,
                perm_barangay_id: null, perm_barangay: '',
            } : {}),
        }));
        if (sameAsResidential && opt) perm.setCityId(Number(opt.value));
        if (submitted) setErrors(prev => ({ ...prev, res_city: undefined }));
    };

    const handleResBarangay = (opt: SelectOption | null) => {
        setForm(prev => ({
            ...prev,
            res_barangay_id: opt ? Number(opt.value) : null,
            res_barangay:    opt?.label ?? '',
            ...(sameAsResidential ? {
                perm_barangay_id: opt ? Number(opt.value) : null,
                perm_barangay:    opt?.label ?? '',
            } : {}),
        }));
        if (submitted) setErrors(prev => ({ ...prev, res_barangay: undefined }));
    };

    const handlePermProvince = (opt: SelectOption | null) => {
        perm.setProvinceId(opt ? Number(opt.value) : null);
        setForm(prev => ({
            ...prev,
            perm_province_id: opt ? Number(opt.value) : null,
            perm_province:    opt?.label ?? '',
            perm_city_id:     null, perm_city: '',
            perm_barangay_id: null, perm_barangay: '',
            perm_zipcode:     '',
        }));
        if (submitted) setErrors(prev => ({ ...prev, perm_province: undefined }));
    };

    const handlePermCity = (opt: SelectOption | null) => {
        perm.setCityId(opt ? Number(opt.value) : null);
        const zip = opt ? perm.getZipCode(opt.value) : '';
        setForm(prev => ({
            ...prev,
            perm_city_id:     opt ? Number(opt.value) : null,
            perm_city:        opt?.label ?? '',
            perm_zipcode:     zip,
            perm_barangay_id: null, perm_barangay: '',
        }));
        if (submitted) setErrors(prev => ({ ...prev, perm_city: undefined }));
    };

    const handlePermBarangay = (opt: SelectOption | null) => {
        setForm(prev => ({
            ...prev,
            perm_barangay_id: opt ? Number(opt.value) : null,
            perm_barangay:    opt?.label ?? '',
        }));
        if (submitted) setErrors(prev => ({ ...prev, perm_barangay: undefined }));
    };

    const handleSameAsResidential = (checked: boolean) => {
        setSameAsResidential(checked);
        if (checked) {
            perm.setProvinceId(form.res_province_id);
            perm.setCityId(form.res_city_id);
            setForm(prev => ({
                ...prev,
                perm_house_no:    prev.res_house_no,
                perm_street:      prev.res_street,
                perm_subdivision: prev.res_subdivision,
                perm_province_id: prev.res_province_id,
                perm_province:    prev.res_province,
                perm_city_id:     prev.res_city_id,
                perm_city:        prev.res_city,
                perm_barangay_id: prev.res_barangay_id,
                perm_barangay:    prev.res_barangay,
                perm_zipcode:     prev.res_zipcode,
            }));
            setErrors(prev => ({
                ...prev,
                perm_house_no: undefined, perm_street: undefined,
                perm_province: undefined, perm_city:   undefined,
                perm_barangay: undefined,
            }));
        } else {
            perm.setProvinceId(null);
            perm.setCityId(null);
            setForm(prev => ({
                ...prev,
                perm_house_no: '', perm_street: '', perm_subdivision: '',
                perm_province_id: null, perm_province: '',
                perm_city_id:     null, perm_city: '',
                perm_barangay_id: null, perm_barangay: '',
                perm_zipcode: '',
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            const firstKey = Object.keys(errs)[0];
            document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setErrors({});
        // Strip UI-only ID fields before sending to server
        const {
            res_province_id, res_city_id, res_barangay_id,
            perm_province_id, perm_city_id, perm_barangay_id,
            ...payload
        } = form;
        onSave('personal', payload as unknown as Record<string, unknown>);
    };

    // Styles

    const inputClass       = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white";
    const errorInputClass  = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-white";
    const readonlyClass    = "w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed select-none";
    const labelClass       = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
    const sectionClass     = "mb-6";

    const ic  = (key: keyof PersonalForm) => errors[key] ? errorInputClass : inputClass;
    const err = (key: keyof PersonalForm) => errors[key]
        ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
        : null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">I. Personal Information</h2>
            </div>

            {/* ── Name ── */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-3">Name</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div id="field-last_name">
                        <label className={labelClass}>Surname <span className="text-red-500">*</span></label>
                        <input type="text" value={form.last_name}
                            onChange={e => set('last_name', e.target.value)}
                            className={ic('last_name')} />
                        {err('last_name')}
                    </div>
                    <div id="field-first_name">
                        <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
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
                        <label className={labelClass}>Name Extension</label>
                        <select value={form.name_ext ?? ''} onChange={e => set('name_ext', e.target.value)}
                            className={ic('name_ext')}>
                            <option value="">None</option>
                            <option value="Jr">Jr</option>
                            <option value="Sr">Sr</option>
                            <option value="I">I</option>
                            <option value="II">II</option>
                            <option value="III">III</option>
                            <option value="IV">IV</option>
                            <option value="V">V</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Basic Info ── */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 mb-3 pb-2 border-b border-gray-100 uppercase">Basic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div id="field-date_of_birth">
                        <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                        <input type="date" value={form.date_of_birth as string}
                            onChange={e => set('date_of_birth', e.target.value)}
                            className={ic('date_of_birth')} />
                        {err('date_of_birth')}
                    </div>
                    <div id="field-birth_place">
                        <label className={labelClass}>Place of Birth <span className="text-red-500">*</span></label>
                        <input type="text" value={form.birth_place ?? ''}
                            onChange={e => set('birth_place', e.target.value)}
                            className={ic('birth_place')} />
                        {err('birth_place')}
                    </div>
                    <div id="field-sex">
                        <label className={labelClass}>Sex <span className="text-red-500">*</span></label>
                        <select value={form.sex ?? ''} onChange={e => set('sex', e.target.value)}
                            className={ic('sex')}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        {err('sex')}
                    </div>
                    <div id="field-civil_status">
                        <label className={labelClass}>Civil Status <span className="text-red-500">*</span></label>
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
                        <label className={labelClass}>
                            Agency Employee No. <span className="text-red-500">*</span>
                        </label>
                            <input
                                type="text"
                                value={form.agency_employee_no ?? ''}
                                onChange={e => set('agency_employee_no', e.target.value)}
                                className={inputClass}
                                placeholder="e.g. EMP-001" />
                        {err('agency_employee_no')}
                    </div>
                </div>
            </div>

            {/* ── Citizenship ── */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 mb-3 pb-2 border-b border-gray-100 uppercase">Citizenship</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div id="field-citizenship">
                        <label className={labelClass}>Citizenship <span className="text-red-500">*</span></label>
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

            {/* ── Residential Address ── */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 mb-3 pb-2 border-b border-gray-100 uppercase">Residential Address</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div id="field-res_province">
                        <label className={labelClass}>Province <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={res.provinces}
                            value={form.res_province_id}
                            onChange={handleResProvince}
                            placeholder="Select Province"
                            loading={res.loadingProvinces}
                            hasError={!!errors.res_province}
                        />
                        {err('res_province')}
                    </div>
                    <div id="field-res_city">
                        <label className={labelClass}>City/Municipality <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={res.cities}
                            value={form.res_city_id}
                            onChange={handleResCity}
                            placeholder={form.res_province_id ? 'Select City/Municipality' : 'Select Province first'}
                            disabled={!form.res_province_id}
                            loading={res.loadingCities}
                            hasError={!!errors.res_city}
                        />
                        {err('res_city')}
                    </div>
                    <div id="field-res_barangay">
                        <label className={labelClass}>Barangay <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={res.barangays}
                            value={form.res_barangay_id}
                            onChange={handleResBarangay}
                            placeholder={form.res_city_id ? 'Select Barangay' : 'Select City first'}
                            disabled={!form.res_city_id}
                            loading={res.loadingBarangays}
                            hasError={!!errors.res_barangay}
                        />
                        {err('res_barangay')}
                    </div>
                    <div>
                        <label className={labelClass}>Zip Code</label>
                        <div className={readonlyClass}>{form.res_zipcode || '—'}</div>
                    </div>
                    <div id="field-res_house_no">
                        <label className={labelClass}>House/Block/Lot No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.res_house_no ?? ''}
                            onChange={e => set('res_house_no', e.target.value)}
                            className={ic('res_house_no')} />
                        {err('res_house_no')}
                    </div>
                    <div id="field-res_street">
                        <label className={labelClass}>Street <span className="text-red-500">*</span></label>
                        <input type="text" value={form.res_street ?? ''}
                            onChange={e => set('res_street', e.target.value)}
                            className={ic('res_street')} />
                        {err('res_street')}
                    </div>
                    <div>
                        <label className={labelClass}>Subdivision/Village</label>
                        <input type="text" value={form.res_subdivision ?? ''}
                            onChange={e => set('res_subdivision', e.target.value)}
                            className={inputClass} />
                    </div>
                </div>
            </div>

            {/* ── Permanent Address ── */}
            <div className={sectionClass}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-green-800 uppercase">Permanent Address</h3>
                    <label className="flex items-center gap-2 text-xs text-green-700 cursor-pointer select-none">
                        <input type="checkbox" checked={sameAsResidential}
                            onChange={e => handleSameAsResidential(e.target.checked)}
                            className="w-3.5 h-3.5 accent-green-600 cursor-pointer" />
                        Same as Residential Address
                    </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div id="field-perm_province">
                        <label className={labelClass}>Province <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={perm.provinces}
                            value={form.perm_province_id}
                            onChange={handlePermProvince}
                            placeholder="Select Province"
                            loading={perm.loadingProvinces}
                            disabled={sameAsResidential}
                            hasError={!sameAsResidential && !!errors.perm_province}
                        />
                        {!sameAsResidential && err('perm_province')}
                    </div>
                    <div id="field-perm_city">
                        <label className={labelClass}>City/Municipality <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={perm.cities}
                            value={form.perm_city_id}
                            onChange={handlePermCity}
                            placeholder={form.perm_province_id ? 'Select City/Municipality' : 'Select Province first'}
                            disabled={sameAsResidential || !form.perm_province_id}
                            loading={perm.loadingCities}
                            hasError={!sameAsResidential && !!errors.perm_city}
                        />
                        {!sameAsResidential && err('perm_city')}
                    </div>
                    <div id="field-perm_barangay">
                        <label className={labelClass}>Barangay <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={perm.barangays}
                            value={form.perm_barangay_id}
                            onChange={handlePermBarangay}
                            placeholder={form.perm_city_id ? 'Select Barangay' : 'Select City first'}
                            disabled={sameAsResidential || !form.perm_city_id}
                            loading={perm.loadingBarangays}
                            hasError={!sameAsResidential && !!errors.perm_barangay}
                        />
                        {!sameAsResidential && err('perm_barangay')}
                    </div>
                    <div>
                        <label className={labelClass}>Zip Code</label>
                        <div className={readonlyClass}>{form.perm_zipcode || '—'}</div>
                    </div>
                    <div id="field-perm_house_no">
                        <label className={labelClass}>House/Block/Lot No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.perm_house_no ?? ''}
                            onChange={e => !sameAsResidential && set('perm_house_no', e.target.value)}
                            readOnly={sameAsResidential}
                            className={sameAsResidential ? readonlyClass : ic('perm_house_no')} />
                        {!sameAsResidential && err('perm_house_no')}
                    </div>
                    <div id="field-perm_street">
                        <label className={labelClass}>Street *</label>
                        <input type="text" value={form.perm_street ?? ''}
                            onChange={e => !sameAsResidential && set('perm_street', e.target.value)}
                            readOnly={sameAsResidential}
                            className={sameAsResidential ? readonlyClass : ic('perm_street')} />
                        {!sameAsResidential && err('perm_street')}
                    </div>
                    <div>
                        <label className={labelClass}>Subdivision/Village</label>
                        <input type="text" value={form.perm_subdivision ?? ''}
                            onChange={e => !sameAsResidential && set('perm_subdivision', e.target.value)}
                            readOnly={sameAsResidential}
                            className={sameAsResidential ? readonlyClass : inputClass} />
                    </div>
                </div>
            </div>

            {/* ── Contact & Government IDs ── */}
            <div className={sectionClass}>
                <h3 className="text-sm font-medium text-green-800 pb-2 mb-3 border-b border-gray-100 uppercase">Contact & Government IDs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Telephone No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.telephone}
                            onChange={e => set('telephone', e.target.value)}
                            className={inputClass} />
                    </div>
                    <div id="field-mobile_number">
                        <label className={labelClass}>Mobile No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.mobile_number ?? ''}
                            onChange={e => set('mobile_number', e.target.value)}
                            className={ic('mobile_number')} />
                        {err('mobile_number')}
                    </div>
                    <div>
                        <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                        <div className={readonlyClass}>{form.email || '—'}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>UMID ID No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.umid_number ?? ''}
                            onChange={e => set('umid_number', e.target.value)}
                            className={inputClass} />
                    </div>
                    <div id="field-pagibig_number">
                        <label className={labelClass}>PAG-IBIG ID No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.pagibig_number ?? ''}
                            onChange={e => set('pagibig_number', e.target.value)}
                            className={ic('pagibig_number')} />
                        {err('pagibig_number')}
                    </div>
                    <div id="field-philhealth_number">
                        <label className={labelClass}>PhilHealth No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.philhealth_number ?? ''}
                            onChange={e => set('philhealth_number', e.target.value)}
                            className={ic('philhealth_number')} />
                        {err('philhealth_number')}
                    </div>
                    <div id="field-philsys_number">
                        <label className={labelClass}>PhilSys No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.philsys_number ?? ''}
                            onChange={e => set('philsys_number', e.target.value)}
                            className={ic('philsys_number')} />
                        {err('philsys_number')}
                    </div>
                    <div id="field-tin_number">
                        <label className={labelClass}>TIN No. <span className="text-red-500">*</span></label>
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
                    {saving ? <><Spinner />Saving Personal Information</> : <><Save className="w-4 h-4" />Save Personal Information</>}
                </button>
            </div>
        </form>
    );
}