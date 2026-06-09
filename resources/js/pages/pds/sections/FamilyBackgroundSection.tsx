import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsFamilyBackground, PdsChild, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: PdsSaveCallback;
    saving: boolean;
    onDirtyChange?: (dirty: boolean) => void;
}

type FamilyForm = PdsFamilyBackground;
type FormErrors = Partial<Record<keyof FamilyForm, string>>;
type ChildErrors = Partial<Record<keyof PdsChild, string>>[];

// Every field the user must fill in (at minimum with "N/A")
const REQUIRED_FIELDS: Array<{ key: keyof FamilyForm; label: string }> = [
    // Spouse
    { key: 'spouse_surname',          label: 'Spouse Surname' },
    { key: 'spouse_first_name',       label: 'Spouse First Name' },
    { key: 'spouse_middle_name',      label: 'Spouse Middle Name' },
    { key: 'spouse_occupation',       label: 'Spouse Occupation' },
    { key: 'spouse_employer',         label: 'Spouse Employer/Business Name' },
    { key: 'spouse_business_address', label: 'Spouse Business Address' },
    { key: 'spouse_telephone',        label: 'Spouse Telephone No.' },
    // Father
    { key: 'father_surname',          label: "Father's Surname" },
    { key: 'father_first_name',       label: "Father's First Name" },
    { key: 'father_middle_name',      label: "Father's Middle Name" },
    // Mother
    { key: 'mother_surname',          label: "Mother's Surname" },
    { key: 'mother_first_name',       label: "Mother's First Name" },
    { key: 'mother_middle_name',      label: "Mother's Middle Name" },
];

function validate(form: FamilyForm, children: PdsChild[]): { formErrors: FormErrors; childErrors: ChildErrors } {
    const formErrors: FormErrors = {};

    for (const { key, label } of REQUIRED_FIELDS) {
        const val = form[key as keyof FamilyForm];
        if (!val || String(val).trim() === '') {
            formErrors[key as keyof FamilyForm] = `Write N/A if not applicable.`;
        }
    }

    // Validate each child row that has been added
    const childErrors: ChildErrors = children.map(child => {
        const errs: Partial<Record<keyof PdsChild, string>> = {};
        if (!child.full_name || child.full_name.trim() === '') {
            errs.full_name = "Child's full name is required. Write N/A if not applicable.";
        }
        return errs;
    });

    return { formErrors, childErrors };
}

export default function FamilyBackgroundSection({ pdsData, onSave, saving, onDirtyChange  }: Props) {
    const [form, setForm] = useState<FamilyForm>({
        spouse_surname:          pdsData.family?.spouse_surname          ?? '',
        spouse_first_name:       pdsData.family?.spouse_first_name       ?? '',
        spouse_middle_name:      pdsData.family?.spouse_middle_name      ?? '',
        spouse_name_ext:         pdsData.family?.spouse_name_ext         ?? '',
        spouse_occupation:       pdsData.family?.spouse_occupation        ?? '',
        spouse_employer:         pdsData.family?.spouse_employer          ?? '',
        spouse_business_address: pdsData.family?.spouse_business_address ?? '',
        spouse_telephone:        pdsData.family?.spouse_telephone         ?? '',
        father_surname:          pdsData.family?.father_surname           ?? '',
        father_first_name:       pdsData.family?.father_first_name        ?? '',
        father_middle_name:      pdsData.family?.father_middle_name       ?? '',
        father_name_ext:         pdsData.family?.father_name_ext          ?? '',
        mother_surname:          pdsData.family?.mother_surname           ?? '',
        mother_first_name:       pdsData.family?.mother_first_name        ?? '',
        mother_middle_name:      pdsData.family?.mother_middle_name       ?? '',
    });

    const { isDirty, markDirty, markClean } = useUnsavedChanges();
    useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

    const [children, setChildren] = useState<PdsChild[]>(
        pdsData.children?.length
            ? pdsData.children
            : [{ full_name: '', date_of_birth: '' }]
    );

    const [submitted, setSubmitted]       = useState(false);
    const [errors, setErrors]             = useState<FormErrors>({});
    const [childErrors, setChildErrors]   = useState<ChildErrors>([]);

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white";
    const errorInputClass = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-white";
    const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

    const ic = (key: keyof FamilyForm) =>
        errors[key] ? errorInputClass : inputClass;

    const err = (key: keyof FamilyForm) =>
        errors[key]
            ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
            : null;

    const childIc = (i: number, key: keyof PdsChild) =>
        childErrors[i]?.[key] ? errorInputClass : inputClass;

    const childErr = (i: number, key: keyof PdsChild) =>
        childErrors[i]?.[key]
            ? <p className="mt-1 text-xs text-red-500">{childErrors[i][key]}</p>
            : null;

    // Field setters

    const setField = (key: keyof FamilyForm, value: string) => {

        markDirty(); // mark unsaved changes

        setForm(prev => ({ ...prev, [key]: value }));
        if (submitted) setErrors(prev => ({ ...prev, [key]: undefined }));
    };

    const addChild = () =>
        setChildren(prev => [...prev, { full_name: '', date_of_birth: '' }]);

    const removeChild = (i: number) => {
        setChildren(prev => prev.filter((_, idx) => idx !== i));
        setChildErrors(prev => prev.filter((_, idx) => idx !== i));
    };

    const setChild = (i: number, key: keyof PdsChild, value: string) => {

        markDirty(); // mark unsaved changes

        setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));
        if (submitted) {
            setChildErrors(prev => {
                const next = [...prev];
                if (next[i]) next[i] = { ...next[i], [key]: undefined };
                return next;
            });
        }
    };

    // Submit 

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const { formErrors, childErrors: ce } = validate(form, children);

        const hasFormErrors  = Object.keys(formErrors).length > 0;
        const hasChildErrors = ce.some(e => Object.keys(e).length > 0);

        if (hasFormErrors || hasChildErrors) {
            setErrors(formErrors);
            setChildErrors(ce);

            // Scroll to first error
            const firstFormKey = Object.keys(formErrors)[0];
            const firstChildIdx = ce.findIndex(e => Object.keys(e).length > 0);

            if (firstFormKey) {
                document.getElementById(`field-${firstFormKey}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (firstChildIdx >= 0) {
                document.getElementById(`child-row-${firstChildIdx}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setErrors({});
        setChildErrors([]);
        onSave('family', { ...form, children } as Record<string, unknown>);

        markClean(); // changes saved
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">II. Family Background</h2>
                <p className="text-xs text-gray-500">All fields are required.
                    <span className="font-medium text-green-700"> Write N/A if not applicable.</span>
                </p>
                
            </div>

            {/* Spouse */}
            <div>
                <h3 className="text-sm font-medium text-green-700 mb-3 pb-2 border-b border-gray-100 uppercase">
                    Spouse's Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div id="field-spouse_surname">
                        <label className={labelClass}>Surname <span className="text-red-500">*</span></label>
                        <input type="text" value={form.spouse_surname}
                            onChange={e => setField('spouse_surname', e.target.value)}
                            className={ic('spouse_surname')} />
                        {err('spouse_surname')}
                    </div>
                    <div id="field-spouse_first_name">
                        <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.spouse_first_name}
                            onChange={e => setField('spouse_first_name', e.target.value)}
                            className={ic('spouse_first_name')} />
                        {err('spouse_first_name')}
                    </div>
                    <div id="field-spouse_middle_name">
                        <label className={labelClass}>Middle Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.spouse_middle_name}
                            onChange={e => setField('spouse_middle_name', e.target.value)}
                            className={ic('spouse_middle_name')} />
                        {err('spouse_middle_name')}
                    </div>
                    <div>
                        <label className={labelClass}>Name Extension</label>
                        <input type="text" value={form.spouse_name_ext}
                            onChange={e => setField('spouse_name_ext', e.target.value)}
                            className={inputClass} placeholder="Jr., Sr." />
                    </div>
                    <div id="field-spouse_occupation">
                        <label className={labelClass}>Occupation <span className="text-red-500">*</span></label>
                        <input type="text" value={form.spouse_occupation}
                            onChange={e => setField('spouse_occupation', e.target.value)}
                            className={ic('spouse_occupation')} />
                        {err('spouse_occupation')}
                    </div>
                    <div id="field-spouse_employer">
                        <label className={labelClass}>Employer/Business Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.spouse_employer}
                            onChange={e => setField('spouse_employer', e.target.value)}
                            className={ic('spouse_employer')} />
                        {err('spouse_employer')}
                    </div>
                    <div id="field-spouse_business_address">
                        <label className={labelClass}>Business Address <span className="text-red-500">*</span></label>
                        <input type="text" value={form.spouse_business_address}
                            onChange={e => setField('spouse_business_address', e.target.value)}
                            className={ic('spouse_business_address')} />
                        {err('spouse_business_address')}
                    </div>
                    <div id="field-spouse_telephone">
                        <label className={labelClass}>Telephone No. <span className="text-red-500">*</span></label>
                        <input type="text" value={form.spouse_telephone}
                            onChange={e => setField('spouse_telephone', e.target.value)}
                            className={ic('spouse_telephone')} />
                        {err('spouse_telephone')}
                    </div>
                </div>
            </div>

            {/* Father */}
            <div>
                <h3 className="text-sm font-medium text-green-700 mb-3 pb-2 border-b border-gray-100 uppercase">
                    Father's Name
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div id="field-father_surname">
                        <label className={labelClass}>Surname <span className="text-red-500">*</span></label>
                        <input type="text" value={form.father_surname}
                            onChange={e => setField('father_surname', e.target.value)}
                            className={ic('father_surname')} />
                        {err('father_surname')}
                    </div>
                    <div id="field-father_first_name">
                        <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.father_first_name}
                            onChange={e => setField('father_first_name', e.target.value)}
                            className={ic('father_first_name')} />
                        {err('father_first_name')}
                    </div>
                    <div id="field-father_middle_name">
                        <label className={labelClass}>Middle Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.father_middle_name}
                            onChange={e => setField('father_middle_name', e.target.value)}
                            className={ic('father_middle_name')} />
                        {err('father_middle_name')}
                    </div>
                    <div>
                        <label className={labelClass}>Name Extension</label>
                        <input type="text" value={form.father_name_ext}
                            onChange={e => setField('father_name_ext', e.target.value)}
                            className={inputClass} placeholder="Jr., Sr." />
                    </div>
                </div>
            </div>

            {/* Mother Maiden Name */}
            <div>
                <h3 className="text-sm font-medium text-green-700 mb-3 pb-2 border-b border-gray-100 uppercase">
                    Mother's Maiden Name
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div id="field-mother_surname">
                        <label className={labelClass}>Surname <span className="text-red-500">*</span></label>
                        <input type="text" value={form.mother_surname}
                            onChange={e => setField('mother_surname', e.target.value)}
                            className={ic('mother_surname')} />
                        {err('mother_surname')}
                    </div>
                    <div id="field-mother_first_name">
                        <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.mother_first_name}
                            onChange={e => setField('mother_first_name', e.target.value)}
                            className={ic('mother_first_name')} />
                        {err('mother_first_name')}
                    </div>
                    <div id="field-mother_middle_name">
                        <label className={labelClass}>Middle Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.mother_middle_name}
                            onChange={e => setField('mother_middle_name', e.target.value)}
                            className={ic('mother_middle_name')} />
                        {err('mother_middle_name')}
                    </div>
                </div>
            </div>

            {/* Children */}
            <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-green-700 uppercase">Children</h3>
                    <button type="button" onClick={addChild}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add Child
                    </button>
                </div>

                {/* Column headers */}
                <div className="flex gap-3 items-center mb-1 px-1">
                    <span className="w-5" />
                    <p className={`${labelClass} flex-1 mb-0`}>Full Name <span className="text-red-500">*</span></p>
                    <p className={`${labelClass} w-40 mb-0`}>Date of Birth</p>
                    <span className="w-8" />
                </div>

                <div className="space-y-2">
                    {children.map((child, i) => (
                        <div key={i} id={`child-row-${i}`}>
                            <div className="flex gap-3 items-start">
                                <span className="text-xs text-gray-400 w-5 text-center mt-2.5">{i + 1}</span>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={child.full_name}
                                        onChange={e => setChild(i, 'full_name', e.target.value)}
                                        placeholder="Full name"
                                        className={childIc(i, 'full_name')}
                                    />
                                    {childErr(i, 'full_name')}
                                </div>
                                <div className="w-40">
                                    <input
                                        type="date"
                                        value={child.date_of_birth ?? ''}
                                        onChange={e => setChild(i, 'date_of_birth', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeChild(i)}
                                    className="mt-1.5 text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                    title="Remove child"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {children.length === 0 && (
                    <p className="text-xs text-gray-400 italic mt-2 text-center">
                        No children added. Click "Add Child" or leave empty if not applicable.
                    </p>
                )}
            </div>

            <div className="sticky bottom-0 bg-white pt-3 pb-1 -mx-1 px-1 flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving
                        ? <><Spinner />Saving Family Background</>
                        : <><Save className="w-4 h-4" />Save Family Background</>
                    }
                </button>
            </div>
        </form>
    );
}