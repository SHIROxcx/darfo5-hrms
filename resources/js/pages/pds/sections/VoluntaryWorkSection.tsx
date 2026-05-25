// VoluntaryWorkSection.tsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, Plus, Trash2, Pencil, X, HeartHandshake } from 'lucide-react';
import type { User, PdsData, PdsVoluntaryWork, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';
import Swal from 'sweetalert2';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_VW: PdsVoluntaryWork = {
    organization_name: '', organization_address: '',
    date_from: '', date_to: '', number_of_hours: '', position: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    draft: PdsVoluntaryWork;
    onChange: (k: keyof PdsVoluntaryWork, v: string) => void;
    onSubmit: () => void;
    saving: boolean;
}

function VoluntaryWorkModal({ open, onClose, title, draft, onChange, onSubmit, saving }: ModalProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const base = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors border-gray-200 focus:ring-green-500";

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button type="button" onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                    {/* Organization Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Organization Name
                        </label>
                        <input type="text" value={draft.organization_name ?? ''} className={base}
                            placeholder="Write organization name in full"
                            onChange={e => onChange('organization_name', e.target.value)} />
                    </div>

                    {/* Organization Address */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Organization Address
                        </label>
                        <input type="text" value={draft.organization_address ?? ''} className={base}
                            placeholder="Write address in full"
                            onChange={e => onChange('organization_address', e.target.value)} />
                    </div>

                    {/* Date From & Date To */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
                            <input type="date" value={draft.date_from ?? ''} className={base}
                                onChange={e => onChange('date_from', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
                            <input type="date" value={draft.date_to ?? ''} className={base}
                                onChange={e => onChange('date_to', e.target.value)} />
                        </div>
                    </div>

                    {/* Number of Hours */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Number of Hours</label>
                        <input type="number" value={draft.number_of_hours as string ?? ''} className={base}
                            placeholder="e.g. 40"
                            onChange={e => onChange('number_of_hours', e.target.value)} />
                    </div>

                    {/* Position / Nature of Work */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Position / Nature of Work
                        </label>
                        <input type="text" value={draft.position ?? ''} className={base}
                            placeholder="e.g. Volunteer Coordinator"
                            onChange={e => onChange('position', e.target.value)} />
                    </div>

                    <p className="text-[11px] text-gray-400 italic">
                        Write <strong>N/A</strong> if not applicable.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex justify-end gap-2">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button type="button" onClick={onSubmit} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                        {saving ? <><Spinner />Saving…</> : <><Save className="w-4 h-4" />Save</>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Voluntary Work Card ───────────────────────────────────────────────────────

interface CardProps {
    row: PdsVoluntaryWork;
    onEdit: () => void;
    onDelete: () => void;
}

function VoluntaryWorkCard({ row, onEdit, onDelete }: CardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const btnRef  = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
                setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const dateRange = row.date_from || row.date_to
        ? `${formatDate(row.date_from) ?? '—'} – ${formatDate(row.date_to) ?? '—'}`
        : null;

    return (
        <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
            {/* Icon */}
            <div className="hidden md:flex w-10 h-10 rounded-xl bg-green-600 items-center justify-center shrink-0 mt-0.5">
                <HeartHandshake className="w-5 h-5 text-white/90" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {row.organization_name || <span className="text-gray-400 italic">No organization</span>}
                </p>

                {row.position && (
                    <p className="text-xs text-gray-600 mt-0.5">{row.position}</p>
                )}

                {row.organization_address && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{row.organization_address}</p>
                )}

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                    {dateRange && <span>{dateRange}</span>}
                    {row.number_of_hours && (
                        <span className="text-gray-500">
                            {row.number_of_hours} hrs
                        </span>
                    )}
                </div>
            </div>

            {/* Ellipsis menu */}
            <div className="relative shrink-0">
                <button ref={btnRef} type="button" onClick={() => setMenuOpen(prev => !prev)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        menuOpen ? 'bg-green-50 text-green-700' : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="4" cy="10" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="16" cy="10" r="1.5" />
                    </svg>
                </button>

                {menuOpen && (
                    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                        <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-green-700 hover:bg-gray-50 transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />Edit
                        </button>
                        <button type="button" onClick={() => { setMenuOpen(false); onDelete(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-gray-50 hover:text-red-700 transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ModalMode = { type: 'add' } | { type: 'edit'; index: number };

export default function VoluntaryWorkSection({ pdsData, onSave, saving }: Props) {
    const [rows, setRows] = useState<PdsVoluntaryWork[]>(
        pdsData.voluntary_work?.length ? pdsData.voluntary_work : []
    );

    // Modal state
    const [modal,  setModal]  = useState<ModalMode | null>(null);
    const [draft,  setDraft]  = useState<PdsVoluntaryWork>({ ...EMPTY_VW });

    const openAdd = () => {
        setDraft({ ...EMPTY_VW });
        setModal({ type: 'add' });
    };

    const openEdit = (index: number) => {
        setDraft({ ...rows[index] });
        setModal({ type: 'edit', index });
    };

    const closeModal = () => setModal(null);

    const handleChange = (k: keyof PdsVoluntaryWork, v: string) =>
        setDraft(prev => ({ ...prev, [k]: v }));

    const handleModalSubmit = () => {
        let nextRows: PdsVoluntaryWork[];

        if (modal?.type === 'add') {
            nextRows = [...rows, draft];
        } else if (modal?.type === 'edit') {
            nextRows = rows.map((r, i) => i === modal.index ? draft : r);
        } else { return; }

        setRows(nextRows);
        closeModal();
        onSave('voluntary_work', { voluntary_work: nextRows } as unknown as Record<string, unknown>);
    };

    const handleDelete = async (index: number) => {
        const label = rows[index]?.organization_name?.trim() || 'this voluntary work';

        const result = await Swal.fire({
            title: 'Delete Voluntary Work?',
            html: `<span class="text-sm text-gray-600">This will permanently remove <strong>${label}</strong> from your record.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            focusCancel: true,
            customClass: {
                popup: '!rounded-2xl !shadow-xl',
                title: '!text-base !font-semibold !text-gray-800',
                confirmButton: '!rounded-lg !text-sm !font-medium !px-4 !py-2',
                cancelButton: '!rounded-lg !text-sm !font-medium !px-4 !py-2',
            },
        });

        if (!result.isConfirmed) return;

        const nextRows = rows.filter((_, i) => i !== index);
        setRows(nextRows);
        onSave('voluntary_work', { voluntary_work: nextRows } as unknown as Record<string, unknown>);
    };

    return (
        <div className="space-y-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-base font-semibold text-green-800 uppercase">VI. Voluntary Work</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Involvement in Civic / Non-government / People / Voluntary Organizations.{' '}
                        <span className="font-medium text-green-700">Write N/A if not applicable.</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-3">
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            {/* List */}
            {rows.length === 0 ? (
                <div onClick={openAdd}
                    className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50/50 transition-colors cursor-pointer">
                    <HeartHandshake className="w-8 h-8" />
                    <p className="text-sm font-medium">Add your Voluntary Work</p>
                    <p className="text-xs">Click to get started</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                    {rows.map((row, i) => (
                        <VoluntaryWorkCard
                            key={i}
                            row={row}
                            onEdit={() => openEdit(i)}
                            onDelete={() => handleDelete(i)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <VoluntaryWorkModal
                open={modal !== null}
                onClose={closeModal}
                title={modal?.type === 'edit' ? 'Edit Voluntary Work' : 'Add Voluntary Work'}
                draft={draft}
                onChange={handleChange}
                onSubmit={handleModalSubmit}
                saving={saving}
            />
        </div>
    );
}