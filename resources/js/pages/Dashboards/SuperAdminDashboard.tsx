import AppLayout from "@/layouts/app-layout";
import { Head } from '@inertiajs/react';
 
interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
}
 
export default function SuperAdminDashboard({ user }: Props) {
    return (
        <AppLayout>
            <Head title="Super Admin Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-bold text-red-600 mb-2">
                                Super Admin Panel
                            </h3>
                            <p>Welcome, {user.name}! You have full system access.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
