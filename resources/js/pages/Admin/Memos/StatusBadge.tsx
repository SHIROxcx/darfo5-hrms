import type { MemoStatus } from '@/types/memo';

const STYLES: Record<MemoStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    withdrawn: 'bg-orange-100 text-orange-700',
};

const LABELS: Record<MemoStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    withdrawn: 'Withdrawn',
};

export default function StatusBadge({ status }: { status: MemoStatus }) {
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES[status]}`}>{LABELS[status]}</span>;
}
