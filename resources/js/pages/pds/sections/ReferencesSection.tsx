import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { User, PdsData, PdsReference, PdsGovernmentId, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

const GOV_IDS = [
    'Passport', 'GSIS e-Card', 'SSS Card', 'PRC ID', "Driver's License",
    'NBI Clearance', 'Police Clearance', 'Postal ID', "Voter's ID",
    'PhilHealth ID', 'Senior Citizen ID', 'UMID', 'PWD ID', 'Solo Parent ID', 'Others',
];

type GovIdErrors = Partial<Record<keyof PdsGovernmentId, string>>;
type RefErrors   = Partial<Record<keyof PdsReference, string>>[];

function validate(govId: PdsGovernmentId, refs: PdsReference[]): { govErrors: GovIdErrors; refErrors: RefErrors } {
    const govErrors: GovIdErrors = {};
    if (!govId.id_type?.trim())          govErrors.id_type          = 'Government ID type is required.';
    if (!govId.id_number?.trim())        govErrors.id_number        = 'ID / License / Passport No. is required.';
    if (!govId.date_of_issuance?.trim()) govErrors.date_of_issuance = 'Date of issuance is required.';
    if (!govId.place_of_issuance?.trim()) govErrors.place_of_issuance = 'Place of issuance is required.';

    // Each reference row that exists must have at least a name filled
    const refErrors: RefErrors = refs.map(ref => {
        const e: Partial<Record<keyof PdsReference, string>> = {};
        if (!ref.name?.trim())      e.name      = 'Reference name is required.';
        if (!ref.address?.trim())   e.address   = 'Address is required.';
        if (!ref.telephone?.trim()) e.telephone = 'Contact No. / Email is required.';
        return e;
    });

    return { govErrors, refErrors };
}

export default function ReferencesSection({ pdsData, onSave, saving }: Props) {
    const [refs, setRefs] = useState<PdsReference[]>(
        pdsData.references?.length ? pdsData.references : [
            { name: '', address: '', telephone: '' },
            { name: '', address: '', telephone: '' },
            { name: '', address: '', telephone: '' },
        ]
    );

    const [govId, setGovId] = useState<PdsGovernmentId>({
        id_type:           pdsData.government_id?.id_type           ?? '',
        id_number:         pdsData.government_id?.id_number         ?? '',
        date_of_issuance:  pdsData.government_id?.date_of_issuance  ?? '',
        place_of_issuance: pdsData.government_id?.place_of_issuance ?? '',
    });

    const [submitted,  setSubmitted]  = useState(false);
    const [govErrors,  setGovErrors]  = useState<GovIdErrors>({});
    const [refErrors,  setRefErrors]  = useState<RefErrors>([]);

    // Styles

    const inputClass      = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";
    const errorInputClass = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";
    const labelClass      = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

    const govIc  = (key: keyof PdsGovernmentId) => govErrors[key] ? errorInputClass : inputClass;
    const govErr = (key: keyof PdsGovernmentId) =>
        govErrors[key] ? <p className="mt-1 text-xs text-red-500">{govErrors[key]}</p> : null;

    const refIc  = (i: number, key: keyof PdsReference) =>
        refErrors[i]?.[key] ? errorInputClass : inputClass;
    const refErr = (i: number, key: keyof PdsReference) =>
        refErrors[i]?.[key]
            ? <p className="mt-1 text-xs text-red-500">{refErrors[i][key]}</p>
            : null;

    // Setters

    const setGov = (key: keyof PdsGovernmentId, val: string) => {
        setGovId(prev => ({ ...prev, [key]: val }));
        if (submitted) setGovErrors(prev => ({ ...prev, [key]: undefined }));
    };

    const setRef = (i: number, key: keyof PdsReference, val: string) => {
        setRefs(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
        if (submitted) {
            setRefErrors(prev => {
                const next = [...prev];
                if (next[i]) next[i] = { ...next[i], [key]: undefined };
                return next;
            });
        }
    };

    const addRef = () => {
        setRefs(prev => [...prev, { name: '', address: '', telephone: '' }]);
        setRefErrors(prev => [...prev, {}]);
    };

    const removeRef = (i: number) => {
        setRefs(prev => prev.filter((_, idx) => idx !== i));
        setRefErrors(prev => prev.filter((_, idx) => idx !== i));
    };

    // Submit

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const { govErrors: ge, refErrors: re } = validate(govId, refs);

        const hasGovErrors = Object.keys(ge).length > 0;
        const hasRefErrors = re.some(r => Object.keys(r).length > 0);

        if (hasGovErrors || hasRefErrors) {
            setGovErrors(ge);
            setRefErrors(re);

            // Scroll to the first error
            if (hasRefErrors) {
                const firstRefIdx = re.findIndex(r => Object.keys(r).length > 0);
                const firstRefKey = firstRefIdx >= 0 ? Object.keys(re[firstRefIdx])[0] : null;
                if (firstRefKey) {
                    document.getElementById(`ref-${firstRefIdx}-${firstRefKey}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }
            if (hasGovErrors) {
                const firstGovKey = Object.keys(ge)[0];
                document.getElementById(`field-${firstGovKey}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setGovErrors({});
        setRefErrors([]);

        onSave('references',    { references: refs } as unknown as Record<string, unknown>);
        onSave('government_id', govId as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">References &amp; Government ID</h2>
                <p className="text-xs text-gray-500">
                    References must not be related by consanguinity or affinity to the applicant/appointee.
                    All fields marked <span className="text-red-500">*</span> are required.
                </p>
            </div>

            {/* ── References ── */}
            <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-green-700 uppercase">References</h3>
                    <button type="button" onClick={addRef}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add Reference
                    </button>
                </div>

                <div className="space-y-3">
                    {refs.map((ref, i) => (
                        <div key={i} className={`rounded-xl border p-4 bg-gray-50/40 ${
                            refErrors[i] && Object.keys(refErrors[i]).length > 0
                                ? 'border-red-200'
                                : 'border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                    Reference {i + 1}
                                </span>
                                {refs.length > 1 && (
                                    <button type="button" onClick={() => removeRef(i)}
                                        className="text-red-400 hover:text-red-600 cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div id={`ref-${i}-name`}>
                                    <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={ref.name ?? ''}
                                        onChange={e => setRef(i, 'name', e.target.value)}
                                        className={refIc(i, 'name')} />
                                    {refErr(i, 'name')}
                                </div>
                                <div id={`ref-${i}-address`}>
                                    <label className={labelClass}>Office/Residential Address <span className="text-red-500">*</span></label>
                                    <input type="text" value={ref.address ?? ''}
                                        onChange={e => setRef(i, 'address', e.target.value)}
                                        className={refIc(i, 'address')} />
                                    {refErr(i, 'address')}
                                </div>
                                <div id={`ref-${i}-telephone`}>
                                    <label className={labelClass}>Contact No. / Email <span className="text-red-500">*</span></label>
                                    <input type="text" value={ref.telephone ?? ''}
                                        onChange={e => setRef(i, 'telephone', e.target.value)}
                                        className={refIc(i, 'telephone')} />
                                    {refErr(i, 'telephone')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Government ID ── */}
            <div>
                <h3 className="text-sm font-medium text-green-700 uppercase mb-3 pb-2 border-b border-gray-100">
                    Government Issued ID
                </h3>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-xs text-gray-500 mb-3">
                        i.e. Passport, GSIS, SSS, PRC, Driver's License, etc. All fields are required.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div id="field-id_type">
                            <label className={labelClass}>Government Issued ID <span className="text-red-500">*</span></label>
                            <select value={govId.id_type ?? ''}
                                onChange={e => setGov('id_type', e.target.value)}
                                className={govIc('id_type')}>
                                <option value="">Select ID type</option>
                                {GOV_IDS.map(id => <option key={id} value={id}>{id}</option>)}
                            </select>
                            {govErr('id_type')}
                        </div>
                        <div id="field-id_number">
                            <label className={labelClass}>ID / License / Passport No. <span className="text-red-500">*</span></label>
                            <input type="text" value={govId.id_number ?? ''}
                                onChange={e => setGov('id_number', e.target.value)}
                                className={govIc('id_number')} />
                            {govErr('id_number')}
                        </div>
                        <div id="field-date_of_issuance">
                            <label className={labelClass}>Date of Issuance <span className="text-red-500">*</span></label>
                            <input type="text" value={govId.date_of_issuance ?? ''}
                                onChange={e => setGov('date_of_issuance', e.target.value)}
                                placeholder="mm/dd/yyyy or Month DD, YYYY"
                                className={govIc('date_of_issuance')} />
                            {govErr('date_of_issuance')}
                        </div>
                        <div id="field-place_of_issuance">
                            <label className={labelClass}>Place of Issuance <span className="text-red-500">*</span></label>
                            <input type="text" value={govId.place_of_issuance ?? ''}
                                onChange={e => setGov('place_of_issuance', e.target.value)}
                                className={govIc('place_of_issuance')} />
                            {govErr('place_of_issuance')}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Declaration ── */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Declaration:</strong> I declare under oath that I have personally accomplished this
                    Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions
                    of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the
                    agency head/authorized representative to verify/validate the contents stated herein. I agree
                    that any misrepresentation made in this document and its attachments shall cause the filing
                    of administrative/criminal case/s against me.
                </p>
            </div>

            <div className="sticky bottom-0 bg-white pt-3 pb-1 -mx-1 px-1 flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving
                        ? <><Spinner />Saving References &amp; ID</>
                        : <><Save className="w-4 h-4" />Save References &amp; ID</>
                    }
                </button>
            </div>
        </form>
    );
}