import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Check, LoaderCircle } from 'lucide-react';

export default function VerifyEmail() {
    const { auth } = usePage<{ auth: { user: { email: string; first_name: string } | null } }>().props;
    const email     = auth?.user?.email ?? '';
    const firstName = auth?.user?.first_name ?? '';

    const [otpDigits, setOtpDigits]           = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError]             = useState('');
    const [otpSuccess, setOtpSuccess]         = useState('');
    const [otpSending, setOtpSending]         = useState(false);
    const [otpVerifying, setOtpVerifying]     = useState(false);
    const [otpSent, setOtpSent]               = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending]           = useState(false);

    const otpRef0 = useRef<HTMLInputElement>(null);
    const otpRef1 = useRef<HTMLInputElement>(null);
    const otpRef2 = useRef<HTMLInputElement>(null);
    const otpRef3 = useRef<HTMLInputElement>(null);
    const otpRef4 = useRef<HTMLInputElement>(null);
    const otpRef5 = useRef<HTMLInputElement>(null);
    const otpRefs = [otpRef0, otpRef1, otpRef2, otpRef3, otpRef4, otpRef5];
    const hasSentRef = useRef(false);

    // Read XSRF token from cookie (Laravel sets this automatically)
    const getCsrf = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const startResendCooldown = () => {
        setResendCooldown(60);
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const sendOtp = async (emailAddr: string) => {
        if (!emailAddr) {
            setOtpError('Could not determine your email address. Please log out and register again.');
            return;
        }
        setOtpSending(true);
        setOtpError('');
        setOtpSuccess('');
        try {
            const res = await fetch('/otp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ email: emailAddr }), // always send email in body
            });

            const text = await res.text();
            let json: { message?: string };
            try { json = JSON.parse(text); }
            catch { setOtpError(`Unexpected server response (${res.status}).`); return; }

            if (!res.ok) { 

                // Parse seconds from rate limit message and start countdown
                 if (res.status === 429) {
                    const match = json.message?.match(/(\d+)\s*second/);
                    if (match) {
                        const seconds = parseInt(match[1]);
                        setResendCooldown(seconds);
                        const timer = setInterval(() => {
                            setResendCooldown(prev => {
                                if (prev <= 1) { clearInterval(timer); return 0; }
                                return prev - 1;
                            });
                        }, 1000);
                    }
                }
                setOtpError(json.message ?? 'Failed to send OTP.'); 
                return; 
            }

            setOtpSent(true);
            setResending(false);
            setOtpSuccess(`A 6-digit code was sent to ${emailAddr}`);
            startResendCooldown();
            setTimeout(() => otpRef0.current?.focus(), 100);
        } catch {
            setOtpError('Failed to send code. Please check your connection.');
        } finally {
            setOtpSending(false);
            setResending(false);
        }
    };

    const verifyOtp = async () => {
        const code = otpDigits.join('');
        if (code.length < 6) { setOtpError('Please enter all 6 digits.'); return; }
        if (!email) { setOtpError('Session error. Please log out and try again.'); return; }

        setOtpVerifying(true);
        setOtpError('');
        try {
            const res = await fetch('/otp/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ email: email, otp: code }),  // send otp code
            });

            const text = await res.text();
            let json: { message?: string };
            try { json = JSON.parse(text); }
            catch { setOtpError(`Unexpected server response (${res.status}).`); return; }

            if (!res.ok) { setOtpError(json.message ?? 'Verification failed.'); return; }

            window.location.href = '/pending-approval';
        } catch {
            setOtpError('Verification failed. Please check your connection.');
        } finally {
            setOtpVerifying(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        setOtpError('');
        if (value && index < 5) otpRefs[index + 1].current?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtpDigits(pasted.split(''));
            otpRef5.current?.focus();
        }
    };

    // Auto-send OTP once email is available
    useEffect(() => {
        if (email && !hasSentRef.current) {
            hasSentRef.current = true;
            sendOtp(email);
        }
    }, [email]);

    return (
        <div className="min-h-screen flex relative justify-center items-center px-4">
            <Head title="Verify Your Email" />

            {/* Background */}
            <picture className="absolute inset-0 w-full h-full z-0">
                <source media="(min-width: 1024px)" srcSet="/images/desktop-wallpaper.png" />
                <source media="(min-width: 640px)"  srcSet="/images/tablet-wallpaper.png" />
                <img src="/images/mobile-wallpaper.png" alt="" className="w-full h-full object-cover object-center" />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-700/60 to-orange-500/60 opacity-50 z-10" />

            {/* Card */}
            <div className="relative z-20 w-full max-w-md bg-white border border-gray-200 rounded-md p-8 sm:p-10 shadow-2xl">

                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <img src="/images/da-masarig-logo.png" alt="DA Logo" className="w-20 h-20 object-contain" />
                </div>

                <h2 className="text-green-700 text-center text-2xl font-bold mb-2">
                    Verify Your Email
                </h2>

                <p className="text-sm text-gray-500 text-center mb-1">
                    {!otpSent
                        ? <>Sending verification code to <strong className="text-gray-700">{email || '...'}</strong>...</>
                        : <>Enter the 6-digit code sent to <strong className="text-gray-700">{email}</strong></>
                    }
                </p>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-3 my-7" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, i) => (
                        <input
                            key={i}
                            ref={otpRefs[i]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            disabled={otpSending && !otpSent}
                            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-40
                                ${otpError ? 'border-red-400 bg-red-50'     :
                                  digit     ? 'border-green-500 bg-green-50' :
                                              'border-gray-300 bg-white'}`}
                        />
                    ))}
                </div>

                {/* Error */}
                {otpError && (
                    <p className="text-sm text-red-500 text-center mb-4">{otpError}</p>
                )}

                {/* Verify button */}
                <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otpVerifying || (otpSending && !otpSent) || otpDigits.join('').length < 6}
                    className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                    {otpVerifying
                        ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Verifying...</>
                        : <><Check className="h-4 w-4" /> Verify Email</>
                    }
                </button>

                {/* Resend */}
                <p className="text-sm text-gray-500 text-center mt-4">
                    Didn't receive the code?{' '}
                    {resendCooldown > 0
                        ? <span className="text-gray-400">Resend in {resendCooldown}s</span>
                        : (
                            <button
                                type="button"
                                onClick={() => { 
                                    setOtpDigits(['', '', '', '', '', '']); 
                                    sendOtp(email); 
                                    setResending(true);
                                    setOtpSent(false);
                                    sendOtp(email);
                                }}
                                disabled={otpSending}
                                className="text-green-600 hover:underline font-medium disabled:opacity-50 cursor-pointer"
                            >
                                {otpSending ? 'Sending...' : 'Resend code'}
                            </button>
                        )
                    }
                </p>

                {/* Log out */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Wrong account?{' '}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="text-green-600 hover:underline font-medium cursor-pointer"
                    >
                        Log out
                    </Link>
                </p>

                <div className="text-xs text-black/40 text-center mt-8">
                    © Department of Agriculture RFO 5 — {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}