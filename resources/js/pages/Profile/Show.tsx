import { Head, router, usePage } from '@inertiajs/react';
import {
    Camera, Pencil,
    MessagesSquare, X,
    ZoomIn, ZoomOut, RotateCw, Check,
    SquareUser,
    Image,
    Download, Printer,
    EllipsisVertical
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import Swal from 'sweetalert2';

import type { PdsData } from '@/types/pds';
import { calculatePdsCompletion } from '@/lib/pds-completion';
import ServiceRecordSection, { type ServiceRecordRow } from '@/pages/Profile/sections/ServiceRecordSection';
import PersonalSection from '@/pages/Profile/sections/PersonalSection';
import CompanySection from '@/pages/Profile/sections/CompanySection';
import EducationSection from '@/pages/Profile/sections/EducationSection';
import EligibilitySection from '@/pages/Profile/sections/EligibilitySection';
import type { ProfileUser } from '@/pages/Profile/types';

// Types

interface DivisionData { id: number; name: string; sections: { id: number; name: string }[] }
interface PositionData  { id: number; title: string; salary_grade: number }

interface PageProps {
    auth: { user: { id: number; roles: string[] } };
    profileUser: ProfileUser;
    canEditCompany: boolean;
    pdsData: PdsData;
    serviceRecords: ServiceRecordRow[];
    divisionAbbreviations: Record<string, string>;
    sectionAbbreviations: Record<string, string>;
    [key: string]: unknown;
}

// Helpers

function getInitials(u: ProfileUser) {
    return ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase()
        || u.name?.[0]?.toUpperCase() || '?';
}

function fullName(u: ProfileUser) {
    const mid = u.middle_name ? u.middle_name[0].toUpperCase() + '.' : null;
    return [u.first_name, mid, u.last_name, u.name_ext].filter(Boolean).join(' ') || u.name;
}

// Photo Crop Modal
// 2×2 inch = 1:1 square crop, 400×400px output

interface CropState {
    x: number; // offset within image (px, natural coords)
    y: number;
    size: number; // square side in natural image px
}

function PhotoViewerModal({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            >
                <X className="h-5 w-5" />
            </button>
            <div
                className="flex flex-col items-center gap-3"
                onClick={e => e.stopPropagation()}
            >
                <p className="text-white font-semibold text-sm">{name}</p>
                <img
                    src={src}
                    alt={name}
                    className="max-h-[80vh] max-w-[80vw] rounded-xl object-contain shadow-2xl"
                />
            </div>
        </div>
    );
}

// Photo Crop Modal

function PhotoCropModal({ src, onSave, onClose, saving }: {
    src: string;
    onSave: (blob: Blob) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const imgRef     = useRef<HTMLImageElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Natural image size
    const [nat, setNat]   = useState({ w: 0, h: 0 });
    // Display scale: display px / natural px
    const [scale, setScale] = useState(1);

    // Crop box in NATURAL image coordinates
    const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, size: 0 });
    const dragStart = useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);

    const onImageLoad = () => {
        const img = imgRef.current!;
        const natW = img.naturalWidth;
        const natH = img.naturalHeight;
        setNat({ w: natW, h: natH });

        // Display size (max 480px)
        const container = containerRef.current!;
        const dispW = Math.min(container.clientWidth - 32, 480);
        setScale(dispW / natW);

        // Initial crop: centered square = min(natW,natH)
        const s = Math.min(natW, natH);
        setCrop({ x: (natW - s) / 2, y: (natH - s) / 2, size: s });
    };

    // Drag the crop box
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
                x: Math.max(0, Math.min(nat.w - prev.size, cx + dx)),
                y: Math.max(0, Math.min(nat.h - prev.size, cy + dy)),
            }));
        };
        const onUp = () => { dragStart.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [scale, nat]);

    const zoomIn  = () => setCrop(prev => {
        const s = Math.max(50, prev.size - nat.w * 0.1);
        return { x: Math.min(nat.w - s, prev.x + (prev.size - s) / 2), y: Math.min(nat.h - s, prev.y + (prev.size - s) / 2), size: s };
    });
    const zoomOut = () => setCrop(prev => {
        const s = Math.min(Math.min(nat.w, nat.h), prev.size + nat.w * 0.1);
        return { x: Math.max(0, prev.x - (s - prev.size) / 2), y: Math.max(0, prev.y - (s - prev.size) / 2), size: s };
    });
    const reset   = () => {
        const s = Math.min(nat.w, nat.h);
        setCrop({ x: (nat.w - s) / 2, y: (nat.h - s) / 2, size: s });
    };

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current!;
        const ctx    = canvas.getContext('2d')!;
        // Output 400×400 for a crisp 2×2 photo
        canvas.width  = 400;
        canvas.height = 400;
        const img = imgRef.current!;
        ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, 400, 400);
        canvas.toBlob(blob => { if (blob) onSave(blob); }, 'image/jpeg', 0.92);
    }, [crop, onSave]);

    // Display crop coords
    const dCrop = { x: crop.x * scale, y: crop.y * scale, size: crop.size * scale };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h3 className="font-semibold text-green-800">Crop Profile Photo</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Drag the box to reposition</p>
                    </div>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Canvas */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Crop area */}
                <div ref={containerRef} className="relative bg-gray-900 overflow-hidden select-none" style={{ maxHeight: '420px' }}>
                    <img
                        ref={imgRef}
                        src={src}
                        onLoad={onImageLoad}
                        draggable={false}
                        style={{ display: 'block', width: nat.w * scale, maxWidth: '100%' }}
                        alt="Crop source"
                    />
                    {nat.w > 0 && (
                        <>
                            <div
                                onMouseDown={onMouseDown}
                                className="absolute inset-0 cursor-move"
                                style={{ background: 'rgba(0,0,0,0.55)' }}
                            />
                            {/* Crop window — clears the overlay */}
                            <div
                                onMouseDown={onMouseDown}
                                className="absolute cursor-move"
                                style={{
                                    left:   dCrop.x,
                                    top:    dCrop.y,
                                    width:  dCrop.size,
                                    height: dCrop.size,
                                    background: 'transparent',
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                                    border: '2px solid rgba(255,255,255,0.8)',
                                    borderRadius: 4,
                                }}
                            >
                                {/* Rule-of-thirds grid lines */}
                                {[1, 2].map(n => (
                                    <span key={n}>
                                        <div className="absolute top-0 bottom-0" style={{ left: `${n * 33.33}%`, width: 1, background: 'rgba(255,255,255,0.25)' }} />
                                        <div className="absolute left-0 right-0" style={{ top: `${n * 33.33}%`, height: 1, background: 'rgba(255,255,255,0.25)' }} />
                                    </span>
                                ))}
                                {/* Corner handles */}
                                {[
                                    'top-0 left-0 border-t-2 border-l-2',
                                    'top-0 right-0 border-t-2 border-r-2',
                                    'bottom-0 left-0 border-b-2 border-l-2',
                                    'bottom-0 right-0 border-b-2 border-r-2',
                                ].map((cls, i) => (
                                    <div key={i} className={`absolute w-4 h-4 border-white ${cls}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50">
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={zoomIn} title='Zoom In'
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={zoomOut} title='Zoom Out'
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={reset} title='Reset'
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition">
                            <RotateCw className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onClose} 
                            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="button" onClick={handleSave} disabled={saving || nat.w === 0}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                            {saving ? <><Spinner /> Saving Photo</> : <><Check className="w-4 h-4" /> Use Photo</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ARTA ID Preview

function ArtaIdPreviewModal({ userId, onClose }: { userId: number; onClose: () => void }) {
    const previewUrl  = `/admin/arta-id/preview/${userId}`;
    const downloadUrl = `/admin/arta-id/download/${userId}`;
    const [loaded, setLoaded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
    };

    return (
        <div className="fixed inset-0 z-200 flex flex-col bg-black/80" onClick={onClose}>
            <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-gray-900" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <SquareUser className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold text-sm">ARTA ID Preview</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        disabled={!loaded}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                        <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download
                    </a>
                    <button onClick={onClose}
                        className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {!loaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-800">
                        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-300 text-sm">Generating ARTA ID preview</p>
                    </div>
                )}
                <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    style={{ display: loaded ? 'block' : 'none' }}
                    onLoad={() => setLoaded(true)}
                    title="ARTA ID Preview"
                />
            </div>
        </div>
    );
}

// Shared UI

// Modals

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";
const errorInputCls = "w-full rounded-lg border border-red-400 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

function firstErrorMessage(errors: Record<string, string>, fallback: string): string {
    const values = Object.values(errors);
    return values.length > 0 ? values[0] : fallback;
}

function ModalShell({ title, onClose, onSave, saving, children }: {
    title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-semibold text-green-800">{title}</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">{children}</div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={onSave} disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? <><Spinner /> Saving</> : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
                {label}{required && <span className="text-red-500"> *</span>}
            </label>
            {children}
        </div>
    );
}

type PersonalForm = {
    first_name: string; middle_name: string; last_name: string; name_ext: string;
    sex: string; birth_place: string; date_of_birth: string; civil_status: string;
    mobile_number: string; height: string; weight: string; blood_type: string;
};
type PersonalFormErrors = Partial<Record<keyof PersonalForm, string>>;

const PERSONAL_REQUIRED_FIELDS: Array<{ key: keyof PersonalForm; label: string }> = [
    { key: 'first_name',    label: 'First Name' },
    { key: 'last_name',     label: 'Last Name' },
    { key: 'sex',           label: 'Sex' },
    { key: 'civil_status',  label: 'Civil Status' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'birth_place',   label: 'Place of Birth' },
    { key: 'mobile_number', label: 'Mobile Number' },
    { key: 'height',        label: 'Height' },
    { key: 'weight',        label: 'Weight' },
    { key: 'blood_type',    label: 'Blood Type' },
];

function validatePersonalForm(form: PersonalForm): PersonalFormErrors {
    const errors: PersonalFormErrors = {};
    for (const { key, label } of PERSONAL_REQUIRED_FIELDS) {
        if (!form[key] || String(form[key]).trim() === '') {
            errors[key] = `${label} is required.`;
        }
    }
    return errors;
}

function EditPersonalModal({ user, isOwn, onClose }: { user: ProfileUser; isOwn: boolean; onClose: () => void }) {
    const pi = user.personal_info;
    const [form, setForm] = useState<PersonalForm>({
        first_name:    user.first_name    ?? '',
        middle_name:   user.middle_name   ?? '',
        last_name:     user.last_name     ?? '',
        name_ext:      user.name_ext      ?? '',
        sex:           pi?.sex            ?? '',
        birth_place:   pi?.birth_place    ?? '',
        date_of_birth: pi?.date_of_birth ? pi.date_of_birth.substring(0, 10) : '',
        civil_status:  pi?.civil_status   ?? '',
        mobile_number: pi?.mobile_number  ?? '',
        height:        pi?.height         ?? '',
        weight:        pi?.weight         ?? '',
        blood_type:    pi?.blood_type     ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<PersonalFormErrors>({});
    const set = (k: keyof PersonalForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const ic  = (key: keyof PersonalForm) => errors[key] ? errorInputCls : inputCls;
    const err = (key: keyof PersonalForm) => errors[key]
        ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
        : null;

    function save() {
        const validationErrors = validatePersonalForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setSaving(true);
        const url = isOwn ? '/profile/personal' : '/profile/' + user.id + '/personal';
        router.post(url, form, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                onClose();
                Toast.fire({ icon: 'success', title: 'Personal information updated.' });
            },
            onError: (serverErrors) => {
                setErrors(serverErrors as PersonalFormErrors);
                setSaving(false);
                Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to update personal information.') });
            },
        });
    }

    return (
        <ModalShell title="Edit Personal Info" onClose={onClose} onSave={save} saving={saving}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" required>
                    <input value={form.first_name} onChange={set('first_name')} className={ic('first_name')} />
                    {err('first_name')}
                </Field>
                <Field label="Middle Name"><input value={form.middle_name} onChange={set('middle_name')} className={inputCls} /></Field>
                <Field label="Last Name" required>
                    <input value={form.last_name} onChange={set('last_name')} className={ic('last_name')} />
                    {err('last_name')}
                </Field>
                <Field label="Suffix">
                    <select value={form.name_ext} onChange={set('name_ext')} className={inputCls}>
                        <option value="">None</option>
                        {['Jr', 'Sr', 'I', 'II', 'III'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <Field label="Height (m)" required>
                    <input type="number" step="0.01" min="0" max="3" placeholder="e.g. 1.65"
                        value={form.height} onChange={set('height')} className={ic('height')} />
                    {err('height')}
                </Field>
                <Field label="Weight (kg)" required>
                    <input type="number" step="0.1" min="0" placeholder="e.g. 60.5"
                        value={form.weight} onChange={set('weight')} className={ic('weight')} />
                    {err('weight')}
                </Field>
                <Field label="Blood Type" required>
                    <select value={form.blood_type} onChange={set('blood_type')} className={ic('blood_type')}>
                        <option value="">— Select —</option>
                        {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                    {err('blood_type')}
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Sex" required>
                    <select value={form.sex} onChange={set('sex')} className={ic('sex')}>
                        <option value="">— Select —</option>
                        <option>Male</option><option>Female</option>
                    </select>
                    {err('sex')}
                </Field>
                <Field label="Civil Status" required>
                    <select value={form.civil_status} onChange={set('civil_status')} className={ic('civil_status')}>
                        <option value="">— Select —</option>
                        {['Single', 'Married', 'Widowed', 'Separated', 'Other'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    {err('civil_status')}
                </Field>
            </div>
            <Field label="Date of Birth" required>
                <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={ic('date_of_birth')} />
                {err('date_of_birth')}
            </Field>
            <Field label="Place of Birth" required>
                <input value={form.birth_place} onChange={set('birth_place')} className={ic('birth_place')} />
                {err('birth_place')}
            </Field>
            <Field label="Mobile Number" required>
                <input value={form.mobile_number} onChange={set('mobile_number')} className={ic('mobile_number')} />
                {err('mobile_number')}
            </Field>
        </ModalShell>
    );
}

function EditCompanyModal({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
    const ep = user.employee_profile;
    const [form, setForm] = useState({
        employee_number: user.personal_info?.agency_employee_no ?? ep?.employee_number ?? '',
        employment_type: ep?.employment_type ?? '',
        position:        ep?.position        ?? '',
        salary_grade:    ep?.salary_grade    ?? '',
        division:        ep?.division        ?? '',
        section:         ep?.section         ?? '',
        date_hired:      ep?.date_hired ? ep.date_hired.substring(0, 10) : '',
    });
    const [saving, setSaving] = useState(false);
    const [divisions, setDivisions] = useState<DivisionData[]>([]);
    const [positions, setPositions] = useState<PositionData[]>([]);
    const [loadingDivs, setLoadingDivs] = useState(true);
    const [loadingPos,  setLoadingPos]  = useState(true);
    const [posSearch, setPosSearch] = useState(ep?.position ?? '');
    const [posOpen,   setPosOpen]   = useState(false);
    const [posStyle,  setPosStyle]  = useState<React.CSSProperties>({});
    const posRef = useRef<HTMLInputElement>(null);
    const [divSearch, setDivSearch] = useState(ep?.division ?? '');
    const [divOpen,   setDivOpen]   = useState(false);
    const [divStyle,  setDivStyle]  = useState<React.CSSProperties>({});
    const divRef = useRef<HTMLInputElement>(null);
    const [secSearch, setSecSearch] = useState(ep?.section ?? '');
    const [secOpen,   setSecOpen]   = useState(false);
    const [secStyle,  setSecStyle]  = useState<React.CSSProperties>({});
    const secRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/divisions').then(r => r.json()).then(d => { setDivisions(d); setLoadingDivs(false); }).catch(() => setLoadingDivs(false));
        fetch('/positions').then(r => r.json()).then(d => { setPositions(d); setLoadingPos(false); }).catch(() => setLoadingPos(false));
    }, []);

    const currentSections = divisions.find(d => d.name === form.division)?.sections ?? [];
    const filteredPos = posSearch.length < 1 ? positions : positions.filter(p => p.title.toLowerCase().includes(posSearch.toLowerCase()));
    const filteredDiv = divSearch.length < 1 ? divisions : divisions.filter(d => d.name.toLowerCase().includes(divSearch.toLowerCase()));
    const filteredSec = secSearch.length < 1 ? currentSections : currentSections.filter(s => s.name.toLowerCase().includes(secSearch.toLowerCase()));

    function openPos() { if (posRef.current) { const r = posRef.current.getBoundingClientRect(); setPosStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 }); } setPosOpen(true); }
    function openDiv() { if (divRef.current) { const r = divRef.current.getBoundingClientRect(); setDivStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 }); } setDivOpen(true); }
    function openSec() { if (secRef.current) { const r = secRef.current.getBoundingClientRect(); setSecStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 }); } setSecOpen(true); }
    function selectPosition(p: PositionData) { setForm(f => ({ ...f, position: p.title, salary_grade: String(p.salary_grade) })); setPosSearch(p.title); setPosOpen(false); }
    function selectDivision(d: DivisionData) { setForm(f => ({ ...f, division: d.name, section: '' })); setDivSearch(d.name); setSecSearch(''); setDivOpen(false); }
    function selectSection(s: { id: number; name: string }) { setForm(f => ({ ...f, section: s.name })); setSecSearch(s.name); setSecOpen(false); }

    const Spin = () => (<svg className="h-4 w-4 animate-spin text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>);
    const SearchInput = ({ refEl, value, disabled, onChange, onFocus, loading, placeholder }: any) => (
        <div className="relative">
            {loading && <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><Spin /></div>}
            <input ref={refEl} value={value} disabled={disabled} onChange={onChange} onFocus={onFocus}
                className={`${inputCls} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                placeholder={placeholder} autoComplete="off" />
        </div>
    );

    function save() {
        setSaving(true);
        router.post('/profile/' + user.id + '/company', form, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                onClose();
                Toast.fire({ icon: 'success', title: 'Company information updated.' });
            },
            onError: (serverErrors) => {
                setSaving(false);
                Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to update company information.') });
            },
        });
    }

    return (
        <ModalShell title="Edit Company Info" onClose={onClose} onSave={save} saving={saving}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Agency Employee No.">
                    <input value={form.employee_number} onChange={e => setForm(f => ({ ...f, employee_number: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Employment Type">
                    <select value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))} className={inputCls}>
                        <option value="">— Select —</option>
                        <option value="JO">Job Order (JO)</option>
                        <option value="COS">Contract of Service (COS)</option>
                        <option value="Pakyaw">Pakyaw</option>
                        <option value="Permanent">Permanent</option>
                    </select>
                </Field>
            </div>
            <Field label="Position">
                <SearchInput refEl={posRef} value={posSearch} disabled={loadingPos} loading={loadingPos}
                    onChange={(e: any) => { setPosSearch(e.target.value); openPos(); setForm(f => ({ ...f, position: e.target.value })); }}
                    onFocus={openPos} placeholder={loadingPos ? 'Loading positions...' : 'Search position title'} />
                {posOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setPosOpen(false)} />}
                {posOpen && filteredPos.length > 0 && (<ul style={posStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">{filteredPos.map((p: PositionData) => (<li key={p.id} onMouseDown={() => selectPosition(p)} className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-green-50"><span className="text-gray-800">{p.title}</span><span className="ml-3 shrink-0 text-xs text-gray-400">SG {p.salary_grade}</span></li>))}</ul>)}
            </Field>
            <Field label="Salary Grade">
                <input value={form.salary_grade ? `SG ${form.salary_grade}` : ''} readOnly className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`} placeholder="Auto-filled from position" />
            </Field>
            <Field label="Division">
                <SearchInput refEl={divRef} value={divSearch} disabled={loadingDivs} loading={loadingDivs}
                    onChange={(e: any) => { setDivSearch(e.target.value); openDiv(); setForm(f => ({ ...f, division: e.target.value, section: '' })); setSecSearch(''); }}
                    onFocus={openDiv} placeholder={loadingDivs ? 'Loading divisions...' : 'Search division/office'} />
                {divOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setDivOpen(false)} />}
                {divOpen && filteredDiv.length > 0 && (<ul style={divStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">{filteredDiv.map((d: DivisionData) => (<li key={d.id} onMouseDown={() => selectDivision(d)} className="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50">{d.name}</li>))}</ul>)}
            </Field>
            <Field label="Section / Unit">
                <SearchInput refEl={secRef} value={secSearch} disabled={loadingDivs || !form.division} loading={false}
                    onChange={(e: any) => { setSecSearch(e.target.value); openSec(); setForm(f => ({ ...f, section: e.target.value })); }}
                    onFocus={openSec} placeholder={loadingDivs ? 'Loading...' : !form.division ? 'Select a division first' : 'Search section / unit...'} />
                {secOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setSecOpen(false)} />}
                {secOpen && filteredSec.length > 0 && (<ul style={secStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">{filteredSec.map((s: { id: number; name: string }) => (<li key={s.id} onMouseDown={() => selectSection(s)} className="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50">{s.name}</li>))}</ul>)}
            </Field>
            <Field label="Date Hired">
                <input type="date" value={form.date_hired} onChange={e => setForm(f => ({ ...f, date_hired: e.target.value }))} className={inputCls} />
            </Field>
        </ModalShell>
    );
}

// Completion Donut

function CompletionDonut({ percent, isOwn }: { percent: number; isOwn: boolean }) {
    const r = 54, circ = 2 * Math.PI * r;
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative flex items-center justify-center">
                <svg width="140" height="140" className="-rotate-90">
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#00a63e" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${(percent / 100) * circ} ${circ}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-gray-900">{percent}%</span>
                    <span className="text-xs text-gray-400">Completed</span>
                </div>
            </div>
            {isOwn && (
                <p className="mt-3 text-xs text-center text-gray-400 leading-snug px-2">
                    {percent === 100 ? '✓ Profile complete!' : 'Complete your profile via the PDS page'}
                </p>
            )}
        </div>
    );
}

// Nav

type Section = 'personal' | 'company' | 'education' | 'eligibility' | 'service-record';
const ALL_NAV_ITEMS: { id: Section; label: string }[] = [
    { id: 'personal',       label: 'About' },
    { id: 'company',        label: 'Agency' },
    { id: 'education',      label: 'Education' },
    { id: 'eligibility',    label: 'Eligibility' },
    { id: 'service-record', label: 'Service Record' },
];

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Profile', href: '/profile' }];

// Main Page

export default function ProfileShow() {
    const { auth, profileUser: user, canEditCompany, pdsData, serviceRecords } = usePage<PageProps>().props;

    const ep       = user.employee_profile;
    const isOwn    = auth.user.id === user.id;
    const name     = fullName(user);
    const avatar   = user.photo ? '/storage/' + user.photo : null;
    const progress = calculatePdsCompletion(pdsData);

    // Service Record only applies to permanent employees.
    const navItems = ALL_NAV_ITEMS.filter(
        item => item.id !== 'service-record' || ep?.employment_type === 'Permanent'
    );

    const avatarRef = useRef<HTMLButtonElement>(null);

    const photoInputRef = useRef<HTMLInputElement>(null);
    const tabBarRef     = useRef<HTMLDivElement>(null);
    const [activeSection, setActiveSection] = useState<Section>('personal');
    const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [showArtaPreview, setShowArtaPreview] = useState(false);

    const [docMenuOpen, setDocMenuOpen] = useState(false);
    const [docMenuPos, setDocMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const docBtnRef = useRef<HTMLButtonElement>(null);

    // Photo crop state
    const [cropSrc,      setCropSrc]      = useState<string | null>(null);
    const [photoSaving,  setPhotoSaving]  = useState(false);
    const [modal, setModal] = useState<'personal' | 'company' | null>(null);

    const [viewingPhoto, setViewingPhoto] = useState(false);

    useEffect(() => {
        const el = tabBarRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {}, { threshold: 0, rootMargin: '-1px 0px 0px 0px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const updateMenuPos = () => {
        if (!avatarRef.current) return;
        const r = avatarRef.current.getBoundingClientRect();
        setMenuPos({
            top:  r.bottom + 8,
            left: Math.max(8, r.left + r.width / 2 - 104),
        });
    };

    useEffect(() => {
        if (!photoMenuOpen) return;
        const update = () => updateMenuPos();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [photoMenuOpen]);

    function handleGenerateArtaId() {
        if (progress < 100) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete PDS',
                html: `<p class="text-sm text-gray-600">
                        This employee's Personal Data Sheet is only <b>${progress}%</b> complete.<br/>
                        The ARTA ID can only be generated once the PDS is 100% complete.
                    </p>`,
                confirmButtonText: 'Got it',
                confirmButtonColor: '#16a34a',
                customClass: {
                    popup:         '!rounded-2xl !shadow-xl',
                    title:         '!text-base !font-semibold',
                    confirmButton: '!text-sm !rounded-lg !px-4',
                },
            });
            return;
        }
        setShowArtaPreview(true);
    }

    // file selected → open crop modal
    function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setCropSrc(ev.target?.result as string);
        reader.readAsDataURL(file);
        // Reset so the same file can be re-selected
        e.target.value = '';
    }

    // save crop image
    function onCropSave(blob: Blob) {
        setPhotoSaving(true);
        const fd = new FormData();
        fd.append('photo', blob, 'photo.jpg');
        router.post('/profile/photo', fd, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                // revoke any object-URL we may have created
                if (cropSrc?.startsWith('blob:')) URL.revokeObjectURL(cropSrc);
                setCropSrc(null);
            },
            onFinish: () => setPhotoSaving(false),
        });
    }

    // Re-crop the already-saved photo without choosing a new file 
    function openCropExisting() {
        if (!avatar) return;
        fetch(avatar)
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch photo');
                return r.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                setCropSrc(url);
            })
            .catch(err => console.error('Could not load photo for editing:', err));
    }

    
    function updateDocMenuPos() {
        if (!docBtnRef.current) return;
        const r = docBtnRef.current.getBoundingClientRect();
        setDocMenuPos({ top: r.bottom + 8, left: Math.max(8, r.right - 224) });
    }

    useEffect(() => {
        if (!docMenuOpen) return;
        const update = () => updateDocMenuPos();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [docMenuOpen]);

    const TabBar = () => {
        const [moreOpen, setMoreOpen] = useState(false);
        const mobileHidden = navItems.slice(3);
        return (
            <div className="bg-white border-b border-gray-200 rounded-none sm:rounded-b-2xl shadow-sm">
                <div className="flex items-center px-4 sm:px-6">
                    <nav className="flex flex-1 relative">
                        {navItems.map(({ id, label }, idx) => (
                            <button key={id} onClick={() => setActiveSection(id)}
                                className={cn('relative shrink-0 cursor-pointer px-4 py-3.5 text-sm font-semibold transition whitespace-nowrap',
                                    idx >= 3 ? 'hidden sm:block' : '',
                                    activeSection === id ? 'text-green-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50')}>
                                {label}
                                {activeSection === id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-green-600" />}
                            </button>
                        ))}
                        {mobileHidden.length > 0 && (
                            <div className="relative sm:hidden">
                                <button onClick={() => setMoreOpen(o => !o)}
                                    className={cn('relative flex shrink-0 cursor-pointer items-center gap-1 px-4 py-3.5 text-sm font-semibold transition whitespace-nowrap',
                                        mobileHidden.some(n => n.id === activeSection) ? 'text-green-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50')}>
                                    More
                                    <svg className={cn('h-3.5 w-3.5 transition-transform', moreOpen && 'rotate-180')} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                    </svg>
                                    {mobileHidden.some(n => n.id === activeSection) && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-green-600" />}
                                </button>
                                {moreOpen && (
                                    <>
                                        <div className="fixed inset-10 z-10" onClick={() => setMoreOpen(false)} />
                                        <div className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-xl border border-gray-100 bg-white shadow-xl py-1">
                                            {mobileHidden.map(({ id, label }) => (
                                                <button key={id} onClick={() => { setActiveSection(id); setMoreOpen(false); }}
                                                    className={cn('flex w-full cursor-pointer items-center px-4 py-2.5 text-sm font-semibold transition', activeSection === id ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50')}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            {/* Photo Viewer Modal */}
            {viewingPhoto && avatar && (
                <PhotoViewerModal
                    src={avatar}
                    name={name}
                    onClose={() => setViewingPhoto(false)}
                />
            )}

            {/* Crop Modal */}
            {cropSrc && (
                <PhotoCropModal
                    src={cropSrc}
                    onSave={onCropSave}
                    onClose={() => setCropSrc(null)}
                    saving={photoSaving}
                />
            )}

            {/* Other Modals */}
            {modal === 'personal' && <EditPersonalModal user={user} isOwn={isOwn} onClose={() => setModal(null)} />}
            {modal === 'company'  && <EditCompanyModal  user={user} onClose={() => setModal(null)} />}
            {showArtaPreview && (
                <ArtaIdPreviewModal userId={user.id} onClose={() => setShowArtaPreview(false)} />
            )}

            <div className="sm:px-6 sm:py-4 space-y-0 h-full">

                {/* HERO */}
                <div className="sm:rounded-t-2xl bg-white shadow-sm overflow-hidden">
                    <div className="relative h-36 sm:h-52 lg:h-80 w-full bg-green-700">
                        <img src="/images/desktop-wallpaper.png" alt="Banner" className="h-full w-full object-cover object-[25%_48%]" />
                        <div className="absolute inset-0 bg-linear-to-r from-green-900/80 via-green-700/60 to-green-500/50" />
                    </div>
                    <div className="relative px-5 sm:px-8 pb-0">
                        <div className="absolute -top-14 sm:-top-22 left-5 sm:left-8">
                            <div className="relative">
                                {/* Clickable avatar */}
                                <button
                                    ref={avatarRef}
                                    onClick={() => {
                                        if (isOwn) { updateMenuPos(); setPhotoMenuOpen(o => !o); }
                                        else if (avatar) setViewingPhoto(true);
                                    }}
                                    className={cn(
                                        'group relative h-28 w-28 sm:h-40 sm:w-40 lg:h-50 lg:w-50 overflow-hidden rounded-full border-4 border-white bg-white block',
                                        (isOwn || avatar) ? 'cursor-pointer' : 'cursor-default'
                                    )}
                                >
                                    {avatar
                                        ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
                                        : <div className="flex h-full w-full items-center justify-center bg-green-700 text-3xl font-bold text-white">{getInitials(user)}</div>
                                    }
                                    {/* Hover overlay — only for own profile */}
                                    {isOwn && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                                            <Camera className="h-6 w-6 text-white" />
                                            <span className="text-white text-[10px] font-semibold mt-1 leading-tight text-center px-2">Edit photo</span>
                                        </div>
                                    )}
                                </button>

                                {/* Photo options popover */}
                                {isOwn && photoMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-100" onClick={() => setPhotoMenuOpen(false)} />
                                        <div className="fixed z-101 min-w-60 rounded-xl border border-gray-100 bg-white shadow-xl p-1"
                                            style={menuPos}
                                        >
                                            {avatar && (
                                                <button
                                                    onClick={() => { setPhotoMenuOpen(false); setViewingPhoto(true); }}
                                                    className="flex w-full cursor-pointer items-center gap-3 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition rounded-xl">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50">
                                                        <SquareUser className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    See profile photo
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { setPhotoMenuOpen(false); photoInputRef.current?.click(); }}
                                                className="flex w-full cursor-pointer items-center gap-3 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition rounded-xl">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50">
                                                    <Image className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {avatar ? 'Choose profile photo' : 'Upload photo'}
                                            </button>
                                        </div>
                                    </>
                                )}
                                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
                            </div>
                        </div>
                        <div className="pt-16 sm:pt-20 lg:pt-4 lg:pl-54">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-green-800 leading-tight">{name}</h1>
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{ep?.position ?? 'No position set'}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2 shrink-0 mt-2 mb-3">
                                {isOwn ? (
                                    <button onClick={() => setModal('personal')}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition">
                                        <Pencil className="h-4 w-4" /> Edit profile
                                    </button>
                                ) : (
                                    <>
                                        <button disabled className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-400">
                                            <MessagesSquare className="w-4 h-4" /> Message
                                        </button>
                                        {canEditCompany ? (
                                        <div className="relative">
                                            <button
                                                ref={docBtnRef}
                                                onClick={() => { updateDocMenuPos(); setDocMenuOpen(o => !o); }}
                                                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-2 p-1.5 text-sm font-semibold text-white hover:bg-green-700 transition"
                                            >
                                                <EllipsisVertical className='w-5 h-5' />
                                            </button>

                                            {docMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-100" onClick={() => setDocMenuOpen(false)} />
                                                    <div
                                                        className="fixed z-101 min-w-56 rounded-xl border border-gray-100 bg-white shadow-xl p-1"
                                                        style={docMenuPos}
                                                    >
                                                        <a
                                                            href={`/pds/download/${user.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={() => setDocMenuOpen(false)}
                                                            className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition rounded-lg"
                                                        >
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50">
                                                                <Download className="h-4 w-4 text-gray-500" />
                                                            </div>
                                                            <span>Download PDS</span>
                                                        </a>
                                                        <button
                                                            onClick={() => { setDocMenuOpen(false); handleGenerateArtaId(); }}
                                                            className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition rounded-lg"
                                                        >
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50">
                                                                <SquareUser className="h-4 w-4 text-gray-500" />
                                                            </div>
                                                            <span>Generate ARTA ID</span>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-400"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Generate PDS</span>
                                        </button>
                                    )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB BAR */}
                <div ref={tabBarRef} className="rounded-none sm:rounded-b-2xl overflow-visible mb-4">
                    <TabBar />
                </div>

                {/* Mobile completion bar */}
                {progress < 100 && (
                    <div className="flex lg:hidden items-center gap-3 mb-4 px-4 p-2 rounded-lg shadow-sm sm:mx-1 mx-3">
                        <p className="uppercase text-sm text-green-700 font-semibold">Profile Completion</p>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-green-700 shrink-0">{progress}%</span>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {progress < 100 && (
                        <div className="hidden lg:block w-56 shrink-0 rounded-2xl bg-white shadow-sm py-6">
                            <p className="text-xs font-semibold text-green-800 text-center mb-4 uppercase tracking-wide">Profile Completion</p>
                            <CompletionDonut percent={progress} isOwn={isOwn} />
                        </div>
                    )}

                    <div className="flex-1 min-w-0 w-full rounded-2xl bg-white shadow-sm px-5 sm:px-8 py-8">

                        {activeSection === 'personal' && (
                            <PersonalSection user={user} isOwn={isOwn} onEdit={() => setModal('personal')} />
                        )}

                        {activeSection === 'company' && (
                            <CompanySection user={user} canEditCompany={canEditCompany} onEdit={() => setModal('company')} />
                        )}

                        {activeSection === 'education' && (
                            <EducationSection user={user} />
                        )}

                        {activeSection === 'eligibility' && (
                            <EligibilitySection user={user} />
                        )}

                        {activeSection === 'service-record' && (
                            <ServiceRecordSection
                                serviceRecords={serviceRecords}
                                userId={user.id}
                                canEdit={canEditCompany}
                            />
                        )}

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}