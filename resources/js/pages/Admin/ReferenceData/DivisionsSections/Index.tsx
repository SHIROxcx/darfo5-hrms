import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowRightLeft, Building2, ChevronLeft, FolderOpen, Loader2, Pencil, Plus, Search, SearchX, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Section {
    id: number;
    division_id: number;
    name: string;
    abbreviation: string | null;
    employees_count: number;
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

// AppSidebarHeader's sticky header (h-16 = 64px) + the breadcrumb bar rendered
// below it (37px: px-6 py-2 + text-sm line-height + border) = 101px on narrow
// screens. AppSidebar uses variant="inset" (sidebar.tsx), which adds an 8px
// top+bottom margin to SidebarInset starting at the `md:` breakpoint (768px)
// — so from md up the offset is 101 + 16 = 117px. Matching Tailwind's own
// breakpoint here (instead of a single guessed constant) keeps this page's
// content area exactly viewport-height instead of guessing a vh fraction.
const HEADER_OFFSET_CLS = 'h-[calc(100dvh-101px)] md:h-[calc(100dvh-117px)]';

const DESKTOP_BREAKPOINT = 1024;

function useIsDesktop(breakpoint = DESKTOP_BREAKPOINT): boolean {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window === 'undefined' ? true : window.innerWidth >= breakpoint
    );

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
        const onChange = () => setIsDesktop(mql.matches);
        onChange();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [breakpoint]);

    return isDesktop;
}

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
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Move Section modal — reassign a section to a different division

interface MoveSectionModalProps {
    section: Section;
    currentDivision: Division;
    divisions: Division[];
    onClose: () => void;
    onMove: (targetDivisionId: number) => void;
    moving: boolean;
    error?: string;
}

function MoveSectionModal({ section, currentDivision, divisions, onClose, onMove, moving, error }: MoveSectionModalProps) {
    const [targetId, setTargetId] = useState<number | ''>('');
    const targetOptions = divisions.filter(d => d.id !== currentDivision.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-semibold text-green-800">Move Section</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4 px-6 py-5">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{section.name}</p>
                        <p className="text-xs text-gray-500">Currently under {currentDivision.name}</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Move to Division<span className="text-red-500"> *</span></label>
                        <select
                            value={targetId}
                            onChange={e => setTargetId(e.target.value ? Number(e.target.value) : '')}
                            className={error ? errorInputCls : inputCls}
                        >
                            <option value="">Select a division...</option>
                            {targetOptions.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                    </div>
                    {targetId !== '' && section.employees_count > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            This will also update <strong>{section.employees_count}</strong> employee{section.employees_count !== 1 ? 's' : ''} currently assigned to this section — their Division will change to the selected division.
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button
                        onClick={() => targetId !== '' && onMove(targetId)}
                        disabled={moving || targetId === ''}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {moving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {moving ? 'Moving...' : 'Move Section'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Divisions panel — reused for the desktop column and the mobile list view

interface DivisionsPanelProps {
    divisions: Division[];
    hasAnyDivisions: boolean;
    selectedId: number | null;
    showSelection: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    onSelect: (division: Division) => void;
    onAdd: () => void;
    onEdit: (division: Division) => void;
    onDelete: (division: Division) => void;
    deletingId: number | null;
}

function DivisionsPanel({
    divisions, hasAnyDivisions, selectedId, showSelection, search, onSearchChange,
    onSelect, onAdd, onEdit, onDelete, deletingId,
}: DivisionsPanelProps) {
    return (
        <>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-800">Divisions</h2>
                <button
                    onClick={onAdd}
                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                >
                    <Plus className="h-3.5 w-3.5" /> Add
                </button>
            </div>
            <div className="shrink-0 border-b border-gray-100 p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search divisions..."
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
                {divisions.length === 0 ? (
                    hasAnyDivisions ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                            <SearchX className="h-8 w-8 text-gray-300" />
                            <p className="text-sm font-medium text-gray-500">No divisions match &ldquo;{search}&rdquo;</p>
                            <button onClick={() => onSearchChange('')} className="cursor-pointer text-xs font-semibold text-green-700 hover:underline">
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                            <Building2 className="h-8 w-8 text-gray-300" />
                            <p className="text-sm font-medium text-gray-500">No divisions yet</p>
                            <p className="text-xs text-gray-400">Get started by adding your first division.</p>
                            <button
                                onClick={onAdd}
                                className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Division
                            </button>
                        </div>
                    )
                ) : (
                    divisions.map(d => (
                        <div
                            key={d.id}
                            onClick={() => onSelect(d)}
                            className={`flex cursor-pointer items-center justify-between gap-2 border-b border-gray-50 px-4 py-3 transition ${
                                deletingId === d.id ? 'opacity-50' : showSelection && selectedId === d.id ? 'bg-green-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="min-w-0">
                                <p className={`truncate text-sm font-medium ${showSelection && selectedId === d.id ? 'text-green-800' : 'text-gray-800'}`}>{d.name}</p>
                                <p className="text-xs text-gray-400">{d.abbreviation || '—'} · {d.sections.length} section{d.sections.length !== 1 ? 's' : ''}</p>
                            </div>
                            {deletingId === d.id ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
                            ) : (
                                <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onEdit(d)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-green-600 hover:bg-green-100 active:bg-green-100 transition" title="Edit Division">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => onDelete(d)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-500 hover:bg-red-100 active:bg-red-100 transition" title="Delete Division">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

// Sections panel — table on desktop, cards (with a back header) on mobile

interface SectionsPanelProps {
    division: Division;
    variant: 'table' | 'cards';
    onBack?: () => void;
    onAdd: () => void;
    onEdit: (section: Section) => void;
    onMove: (section: Section) => void;
    onDelete: (section: Section) => void;
    deletingId: number | null;
}

function SectionsPanel({ division, variant, onBack, onAdd, onEdit, onMove, onDelete, deletingId }: SectionsPanelProps) {
    return (
        <>
            <div className="shrink-0 border-b border-gray-100">
                {onBack && (
                    <button onClick={onBack} className="flex cursor-pointer items-center gap-1 px-4 pt-3 text-xs font-medium text-gray-500 hover:text-green-700 transition">
                        <ChevronLeft className="h-3.5 w-3.5" /> Divisions
                    </button>
                )}
                <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-gray-800">
                            {onBack ? division.name : `Sections under ${division.name}`}
                        </h2>
                        <p className="text-xs text-gray-400">{division.sections.length} section{division.sections.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={onAdd}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add Section
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
                {division.sections.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                        <FolderOpen className="h-8 w-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No sections yet</p>
                        <p className="text-xs text-gray-400">Add the first section under {division.name}.</p>
                    </div>
                ) : variant === 'table' ? (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Abbreviation</th>
                                <th className="px-5 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {division.sections.map(s => (
                                <tr key={s.id} className={`transition ${deletingId === s.id ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-5 py-3 text-gray-700">{s.name}</td>
                                    <td className="px-5 py-3 text-gray-700">{s.abbreviation || <span className="italic text-gray-300">—</span>}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            {deletingId === s.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            ) : (
                                                <>
                                                    <button onClick={() => onEdit(s)} className="cursor-pointer rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition" title="Edit Section">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => onMove(s)} className="cursor-pointer rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition" title="Move to another Division">
                                                        <ArrowRightLeft className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => onDelete(s)} className="cursor-pointer rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition" title="Delete Section">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {division.sections.map(s => (
                            <div key={s.id} className={`flex items-center justify-between gap-3 px-4 py-3.5 transition ${deletingId === s.id ? 'opacity-50' : ''}`}>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-800">{s.name}</p>
                                    <p className="text-xs text-gray-400">{s.abbreviation || '—'}</p>
                                </div>
                                {deletingId === s.id ? (
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
                                ) : (
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button onClick={() => onEdit(s)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-green-600 active:bg-green-100" title="Edit Section">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => onMove(s)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-blue-600 active:bg-blue-100" title="Move to another Division">
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => onDelete(s)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-red-500 active:bg-red-100" title="Delete Section">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default function DivisionsSectionsIndex({ divisions }: Props) {
    const isDesktop = useIsDesktop();

    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(divisions[0]?.id ?? null);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    const [divModal, setDivModal] = useState<'new' | Division | null>(null);
    const [secModal, setSecModal] = useState<'new' | Section | null>(null);
    const [moveModal, setMoveModal] = useState<Section | null>(null);
    const [saving, setSaving] = useState(false);
    const [moving, setMoving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [moveError, setMoveError] = useState<string | undefined>(undefined);
    const [deletingDivisionId, setDeletingDivisionId] = useState<number | null>(null);
    const [deletingSectionId, setDeletingSectionId] = useState<number | null>(null);

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
            setDeletingDivisionId(division.id);
            router.delete(`/admin/reference-data/divisions/${division.id}`, {
                preserveScroll: true,
                onSuccess: () => Toast.fire({ icon: 'success', title: 'Division deleted.' }),
                onError: (serverErrors) => Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to delete division.') }),
                onFinish: () => setDeletingDivisionId(null),
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

    async function moveSection(section: Section, targetDivisionId: number) {
        setMoving(true);
        setMoveError(undefined);
        try {
            const { data } = await axios.patch(`/admin/reference-data/sections/${section.id}/move`, {
                division_id: targetDivisionId,
            });
            setMoveModal(null);
            Toast.fire({ icon: 'success', title: data.message as string });
            router.reload({ only: ['divisions'] });
        } catch (err) {
            const serverErrors = axios.isAxiosError(err) ? err.response?.data?.errors as Record<string, string[]> | undefined : undefined;
            const message = serverErrors?.division_id?.[0] ?? 'Failed to move section.';
            setMoveError(message);
            Toast.fire({ icon: 'error', title: message });
        } finally {
            setMoving(false);
        }
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
            setDeletingSectionId(section.id);
            router.delete(`/admin/reference-data/sections/${section.id}`, {
                preserveScroll: true,
                onSuccess: () => Toast.fire({ icon: 'success', title: 'Section deleted.' }),
                onError: (serverErrors) => Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to delete section.') }),
                onFinish: () => setDeletingSectionId(null),
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
            {moveModal && (() => {
                const currentDivision = divisions.find(d => d.id === moveModal.division_id);
                return currentDivision ? (
                    <MoveSectionModal
                        section={moveModal}
                        currentDivision={currentDivision}
                        divisions={divisions}
                        onClose={() => { setMoveModal(null); setMoveError(undefined); }}
                        onMove={targetDivisionId => moveSection(moveModal, targetDivisionId)}
                        moving={moving}
                        error={moveError}
                    />
                ) : null;
            })()}

            <div className={`flex w-full flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8 ${HEADER_OFFSET_CLS}`}>
                <div className="mb-4 shrink-0">
                    <h1 className="text-2xl font-bold text-gray-900">Divisions & Sections</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage divisions/offices and the sections/units within them.</p>
                </div>

                {isDesktop ? (
                    <div className="flex min-h-0 flex-1 gap-4">
                        <div className="flex min-h-0 w-80 shrink-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                            <DivisionsPanel
                                divisions={filteredDivisions}
                                hasAnyDivisions={divisions.length > 0}
                                selectedId={selectedId}
                                showSelection
                                search={search}
                                onSearchChange={setSearch}
                                onSelect={d => setSelectedId(d.id)}
                                onAdd={() => setDivModal('new')}
                                onEdit={d => setDivModal(d)}
                                onDelete={deleteDivision}
                                deletingId={deletingDivisionId}
                            />
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                            {selectedDivision ? (
                                <SectionsPanel
                                    division={selectedDivision}
                                    variant="table"
                                    onAdd={() => setSecModal('new')}
                                    onEdit={s => setSecModal(s)}
                                    onMove={s => { setMoveModal(s); setMoveError(undefined); }}
                                    onDelete={deleteSection}
                                    deletingId={deletingSectionId}
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                                    <Building2 className="h-8 w-8 text-gray-300" />
                                    <p className="text-sm font-medium text-gray-500">No division selected</p>
                                    <p className="text-xs text-gray-400">Add a division on the left to start managing its sections.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                        {mobileView === 'list' || !selectedDivision ? (
                            <DivisionsPanel
                                divisions={filteredDivisions}
                                hasAnyDivisions={divisions.length > 0}
                                selectedId={selectedId}
                                showSelection={false}
                                search={search}
                                onSearchChange={setSearch}
                                onSelect={d => { setSelectedId(d.id); setMobileView('detail'); }}
                                onAdd={() => setDivModal('new')}
                                onEdit={d => setDivModal(d)}
                                onDelete={deleteDivision}
                                deletingId={deletingDivisionId}
                            />
                        ) : (
                            <SectionsPanel
                                division={selectedDivision}
                                variant="cards"
                                onBack={() => setMobileView('list')}
                                onAdd={() => setSecModal('new')}
                                onEdit={s => setSecModal(s)}
                                onMove={s => { setMoveModal(s); setMoveError(undefined); }}
                                onDelete={deleteSection}
                                deletingId={deletingSectionId}
                            />
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
