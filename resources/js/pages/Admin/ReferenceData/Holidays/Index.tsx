import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type HolidayType = 'regular' | 'special';

interface HolidayOccurrence {
    id: number;
    name: string;
    type: HolidayType;
    is_recurring: boolean;
    date: string | null;
    is_skipped: boolean;
    is_moved: boolean;
    default_date: string | null;
}

interface Props {
    year: number;
    holidays: HolidayOccurrence[];
    hasAnyRecurring: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reference Data', href: '/admin/reference-data/divisions' },
    { title: 'Holidays', href: '/admin/reference-data/holidays' },
];

const TYPE_BADGE: Record<HolidayType, string> = {
    regular: 'bg-green-50 text-green-700 border-green-200',
    special: 'bg-amber-50 text-amber-700 border-amber-200',
};

const TYPE_LABEL: Record<HolidayType, string> = {
    regular: 'Regular',
    special: 'Special (non-working)',
};

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

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

function fmtDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Add / edit master holiday modal ────────────────────────────────────────

interface HolidayForm {
    name: string;
    type: HolidayType;
    is_recurring: boolean;
    month: string;
    day: string;
    date: string;
}

function emptyForm(year: number): HolidayForm {
    return { name: '', type: 'regular', is_recurring: true, month: '1', day: '1', date: `${year}-01-01` };
}

function formFromOccurrence(h: HolidayOccurrence): HolidayForm {
    const d = h.default_date ? new Date(h.default_date + 'T00:00:00') : null;
    return {
        name: h.name,
        type: h.type,
        is_recurring: h.is_recurring,
        month: d ? String(d.getMonth() + 1) : '1',
        day: d ? String(d.getDate()) : '1',
        date: h.date ?? '',
    };
}

function HolidayFormModal({ title, initial, onClose, onSaved, submitUrl, method, onDelete }: {
    title: string;
    initial: HolidayForm;
    onClose: () => void;
    onSaved: () => void;
    submitUrl: string;
    method: 'post' | 'put';
    onDelete?: () => void;
}) {
    const [form, setForm] = useState<HolidayForm>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    function save() {
        setSaving(true);
        const payload: Record<string, string> = {
            name: form.name,
            type: form.type,
            is_recurring: form.is_recurring ? '1' : '0',
        };
        if (form.is_recurring) {
            payload.month = form.month;
            payload.day = form.day;
        } else {
            payload.date = form.date;
        }

        router[method](submitUrl, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                Toast.fire({ icon: 'success', title: 'Holiday saved.' });
                onSaved();
            },
            onError: serverErrors => {
                setErrors(serverErrors as Record<string, string>);
                setSaving(false);
                Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to save holiday.') });
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-semibold text-green-800 text-sm">{title}</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Name <span className="text-red-500">*</span></label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Independence Day" className={errors.name ? errorInputCls : inputCls} />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as HolidayType }))} className={inputCls}>
                            <option value="regular">Regular holiday</option>
                            <option value="special">Special (non-working) day</option>
                        </select>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={form.is_recurring}
                            onChange={e => setForm(p => ({ ...p, is_recurring: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" />
                        <span className="text-sm text-gray-700">Repeats annually on the same date</span>
                    </label>

                    {form.is_recurring ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Month</label>
                                <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} className={inputCls}>
                                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Day</label>
                                <input type="number" min={1} max={31} value={form.day}
                                    onChange={e => setForm(p => ({ ...p, day: e.target.value }))} className={errors.day ? errorInputCls : inputCls} />
                                {errors.day && <p className="mt-1 text-xs text-red-500">{errors.day}</p>}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Date <span className="text-red-500">*</span></label>
                            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={errors.date ? errorInputCls : inputCls} />
                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                            <p className="mt-1 text-[11px] text-gray-400">One-off holidays only apply in the year of this date.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
                    {onDelete ? (
                        <button onClick={onDelete} disabled={saving}
                            className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                            Delete (all years)
                        </button>
                    ) : <span />}
                    <div className="flex gap-2">
                        <button onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                        <button onClick={save} disabled={saving}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Per-year override modal (recurring holidays only) ─────────────────────

function YearOverrideModal({ holiday, year, onClose, onSaved }: {
    holiday: HolidayOccurrence; year: number; onClose: () => void; onSaved: () => void;
}) {
    const [date, setDate] = useState(holiday.date ?? holiday.default_date ?? '');
    const [saving, setSaving] = useState(false);

    function saveMove() {
        setSaving(true);
        router.post(`/admin/reference-data/holidays/${holiday.id}/exceptions`, { year, observed_date: date }, {
            preserveScroll: true,
            onSuccess: () => { Toast.fire({ icon: 'success', title: `Moved for ${year}.` }); onSaved(); },
            onError: e => Toast.fire({ icon: 'error', title: firstErrorMessage(e as Record<string, string>, 'Failed to update.') }),
            onFinish: () => setSaving(false),
        });
    }

    function saveSkip() {
        setSaving(true);
        router.post(`/admin/reference-data/holidays/${holiday.id}/exceptions`, { year, observed_date: '' }, {
            preserveScroll: true,
            onSuccess: () => { Toast.fire({ icon: 'success', title: `Skipped for ${year}.` }); onSaved(); },
            onError: e => Toast.fire({ icon: 'error', title: firstErrorMessage(e as Record<string, string>, 'Failed to update.') }),
            onFinish: () => setSaving(false),
        });
    }

    function restoreDefault() {
        setSaving(true);
        router.delete(`/admin/reference-data/holidays/${holiday.id}/exceptions/${year}`, {
            preserveScroll: true,
            onSuccess: () => { Toast.fire({ icon: 'success', title: 'Restored to default.' }); onSaved(); },
            onFinish: () => setSaving(false),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-semibold text-green-800 text-sm">{holiday.name} — {year} only</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    <p className="text-xs text-gray-500">
                        Normally observed on <strong>{holiday.default_date ? fmtDate(holiday.default_date) : '—'}</strong>. Changes here only affect {year} — every other year keeps the default date.
                    </p>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Observed date for {year}</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
                    </div>

                    {(holiday.is_skipped || holiday.is_moved) && (
                        <button onClick={restoreDefault} disabled={saving}
                            className="text-xs text-green-700 hover:underline cursor-pointer disabled:opacity-50">
                            Restore default date for {year}
                        </button>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={saveSkip} disabled={saving}
                        className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                        Skip {year}
                    </button>
                    <button onClick={saveMove} disabled={saving || !date}
                        className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? 'Saving…' : `Save for ${year}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HolidaysIndex({ year, holidays, hasAnyRecurring }: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<HolidayOccurrence | null>(null);
    const [editingYear, setEditingYear] = useState<HolidayOccurrence | null>(null);

    function goToYear(y: number) {
        router.get('/admin/reference-data/holidays', { year: y }, { preserveState: true, preserveScroll: true });
    }

    function reload() {
        router.reload({ only: ['holidays', 'hasAnyRecurring'] });
    }

    function deleteOccurrence(h: HolidayOccurrence) {
        if (!h.is_recurring) {
            Swal.fire({
                title: 'Delete holiday?',
                html: `This will permanently delete <strong>${h.name}</strong>.`,
                icon: 'warning', showCancelButton: true,
                confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, delete',
            }).then(result => {
                if (!result.isConfirmed) return;
                router.delete(`/admin/reference-data/holidays/${h.id}`, {
                    preserveScroll: true,
                    onSuccess: () => Toast.fire({ icon: 'success', title: 'Holiday deleted.' }),
                });
            });
        } else {
            Swal.fire({
                title: `Skip ${h.name} for ${year}?`,
                html: `This only removes it from <strong>${year}</strong> — it will still apply normally in every other year. To delete it permanently, use Edit → All years.`,
                icon: 'warning', showCancelButton: true,
                confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: `Yes, skip ${year}`,
            }).then(result => {
                if (!result.isConfirmed) return;
                router.post(`/admin/reference-data/holidays/${h.id}/exceptions`, { year, observed_date: '' }, {
                    preserveScroll: true,
                    onSuccess: () => Toast.fire({ icon: 'success', title: `Skipped for ${year}.` }),
                });
            });
        }
    }

    function deleteTemplateEntirely(h: HolidayOccurrence) {
        Swal.fire({
            title: 'Delete recurring holiday?',
            html: `This removes <strong>${h.name}</strong> from every year, not just ${year}.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, delete for all years',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.delete(`/admin/reference-data/holidays/${h.id}`, {
                preserveScroll: true,
                onSuccess: () => { Toast.fire({ icon: 'success', title: 'Holiday deleted.' }); setEditingTemplate(null); },
            });
        });
    }

    function runPrefill() {
        router.post('/admin/reference-data/holidays/prefill', {}, {
            preserveScroll: true,
            onSuccess: () => Toast.fire({ icon: 'success', title: 'Standard holidays added.' }),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Holidays" />

            {showAdd && (
                <HolidayFormModal
                    title="Add Holiday"
                    initial={emptyForm(year)}
                    submitUrl="/admin/reference-data/holidays"
                    method="post"
                    onClose={() => setShowAdd(false)}
                    onSaved={() => { setShowAdd(false); reload(); }}
                />
            )}

            {editingTemplate && (
                <HolidayFormModal
                    title={editingTemplate.is_recurring ? `Edit "${editingTemplate.name}" — all years` : `Edit "${editingTemplate.name}"`}
                    initial={formFromOccurrence(editingTemplate)}
                    submitUrl={`/admin/reference-data/holidays/${editingTemplate.id}`}
                    method="put"
                    onClose={() => setEditingTemplate(null)}
                    onSaved={() => { setEditingTemplate(null); reload(); }}
                    onDelete={editingTemplate.is_recurring ? () => deleteTemplateEntirely(editingTemplate) : undefined}
                />
            )}

            {editingYear && (
                <YearOverrideModal
                    holiday={editingYear}
                    year={year}
                    onClose={() => setEditingYear(null)}
                    onSaved={() => { setEditingYear(null); reload(); }}
                />
            )}

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage regular and special non-working days. Approved leave requests spanning these dates don't count against an employee's leave balance.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={runPrefill}
                            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                            title="Add the standard fixed-date PH regular holidays as recurring entries">
                            Prefill standard holidays
                        </button>
                        <button onClick={() => setShowAdd(true)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition">
                            <Plus className="h-4 w-4" /> Add Holiday
                        </button>
                    </div>
                </div>

                <div className="mb-4 flex items-center gap-2">
                    <button onClick={() => goToYear(year - 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-semibold text-gray-800 w-20 text-center">{year}</span>
                    <button onClick={() => goToYear(year + 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    {!hasAnyRecurring && (
                        <p className="ml-3 text-xs text-gray-400">No recurring holidays set up yet — try "Prefill standard holidays".</p>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Caps the visible list to ~10 rows and scrolls for the rest, with the header pinned in place */}
                    <div className="max-h-130 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-3 py-3 font-semibold">Name</th>
                                    <th className="px-3 py-3 font-semibold">Type</th>
                                    <th className="px-3 py-3 font-semibold">Recurs</th>
                                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holidays.length === 0 ? (
                                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400 italic">No holidays set up for {year} yet.</td></tr>
                                ) : holidays.map(h => (
                                    <tr key={h.id} className="border-t border-gray-50">
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {h.date ? (
                                                <span className="text-gray-800 font-medium">{fmtDate(h.date)}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">Skipped this year</span>
                                            )}
                                            {h.is_moved && <span className="ml-2 text-[10px] font-semibold text-amber-600">moved</span>}
                                        </td>
                                        <td className="px-3 py-3 text-gray-800">{h.name}</td>
                                        <td className="px-3 py-3">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_BADGE[h.type]}`}>{TYPE_LABEL[h.type]}</span>
                                        </td>
                                        <td className="px-3 py-3 text-gray-500">{h.is_recurring ? 'Yearly' : 'One-off'}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => h.is_recurring ? setEditingYear(h) : setEditingTemplate(h)}
                                                    title={h.is_recurring ? `Edit for ${year} only` : 'Edit'}
                                                    className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteOccurrence(h)}
                                                    title={h.is_recurring ? `Skip ${year}` : 'Delete'}
                                                    className="h-7 w-7 flex items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition cursor-pointer">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                {h.is_recurring && (
                                                    <button
                                                        onClick={() => setEditingTemplate(h)}
                                                        className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline cursor-pointer ml-1">
                                                        All years
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
