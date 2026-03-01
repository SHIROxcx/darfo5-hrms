import { Form, Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const { data, setData } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    return (
        // Full-screen layout with background image
        <div className="flex w-screen h-screen relative overflow-hidden">
            <Head title="Log in" />

            {/* ── Responsive Background Image ── */}
            <picture className="absolute inset-0 w-full h-full z-0">

                {/* Desktop */}
                <source media="(min-width: 1024px)" srcSet="/images/desktop-wallpaper.png" />

                {/* Tablet*/}
                <source media="(min-width: 640px)" srcSet="/images/tablet-wallpaper.png" />

                {/* Mobile (default) */}
                <img
                    src="/images/mobile-wallpaper.png"
                    alt=""
                    className="w-full h-full object-cover object-center"
                />
            </picture>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-700/60 to-orange-500/60 opacity-50" />

            {/* Left Side — Tagline (desktop only) */}
            <div className="hidden lg:flex flex-col justify-center w-1/2 px-16 relative z-10 text-white">
                <h3 className="text-2xl font-extralight leading-tight  drop-shadow-lg">
                    Masarig na Agrikultura, Mauswag na
                </h3>
                <h3 className="text-7xl font-semibold leading-tight tracking-wider drop-shadow-lg">
                    BICOLANDIA
                </h3>
            </div>

            {/* Right Side — Login Form */}
            <div className="flex justify-center items-center w-full lg:w-1/2 relative z-10 px-6 sm:px-8">
                <div className="w-full max-w-md backdrop-blur-sm bg-white border border-white/20 rounded-xl p-8 sm:p-10 shadow-2xl text-black/80">

                    {/* Logo */}
                    <div className="flex justify-center mb-2">
                        <img
                            src="/images/da-masarig-logo.png"
                            alt="DA RFO 5 Masarig Logo"
                            className="w-22 h-22 object-contain"
                        />
                    </div>

                    <h2 className="text-green-700 text-center text-3xl font-semibold mb-8">HRMS</h2>

                    {/* Session Status */}
                    {status && (
                        <div className="mb-4 text-center text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="space-y-5"
                    >
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
                                        autoComplete="username"
                                        placeholder="email@example.com"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={request()}
                                                className="text-xs text-black/50 hover:text-green-600 hover:underline"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                            placeholder="Password"
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(s => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword
                                                ? <EyeOff className="h-4 w-4" />
                                                : <Eye className="h-4 w-4" />
                                            }
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onCheckedChange={checked => setData('remember', checked === true)}
                                    />
                                    <Label htmlFor="remember" className="text-xs font-normal cursor-pointer select-none text-gray-500">
                                        Remember me
                                    </Label>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3 cursor-pointer bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processing && <Spinner />}
                                    Log in
                                </button>

                                {/* Register Link */}
                                {canRegister && (
                                    <p className="text-center text-sm text-gray-500">
                                        Don't have an account?{' '}
                                        <Link href={register()} className="text-green-600 hover:text-green-700 hover:underline font-medium">
                                            Register
                                        </Link>
                                    </p>
                                )}
                            </>
                        )}
                    </Form>

                    {/* Footer */}
                    <div className="text-xs text-black/40 text-center mt-8">
                        © Department of Agriculture RFO 5 - {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </div>
    );
}