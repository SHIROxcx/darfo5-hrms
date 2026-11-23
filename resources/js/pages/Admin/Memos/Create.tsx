import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { create, index } from '@/routes/admin/memos';
import type { BreadcrumbItem } from '@/types';
import type { PickableSignatory } from '@/types/memo';
import MemoForm from './MemoForm';

interface Props {
    types: string[];
    signatories: PickableSignatory[];
    defaults: { addressed_to: string; memo_date: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Memos', href: index().url },
    { title: 'New Memo', href: create().url },
];

export default function CreateMemo({ types, signatories, defaults }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Memo" />

            <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">New Memo</h1>
                    <p className="mt-1 text-sm text-gray-500">Write the memo here or upload a ready-made file. It stays a draft until you publish it.</p>
                </div>

                <MemoForm types={types} signatories={signatories} defaults={defaults} />
            </div>
        </AppLayout>
    );
}
