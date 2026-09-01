import { router } from '@inertiajs/react';
import { Briefcase, Eye, FileDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { Spinner } from '@/components/ui/spinner';

export interface ServiceRecordRow {
    id: number;
    date_from: string;
    date_to: string | null;
    designation: string;
    employment_status: string;
    salary: string;
    station_place_of_assignment: string;
    branch: string | null;
    leave_without_pay: string | null;
    separation_date: string | null;
    separation_cause: string | null;
    remarks: string | null;
}

interface Props {
    serviceRecords: ServiceRecordRow[];
    userId: number;
    canEdit: boolean;
}

type ServiceRecordForm = {
    date_from: string; date_to: string; designation: string; employment_status: string;
    salary: string; station_place_of_assignment: string; branch: string;
    leave_without_pay: string; separation_date: string; separation_cause: string; remarks: string;
};

type FormErrors = Partial<Record<keyof ServiceRecordForm, string>>;

const EMPTY_FORM: ServiceRecordForm = {
    date_from: '', date_to: '', designation: '', employment_status: '',
    salary: '', station_place_of_assignment: '', branch: '',
    leave_without_pay: '', separation_date: '', separation_cause: '', remarks: '',
};

const REQUIRED_FIELDS: Array<{ key: keyof ServiceRecordForm; label: string }> = [
    { key: 'date_from', label: 'Date From' },
    { key: 'designation', label: 'Designation' },
    { key: 'employment_status', label: 'Employment Status' },
    { key: 'salary', label: 'Salary' },
    { key: 'station_place_of_assignment', label: 'Station / Place of Assignment' },
];

function validate(form: ServiceRecordForm): FormErrors {
    const errors: FormErrors = {};
    for (const { key, label } of REQUIRED_FIELDS) {
        if (!form[key] || String(form[key]).trim() === '') {
            errors[key] = `${label} is required.`;
        }
    }
    return errors;
}

function toForm(row: ServiceRecordRow): ServiceRecordForm {
    return {
        date_from: row.date_from?.slice(0, 10) ?? '',
        date_to: row.date_to?.slice(0, 10) ?? '',
        designation: row.designation ?? '',
        employment_status: row.employment_status ?? '',
        salary: row.salary ?? '',
        station_place_of_assignment: row.station_place_of_assignment ?? '',
        branch: row.branch ?? '',
        leave_without_pay: row.leave_without_pay ?? '',
        separation_date: row.separation_date?.slice(0, 10) ?? '',
        separation_cause: row.separation_cause ?? '',
        remarks: row.remarks ?? '',
    };
}

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

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 resize-none';
const errorInputCls = 'w-full rounded-lg border border-red-400 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500';

function formatDate(val: string | null): string | null {
    if (!val) return null;
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSalary(val: string): string {
    const n = Number(val);
    return isNaN(n) ? val : n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
}

// Modal

interface ModalProps {
    title: string;
    form: ServiceRecordForm;
    errors: FormErrors;
    saving: boolean;
    onChange: (k: keyof ServiceRecordForm, v: string) => void;
    onSave: () => void;
    onClose: () => void;
}

function ServiceRecordModal({ title, form, errors, saving, onChange, onSave, onClose }: ModalProps) {
    const ic = (k: keyof ServiceRecordForm) => errors[k] ? errorInputCls : inputCls;
    const err = (k: keyof ServiceRecordForm) => errors[k]
        ? <p className="mt-1 text-xs text-red-500">{errors[k]}</p>
        : null;
    const field = (k: keyof ServiceRecordForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(k, e.target.value);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative flex h-full w-full flex-col rounded-t-none bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Date From <span className="text-red-500">*</span></label>
                            <input type="date" value={form.date_from} onChange={field('date_from')} className={ic('date_from')} />
                            {err('date_from')}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Date To</label>
                            <input type="date" value={form.date_to} onChange={field('date_to')} className={inputCls} placeholder="Leave blank if ongoing" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Designation <span className="text-red-500">*</span></label>
                        <input value={form.designation} onChange={field('designation')} placeholder="e.g. Agriculturist I" className={ic('designation')} />
                        {err('designation')}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Employment Status <span className="text-red-500">*</span></label>
                            <input value={form.employment_status} onChange={field('employment_status')} placeholder="e.g. Permanent" className={ic('employment_status')} />
                            {err('employment_status')}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Salary <span className="text-red-500">*</span></label>
                            <input type="number" step="0.01" min="0" value={form.salary} onChange={field('salary')} placeholder="e.g. 25439.00" className={ic('salary')} />
                            {err('salary')}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Station / Place of Assignment <span className="text-red-500">*</span></label>
                        <input value={form.station_place_of_assignment} onChange={field('station_place_of_assignment')} placeholder="e.g. DA RFO-5" className={ic('station_place_of_assignment')} />
                        {err('station_place_of_assignment')}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Branch</label>
                        <input value={form.branch} onChange={field('branch')} placeholder="e.g. Nat'l" className={inputCls} />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Leave Without Pay</label>
                        <textarea value={form.leave_without_pay} onChange={field('leave_without_pay')} rows={2} className={inputCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Separation Date</label>
                            <input type="date" value={form.separation_date} onChange={field('separation_date')} className={inputCls} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Separation Cause</label>
                            <input value={form.separation_cause} onChange={field('separation_cause')} className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Remarks</label>
                        <input value={form.remarks} onChange={field('remarks')} placeholder="e.g. Original, NBC 594" className={inputCls} />
                    </div>
                </div>

                <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={onSave} disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? <><Spinner /> Saving…</> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// PDF Preview

function ServiceRecordPdfViewer({ userId, onClose }: { userId: number; onClose: () => void }) {
    const previewUrl  = `/service-records/pdf/preview/${userId}`;
    const downloadUrl = `/service-records/pdf/download/${userId}`;
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-200 flex flex-col bg-black/80">
            <div className="flex shrink-0 items-center justify-between bg-gray-900 px-5 py-3">
                <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-semibold text-white">AFD-HRMS-012-0 — Service Record</span>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
                    >
                        <FileDown className="h-3.5 w-3.5" /> Download PDF
                    </a>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
                {!loaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-800">
                        <Spinner className="h-10 w-10 text-green-500" />
                        <p className="text-sm text-gray-300">Generating Service Record…</p>
                    </div>
                )}
                <iframe
                    src={previewUrl}
                    className="h-full w-full border-0"
                    style={{ display: loaded ? 'block' : 'none' }}
                    onLoad={() => setLoaded(true)}
                    title="Service Record Preview"
                />
            </div>

            <div className="flex shrink-0 items-center justify-center gap-2 bg-gray-900 px-5 py-2 text-xs text-gray-400">
                <span>Press <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-xs text-gray-300">Esc</kbd> to close</span>
            </div>
        </div>,
        document.body
    );
}

// Main

export default function ServiceRecordSection({ serviceRecords, userId, canEdit }: Props) {
    const sorted = [...serviceRecords].sort((a, b) => a.date_from.localeCompare(b.date_from));

    const [modal, setModal] = useState<'new' | ServiceRecordRow | null>(null);
    const [form, setForm] = useState<ServiceRecordForm>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

    function openAdd() {
        setForm(EMPTY_FORM);
        setErrors({});
        setModal('new');
    }

    function openEdit(row: ServiceRecordRow) {
        setForm(toForm(row));
        setErrors({});
        setModal(row);
    }

    function closeModal() {
        setModal(null);
        setErrors({});
    }

    function handleChange(k: keyof ServiceRecordForm, v: string) {
        setForm(f => ({ ...f, [k]: v }));
    }

    function save() {
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setSaving(true);

        const isNew = modal === 'new';
        const url = isNew ? `/admin/employees/${userId}/service-records` : `/admin/service-records/${(modal as ServiceRecordRow).id}`;
        const method: 'post' | 'put' = isNew ? 'post' : 'put';

        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                closeModal();
                Toast.fire({ icon: 'success', title: `Service record ${isNew ? 'added' : 'updated'}.` });
            },
            onError: (serverErrors) => {
                setErrors(serverErrors as FormErrors);
                setSaving(false);
                Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to save service record.') });
            },
        });
    }

    function remove(row: ServiceRecordRow) {
        Swal.fire({
            title: 'Delete Service Record?',
            html: `This will permanently delete the <strong>${row.designation}</strong> entry.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.delete(`/admin/service-records/${row.id}`, {
                preserveScroll: true,
                onSuccess: () => Toast.fire({ icon: 'success', title: 'Service record deleted.' }),
                onError: (serverErrors) => Toast.fire({ icon: 'error', title: firstErrorMessage(serverErrors as Record<string, string>, 'Failed to delete service record.') }),
            });
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800">Service Record</h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        onClick={() => setPdfPreviewOpen(true)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition"
                        title="Preview Service Record PDF"
                    >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Generate PDF</span>
                    </button>
                    {canEdit && (
                        <button onClick={openAdd}
                            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-green-600 p-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">
                            <Plus className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {sorted.length === 0 ? (
                canEdit ? (
                    <div onClick={openAdd}
                        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-10 text-gray-400 transition hover:border-green-300 hover:bg-green-50/50 hover:text-green-500">
                        <Briefcase className="h-8 w-8" />
                        <p className="text-sm font-medium">No service record entries yet</p>
                        <p className="text-xs">Click here to add one</p>
                    </div>
                ) : (
                    <p className="text-sm italic text-gray-400">No service record entries available.</p>
                )
            ) : (
                <div className="w-full max-w-full overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Date From</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Date To</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Designation</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Employment Status</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Salary</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Station / Place of Assignment</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Branch</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left">Remarks</th>
                                {canEdit && <th className="whitespace-nowrap px-4 py-3 text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sorted.map(row => (
                                <tr key={row.id} className="hover:bg-gray-50 transition">
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(row.date_from)}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(row.date_to) ?? 'Present'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">{row.designation}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{row.employment_status}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatSalary(row.salary)}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{row.station_place_of_assignment}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{row.branch || <span className="italic text-gray-300">—</span>}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 italic">{row.remarks || <span className="text-gray-300">—</span>}</td>
                                    {canEdit && (
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(row)}
                                                    className="cursor-pointer rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition" title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => remove(row)}
                                                    className="cursor-pointer rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition" title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <ServiceRecordModal
                    title={modal === 'new' ? 'Add Service Record' : 'Edit Service Record'}
                    form={form}
                    errors={errors}
                    saving={saving}
                    onChange={handleChange}
                    onSave={save}
                    onClose={closeModal}
                />
            )}

            {pdfPreviewOpen && (
                <ServiceRecordPdfViewer userId={userId} onClose={() => setPdfPreviewOpen(false)} />
            )}
        </div>
    );
}
