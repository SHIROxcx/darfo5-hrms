import AppLayout from "@/layouts/app-layout";
import { Head } from '@inertiajs/react';
 
interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
}
 
export default function AdminDashboard({ user }: Props) {
    return (
        <AppLayout>
            <Head title="HR Admin Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-blue-600 mb-2">
                            HR Staff Panel
                        </h3>
                        <p>Welcome, {user.name}! Manage employees and HR tasks here.</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
