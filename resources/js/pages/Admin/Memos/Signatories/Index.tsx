import { Head, router } from '@inertiajs/react';
import { Pencil, PenLine, Plus, Power, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import LimitedInput from '@/components/limited-input';
import SignaturePadModal from '@/components/signature-pad-modal';
import AppLayout from '@/layouts/app-layout';
import { checkPersonName } from '@/lib/pds-formats';
import { destroy, index, store, update } from '@/routes/admin/signatories';
import type { BreadcrumbItem } from '@/types';
import type { SignatoryLimits, SignatoryRow } from '@/types/memo';

interface Props {
    signatories: SignatoryRow[];
    limits: SignatoryLimits;
}

interface FormState {
    id: number | null;
    name: string;
    position: string;
    file: File | null;
    previewUrl: string | null;
    removePicture: boolean;
}

const MAX_PICTURE_MB = 2;
const PICTURE_TYPES = ['image/png', 'image/jpeg'];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Memos', href: '/admin/memos' },
    { title: 'Signatories', href: index().url },
];

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600';
const errorInputCls = 'w-full rounded-lg border border-red-400 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-400';

// The server names its fields name, position and signature. Anything else (is_active, remove_signature) has no spot of its
// own on the form, so its message goes to the footer, where a refused save is never silent.
function readErrors(errs: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, message] of Object.entries(errs)) {
        const spot = ['name', 'position', 'signature'].includes(key) ? key : 'form';
        out[spot] = out[spot] ? `${out[spot]} ${message}` : message;
    }
    return out;
}

function toast(text: string) {
    Swal.fire({ icon: 'success', text, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });
}

export default function SignatoriesIndex({ signatories, limits }: Props) {
    const [modal, setModal] = useState<FormState | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [padOpen, setPadOpen] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    // A picture chosen in this window is shown from a temporary address; let it go when it is replaced or the window closes.
    useEffect(() => {
        const url = modal?.file ? modal.previewUrl : null;
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [modal?.file, modal?.previewUrl]);

    const openCreate = () => {
        setErrors({});
        setModal({ id: null, name: '', position: '', file: null, previewUrl: null, removePicture: false });
    };

    const openEdit = (row: SignatoryRow) => {
        setErrors({});
        setModal({ id: row.id, name: row.name, position: row.position, file: null, previewUrl: row.signature_url, removePicture: false });
    };

    const closeModal = () => { setModal(null); setPadOpen(false); };

    const setField = (key: 'name' | 'position', value: string) => {
        setModal(m => (m ? { ...m, [key]: value } : m));
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const setPicture = (file: File) => {
        if (!PICTURE_TYPES.includes(file.type)) {
            setErrors(prev => ({ ...prev, signature: 'The signature must be a PNG or JPG picture.' }));
            return;
        }
        if (file.size > MAX_PICTURE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, signature: `The signature picture must not be larger than ${MAX_PICTURE_MB} MB.` }));
            return;
        }
        setErrors(prev => ({ ...prev, signature: '' }));
        setModal(m => (m ? { ...m, file, previewUrl: URL.createObjectURL(file), removePicture: false } : m));
    };

    const removePicture = () => {
        setErrors(prev => ({ ...prev, signature: '' }));
        setModal(m => (m ? { ...m, file: null, previewUrl: null, removePicture: true } : m));
    };

    const save = () => {
        if (!modal) return;

        const found: Record<string, string> = {};
        if (!modal.name.trim()) found.name = 'Name is required.';
        else {
            const message = checkPersonName(modal.name, 'Name');
            if (message) found.name = message;
        }
        if (!modal.position.trim()) found.position = 'Position is required.';
        if (Object.keys(found).length) { setErrors(found); return; }

        const data = new FormData();
        data.append('name', modal.name.trim());
        data.append('position', modal.position.trim());
        if (modal.file) data.append('signature', modal.file);
        else if (modal.removePicture) data.append('remove_signature', '1');
        if (modal.id !== null) data.append('_method', 'put');

        setSaving(true);
        setErrors({});
        router.post(modal.id === null ? store().url : update(modal.id).url, data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { closeModal(); toast(modal.id === null ? 'Signatory added.' : 'Signatory updated.'); },
            onError: errs => setErrors(readErrors(errs as Record<string, string>)),
            onFinish: () => setSaving(false),
        });
    };

    const toggleActive = async (row: SignatoryRow) => {
        if (row.is_active) {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Deactivate this signatory?',
                text: `${row.name} stays on memos already issued, but can no longer be picked for new ones.`,
                showCancelButton: true,
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, deactivate',
            });
            if (!result.isConfirmed) return;
            router.delete(destroy(row.id).url, { preserveScroll: true, onSuccess: () => toast('Signatory deactivated.') });
            return;
        }

        router.post(update(row.id).url, { _method: 'put', name: row.name, position: row.position, is_active: 1 }, {
            preserveScroll: true,
            onSuccess: () => toast('Signatory activated.'),
            onError: errs => Swal.fire({ icon: 'error', title: 'Could not activate', text: Object.values(errs)[0] as string, confirmButtonColor: '#dc2626' }),
        });
    };

    const picture = modal?.previewUrl ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Signatories" />

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
                            <h3 className="font-semibold text-green-800">{modal.id === null ? 'Add Signatory' : 'Edit Signatory'}</h3>
                            <button type="button" onClick={closeModal} aria-label="Close" className="cursor-pointer text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                            <div>
                                <label htmlFor="signatory-name" className="mb-1 block text-xs font-medium text-gray-500">Name <span className="text-red-500">*</span></label>
                                <LimitedInput id="signatory-name" maxLength={limits.name} value={modal.name} placeholder="e.g. Maria R. Santos"
                                    onChange={e => setField('name', e.target.value)} className={errors.name ? errorInputCls : inputCls} />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="signatory-position" className="mb-1 block text-xs font-medium text-gray-500">Position <span className="text-red-500">*</span></label>
                                <LimitedInput id="signatory-position" maxLength={limits.position} value={modal.position} placeholder="e.g. Regional Executive Director"
                                    onChange={e => setField('position', e.target.value)} className={errors.position ? errorInputCls : inputCls} />
                                {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position}</p>}
                            </div>

                            <div>
                                <span className="mb-1 block text-xs font-medium text-gray-500">Signature picture <span className="font-normal text-gray-400">(optional)</span></span>
                                <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white">
                                    {picture
                                        ? <img src={picture} alt="Signature" className="max-h-20 max-w-full object-contain" />
                                        : <span className="text-xs text-gray-400">No picture</span>}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => fileInput.current?.click()}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50">
                                        <Upload className="h-3.5 w-3.5" /> Upload picture
                                    </button>
                                    <button type="button" onClick={() => setPadOpen(true)}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50">
                                        <PenLine className="h-3.5 w-3.5" /> Draw signature
                                    </button>
                                    {picture && (
                                        <button type="button" onClick={removePicture}
                                            className="cursor-pointer px-2 py-1.5 text-xs font-semibold text-red-500 transition hover:text-red-700">
                                            Remove picture
                                        </button>
                                    )}
                                </div>
                                <p className="mt-1 text-[10px] text-gray-400">PNG or JPG, up to {MAX_PICTURE_MB} MB. A transparent background prints best.</p>
                                {errors.signature && <p role="alert" className="mt-1 text-xs text-red-500">{errors.signature}</p>}
                                <input ref={fileInput} type="file" accept="image/png,image/jpeg" className="hidden"
                                    onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) setPicture(file); }} />
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
                            {errors.form && <p role="alert" className="mr-auto min-w-0 self-center text-xs text-red-500">{errors.form}</p>}
                            <button type="button" onClick={closeModal}
                                className="shrink-0 cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">Cancel</button>
                            <button type="button" onClick={save} disabled={saving}
                                className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {padOpen && (
                <SignaturePadModal
                    onSave={blob => { setPicture(new File([blob], 'signature.png', { type: 'image/png' })); setPadOpen(false); }}
                    onClose={() => setPadOpen(false)}
                />
            )}

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Signatories</h1>
                        <p className="mt-1 text-sm text-gray-500">The people who sign memos. Pick them from this list when you write a memo.</p>
                    </div>
                    <button type="button" onClick={openCreate}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                        <Plus className="h-4 w-4" /> Add Signatory
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                                <tr>
                                    <th className="px-4 py-5 text-left">Name</th>
                                    <th className="px-4 py-5 text-left">Position</th>
                                    <th className="px-4 py-5 text-left">Signature</th>
                                    <th className="px-4 py-5 text-left">Status</th>
                                    <th className="px-4 py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {signatories.length === 0 ? (
                                    <tr><td colSpan={5} className="py-12 text-center italic text-gray-400">No signatories yet.</td></tr>
                                ) : (
                                    signatories.map(row => (
                                        <tr key={row.id} className="transition hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                                            <td className="px-4 py-3 text-gray-700">{row.position}</td>
                                            <td className="px-4 py-3">
                                                {row.signature_url
                                                    ? <img src={row.signature_url} alt={`Signature of ${row.name}`} className="h-8 max-w-30 object-contain" />
                                                    : <span className="italic text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {row.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button type="button" onClick={() => openEdit(row)} title="Edit signatory" aria-label={`Edit ${row.name}`}
                                                        className="cursor-pointer rounded-lg p-1.5 text-green-600 transition hover:bg-green-50"><Pencil className="h-4 w-4" /></button>
                                                    <button type="button" onClick={() => toggleActive(row)} title={row.is_active ? 'Deactivate signatory' : 'Activate signatory'}
                                                        aria-label={`${row.is_active ? 'Deactivate' : 'Activate'} ${row.name}`}
                                                        className={`cursor-pointer rounded-lg p-1.5 transition ${row.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                                                        <Power className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
