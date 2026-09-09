import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Download, Eye, FileText, CheckSquare, Square,
    ChevronDown, ChevronUp, ClipboardList, ArrowLeft, Dot,
} from 'lucide-react';
import type { PdsData, PdsWorkExperience, User } from '@/types/pds';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    open:    boolean;
    onClose: () => void;
    user:    User;
    pdsData: PdsData;
}

interface WorkExperienceEntry extends PdsWorkExperience {
    id?:              number;
    attachment?:      string;
    accomplishments?: string;
    actual_duties?:   string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDateShort = (val?: string | null): string => {
    if (!val) return '';
    try {
        return new Date(val).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    } catch {
        return val;
    }
};

function buildWesUrl(userToken: string, selectedIds: number[], action: 'preview' | 'download'): string {
    const params = new URLSearchParams();
    selectedIds.forEach(id => params.append('ids[]', String(id)));
    return `/pds/wes/${action}/${userToken}?${params.toString()}`;
}

// ── Selection Card ────────────────────────────────────────────────────────────

function SelectionCard({
    entry, checked, onToggle, expanded, onExpandToggle,
}: {
    entry: WorkExperienceEntry;
    checked: boolean;
    onToggle: () => void;
    expanded: boolean;
    onExpandToggle: () => void;
}) {
    const dateRange = entry.is_present
        ? `${formatDateShort(entry.date_from)} – Present`
        : `${formatDateShort(entry.date_from)} – ${formatDateShort(entry.date_to)}`;

    return (
        <div className={`rounded-xl border transition-all duration-150 ${
            checked ? 'border-green-400 bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
        }`}>
            <div className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={onToggle}
                    className="shrink-0 cursor-pointer" aria-label={checked ? 'Deselect' : 'Select'}>
                    {checked
                        ? <CheckSquare className="w-5 h-5 text-green-600" />
                        : <Square className="w-5 h-5 text-gray-300" />}
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{entry.position_title}</p>
                    <p className="text-xs text-gray-500 truncate">{entry.department} · {dateRange}</p>
                </div>
                <button type="button" onClick={onExpandToggle}
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded"
                    title={expanded ? 'Collapse' : 'Expand'}>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3 text-xs text-gray-600">
                    <div>
                        <p className="font-semibold text-gray-700 mb-1">Accomplishments:</p>
                        {entry.accomplishments
                            ? <ul className="list-disc list-inside space-y-0.5 pl-1">
                                {entry.accomplishments.split('\n').filter(Boolean).map((a, i) => (
                                    <li key={i}>{a.trim()}</li>
                                ))}
                              </ul>
                            : <p className="italic text-gray-400">None recorded.</p>}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700 mb-1">Summary of Actual Duties:</p>
                        {entry.actual_duties
                            ? <ul className="list-disc list-inside space-y-0.5 pl-1">
                                {entry.actual_duties.split('\n').filter(Boolean).map((d, i) => (
                                    <li key={i}>{d.trim()}</li>
                                ))}
                              </ul>
                            : <p className="italic text-gray-400">None recorded.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Entry Selection Screen ──────────────────────────────────────────

function SelectionScreen({
    entries,
    selected,
    expanded,
    onToggle,
    onToggleExpand,
    onToggleAll,
    onClose,
    onPreview,
}: {
    entries:        WorkExperienceEntry[];
    selected:       Set<number>;
    expanded:       Set<number>;
    onToggle:       (i: number) => void;
    onToggleExpand: (i: number) => void;
    onToggleAll:    () => void;
    onClose:        () => void;
    onPreview:      () => void;
}) {
    return (
        <div className="fixed inset-0 z-150 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
                            <ClipboardList className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">Work Experience Sheet</h3>
                            <p className="text-xs text-gray-500">Include only the work experiences relevant to the position being applied to</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                            <ClipboardList className="w-10 h-10 opacity-40" />
                            <p className="text-sm font-medium">No work experience entries yet.</p>
                            <p className="text-xs">Add entries in the Work Experience section first.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {selected.size} of {entries.length} selected
                                </p>
                                <button type="button" onClick={onToggleAll}
                                    className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer transition-colors">
                                    {selected.size === entries.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            {entries.map((entry, i) => (
                                <SelectionCard
                                    key={entry.id ?? i}
                                    entry={entry}
                                    checked={selected.has(i)}
                                    onToggle={() => onToggle(i)}
                                    expanded={expanded.has(i)}
                                    onExpandToggle={() => onToggleExpand(i)}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                {entries.length > 0 && (
                    <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onPreview}
                            disabled={selected.size === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Eye className="w-4 h-4" />
                            Generate Preview
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Full-Screen PDF Viewer ─────────

function WesFullScreenViewer({
    userToken,
    selectedIds,
    onBack,
    onClose,
}: {
    userToken:   string;
    selectedIds: number[];
    onBack:      () => void;
    onClose:     () => void;
}) {
    const previewUrl  = buildWesUrl(userToken, selectedIds, 'preview');
    const downloadUrl = buildWesUrl(userToken, selectedIds, 'download');
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

    return (
        <div className="fixed inset-0 z-200 flex flex-col bg-black/80">

            {/* Top bar — mirrors PdfPreviewModal */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-gray-900">
                <div className="flex items-center gap-3">
                    {/* Back to selection */}
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                        title="Back to selection"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <ClipboardList className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold text-sm">
                        CS Form 212 — Work Experience Sheet
                    </span>
                    <span className="hidden sm:inline text-gray-500 text-xs">
                        ({selectedIds.length} {selectedIds.length === 1 ? 'entry' : 'entries'})
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* PDF iframe — full height remaining */}
            <div className="flex-1 relative overflow-hidden">
                {!loaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-800">
                        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-300 text-sm">Generating Work Experience Sheet…</p>
                    </div>
                )}
                <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    style={{ display: loaded ? 'block' : 'none' }}
                    onLoad={() => setLoaded(true)}
                    title="Work Experience Sheet Preview"
                />
            </div>

            {/* Bottom hint — mirrors PdfPreviewModal */}
            <div className="shrink-0 flex items-center justify-center gap-2 px-5 py-2 bg-gray-900 text-gray-400 text-xs">
                <span>Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-xs">Esc</kbd> to close</span>
                <span><Dot /></span>
                <span>Use your browser&apos;s built-in print button inside the PDF viewer to print</span>
                <span><Dot /></span>
                <button onClick={onBack} className="text-green-400 hover:text-green-300 transition-colors cursor-pointer">
                    Change selection
                </button>
            </div>
        </div>
    );
}

// ── Root Component ────────────────────────────────────────────────────────────

export default function WorkExperienceSheetModal({ open, onClose, user, pdsData }: Props) {
    const entries: WorkExperienceEntry[] = (pdsData.work_experience ?? []) as WorkExperienceEntry[];

    const [selected,  setSelected]  = useState<Set<number>>(new Set());
    const [expanded,  setExpanded]  = useState<Set<number>>(new Set());
    // 'select' = entry selection screen, 'preview' = full-screen PDF viewer
    const [stage, setStage] = useState<'select' | 'preview'>('select');

    // Ordered DB ids for selected entries
    const selectedIds: number[] = entries
        .map((e, i) => ({ id: e.id, idx: i }))
        .filter(({ idx }) => selected.has(idx))
        .map(({ id }) => id!)
        .filter(Boolean);

    // Reset on open
    useEffect(() => {
        if (open) {
            setSelected(new Set(entries.map((_, i) => i)));
            setExpanded(new Set());
            setStage('select');
        }
    }, [open]);

    useEffect(() => {
        if (open && stage === 'select') document.body.style.overflow = 'hidden';
        if (!open) document.body.style.overflow = '';
        return () => { if (!open) document.body.style.overflow = ''; };
    }, [open, stage]);

    if (!open) return null;

    const toggleEntry = (i: number) => setSelected(prev => {
        const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
    });
    const toggleExpand = (i: number) => setExpanded(prev => {
        const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
    });
    const toggleAll = () => setSelected(prev =>
        prev.size === entries.length ? new Set() : new Set(entries.map((_, i) => i))
    );

    const handleClose = () => {
        document.body.style.overflow = '';
        onClose();
    };

    if (stage === 'preview' && selectedIds.length > 0) {
        return createPortal(
            <WesFullScreenViewer
                userToken={user.public_token}
                selectedIds={selectedIds}
                onBack={() => setStage('select')}
                onClose={handleClose}
            />,
            document.body
        );
    }

    return createPortal(
        <SelectionScreen
            entries={entries}
            selected={selected}
            expanded={expanded}
            onToggle={toggleEntry}
            onToggleExpand={toggleExpand}
            onToggleAll={toggleAll}
            onClose={handleClose}
            onPreview={() => setStage('preview')}
        />,
        document.body
    );
}