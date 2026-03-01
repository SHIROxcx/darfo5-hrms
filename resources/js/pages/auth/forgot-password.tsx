import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <div className="min-h-screen flex relative justify-center items-center px-4">
        <Head title="Forgot Password" />

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

        {/* Overlay — same gradient as login page */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-700/60 to-orange-500/60 opacity-50 z-10" />

        {/* Card — must be z-20 to sit above overlay */}
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
                    Forgot Password
                </h2>

                <p className="text-sm text-gray-600 text-center mb-6">
                    Forgot your password? No problem. Just enter your email and we'll send a link to reset it.
                </p>

                {/* Session Status */}
                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600 text-center">
                        {status}
                    </div>
                )}

                <Form {...email.form()} className="space-y-5">
                    {({ processing, errors }) => (
                        <>
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    autoComplete="off"
                                    placeholder="email@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Email Password Reset Link
                            </button>
                        </>
                    )}
                </Form>

                {/* Back to login */}
                <div className="text-center text-sm text-gray-500 mt-5">
                    Or, return to{' '}
                    <Link href={login()} className="text-green-600 hover:text-green-700 hover:underline font-medium">
                        Log in
                    </Link>
                </div>

                {/* Footer */}
                <div className="text-xs text-black/40 text-center mt-10">
                    © Department of Agriculture RFO 5 - {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}