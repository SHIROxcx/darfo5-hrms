import { useState, useRef, useCallback, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, X, Camera, PenLine, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
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
    passport_photo:    File | null;
    signature:         File | null;
    date_accomplished: string;
    // Preview URLs (only used for display)
    passport_preview:  string | null;
    signature_preview: string | null;
    // Raw uncroped source
    passport_raw:      string | null;
}

/** Convert a stored path like "pds/1/photo.jpg" to a full /storage/ URL. */
function storageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `/storage/${path}`;
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
    if (!decl.passport_photo && !decl.passport_preview)  photoErrors.passport_photo    = 'Passport-size photo is required.';
    if (!decl.signature       && !decl.signature_preview) photoErrors.signature         = 'Signature is required.';
    if (!decl.date_accomplished?.trim())                  photoErrors.date_accomplished = 'Date accomplished is required.';

    return { govErrors, refErrors, photoErrors };
}

// Shimmer skeleton
// Shown while a saved /storage/ image is fetching over the network

function ImageSkeleton() {
    return ( 
        <>
            <style>{`
                @keyframes imgShimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .img-shimmer {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: imgShimmer 1.4s infinite linear;
                }
            `}</style>
            <div className="absolute inset-0 img-shimmer rounded-xl" />
        </>
    );
}

// Passport Crop Modal
//
// Passport-size photo: 3.5 cm wide × 4.5 cm tall  →  aspect ratio W:H = 7:9
// Output canvas: 350 × 450 px (100 px per cm equivalent)
//
const PASSPORT_W = 350;
const PASSPORT_H = 450;
const PASSPORT_RATIO = PASSPORT_W / PASSPORT_H; // ≈ 0.7778

interface CropState {
    x: number;
    y: number;
    w: number;
    h: number;
}

function PassportCropModal({
    src,
    onSave,
    onClose,
    saving,
}: {
    src: string;
    onSave: (blob: Blob) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const imgRef       = useRef<HTMLImageElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [nat, setNat]     = useState({ w: 0, h: 0 });
    const [scale, setScale] = useState(1);
    const [crop, setCrop]   = useState<CropState>({ x: 0, y: 0, w: 0, h: 0 });

    const dragStart = useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);

    const onImageLoad = () => {
        const img  = imgRef.current!;
        const natW = img.naturalWidth;
        const natH = img.naturalHeight;
        setNat({ w: natW, h: natH });

        const container = containerRef.current!;
        const maxW      = Math.min(container.clientWidth - 32, 480);
        setScale(maxW / natW);

        let cropW = natW;
        let cropH = cropW / PASSPORT_RATIO;
        if (cropH > natH) { cropH = natH; cropW = cropH * PASSPORT_RATIO; }
        setCrop({ x: (natW - cropW) / 2, y: (natH - cropH) / 2, w: cropW, h: cropH });
    };

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        dragStart.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y };
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragStart.current) return;
            const { mx, my, cx, cy } = dragStart.current;
            const dx = (e.clientX - mx) / scale;
            const dy = (e.clientY - my) / scale;
            setCrop(prev => ({
                ...prev,
                x: Math.max(0, Math.min(nat.w - prev.w, cx + dx)),
                y: Math.max(0, Math.min(nat.h - prev.h, cy + dy)),
            }));
        };
        const onUp = () => { dragStart.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup',   onUp);
        };
    }, [scale, nat]);

    const zoom = (factor: number) => {
        setCrop(prev => {
            const newW = Math.min(Math.max(50, prev.w * factor), nat.w, nat.h * PASSPORT_RATIO);
            const newH = newW / PASSPORT_RATIO;
            if (newH > nat.h) return prev;
            return {
                x: Math.max(0, Math.min(nat.w - newW, prev.x + (prev.w - newW) / 2)),
                y: Math.max(0, Math.min(nat.h - newH, prev.y + (prev.h - newH) / 2)),
                w: newW,
                h: newH,
            };
        });
    };

    const zoomIn  = () => zoom(0.85);
    const zoomOut = () => zoom(1 / 0.85);
    const reset   = () => {
        let cropW = nat.w;
        let cropH = cropW / PASSPORT_RATIO;
        if (cropH > nat.h) { cropH = nat.h; cropW = cropH * PASSPORT_RATIO; }
        setCrop({ x: (nat.w - cropW) / 2, y: (nat.h - cropH) / 2, w: cropW, h: cropH });
    };

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current!;
        const ctx    = canvas.getContext('2d')!;
        canvas.width  = PASSPORT_W;
        canvas.height = PASSPORT_H;
        ctx.drawImage(imgRef.current!, crop.x, crop.y, crop.w, crop.h, 0, 0, PASSPORT_W, PASSPORT_H);
        canvas.toBlob(blob => { if (blob) onSave(blob); }, 'image/png', 0.92);
    }, [crop, onSave]);

    const d = { x: crop.x * scale, y: crop.y * scale, w: crop.w * scale, h: crop.h * scale, imgW: nat.w * scale };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h3 className="font-semibold text-green-800">Crop Passport-Size Photo</h3>
                        <p className="text-xs text-gray-400 mt-0.5">3.5 cm × 4.5 cm — drag the box to reposition</p>
                    </div>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div ref={containerRef} className="relative bg-gray-900 overflow-hidden select-none" style={{ maxHeight: 460 }}>
                    <img
                        ref={imgRef}
                        src={src}
                        onLoad={onImageLoad}
                        draggable={false}
                        style={{ display: 'block', width: d.imgW || '100%', maxWidth: '100%' }}
                        alt="Crop source"
                    />
                    {nat.w > 0 && (
                        <>
                            <div onMouseDown={onMouseDown} className="absolute inset-0 cursor-move" style={{ background: 'rgba(0,0,0,0.55)' }} />
                            <div
                                onMouseDown={onMouseDown}
                                className="absolute cursor-move"
                                style={{
                                    left: d.x, top: d.y, width: d.w, height: d.h,
                                    background: 'transparent',
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                                    border: '2px solid rgba(255,255,255,0.85)',
                                    borderRadius: 3,
                                }}
                            >
                                {[1, 2].map(n => (
                                    <span key={n}>
                                        <div className="absolute top-0 bottom-0" style={{ left: `${n * 33.33}%`, width: 1, background: 'rgba(255,255,255,0.2)' }} />
                                        <div className="absolute left-0 right-0" style={{ top: `${n * 33.33}%`, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                                    </span>
                                ))}
                                {['top-0 left-0 border-t-2 border-l-2','top-0 right-0 border-t-2 border-r-2','bottom-0 left-0 border-b-2 border-l-2','bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
                                    <div key={i} className={`absolute w-4 h-4 border-white ${cls}`} />
                                ))}
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-[10px] text-white">
                                    3.5 cm × 4.5 cm
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50">
                    <div className="flex items-center gap-1">
                        {([
                            { icon: ZoomIn,   fn: zoomIn,  title: 'Zoom In'  },
                            { icon: ZoomOut,  fn: zoomOut, title: 'Zoom Out' },
                            { icon: RotateCw, fn: reset,   title: 'Reset'    },
                        ] as const).map(({ icon: Icon, fn, title }) => (
                            <button key={title} type="button" onClick={fn} title={title}
                                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition">
                                <Icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onClose}
                            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="button" onClick={handleSave} disabled={saving || nat.w === 0}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                            {saving ? <><Spinner /> Saving…</> : <><Check className="w-4 h-4" /> Use Photo</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Signature Upload Box

function SignatureUploadBox({
    id,
    preview,
    error,
    onFile,
    onClear,
}: {
    id: string;
    preview: string | null;
    error?: string;
    onFile: (file: File, previewUrl: string) => void;
    onClear: () => void;
}) {
    const inputRef                  = useRef<HTMLInputElement>(null);
    const [imgLoaded, setImgLoaded] = useState(false);

    // Reset the loaded flag whenever the src changes (new upload or clear + re-upload)
    useEffect(() => { setImgLoaded(false); }, [preview]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        onFile(file, url);
        e.target.value = '';
    };

    return (
        <div>
            <div
                className={`relative w-full aspect-3/1 rounded-xl border-2 transition-colors overflow-hidden ${
                    error
                        ? 'border-red-400 bg-red-50'
                        : preview
                        ? 'border-green-400 bg-white'
                        : 'border-dashed border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/30'
                }`}
            >
                {preview ? (
                    <>
                        {/* Shimmer until image fires onLoad */}
                        {!imgLoaded && <ImageSkeleton />}
                        <img
                            src={preview}
                            alt="Signature"
                            onLoad={() => setImgLoaded(true)}
                            className={`w-full h-full object-contain transition-opacity duration-300 ${
                                imgLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={onClear}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full h-full"
                    >
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 text-center px-2 leading-tight">
                            Upload your wet or e-signature image (PNG with transparent background preferred)
                        </span>
                    </button>
                )}
                <input
                    ref={inputRef}
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleChange}
                    className="hidden"
                />
            </div>
            {preview && (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-1 w-full text-[10px] text-green-600 hover:text-green-700 text-center cursor-pointer"
                >
                    Change
                </button>
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

// Passport Photo Upload Box

function PassportPhotoUploadBox({
    id,
    preview,
    error,
    onCroppedFile,
    onClear,
}: {
    id: string;
    preview: string | null;
    error?: string;
    onCroppedFile: (file: File, previewUrl: string) => void;
    onClear: () => void;
}) {
    const inputRef                    = useRef<HTMLInputElement>(null);
    const [cropSrc,    setCropSrc]    = useState<string | null>(null);
    const [cropSaving, setCropSaving] = useState(false);
    const [imgLoaded,  setImgLoaded]  = useState(false);

    // Reset the loaded flag whenever the src changes
    useEffect(() => { setImgLoaded(false); }, [preview]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setCropSrc(ev.target?.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropSave = (blob: Blob) => {
        setCropSaving(true);
        const url  = URL.createObjectURL(blob);
        const file = new File([blob], 'passport_photo.jpg', { type: 'image/jpeg' });
        onCroppedFile(file, url);
        if (cropSrc?.startsWith('blob:')) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
        setCropSaving(false);
    };

    return (
        <>
            {cropSrc && (
                <PassportCropModal
                    src={cropSrc}
                    onSave={handleCropSave}
                    onClose={() => {
                        if (cropSrc?.startsWith('blob:')) URL.revokeObjectURL(cropSrc);
                        setCropSrc(null);
                    }}
                    saving={cropSaving}
                />
            )}

            <div>
                {/* aspect-[7/9] = 3.5 cm wide : 4.5 cm tall */}
                <div
                    className={`relative w-full aspect-7/9 rounded-xl border-2 transition-colors overflow-hidden ${
                        error
                            ? 'border-red-400 bg-red-50'
                            : preview
                            ? 'border-green-400 bg-white'
                            : 'border-dashed border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/30'
                    }`}
                >
                    {preview ? (
                        <>
                            {/* Shimmer until image fires onLoad */}
                            {!imgLoaded && <ImageSkeleton />}
                            <img
                                src={preview}
                                alt="Passport photo"
                                onLoad={() => setImgLoaded(true)}
                                className={`w-full h-full object-cover transition-opacity duration-300 ${
                                    imgLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={onClear}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full h-full"
                        >
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 text-center px-2 leading-tight">
                                Passport-sized photo (3.5 × 4.5 cm){'\n'}taken within the last 6 months
                            </span>
                        </button>
                    )}
                    <input
                        ref={inputRef}
                        id={id}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleChange}
                        className="hidden"
                    />
                </div>

                {preview && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="mt-1 w-full text-[10px] text-green-600 hover:text-green-700 text-center cursor-pointer"
                    >
                        Change
                    </button>
                )}
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        </>
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
        date_accomplished: pdsData.government_id?.date_accomplished ?? '',
        passport_preview:  storageUrl(pdsData.government_id?.passport_photo),
        signature_preview: storageUrl(pdsData.government_id?.signature),
        passport_raw:      null,
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

    const addRef = () => {
        if (refs.length >= 3) return; 
        setRefs(p => [...p, { name: '', address: '', telephone: '' }]);
        setRefErrors(p => [...p, {}]);
    };
    const removeRef = (i: number) => { setRefs(p => p.filter((_, idx) => idx !== i)); setRefErrors(p => p.filter((_, idx) => idx !== i)); };

    const setPassportPhoto = (file: File, url: string) => {
        setDecl(p => ({ ...p, passport_photo: file, passport_preview: url }));
        if (submitted) setPhotoErrors(p => ({ ...p, passport_photo: undefined }));
    };
    const clearPassportPhoto = () => setDecl(p => ({ ...p, passport_photo: null, passport_preview: null, passport_raw: null }));

    const setSignature = (file: File, url: string) => {
        setDecl(p => ({ ...p, signature: file, signature_preview: url }));
        if (submitted) setPhotoErrors(p => ({ ...p, signature: undefined }));
    };
    const clearSignature = () => setDecl(p => ({ ...p, signature: null, signature_preview: null }));

    const setDateAccomplished = (v: string) => {
        setDecl(p => ({ ...p, date_accomplished: v }));
        if (submitted) setPhotoErrors(p => ({ ...p, date_accomplished: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

        try {
            await onSave('references',    { references: refs } as unknown as Record<string, unknown>);
            await onSave('government_id', govId as unknown as Record<string, unknown>);

            const declData: Record<string, unknown> = { date_accomplished: decl.date_accomplished };
            if (decl.passport_photo) declData.passport_photo = decl.passport_photo;
            if (decl.signature)      declData.signature      = decl.signature;
            await onSave('declaration', declData);
        } catch {
            // errors already handled inside onSave
        }
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

            {/* References */}
            <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-green-700 uppercase">References</h3>
                    <button type="button" onClick={addRef}
                        disabled={refs.length >= 3} 
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
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

            {/* Declaration */}
            {/* <div>
                <h3 className="text-sm font-medium text-green-700 uppercase mb-3 pb-2 border-b border-gray-100">
                    Declaration
                </h3>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
                    <p className="text-xs text-amber-800 leading-relaxed text-justify">
                        <span className='font-semibold'>I declare under oath</span> that I have personally accomplished this 
                        <span className='font-semibold'> Personal Data Sheet</span> which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized
                        representative to verify/validate the contents stated herein. I agree that any misrepresentation
                        made in this document and its attachments shall cause the filing of administrative/criminal case/s
                        against me.
                    </p>
                </div>
            </div> */}

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

            {/* Photo + Signature + Date */}
            <div>
                <h3 className="text-sm font-medium text-green-700 uppercase mb-3 pb-2 border-b border-gray-100">
                    Photo and Signature
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">

                    {/* Passport Photo */}
                    <div id="field-passport_photo">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Camera className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Passport-Size Photo <span className="text-red-500">*</span>
                            </span>
                        </div>
                        <PassportPhotoUploadBox
                            id="upload-passport-photo"
                            preview={decl.passport_preview}
                            error={photoErrors.passport_photo}
                            onCroppedFile={setPassportPhoto}
                            onClear={clearPassportPhoto}
                        />
                    </div>

                    {/* Signature */}
                    <div id="field-signature">
                        <div className="flex items-center gap-1.5 mb-2">
                            <PenLine className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Signature <span className="text-red-500">*</span>
                            </span>
                        </div>
                        <SignatureUploadBox
                            id="upload-signature"
                            preview={decl.signature_preview}
                            error={photoErrors.signature}
                            onFile={setSignature}
                            onClear={clearSignature}
                        />
                    </div>

                    {/* Date Accomplished */}
                    <div id="field-date_accomplished">
                        <div className="flex items-center gap-1.5 mb-2">
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