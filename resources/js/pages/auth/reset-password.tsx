import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="min-h-screen flex relative justify-center items-center px-4">
            <Head title="Reset Password" />

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
                    Reset Password
                </h2>

                <p className="text-sm text-gray-600 text-center mb-6">
                    Please enter your new password below to regain access to your account.
                </p>

                <Form
                    {...update.form()}
                    transform={(data) => ({ ...data, token, email })}
                    resetOnSuccess={['password', 'password_confirmation']}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Email (read-only) */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        autoComplete="new-password"
                                        autoFocus
                                        placeholder="Enter new password"
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                                        tabIndex={-1}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                data-test="reset-password-button"
                                className="w-full py-3 cursor-pointer bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Reset Password
                            </button>
                        </>
                    )}
                </Form>

                {/* Footer */}
                <div className="text-xs text-black/40 text-center mt-10">
                    © Department of Agriculture RFO 5 - {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}