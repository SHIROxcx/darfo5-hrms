import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EditBtn({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick}
            className="flex cursor-pointer items-center gap-1.5 rounded-full p-1.5 text-xs font-semibold text-white hover:bg-green-700 transition bg-green-600">
            <Pencil className="h-5 w-5" />
        </button>
    );
}

export function InfoGrid({ items, showAll }: { items: { label: string; value: string | null | undefined }[]; showAll?: boolean }) {
    const visible = showAll ? items : items.filter(i => i.value);
    if (!visible.length) return <p className="text-sm text-gray-400 italic">No information available.</p>;
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ label, value }) => (
                <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">{label}</p>
                    <p className={cn('text-sm font-medium', value ? 'text-gray-800' : 'text-gray-400 italic')}>{value || 'Not set'}</p>
                </div>
            ))}
        </div>
    );
}

export function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-green-900">{title}</h3>
            {children}
        </div>
    );
}

export function educationPeriod(from: string | null, to: string | null) {
    if (!from && !to) return null;
    return [from || '—', to || 'Present'].join(' – ');
}

export function lengthOfService(dateHired: string | null | undefined): string | null {
    if (!dateHired) return null;
    const start = new Date(dateHired);
    if (isNaN(start.getTime())) return null;

    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (now.getDate() < start.getDate()) months -= 1;
    if (months < 0) { years -= 1; months += 12; }
    if (years < 0) return null;

    if (years === 0 && months === 0) return 'Less than a month';
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    return parts.join(', ');
}
