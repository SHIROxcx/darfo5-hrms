import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export interface LookupField {
    key: string;
    label: string;
    type?: 'text' | 'number';
    required?: boolean;
    placeholder?: string;
}

interface LookupItem {
    id: number;
}

function field(item: LookupItem, key: string): unknown {
    return (item as unknown as Record<string, unknown>)[key];
}

interface LookupCrudTableProps<T extends LookupItem> {
    pageTitle: string;
    heading: string;
    description: string;
    baseUrl: string;
    items: T[];
    fields: LookupField[];
    getLabel: (item: T) => string;
    itemNoun: string;
    breadcrumbs: BreadcrumbItem[];
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

function emptyForm(fields: LookupField[]): Record<string, string> {
    return Object.fromEntries(fields.map(f => [f.key, '']));
}

export default function LookupCrudTable<T extends LookupItem>({
    pageTitle, heading, description, baseUrl, items, fields, getLabel, itemNoun, breadcrumbs,
}: LookupCrudTableProps<T>) {
    const [search, setSearch] = useState('');
    const [modalItem, setModalItem] = useState<T | 'new' | null>(null);
    const [form, setForm] = useState<Record<string, string>>(emptyForm(fields));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const filtered = items.filter(item =>
        !search.trim() || fields.some(f => String(field(item, f.key) ?? '').toLowerCase().includes(search.toLowerCase()))
    );

    function openCreate() {
        setForm(emptyForm(fields));
        setErrors({});
        setModalItem('new');
    }

    function openEdit(item: T) {
        setForm(Object.fromEntries(fields.map(f => [f.key, String(field(item, f.key) ?? '')])));
        setErrors({});
        setModalItem(item);
    }

    function closeModal() {
        setModalItem(null);
        setErrors({});
    }

    function save() {
        setSaving(true);
        const isNew = modalItem === 'new';
        const url = isNew ? baseUrl : `${baseUrl}/${(modalItem as T).id}`;
        const method: 'post' | 'put' = isNew ? 'post' : 'put';

        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                closeModal();
                Toast.fire({ icon: 'success', title: `${itemNoun} ${isNew ? 'added' : 'updated'}.` });
            },
            onError: (serverErrors) => {
                setErrors(serverErrors as Record<string, string>);
                setSaving(false);
                Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, `Failed to ${isNew ? 'add' : 'update'} ${itemNoun.toLowerCase()}.`) });
            },
        });
    }

    function remove(item: T) {
        Swal.fire({
            title: `Delete ${itemNoun}?`,
            html: `This will permanently delete <strong>${getLabel(item)}</strong>.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.delete(`${baseUrl}/${item.id}`, {
                preserveScroll: true,
                onSuccess: () => Toast.fire({ icon: 'success', title: `${itemNoun} deleted.` }),
                onError: (serverErrors) => {
                    Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, `Failed to delete ${itemNoun.toLowerCase()}.`) });
                },
            });
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            {modalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h3 className="font-semibold text-green-800">{modalItem === 'new' ? `Add ${itemNoun}` : `Edit ${itemNoun}`}</h3>
                            <button onClick={closeModal} className="cursor-pointer text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            {fields.map(f => (
                                <div key={f.key}>
                                    <label className="mb-1 block text-xs font-medium text-gray-500">
                                        {f.label}{f.required && <span className="text-red-500"> *</span>}
                                    </label>
                                    <input
                                        type={f.type ?? 'text'}
                                        value={form[f.key] ?? ''}
                                        placeholder={f.placeholder}
                                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        className={errors[f.key] ? errorInputCls : inputCls}
                                    />
                                    {errors[f.key] && <p className="mt-1 text-xs text-red-500">{errors[f.key]}</p>}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 border-t px-6 py-4">
                            <button onClick={closeModal} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={save} disabled={saving}
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
                        <p className="mt-1 text-sm text-gray-500">{description}</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                    >
                        <Plus className="h-4 w-4" /> Add {itemNoun}
                    </button>
                </div>

                <div className="mb-4 relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${itemNoun.toLowerCase()}s...`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {/* Caps the visible list to ~10 rows and scrolls for the rest, with the header pinned in place */}
                    <div className="max-h-130 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                                <tr>
                                    {fields.map(f => <th key={f.key} className="px-4 py-5 text-left">{f.label}</th>)}
                                    <th className="px-4 py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={fields.length + 1} className="py-12 text-center italic text-gray-400">
                                            No {itemNoun.toLowerCase()}s found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition">
                                            {fields.map(f => (
                                                <td key={f.key} className="px-4 py-3 text-gray-700">
                                                    {String(field(item, f.key) ?? '') || <span className="italic text-gray-300">—</span>}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="cursor-pointer rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition"
                                                        title={`Edit ${itemNoun}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => remove(item)}
                                                        className="cursor-pointer rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                                                        title={`Delete ${itemNoun}`}
                                                    >
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
                </div>
            </div>
        </AppLayout>
    );
}
