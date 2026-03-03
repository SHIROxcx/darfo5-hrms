import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle, MailCheck } from 'lucide-react';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <div className="min-h-screen flex relative justify-center items-center px-4">
            <Head title="Email Verification" />

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

            {/* Overlay — same gradient as login/forgot-password page */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-700/60 to-orange-500/60 opacity-50 z-10" />

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
                    Verify Your Email
                </h2>

                <p className="text-sm text-gray-600 text-center mb-6">
                    Please verify your email address by clicking on the link we just emailed to you. Didn't receive it? You can request a new one below.
                </p>

                {/* Session Status */}
                {status === 'verification-link-sent' && (
                    <div className="mb-4 text-sm font-medium text-green-600 text-center bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        A new verification link has been sent to the email address you provided during registration.
                    </div>
                )}

                <Form {...send.form()} className="space-y-5">
                    {({ processing }) => (
                        <>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 cursor-pointer bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Resend Verification Email
                            </button>
                        </>
                    )}
                </Form>

                {/* Log out */}
                <div className="text-center text-sm text-gray-500 mt-5">
                    Want to use a different account?{' '}
                    <Link href={logout()} className="text-green-600 hover:text-green-700 hover:underline font-medium">
                        Log out
                    </Link>
                </div>

                {/* Footer */}
                <div className="text-xs text-black/40 text-center mt-16">
                    © Department of Agriculture RFO 5 - {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}