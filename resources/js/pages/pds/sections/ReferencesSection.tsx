import { useState, useRef } from 'react';
import { Save, Plus, Trash2, Upload, X, Camera, PenLine } from 'lucide-react';
import type { User, PdsData, PdsReference, PdsGovernmentId, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

const GOV_IDS = [
    'Passport', 'GSIS e-Card', 'SSS Card', 'PRC ID', "Driver's License",
    'NBI Clearance', 'Police Clearance', 'Postal ID', "Voter's ID",
    'PhilHealth ID', 'Senior Citizen ID', 'UMID', 'PWD ID', 'Solo Parent ID', 'Others',
];

type GovIdErrors  = Partial<Record<keyof PdsGovernmentId, string>>;
type RefErrors    = Partial<Record<keyof PdsReference, string>>[];
type PhotoErrors  = { passport_photo?: string; signature?: string; date_accomplished?: string };

interface DeclarationData {
    passport_photo:   File | null;
    signature:        File | null;
    date_accomplished: string;
    // Preview URLs (not sent to server — only used for display)
    passport_preview: string | null;
    signature_preview: string | null;
}

function validate(
    govId: PdsGovernmentId,
    refs: PdsReference[],
    decl: DeclarationData,
): {
    govErrors: GovIdErrors;
    refErrors: RefErrors;
    photoErrors: PhotoErrors;
} {
    const govErrors: GovIdErrors = {};
    if (!govId.id_type?.trim())           govErrors.id_type           = 'Government ID type is required.';
    if (!govId.id_number?.trim())         govErrors.id_number         = 'ID / License / Passport No. is required.';
    if (!govId.date_of_issuance?.trim())  govErrors.date_of_issuance  = 'Date of issuance is required.';
    if (!govId.place_of_issuance?.trim()) govErrors.place_of_issuance = 'Place of issuance is required.';

    const refErrors: RefErrors = refs.map(ref => {
        const e: Partial<Record<keyof PdsReference, string>> = {};
        if (!ref.name?.trim())      e.name      = 'Reference name is required.';
        if (!ref.address?.trim())   e.address   = 'Address is required.';
        if (!ref.telephone?.trim()) e.telephone = 'Contact No. / Email is required.';
        return e;
    });

    const photoErrors: PhotoErrors = {};
    if (!decl.passport_photo && !decl.passport_preview)  photoErrors.passport_photo  = 'Passport-size photo is required.';
    if (!decl.signature       && !decl.signature_preview) photoErrors.signature       = 'Signature is required.';
    if (!decl.date_accomplished?.trim())                  photoErrors.date_accomplished = 'Date accomplished is required.';

    return { govErrors, refErrors, photoErrors };
}

// Image Upload Box

function ImageUploadBox({
    id, label, hint, preview, error,
    accept = 'image/*',
    onFile,
    onClear,
    aspectClass = 'aspect-[3/4]',
}: {
    id: string;
    label: string;
    hint: string;
    preview: string | null;
    error?: string;
    accept?: string;
    onFile: (file: File, previewUrl: string) => void;
    onClear: () => void;
    aspectClass?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        onFile(file, url);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className={`relative w-full ${aspectClass} rounded-xl border-2 transition-colors overflow-hidden ${
                error
                    ? 'border-red-400 bg-red-50'
                    : preview
                    ? 'border-green-400 bg-white'
                    : 'border-dashed border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/30'
            }`}>
                {preview ? (
                    <>
                        <img src={preview} alt={label}
                            className="w-full h-full object-contain" />
                        <button type="button" onClick={onClear}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <button type="button" onClick={() => inputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full h-full">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 text-center px-2 leading-tight">{hint}</span>
                    </button>
                )}
                <input
                    ref={inputRef}
                    id={id}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />
            </div>
            {preview && (
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="mt-1 w-full text-[10px] text-green-600 hover:text-green-700 text-center cursor-pointer">
                    Change
                </button>
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

// Main

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

    const [decl, setDecl] = useState<DeclarationData>({
        passport_photo:    null,
        signature:         null,
        date_accomplished: '',
        passport_preview:  null,
        signature_preview: null,
    });

    const [submitted,   setSubmitted]   = useState(false);
    const [govErrors,   setGovErrors]   = useState<GovIdErrors>({});
    const [refErrors,   setRefErrors]   = useState<RefErrors>([]);
    const [photoErrors, setPhotoErrors] = useState<PhotoErrors>({});

    // Styles

    const inputClass      = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";
    const errorInputClass = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";
    const labelClass      = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

    const govIc  = (k: keyof PdsGovernmentId) => govErrors[k]  ? errorInputClass : inputClass;
    const govErr = (k: keyof PdsGovernmentId) => govErrors[k]  ? <p className="mt-1 text-xs text-red-500">{govErrors[k]}</p>  : null;
    const refIc  = (i: number, k: keyof PdsReference) => refErrors[i]?.[k] ? errorInputClass : inputClass;
    const refErr = (i: number, k: keyof PdsReference) => refErrors[i]?.[k] ? <p className="mt-1 text-xs text-red-500">{refErrors[i][k]}</p> : null;

    // Setters

    const setGov = (k: keyof PdsGovernmentId, v: string) => {
        setGovId(p => ({ ...p, [k]: v }));
        if (submitted) setGovErrors(p => ({ ...p, [k]: undefined }));
    };

    const setRef = (i: number, k: keyof PdsReference, v: string) => {
        setRefs(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
        if (submitted) setRefErrors(p => p.map((e, idx) => idx === i ? { ...e, [k]: undefined } : e));
    };

    const addRef    = () => { setRefs(p => [...p, { name: '', address: '', telephone: '' }]); setRefErrors(p => [...p, {}]); };
    const removeRef = (i: number) => { setRefs(p => p.filter((_, idx) => idx !== i)); setRefErrors(p => p.filter((_, idx) => idx !== i)); };

    const setPassportPhoto = (file: File, url: string) => {
        setDecl(p => ({ ...p, passport_photo: file, passport_preview: url }));
        if (submitted) setPhotoErrors(p => ({ ...p, passport_photo: undefined }));
    };
    const clearPassportPhoto = () => setDecl(p => ({ ...p, passport_photo: null, passport_preview: null }));

    const setSignature = (file: File, url: string) => {
        setDecl(p => ({ ...p, signature: file, signature_preview: url }));
        if (submitted) setPhotoErrors(p => ({ ...p, signature: undefined }));
    };
    const clearSignature = () => setDecl(p => ({ ...p, signature: null, signature_preview: null }));

    const setDateAccomplished = (v: string) => {
        setDecl(p => ({ ...p, date_accomplished: v }));
        if (submitted) setPhotoErrors(p => ({ ...p, date_accomplished: undefined }));
    };

    // Submit

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const { govErrors: ge, refErrors: re, photoErrors: pe } = validate(govId, refs, decl);
        const hasErrors = Object.keys(ge).length > 0
            || re.some(r => Object.keys(r).length > 0)
            || Object.keys(pe).length > 0;

        if (hasErrors) {
            setGovErrors(ge);
            setRefErrors(re);
            setPhotoErrors(pe);

            // Scroll to first error
            const firstRefIdx = re.findIndex(r => Object.keys(r).length > 0);
            if (firstRefIdx >= 0) {
                const fk = Object.keys(re[firstRefIdx])[0];
                document.getElementById(`ref-${firstRefIdx}-${fk}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (Object.keys(ge).length > 0) {
                document.getElementById(`field-${Object.keys(ge)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (Object.keys(pe).length > 0) {
                document.getElementById(`field-${Object.keys(pe)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setGovErrors({}); setRefErrors([]); setPhotoErrors({});

        // Save references and government ID
        onSave('references',    { references: refs } as unknown as Record<string, unknown>);
        onSave('government_id', govId as unknown as Record<string, unknown>);

        // Save declaration data as FormData (files + date)
        const fd = new FormData();
        if (decl.passport_photo)  fd.append('passport_photo', decl.passport_photo);
        if (decl.signature)       fd.append('signature',       decl.signature);
        fd.append('date_accomplished', decl.date_accomplished);
        onSave('declaration', Object.fromEntries(fd.entries()) as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Title */}
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">X. References &amp; Government ID</h2>
                <p className="text-xs text-gray-500">
                    References must not be related by consanguinity or affinity to the applicant/appointee.
                    All fields marked <span className="text-red-500">*</span> are required.
                </p>
            </div>

            {/*  References */}
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
                            refErrors[i] && Object.keys(refErrors[i]).length > 0 ? 'border-red-200' : 'border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Reference {i + 1}</span>
                                {refs.length > 1 && (
                                    <button type="button" onClick={() => removeRef(i)} className="text-red-400 hover:text-red-600 cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div id={`ref-${i}-name`}>
                                    <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={ref.name ?? ''} onChange={e => setRef(i, 'name', e.target.value)} className={refIc(i, 'name')} />
                                    {refErr(i, 'name')}
                                </div>
                                <div id={`ref-${i}-address`}>
                                    <label className={labelClass}>Office/Residential Address <span className="text-red-500">*</span></label>
                                    <input type="text" value={ref.address ?? ''} onChange={e => setRef(i, 'address', e.target.value)} className={refIc(i, 'address')} />
                                    {refErr(i, 'address')}
                                </div>
                                <div id={`ref-${i}-telephone`}>
                                    <label className={labelClass}>Contact No. / Email <span className="text-red-500">*</span></label>
                                    <input type="text" value={ref.telephone ?? ''} onChange={e => setRef(i, 'telephone', e.target.value)} className={refIc(i, 'telephone')} />
                                    {refErr(i, 'telephone')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Government ID */}
            <div>
                <h3 className="text-sm font-medium text-green-700 uppercase mb-3 pb-2 border-b border-gray-100">
                    Government Issued ID
                </h3>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div id="field-id_type">
                            <label className={labelClass}>Government Issued ID <span className="text-red-500">*</span></label>
                            <select value={govId.id_type ?? ''} onChange={e => setGov('id_type', e.target.value)} className={govIc('id_type')}>
                                <option value="">Select ID type</option>
                                {GOV_IDS.map(id => <option key={id} value={id}>{id}</option>)}
                            </select>
                            {govErr('id_type')}
                        </div>
                        <div id="field-id_number">
                            <label className={labelClass}>ID / License / Passport No. <span className="text-red-500">*</span></label>
                            <input type="text" value={govId.id_number ?? ''} onChange={e => setGov('id_number', e.target.value)} className={govIc('id_number')} />
                            {govErr('id_number')}
                        </div>
                        <div id="field-date_of_issuance">
                            <label className={labelClass}>Date of Issuance <span className="text-red-500">*</span></label>
                            <input type="text" value={govId.date_of_issuance ?? ''} onChange={e => setGov('date_of_issuance', e.target.value)}
                                placeholder="mm/dd/yyyy or Month DD, YYYY" className={govIc('date_of_issuance')} />
                            {govErr('date_of_issuance')}
                        </div>
                        <div id="field-place_of_issuance">
                            <label className={labelClass}>Place of Issuance <span className="text-red-500">*</span></label>
                            <input type="text" value={govId.place_of_issuance ?? ''} onChange={e => setGov('place_of_issuance', e.target.value)} className={govIc('place_of_issuance')} />
                            {govErr('place_of_issuance')}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                 <h3 className="text-sm font-medium text-green-700 uppercase mb-3 pb-2 border-b border-gray-100">
                    Photo and Signature
                </h3>
                 {/* Photo + Signature + Date in one row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">

                    {/* Passport Photo */}
                    <div id="field-passport_photo">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Camera className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Passport-Size Photo <span className="text-red-500">*</span>
                            </span>
                        </div>
                        <ImageUploadBox
                            id="upload-passport-photo"
                            label=""
                            hint={"Passport-sized unfiltered digital picture taken with the last 6 months 4.5 cm x 3.5 cm"}
                            preview={decl.passport_preview}
                            error={photoErrors.passport_photo}
                            accept="image/jpeg,image/png,image/webp"
                            onFile={setPassportPhoto}
                            onClear={clearPassportPhoto}
                            aspectClass="aspect-[3/4]"
                        />
                    </div>

                    {/* Signature */}
                    <div id="field-signature">
                        <div className="flex items-center gap-1.5 mb-1">
                            <PenLine className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Signature <span className="text-red-500">*</span>
                            </span>
                        </div>
                        <ImageUploadBox
                            id="upload-signature"
                            label=""
                            hint={"Upload your wet or\ne-signature image\n(PNG with transparent\nbackground preferred)"}
                            preview={decl.signature_preview}
                            error={photoErrors.signature}
                            accept="image/jpeg,image/png,image/webp"
                            onFile={setSignature}
                            onClear={clearSignature}
                            aspectClass="aspect-[3/1]"
                        />
                    </div>

                    {/* Date Accomplished */}
                    <div id="field-date_accomplished">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Date Accomplished <span className="text-red-500">*</span>
                            </span>
                        </div>
                        <input
                            type="date"
                            value={decl.date_accomplished}
                            onChange={e => setDateAccomplished(e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white transition-all ${
                                photoErrors.date_accomplished
                                    ? 'border-red-400 focus:ring-red-400'
                                    : 'border-gray-200 focus:ring-green-500'
                            }`}
                        />
                        {photoErrors.date_accomplished && (
                            <p className="mt-1 text-xs text-red-500">{photoErrors.date_accomplished}</p>
                        )}
                    </div>

                </div>
            </div>

            {/* Declaration Row */}
            <div>
                <h3 className="text-sm font-medium text-green-700 uppercase mb-3 pb-2 border-b border-gray-100">
                    Declaration
                </h3>

                {/* Oath text */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
                    <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>I declare under oath</strong> that I have personally accomplished this Personal Data Sheet
                        which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules
                        and regulations of the Republic of the Philippines. I authorize the agency head/authorized
                        representative to verify/validate the contents stated herein. I agree that any misrepresentation
                        made in this document and its attachments shall cause the filing of administrative/criminal case/s
                        against me.
                    </p>
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
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