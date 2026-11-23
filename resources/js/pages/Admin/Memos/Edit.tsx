import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { edit, index } from '@/routes/admin/memos';
import type { BreadcrumbItem } from '@/types';
import type { MemoFormData, PickableSignatory } from '@/types/memo';
import MemoForm from './MemoForm';

interface Props {
    memo: MemoFormData;
    types: string[];
    signatories: PickableSignatory[];
}

export default function EditMemo({ memo, types, signatories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Memos', href: index().url },
        { title: 'Edit Draft', href: edit(memo.id).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Draft" />

            <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Draft</h1>
                    <p className="mt-1 truncate text-sm text-gray-500">{memo.subject}</p>
                </div>

                <MemoForm memo={memo} types={types} signatories={signatories} />
            </div>
        </AppLayout>
    );
}
