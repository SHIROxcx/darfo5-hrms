import { Head } from '@inertiajs/react';
import { CheckCircle, Clock } from 'lucide-react';

export default function PendingApproval() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <Head title="Pending Approval" />
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">

                {/* Icons */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Email Verified!
                </h1>
                <p className="text-gray-500 mb-6 leading-relaxed">
                    Your email address has been successfully verified.
                    Your account is currently <span className="font-semibold text-yellow-600">pending approval</span> by
                    the HR Administrator.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 text-left mb-6">
                    <p className="font-semibold mb-1">What happens next?</p>
                    <ul className="space-y-1 list-disc list-inside text-yellow-700">
                        <li>The HR Admin will review your registration</li>
                        <li>You will receive an email once approved</li>
                        <li>You can then log in to your account</li>
                    </ul>
                </div>

                <a
                    href="/login"
                    className="text-sm text-blue-600 hover:underline"
                >
                    Back to Login
                </a>
            </div>
        </div>
    );
}