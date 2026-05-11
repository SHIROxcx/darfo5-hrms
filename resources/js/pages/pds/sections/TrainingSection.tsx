import { useState, useRef, useEffect } from 'react';
import { Save, Plus, Trash2, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';
import type { User, PdsData, PdsTraining } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: (section: string, data: FormData) => void; saving: boolean; }

interface RowFile {
    file:     File | null;
    existing: string | null;
    preview:  string | null;
}

const EMPTY: PdsTraining = { title: '', date_from: '', date_to: '', number_of_hours: '', type_of_ld: '', conducted_by: '' };
const LD_TYPES = ['Managerial', 'Supervisory', 'Technical', 'Etc.'];

const ACCEPTED  = '.jpg,.jpeg,.png,.pdf';
const MAX_BYTES = 5 * 1024 * 1024;
const isImage = (name: string) => /\.(jpe?g|png)$/i.test(name);
const isPdf   = (name: string) => /\.pdf$/i.test(name);

function AttachmentCell({ rowFile, onChange, storageBase = '/storage' }: { rowFile: RowFile; onChange: (rf: RowFile) => void; storageBase?: string }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [sizeError, setSizeError] = useState('');

    const hasFile = !!rowFile.file, hasExisting = !!rowFile.existing, hasAny = hasFile || hasExisting;
    const label = hasFile ? rowFile.file!.name : hasExisting ? rowFile.existing!.split('/').pop() ?? 'Attachment' : null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_BYTES) { setSizeError('File must be under 5 MB.'); return; }
        setSizeError('');
        const preview = URL.createObjectURL(f);
        if (rowFile.preview) URL.revokeObjectURL(rowFile.preview);
        onChange({ file: f, existing: rowFile.existing, preview });
        e.target.value = '';
    };

    const handleClear = () => {
        if (rowFile.preview) URL.revokeObjectURL(rowFile.preview);
        onChange({ file: null, existing: null, preview: null });
        setSizeError('');
    };

    const existingUrl = hasExisting ? `${storageBase}/${rowFile.existing}` : null;
    const viewUrl = rowFile.preview ?? existingUrl;
    const previewSrc = viewUrl && label && isImage(label) ? viewUrl : null;

    return (
        <div className="flex flex-col gap-1 min-w-30">
            <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleChange} />
            {hasAny ? (
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50">
                    {previewSrc ? (
                        <a href={viewUrl!} target="_blank" rel="noopener noreferrer" className="shrink-0" title="View image">
                            <img src={previewSrc} alt="preview" className="w-7 h-7 rounded object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                    ) : viewUrl ? (
                        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                            className={`shrink-0 transition-colors ${label && isPdf(label) ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-green-600'}`}
                            title="Open attachment">
                            <FileText className="w-4 h-4" />
                        </a>
                    ) : (
                        <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <a href={viewUrl ?? '#'} target={viewUrl ? '_blank' : undefined} rel="noopener noreferrer"
                        className="text-[10px] text-gray-600 truncate max-w-20 hover:text-green-700 hover:underline transition-colors" title={label ?? ''}>
                        {label}
                    </a>
                    <div className="flex items-center gap-0.5 ml-auto shrink-0 min-h-7 max-h-5">
                        <button type="button" title="Replace file" onClick={() => fileRef.current?.click()}
                            className="text-gray-400 hover:text-green-600 p-0.5 rounded transition-colors cursor-pointer">
                            <Paperclip className="w-3 h-3" />
                        </button>
                        <button type="button" title="Remove attachment" onClick={handleClear}
                            className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1 border border-dashed border-gray-300 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors cursor-pointer min-h-8 w-full">
                    <Paperclip className="w-3 h-3 shrink-0" /><span>Attach File</span>
                </button>
            )}
            {sizeError && <p className="text-[10px] text-red-500">{sizeError}</p>}
        </div>
    );
}

export default function TrainingSection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsTraining[]>(
        pdsData.trainings?.length ? pdsData.trainings : [{ ...EMPTY }]
    );
    const [rowFiles, setRowFiles] = useState<RowFile[]>(
        (pdsData.trainings?.length ? pdsData.trainings : [EMPTY]).map(row => ({
            file: null,
            existing: (row as PdsTraining & { attachment?: string }).attachment ?? null,
            preview: null,
        }))
    );

    const trainingKey = JSON.stringify(
        (pdsData.trainings ?? []).map((e: PdsTraining & { id?: number; attachment?: string }) => ({ id: e.id, attachment: e.attachment }))
    );
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        const fresh = pdsData.trainings?.length ? pdsData.trainings : [{ ...EMPTY }];
        setRows(fresh);
        setRowFiles(prev => fresh.map((row: PdsTraining & { attachment?: string }, i: number) => {
            if (prev[i]?.preview) URL.revokeObjectURL(prev[i].preview!);
            return { file: null, existing: row.attachment ?? null, preview: null };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trainingKey]);

    useEffect(() => {
        return () => { rowFiles.forEach(rf => { if (rf.preview) URL.revokeObjectURL(rf.preview); }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const inputClass = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";

    const setRow = (i: number, key: keyof PdsTraining, val: string) =>
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

    const setRowFile = (i: number, rf: RowFile) =>
        setRowFiles(prev => prev.map((r, idx) => idx === i ? rf : r));

    const addRow = () => {
        setRows(p => [...p, { ...EMPTY }]);
        setRowFiles(p => [...p, { file: null, existing: null, preview: null }]);
    };

    const removeRow = (i: number) => {
        if (rowFiles[i]?.preview) URL.revokeObjectURL(rowFiles[i].preview!);
        setRows(p => p.filter((_, idx) => idx !== i));
        setRowFiles(p => p.filter((_, idx) => idx !== i));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        rows.forEach((row, i) => {
            fd.append(`trainings[${i}][title]`,           row.title           ?? '');
            fd.append(`trainings[${i}][date_from]`,       row.date_from       ?? '');
            fd.append(`trainings[${i}][date_to]`,         row.date_to         ?? '');
            fd.append(`trainings[${i}][number_of_hours]`, String(row.number_of_hours ?? ''));
            fd.append(`trainings[${i}][type_of_ld]`,      row.type_of_ld      ?? '');
            fd.append(`trainings[${i}][conducted_by]`,    row.conducted_by    ?? '');
            const rf = rowFiles[i];
            if (rf?.file)     fd.append(`attachments[${i}]`,          rf.file);
            else if (rf?.existing) fd.append(`existing_attachments[${i}]`, rf.existing);
        });
        onSave('trainings', fd);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">VII. Learning & Development Interventions</h2>
                    <p className="text-xs text-gray-500">Training programs attended. Write titles in full.</p>
                </div>
                <button type="button" onClick={addRow}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium mt-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 uppercase">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Title of Training</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">Date From</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">Date To</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">Hours</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">Type of L&D</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Conducted/Sponsored By</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-36">Attachment</th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                                <td className="px-2 py-1.5"><input type="text" value={row.title ?? ''} onChange={e => setRow(i, 'title', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="date" value={row.date_from ?? ''} onChange={e => setRow(i, 'date_from', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="date" value={row.date_to ?? ''} onChange={e => setRow(i, 'date_to', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5"><input type="number" value={row.number_of_hours as string ?? ''} onChange={e => setRow(i, 'number_of_hours', e.target.value)} className={inputClass} /></td>
                                <td className="px-2 py-1.5">
                                    <select value={row.type_of_ld ?? ''} onChange={e => setRow(i, 'type_of_ld', e.target.value)} className={inputClass}>
                                        <option value="">Select</option>
                                        {LD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </td>
                                <td className="px-2 py-1.5"><input type="text" value={row.conducted_by ?? ''} onChange={e => setRow(i, 'conducted_by', e.target.value)} className={inputClass} /></td>
                                <td className="px-1 py-1.5">
                                    <AttachmentCell
                                        rowFile={rowFiles[i] ?? { file: null, existing: null, preview: null }}
                                        onChange={rf => setRowFile(i, rf)}
                                    />
                                </td>
                                <td className="px-2 py-4">
                                    {rows.length > 1 && (
                                        <button type="button" onClick={() => removeRow(i)} title="Remove"
                                            className="text-red-400 hover:text-red-600 cursor-pointer">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving ? <><Spinner />Saving Training</> : <><Save className="w-4 h-4" />Save Training</>}
                </button>
            </div>
        </form>
    );
}