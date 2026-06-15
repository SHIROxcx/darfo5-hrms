import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Clock } from 'lucide-react';
import { login } from '@/routes';

export default function PendingApproval() {
    return (
        <div className="min-h-screen flex relative justify-center items-center px-4">
            <Head title="Pending Approval" />

            {/* ── Responsive Background Image ── */}
            <picture className="absolute inset-0 w-full h-full z-0">
                <source media="(min-width: 1024px)" srcSet="/images/desktop-wallpaper.png" />
                <source media="(min-width: 640px)"  srcSet="/images/tablet-wallpaper.png" />
                <img
                    src="/images/mobile-wallpaper.png"
                    alt=""
                    className="w-full h-full object-cover object-center"
                />
            </picture>

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-r from-green-900/80 via-green-700/60 to-green-500/50 opacity-50" />

            {/* Card */}
            <div className="relative z-20 w-full max-w-md bg-white border border-gray-200 rounded-md p-8 sm:p-10 shadow-2xl text-black/80">

                {/* Logo */}
                <div className="flex justify-center mb-2">
                    <img
                        src="/images/da-masarig-logo.png"
                        alt="DA Logo"
                        className="w-22 h-22 object-contain"
                    />
                </div>

                <h2 className="text-green-700 text-center text-3xl font-semibold mb-3">
                    Email Verified
                </h2>

                <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                    Your email address has been successfully verified. Your account is currently{' '}
                    <span className="font-semibold text-green-600">pending approval</span>{' '}
                    by the HR Administrator.
                </p>

                {/* What happens next */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-left mb-6">
                    <p className="font-semibold text-green-800 mb-2">What happens next?</p>
                    <ul className="space-y-1 list-disc list-inside text-green-700">
                        <li>The HR Admin will review your registration</li>
                        <li>You will receive an email once approved</li>
                        <li>You can then log in to your account</li>
                    </ul>
                </div>

                {/* Back to login */}
                <div className="text-center text-sm text-gray-500">
                    Back to {' '}
                    <Link href={login()} className="text-green-600 hover:text-green-700 hover:underline font-medium">
                        Log in
                    </Link>
                </div>

                {/* Footer */}
                <div className="text-xs text-black/40 text-center mt-10">
                    © DARFO 5 - ICT UNIT {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}