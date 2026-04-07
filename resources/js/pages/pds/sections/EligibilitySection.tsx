import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, Plus, Trash2, ChevronDown, X } from 'lucide-react';
import type { User, PdsData, PdsEligibility, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: PdsSaveCallback;
    saving: boolean;
    // No eligibilities prop needed — the combobox fetches its own list
}

interface EligibilityOption {
    id: number;
    category: string;
    title: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY: PdsEligibility = {
    career_service: '',
    rating: '',
    date_of_examination: '',
    place_of_examination: '',
    license_number: '',
    license_validity: '',
};

type RowErrors = Partial<Record<keyof PdsEligibility, string>>;

const toDateOnly = (val?: string | null) => val ? val.slice(0, 10) : '';
const normalizeRow = (row: PdsEligibility): PdsEligibility => ({
    ...row,
    date_of_examination: toDateOnly(row.date_of_examination),
    license_validity:    toDateOnly(row.license_validity),
});

// ── Module-level cache — fetches once per page session ────────────────────────

let _cache: EligibilityOption[] | null = null;
let _inflight: Promise<EligibilityOption[]> | null = null;

function fetchOptions(): Promise<EligibilityOption[]> {
    if (_cache)    return Promise.resolve(_cache);
    if (_inflight) return _inflight;
    _inflight = fetch('/api/locations/eligibilities')
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then((data: EligibilityOption[]) => {
            _cache    = data;
            _inflight = null;
            return data;
        })
        .catch(err => {
            _inflight = null;
            console.error('Failed to load eligibilities:', err);
            return [];
        });
    return _inflight;
}

// ── Combobox ──────────────────────────────────────────────────────────────────

interface ComboboxProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
}

function EligibilityCombobox({ value, onChange, error }: ComboboxProps) {
    const [options,  setOptions]  = useState<EligibilityOption[]>(_cache ?? []);
    const [loading,  setLoading]  = useState(!_cache);
    const [open,     setOpen]     = useState(false);
    const [query,    setQuery]    = useState('');
    const [style,    setStyle]    = useState<React.CSSProperties>({});

    const triggerRef  = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef    = useRef<HTMLInputElement>(null);

    // Fetch on mount (uses cache if already loaded)
    useEffect(() => {
        if (_cache) { setOptions(_cache); setLoading(false); return; }
        fetchOptions().then(data => { setOptions(data); setLoading(false); });
    }, []);

    // Filter
    const filtered = query.trim()
        ? options.filter(o => o.title.toLowerCase().includes(query.toLowerCase()) ||
                              o.category.toLowerCase().includes(query.toLowerCase()))
        : options;

    // Group by category
    const grouped = filtered.reduce<Record<string, EligibilityOption[]>>((acc, o) => {
        (acc[o.category] ??= []).push(o);
        return acc;
    }, {});

    const updatePos = () => {
        if (!triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        const below = window.innerHeight - r.bottom;
        const up    = below < 240 && r.top > 240;
        setStyle({
            position: 'fixed',
            left:     r.left,
            width:    Math.max(r.width, 280),
            zIndex:   9999,
            ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
        });
    };

    const openDropdown = () => {
        updatePos();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) &&
                !dropdownRef.current?.contains(e.target as Node)) {
                setOpen(false); setQuery('');
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    // Reposition on scroll / resize
    useEffect(() => {
        if (!open) return;
        const h = () => updatePos();
        window.addEventListener('scroll', h, true);
        window.addEventListener('resize', h);
        return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
    }, [open]);

    const select = (title: string) => { onChange(title); setOpen(false); setQuery(''); };
    const clear  = (e: React.MouseEvent) => { e.stopPropagation(); onChange(''); setQuery(''); };

    const dropdown = open ? createPortal(
        <div ref={dropdownRef} style={style}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-1.5 border-b border-gray-100">
                <input ref={inputRef} type="text" value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search eligibility or category…"
                    className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
                {loading ? (
                    <p className="px-3 py-2 text-xs text-gray-400 text-center">Loading…</p>
                ) : Object.keys(grouped).length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400 italic text-center">No results</p>
                ) : (
                    Object.entries(grouped).map(([cat, opts]) => (
                        <div key={cat}>
                            <div className="sticky top-0 bg-gray-50 px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                {cat}
                            </div>
                            {opts.map(opt => (
                                <button key={opt.id} type="button"
                                    onMouseDown={() => select(opt.title)}
                                    className={[
                                        'w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer',
                                        value === opt.title
                                            ? 'bg-green-50 text-green-800 font-medium'
                                            : 'text-gray-700 hover:bg-green-50 hover:text-green-800',
                                    ].join(' ')}>
                                    {opt.title}
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="relative w-full">
            <button ref={triggerRef} type="button"
                onClick={() => open ? (setOpen(false), setQuery('')) : openDropdown()}
                className={[
                    'w-full flex items-center justify-between border rounded-lg px-2 py-1.5 text-xs bg-white text-left transition-colors focus:outline-none focus:ring-1',
                    error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-green-500',
                ].join(' ')}>
                <span className={value ? 'text-gray-800 truncate' : 'text-gray-400'}>
                    {loading ? 'Loading…' : (value || 'Select eligibility')}
                </span>
                <span className="flex items-center gap-0.5 ml-1 shrink-0">
                    {value && !loading && (
                        <span onClick={clear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>
            {dropdown}
            {error && <p className="mt-0.5 text-[10px] text-red-500">{error}</p>}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EligibilitySection({ pdsData, onSave, saving }: Props) {
    const [rows,   setRows]   = useState<PdsEligibility[]>(
        pdsData.eligibilities?.length
            ? pdsData.eligibilities.map(normalizeRow)
            : [{ ...EMPTY }]
    );
    const [errors, setErrors] = useState<RowErrors[]>([]);

    const inputCls = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";
    const errCls   = "w-full border border-red-400 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-red-50";
    const cls      = (i: number, k: keyof PdsEligibility) => errors[i]?.[k] ? errCls : inputCls;

    const setRow = (i: number, k: keyof PdsEligibility, v: string) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
        setErrors(prev => prev.map((e, idx) => idx === i ? { ...e, [k]: undefined } : e));
    };

    const validate = (): boolean => {
        const next: RowErrors[] = rows.map(row => {
            const e: RowErrors = {};
            if (!row.career_service?.trim())       e.career_service       = 'Required. Write N/A if not applicable.';
            if (!row.rating?.trim())               e.rating               = 'Required. Write N/A if not applicable.';
            if (!row.date_of_examination?.trim())  e.date_of_examination  = 'Required.';
            if (!row.place_of_examination?.trim()) e.place_of_examination = 'Required. Write N/A if not applicable.';
            return e;
        });
        setErrors(next);
        return next.every(e => Object.keys(e).length === 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave('eligibility', { eligibilities: rows } as unknown as Record<string, unknown>);
    };

    const addRow    = () => { setRows(p => [...p, { ...EMPTY }]); setErrors(p => [...p, {}]); };
    const removeRow = (i: number) => {
        setRows(p => p.filter((_, idx) => idx !== i));
        setErrors(p => p.filter((_, idx) => idx !== i));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">IV. Civil Service Eligibility</h2>
                    <p className="text-xs text-gray-500">
                        Include CES, CSEE, Career Service, RA 1080 (BOARD/BAR), Under Special Laws, and Eligibilities for Uniformed Personnel.{' '}
                        <span className="font-medium text-green-700">Write N/A if not applicable.</span>
                    </p>
                </div>
                <button type="button" onClick={addRow}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium mt-1 cursor-pointer shrink-0 ml-3">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 uppercase">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 lg:min-w-50">Career Service / Eligibility <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-24">Rating <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">Date of Exam <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 lg:min-w-35">Place of Examination <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-28">License No.</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">Validity</th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => {
                            const rowErr = errors[i] ?? {};
                            return (
                                <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                                    <td className="px-2 py-1.5">
                                        {/* Self-fetching — no prop needed */}
                                        <EligibilityCombobox
                                            value={row.career_service ?? ''}
                                            onChange={val => setRow(i, 'career_service', val)}
                                            error={rowErr.career_service}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input type="text" value={row.rating ?? ''}
                                            onChange={e => setRow(i, 'rating', e.target.value)}
                                            placeholder="e.g. 85.50 or N/A" className={cls(i, 'rating')} />
                                        {rowErr.rating && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.rating}</p>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input type="date" value={row.date_of_examination ?? ''}
                                            onChange={e => setRow(i, 'date_of_examination', e.target.value)}
                                            className={cls(i, 'date_of_examination')} />
                                        {rowErr.date_of_examination && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.date_of_examination}</p>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input type="text" value={row.place_of_examination ?? ''}
                                            onChange={e => setRow(i, 'place_of_examination', e.target.value)}
                                            placeholder="City, Province or N/A" className={cls(i, 'place_of_examination')} />
                                        {rowErr.place_of_examination && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.place_of_examination}</p>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input type="text" value={row.license_number ?? ''}
                                            onChange={e => setRow(i, 'license_number', e.target.value)}
                                            placeholder="License No. or N/A" className={inputCls} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input type="date" value={row.license_validity ?? ''}
                                            onChange={e => setRow(i, 'license_validity', e.target.value)}
                                            className={inputCls} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        {rows.length > 1 && (
                                            <button type="button" onClick={() => removeRow(i)}
                                                className="text-red-400 hover:text-red-600 cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving ? <><Spinner />Saving Eligibility</> : <><Save className="w-4 h-4" />Save Eligibility</>}
                </button>
            </div>
        </form>
    );
}