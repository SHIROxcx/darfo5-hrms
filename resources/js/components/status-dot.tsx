import type { ReactNode } from 'react';

// A plain marker + label rather than a colored pill, so color stays
// reserved for meaning instead of decorating every cell.

interface Props {
    tone: 'green' | 'amber' | 'gray' | 'red';
    children: ReactNode;
}

export function StatusDot({ tone, children }: Props) {
    const dot = tone === 'green' ? 'bg-green-700' : tone === 'amber' ? 'bg-amber-600' : tone === 'red' ? 'bg-red-600' : 'bg-gray-400';
    const text = tone === 'green' ? 'text-green-800' : tone === 'amber' ? 'text-amber-800' : tone === 'red' ? 'text-red-700' : 'text-gray-500';
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {children}
        </span>
    );
}
