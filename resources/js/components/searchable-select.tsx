import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
    value: string | number;
    label: string;
    meta?: string; // e.g. zip code
}

interface Props {
    options: SelectOption[];
    value: string | number | null;
    onChange: (option: SelectOption | null) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    hasError?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    loading = false,
    className = '',
    hasError = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find(o => String(o.value) === String(value)) ?? null;

    const filtered = query.trim()
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const handleSelect = (opt: SelectOption) => {
        onChange(opt);
        setOpen(false);
        setQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setQuery('');
    };

    const baseClass = [
        'w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between',
        'focus:outline-none focus:ring-2 transition-all bg-white',
        disabled || loading
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100'
            : hasError
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-200 focus:ring-green-500 hover:border-gray-300 cursor-pointer',
        className,
    ].join(' ');

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled || loading}
                onClick={() => !disabled && !loading && setOpen(prev => !prev)}
                className={baseClass}
            >
                <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
                    {loading ? 'Loading...' : (selected?.label ?? placeholder)}
                </span>
                <span className="flex items-center gap-1 ml-2 shrink-0">
                    {selected && !disabled && (
                        <X
                            className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"
                            onClick={handleClear}
                        />
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Type to search..."
                            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                        />
                        {query && (
                            <button type="button" onClick={() => setQuery('')}>
                                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Options list */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-400 text-center">
                                {query ? `No results for "${query}"` : 'No options available'}
                            </li>
                        ) : (
                            filtered.map(opt => (
                                <li key={opt.value}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(opt)}
                                        className={[
                                            'w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between',
                                            String(opt.value) === String(value)
                                                ? 'bg-green-50 text-green-800 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50',
                                        ].join(' ')}
                                    >
                                        <span>{opt.label}</span>
                                        {opt.meta && (
                                            <span className="text-xs text-gray-400 ml-2">{opt.meta}</span>
                                        )}
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

