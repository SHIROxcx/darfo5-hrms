import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Section {
    id: number;
    division_id: number;
    name: string;
    abbreviation: string | null;
}

interface Division {
    id: number;
    name: string;
    abbreviation: string | null;
    sections: Section[];
}

interface Props {
    divisions: Division[];
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600';
const errorInputCls = 'w-full rounded-lg border border-red-400 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500';

function firstErrorMessage(errors: Record<string, string>, fallback: string): string {
    const values = Object.values(errors);
    return values.length > 0 ? values[0] : fallback;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reference Data', href: '/admin/reference-data/divisions' },
    { title: 'Divisions & Sections', href: '/admin/reference-data/divisions' },
];

// Division / Section form modal

interface FormModalProps {
    title: string;
    onClose: () => void;
    onSave: (form: { name: string; abbreviation: string }) => void;
    saving: boolean;
    errors: Record<string, string>;
    initial?: { name: string; abbreviation: string };
}

function FormModal({ title, onClose, onSave, saving, errors, initial }: FormModalProps) {
    const [form, setForm] = useState({ name: initial?.name ?? '', abbreviation: initial?.abbreviation ?? '' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-semibold text-green-800">{title}</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4 px-6 py-5">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Name<span className="text-red-500"> *</span></label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className={errors.name ? errorInputCls : inputCls} />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Abbreviation</label>
                        <input value={form.abbreviation} onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))}
                            className={inputCls} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={() => onSave(form)} disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DivisionsSectionsIndex({ divisions }: Props) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(divisions[0]?.id ?? null);

    const [divModal, setDivModal] = useState<'new' | Division | null>(null);
    const [secModal, setSecModal] = useState<'new' | Section | null>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (selectedId === null && divisions.length > 0) setSelectedId(divisions[0].id);
        if (selectedId !== null && !divisions.some(d => d.id === selectedId)) {
            setSelectedId(divisions[0]?.id ?? null);
        }
    }, [divisions]);

    const filteredDivisions = divisions.filter(d =>
        !search.trim() || d.name.toLowerCase().includes(search.toLowerCase()) || (d.abbreviation ?? '').toLowerCase().includes(search.toLowerCase())
    );
    const selectedDivision = divisions.find(d => d.id === selectedId) ?? null;

    // Division CRUD

    function saveDivision(form: { name: string; abbreviation: string }) {
        setSaving(true);
        const isNew = divModal === 'new';
        const url = isNew ? '/admin/reference-data/divisions' : `/admin/reference-data/divisions/${(divModal as Division).id}`;
        const method: 'post' | 'put' = isNew ? 'post' : 'put';

        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                setDivModal(null);
                setErrors({});
                Toast.fire({ icon: 'success', title: `Division ${isNew ? 'added' : 'updated'}.` });
            },
            onError: (serverErrors) => {
                setErrors(serverErrors as Record<string, string>);
                setSaving(false);
                Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to save division.') });
            },
        });
    }

    function deleteDivision(division: Division) {
        Swal.fire({
            title: 'Delete Division?',
            html: `This will permanently delete <strong>${division.name}</strong>${division.sections.length > 0 ? ` and its ${division.sections.length} section(s)` : ''}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.delete(`/admin/reference-data/divisions/${division.id}`, {
                preserveScroll: true,
                onSuccess: () => Toast.fire({ icon: 'success', title: 'Division deleted.' }),
                onError: (serverErrors) => Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to delete division.') }),
            });
        });
    }

    // Section CRUD

    function saveSection(form: { name: string; abbreviation: string }) {
        if (!selectedDivision) return;
        setSaving(true);
        const isNew = secModal === 'new';
        const url = isNew
            ? `/admin/reference-data/divisions/${selectedDivision.id}/sections`
            : `/admin/reference-data/sections/${(secModal as Section).id}`;
        const method: 'post' | 'put' = isNew ? 'post' : 'put';

        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                setSecModal(null);
                setErrors({});
                Toast.fire({ icon: 'success', title: `Section ${isNew ? 'added' : 'updated'}.` });
            },
            onError: (serverErrors) => {
                setErrors(serverErrors as Record<string, string>);
                setSaving(false);
                Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to save section.') });
            },
        });
    }

    function deleteSection(section: Section) {
        Swal.fire({
            title: 'Delete Section?',
            html: `This will permanently delete <strong>${section.name}</strong>.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.delete(`/admin/reference-data/sections/${section.id}`, {
                preserveScroll: true,
                onSuccess: () => Toast.fire({ icon: 'success', title: 'Section deleted.' }),
                onError: (serverErrors) => Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to delete section.') }),
            });
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Divisions & Sections" />

            {divModal && (
                <FormModal
                    title={divModal === 'new' ? 'Add Division' : 'Edit Division'}
                    onClose={() => { setDivModal(null); setErrors({}); }}
                    onSave={saveDivision}
                    saving={saving}
                    errors={errors}
                    initial={divModal === 'new' ? undefined : { name: divModal.name, abbreviation: divModal.abbreviation ?? '' }}
                />
            )}
            {secModal && (
                <FormModal
                    title={secModal === 'new' ? 'Add Section' : 'Edit Section'}
                    onClose={() => { setSecModal(null); setErrors({}); }}
                    onSave={saveSection}
                    saving={saving}
                    errors={errors}
                    initial={secModal === 'new' ? undefined : { name: secModal.name, abbreviation: secModal.abbreviation ?? '' }}
                />
            )}

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Divisions & Sections</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage divisions/offices and the sections/units within them.</p>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    {/* Divisions list */}
                    <div className="w-full shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm lg:w-80">
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                            <h2 className="text-sm font-semibold text-gray-800">Divisions</h2>
                            <button
                                onClick={() => setDivModal('new')}
                                className="flex cursor-pointer items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add
                            </button>
                        </div>
                        <div className="border-b border-gray-100 p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search divisions..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            {filteredDivisions.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm italic text-gray-400">No divisions found.</p>
                            ) : (
                                filteredDivisions.map(d => (
                                    <div
                                        key={d.id}
                                        onClick={() => setSelectedId(d.id)}
                                        className={`flex cursor-pointer items-center justify-between gap-2 border-b border-gray-50 px-4 py-3 transition ${
                                            selectedId === d.id ? 'bg-green-50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`truncate text-sm font-medium ${selectedId === d.id ? 'text-green-800' : 'text-gray-800'}`}>{d.name}</p>
                                            <p className="text-xs text-gray-400">{d.abbreviation || '—'} · {d.sections.length} section{d.sections.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setDivModal(d)} className="cursor-pointer rounded-lg p-1.5 text-green-600 hover:bg-green-100 transition" title="Edit Division">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => deleteDivision(d)} className="cursor-pointer rounded-lg p-1.5 text-red-500 hover:bg-red-100 transition" title="Delete Division">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sections detail */}
                    <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white shadow-sm">
                        {!selectedDivision ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
                                <Building2 className="h-8 w-8" />
                                <p className="text-sm italic">Select a division to manage its sections.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-800">Sections under {selectedDivision.name}</h2>
                                        <p className="text-xs text-gray-400">{selectedDivision.sections.length} section{selectedDivision.sections.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <button
                                        onClick={() => setSecModal('new')}
                                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Section
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                                            <tr>
                                                <th className="px-5 py-3 text-left">Name</th>
                                                <th className="px-5 py-3 text-left">Abbreviation</th>
                                                <th className="px-5 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedDivision.sections.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="py-12 text-center italic text-gray-400">No sections under this division yet.</td>
                                                </tr>
                                            ) : (
                                                selectedDivision.sections.map(s => (
                                                    <tr key={s.id} className="hover:bg-gray-50 transition">
                                                        <td className="px-5 py-3 text-gray-700">{s.name}</td>
                                                        <td className="px-5 py-3 text-gray-700">{s.abbreviation || <span className="italic text-gray-300">—</span>}</td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => setSecModal(s)} className="cursor-pointer rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition" title="Edit Section">
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button onClick={() => deleteSection(s)} className="cursor-pointer rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition" title="Delete Section">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
