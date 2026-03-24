import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, Plus, Trash2, ChevronDown, X } from 'lucide-react';
import type { User, PdsData, PdsEligibility, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

// Shape returned by Eligibility::get(['id', 'title', 'abbreviation'])
export interface EligibilityOption {
    id: number;
    title: string;
    abbreviation: string;
}

interface Props {
    user: User;
    pdsData: PdsData;
    onSave: PdsSaveCallback;
    saving: boolean;
    eligibilities?: EligibilityOption[];
}

const EMPTY: PdsEligibility = {
    career_service: '',
    rating: '',
    date_of_examination: '',
    place_of_examination: '',
    license_number: '',
    license_validity: '',
};

type RowErrors = Partial<Record<keyof PdsEligibility, string>>;

//  Searchable Combobox
interface ComboboxProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
    options: EligibilityOption[];
}

function EligibilityCombobox({ value, onChange, error, options = [] }: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.trim()
        ? options.filter(e =>
            e.title.toLowerCase().includes(query.toLowerCase()) ||
            e.abbreviation.toLowerCase().includes(query.toLowerCase())
          )
        : options;

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownH = 220;
        const openUpward = spaceBelow < dropdownH && rect.top > dropdownH;
        setDropdownStyle({
            position: 'fixed',
            left: rect.left,
            width: Math.max(rect.width, 280),
            zIndex: 9999,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        });
    };

    const openDropdown = () => {
        updatePosition();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = () => updatePosition();
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('resize', handler);
        };
    }, [open]);

    const select = (title: string) => {
        onChange(title);
        setOpen(false);
        setQuery('');
    };

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
    };

    const match = options.find(e => e.title === value);
    const displayLabel = value ? (match ? `${value} (${match.abbreviation})` : value) : '';

    const dropdown = open
        ? createPortal(
            <div
                ref={dropdownRef}
                style={dropdownStyle}
                className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
            >
                <div className="p-1.5 border-b border-gray-100">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search eligibility or abbreviation…"
                        className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                </div>
                <ul className="max-h-48 overflow-y-auto py-1">
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-gray-400 italic">No results found</li>
                    ) : filtered.map(e => (
                        <li
                            key={e.id}
                            onMouseDown={() => select(e.title)}
                            className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs hover:bg-green-50 hover:text-green-800
                                ${value === e.title ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-700'}`}
                        >
                            <span className="truncate">{e.title}</span>
                            <span className="ml-2 shrink-0 text-[10px] text-gray-400 font-mono">{e.abbreviation}</span>
                        </li>
                    ))}
                </ul>
            </div>,
            document.body
        )
        : null;

    return (
        <div className="relative w-full">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => open ? (setOpen(false), setQuery('')) : openDropdown()}
                className={`w-full flex items-center justify-between border rounded-lg px-2 py-1.5 text-xs bg-white text-left transition-colors
                    ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-green-500'}
                    focus:outline-none focus:ring-1`}
            >
                <span className={value ? 'text-gray-800 truncate' : 'text-gray-400'}>
                    {value ? displayLabel : 'Select eligibility…'}
                </span>
                <span className="flex items-center gap-0.5 ml-1 shrink-0">
                    {value && (
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

// Main Component
export default function EligibilitySection({ pdsData, onSave, saving, eligibilities = [] }: Props) {
    const [rows, setRows] = useState<PdsEligibility[]>(
        pdsData.eligibilities?.length ? pdsData.eligibilities : [{ ...EMPTY }]
    );
    const [errors, setErrors] = useState<RowErrors[]>([]);

    const inputClass = (err?: string) =>
        `w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 bg-white transition-colors
        ${err ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-green-500'}`;

    const setRow = (i: number, key: keyof PdsEligibility, val: string) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
        setErrors(prev => {
            const next = [...prev];
            if (next[i]) next[i] = { ...next[i], [key]: undefined };
            return next;
        });
    };

    const validate = (): boolean => {
        const newErrors: RowErrors[] = rows.map(row => {
            const e: RowErrors = {};
            if (!row.career_service?.trim())       e.career_service       = 'Eligibility is required.';
            if (!row.rating?.trim())               e.rating               = 'Rating is required.';
            if (!row.date_of_examination?.trim())  e.date_of_examination  = 'Date is required.';
            if (!row.place_of_examination?.trim()) e.place_of_examination = 'Place is required.';
            if (!row.license_number?.trim())       e.license_number       = 'License No. is required.';
            if (!row.license_validity?.trim())     e.license_validity     = 'Validity is required.';
            return e;
        });
        setErrors(newErrors);
        return newErrors.every(e => Object.keys(e).length === 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave('eligibility', { eligibilities: rows } as unknown as Record<string, unknown>);
    };

    const addRow = () => {
        setRows(p => [...p, { ...EMPTY }]);
        setErrors(p => [...p, {}]);
    };

    const removeRow = (i: number) => {
        setRows(p => p.filter((_, idx) => idx !== i));
        setErrors(p => p.filter((_, idx) => idx !== i));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">IV. Civil Service Eligibility</h2>
                    <p className="text-xs text-gray-500">Include CES, CSEE, Career Service, RA 1080 (BOARD/BAR), Under Special Laws, and Eligibilities for Uniformed Personnel.</p>
                </div>
                <button type="button" onClick={addRow}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium mt-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 min-w-55">
                                Career Service / Eligibility <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-24">
                                Rating <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">
                                Date of Exam <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 min-w-37.5">
                                Place of Examination <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">
                                License No. <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">
                                Validity <span className="text-red-500">*</span>
                            </th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => {
                            const rowErr = errors[i] ?? {};
                            return (
                                <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                                    <td className="px-2 py-1.5">
                                        <EligibilityCombobox
                                            value={row.career_service ?? ''}
                                            onChange={val => setRow(i, 'career_service', val)}
                                            error={rowErr.career_service}
                                            options={eligibilities}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={row.rating ?? ''}
                                            onChange={e => setRow(i, 'rating', e.target.value)}
                                            placeholder="e.g. 85.50"
                                            className={inputClass(rowErr.rating)}
                                        />
                                        {rowErr.rating && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.rating}</p>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="date"
                                            value={row.date_of_examination ?? ''}
                                            onChange={e => setRow(i, 'date_of_examination', e.target.value)}
                                            className={inputClass(rowErr.date_of_examination)}
                                        />
                                        {rowErr.date_of_examination && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.date_of_examination}</p>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={row.place_of_examination ?? ''}
                                            onChange={e => setRow(i, 'place_of_examination', e.target.value)}
                                            placeholder="City, Province"
                                            className={inputClass(rowErr.place_of_examination)}
                                        />
                                        {rowErr.place_of_examination && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.place_of_examination}</p>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={row.license_number ?? ''}
                                            onChange={e => setRow(i, 'license_number', e.target.value)}
                                            placeholder="License No."
                                            className={inputClass(rowErr.license_number)}
                                        />
                                        {rowErr.license_number && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.license_number}</p>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="date"
                                            value={row.license_validity ?? ''}
                                            onChange={e => setRow(i, 'license_validity', e.target.value)}
                                            className={inputClass(rowErr.license_validity)}
                                        />
                                        {rowErr.license_validity && <p className="mt-0.5 text-[10px] text-red-500">{rowErr.license_validity}</p>}
                                    </td>
                                    <td className="px-2 py-3">
                                        {rows.length > 0 && (
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
                    {saving
                        ? <><Spinner />Saving Eligibility…</>
                        : <><Save className="w-4 h-4" />Save Eligibility</>
                    }
                </button>
            </div>
        </form>
    );
}