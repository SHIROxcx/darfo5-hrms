import axios from 'axios';
import { AlertTriangle, CheckCircle2, FileDown, FileWarning, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Swal from 'sweetalert2';

interface EmployeeRef {
    user_id: number;
    employee_number: string;
    name: string;
}

interface RejectedRow {
    row: number;
    employee_number: string;
    reason: string;
}

interface PreviewSummary {
    new_count: number;
    duplicate_count: number;
    not_found_count: number;
    invalid_count: number;
    new_employees: EmployeeRef[];
    duplicate_employees: EmployeeRef[];
    not_found: RejectedRow[];
    invalid: RejectedRow[];
}

interface PreviewResponse {
    token: string;
    summary: PreviewSummary;
}

interface Props {
    onClose: () => void;
    onImported: () => void;
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

function extractError(err: unknown, fallback: string): string {
    const data = (err as { response?: { data?: { errors?: Record<string, string[] | string>; message?: string } } })?.response?.data;
    if (data?.errors) {
        const first = Object.values(data.errors)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return data?.message ?? fallback;
}

export default function ServiceRecordImportModal({ onClose, onImported }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    function pickFile() {
        fileRef.current?.click();
    }

    function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) setFile(f);
        setError(null);
    }

    async function runPreview() {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axios.post<PreviewResponse>('/admin/service-records/import/preview', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPreview(res.data);
        } catch (err) {
            setError(extractError(err, 'Failed to process the CSV file.'));
        } finally {
            setUploading(false);
        }
    }

    async function commit() {
        if (!preview) return;
        setCommitting(true);
        setError(null);
        try {
            await axios.post('/admin/service-records/import/commit', { token: preview.token });
            Toast.fire({ icon: 'success', title: 'Service records imported.' });
            onImported();
            onClose();
        } catch (err) {
            setError(extractError(err, 'Failed to import service records.'));
        } finally {
            setCommitting(false);
        }
    }

    function reset() {
        setFile(null);
        setPreview(null);
        setError(null);
    }

    const s = preview?.summary;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="font-semibold text-green-800">Bulk Import Service Records</h3>
                    <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {!preview ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                Upload a CSV with columns: <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">employee_number, date_from, date_to, designation, employment_status, salary, station_place_of_assignment, branch, leave_without_pay, separation_date, separation_cause, remarks</code>
                            </p>
                            <a
                                href="/admin/service-records/import/template"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 hover:underline"
                            >
                                <FileDown className="h-4 w-4" /> Download CSV template
                            </a>
                            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileSelected} />
                            <div
                                onClick={pickFile}
                                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-10 text-gray-400 transition hover:border-green-300 hover:bg-green-50/50 hover:text-green-500"
                            >
                                <Upload className="h-8 w-8" />
                                <p className="text-sm font-medium">{file ? file.name : 'Click to choose a CSV file'}</p>
                                {file && <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>}
                            </div>
                            {error && (
                                <p className="flex items-start gap-1.5 text-xs text-red-500">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl bg-green-50 p-3 text-center">
                                    <p className="text-lg font-bold text-green-700">{s!.new_count}</p>
                                    <p className="text-xs text-green-700">New rows</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-3 text-center">
                                    <p className="text-lg font-bold text-amber-700">{s!.duplicate_count}</p>
                                    <p className="text-xs text-amber-700">Additional rows</p>
                                </div>
                                <div className="rounded-xl bg-gray-100 p-3 text-center">
                                    <p className="text-lg font-bold text-gray-600">{s!.not_found_count}</p>
                                    <p className="text-xs text-gray-600">Not found</p>
                                </div>
                                <div className="rounded-xl bg-red-50 p-3 text-center">
                                    <p className="text-lg font-bold text-red-600">{s!.invalid_count}</p>
                                    <p className="text-xs text-red-600">Invalid</p>
                                </div>
                            </div>

                            {s!.duplicate_employees.length > 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                                        <AlertTriangle className="h-3.5 w-3.5" /> These employees already have service record entries:
                                    </p>
                                    <ul className="max-h-24 space-y-0.5 overflow-y-auto text-xs text-amber-700">
                                        {s!.duplicate_employees.map(e => (
                                            <li key={e.user_id}>{e.name} ({e.employee_number})</li>
                                        ))}
                                    </ul>
                                    <p className="mt-1.5 text-xs text-amber-700">
                                        Choosing to proceed will <strong>add</strong> this CSV's rows as additional entries for these employees — their existing service record stays intact. Re-importing the same rows twice will create duplicate entries, so double-check the CSV first.
                                    </p>
                                </div>
                            )}

                            {(s!.not_found.length > 0 || s!.invalid.length > 0) && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                        <FileWarning className="h-3.5 w-3.5" /> Skipped rows (will not be imported):
                                    </p>
                                    <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-gray-600">
                                        {[...s!.not_found, ...s!.invalid].sort((a, b) => a.row - b.row).map((r, i) => (
                                            <li key={i}>Row {r.row} ({r.employee_number || 'blank'}): {r.reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {s!.new_count === 0 && s!.duplicate_count === 0 && (
                                <p className="text-sm italic text-gray-400">Nothing to import — every row was skipped.</p>
                            )}

                            {error && (
                                <p className="flex items-start gap-1.5 text-xs text-red-500">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
                    {!preview ? (
                        <>
                            <button onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={runPreview} disabled={!file || uploading}
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                                {uploading ? 'Processing…' : 'Preview'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={reset} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                Cancel Import
                            </button>
                            {(s!.new_count > 0 || s!.duplicate_count > 0) && (
                                <button onClick={commit} disabled={committing}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {committing ? 'Importing…' : s!.duplicate_count > 0 ? 'Add to Existing Records' : 'Import Now'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
