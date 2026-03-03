import { Head, Link, useForm } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import { Eye, EyeOff, Check, ChevronRight, ChevronLeft } from 'lucide-react';

// Types
interface FormData {
    first_name: string;
    middle_name: string;
    last_name: string;
    name_ext: string;
    agency: string;
    division_unit: string;
    section: string;
    position: string;
    employment_type: string;
    email: string;
    mobile_number: string;
    password: string;
    password_confirmation: string;
}

// Step Indicator
const STEPS = ['Terms & Conditions', 'Account Information', 'Review & Submit'];

function StepBar({ current }: { current: number }) {
    return (
        <div className="flex text-sm font-medium">
            {STEPS.map((label, i) => {
                const stepNum = i + 1;
                const isActive   = current === stepNum;
                const isComplete = current > stepNum;

                return (
                    <div
                        key={label}
                        className={`flex-1 flex items-center gap-2 px-4 py-5 transition-colors duration-300
                            ${isActive   ? 'bg-green-600 text-white' : ''}
                            ${isComplete ? 'bg-green-100 text-green-700' : ''}
                            ${!isActive && !isComplete ? 'bg-gray-100 text-gray-400' : ''}
                        `}
                    >
                        {/* Circle / Check */}
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 border
                            ${isActive   ? 'bg-green-700 border-green-700 text-white' : ''}
                            ${isComplete ? 'bg-green-600 border-green-600 text-white' : ''}
                            ${!isActive && !isComplete ? 'border-gray-400 text-gray-400' : ''}
                        `}>
                            {isComplete ? <Check className="h-3 w-3" /> : stepNum}
                        </span>
                        <span className="hidden sm:inline truncate">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

// Password Input
interface PasswordInputProps {
    id: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    label: string;
    required?: boolean;
}

function PasswordInput({ id, value, onChange, placeholder, error, label, required }: PasswordInputProps) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                        ${error ? 'border-red-400' : 'border-gray-300'}`}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

// Field
interface FieldProps {
    label: string;
    required?: boolean;
    optional?: boolean;
    error?: string;
    children: React.ReactNode;
}

function Field({ label, required, optional, error, children }: FieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
                {optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    error,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                ${error ? 'border-red-400' : 'border-gray-300'}`}
        />
    );
}

// Review Row
function ReviewRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <div className="flex flex-col sm:flex-row sm:gap-4 py-2.5 border-b border-gray-100 last:border-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 sm:w-44 shrink-0">{label}</span>
            <span className="text-sm text-gray-800">{value || '—'}</span>
        </div>
    );
}

// Division data
interface DivisionData {
    id: number;
    name: string;
    sections: { id: number; name: string }[];
}

// Main Register Page
export default function Register() {
    const [step, setStep] = useState(1);
    const [passwordMismatch, setPasswordMismatch] = useState('');
    const [divisions, setDivisions] = useState<DivisionData[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [positions, setPositions] = useState<{ id: number; title: string; salary_grade: number }[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        first_name: '',
        middle_name: '',
        last_name: '',
        name_ext: '',
        agency: 'Department of Agriculture Regional Field Office 5',
        division_unit: '',
        section: '',
        position: '',
        employment_type: '',
        email: '',
        mobile_number: '',
        password: '',
        password_confirmation: '',
    });

    // Jump back to step 2 if server returns validation errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [errors]);

    // Fetch divisions on mount
    useEffect(() => {
        fetch('/divisions')
            .then(r => r.json())
            .then(setDivisions)
            .catch(console.error);
    }, []);

    // Update sections when division changes
    useEffect(() => {
        if (!data.division_unit) {
            setSections([]);
            setData('section', '');
            return;
        }
        const found = divisions.find(d => d.name === data.division_unit);
        setSections(found?.sections ?? []);
        // setData('section', '');
    }, [data.division_unit, divisions]);

    // Fetch positions on mount
    useEffect(() => {
        fetch('/positions').then(r => r.json()).then(setPositions).catch(console.error);
    }, []);

    const validateStep2 = (): boolean => {
        if (
            !data.first_name ||
            !data.last_name  ||
            !data.division_unit ||
            !data.section    ||
            !data.position   ||
            !data.employment_type ||
            !data.email      ||
            !data.mobile_number  ||
            !data.password   ||
            !data.password_confirmation
        ) {
            return false;
        }
        if (data.password !== data.password_confirmation) {
            setPasswordMismatch('Passwords do not match.');
            return false;
        }
        if (data.password.length < 8) {
            setPasswordMismatch('Password must be at least 8 characters.');
            return false;
        }
        setPasswordMismatch('');
        return true;
    };

    const goTo = (next: number) => {
        if (step === 2 && next === 3) {
            if (!validateStep2()) return;
        }
        setStep(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const fullName = [data.first_name, data.middle_name, data.last_name, data.name_ext]
        .filter(Boolean).join(' ');

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 px-2 sm:px-4 pb-20 pt-8">
            <Head title="Register" />

            {/* Page Title */}
            <div className="flex items-center justify-between w-full max-w-4xl mb-6">
                <div className='flex items-center justify-center gap-2'>
                    <img
                        src="/images/da-masarig-logo.png"
                        alt="DA RFO 5 Logo"
                        className="h-14 w-14 object-contain"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-green-700">DA RFO 5 — HRMS</h1>
                        <p className="text-sm text-gray-500">Employee Registration Portal</p>
                    </div>
                </div>
                <p className="hidden sm:flex mr-2 text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-green-600 hover:underline font-medium cursor-pointer">Log in</Link>
                </p>
            </div>

            <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">

                {/* Step Bar */}
                <StepBar current={step} />

                {/* ── Step 1: Terms ── */}
                {step === 1 && (
                    <div>
                        <div className="px-6 sm:px-16 py-10">
                            <h2 className="text-lg font-bold text-center text-gray-800 mb-6">
                                HRMS Terms and Conditions
                            </h2>
                            <div className="p-6 text-sm text-gray-700 leading-relaxed text-justify">
                                <p className="mb-4">
                                    By signing in for my user account at the <strong>DA RFO 5 HRMS</strong>, I hereby acknowledge
                                    that I have read and understood the Data Privacy Notice. I agree to provide my personal data at
                                    the Electronic Personal Data Sheet (e-PDS), pursuant to <strong>CSC Resolution No. 2500358</strong> promulgated on April 30, 2025.
                                </p>
                                <p>
                                    I knowingly and voluntarily give my consent to DA Human Resource Management Section to collect, use, dispose,
                                    and process my personal information provided in the e-PDS for legitimate purposes stipulated
                                    at the Data Privacy Notice.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 bg-gray-50 border-t px-6 py-4">
                            <button
                                disabled
                                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-gray-200 text-gray-400 text-sm cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button
                                onClick={() => goTo(2)}
                                className="flex items-center gap-1 px-6 py-2 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition"
                            >
                                I Agree<ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Account Info ── */}
                {step === 2 && (
                    <div>
                        <div className="px-6 sm:px-12 py-8">
                            <h2 className="text-base font-bold text-gray-800 uppercase mb-8 text-center tracking-wide">
                                Employee Information
                            </h2>

                            <form id="registerForm" onSubmit={submit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                                    {/* Name Row */}
                                    <Field label="First Name" required error={errors.first_name}>
                                        <TextInput
                                            value={data.first_name}
                                            onChange={v => setData('first_name', v)}
                                            placeholder="Juan"
                                            error={errors.first_name}
                                        />
                                    </Field>

                                    <Field label="Middle Name">
                                        <TextInput
                                            value={data.middle_name}
                                            onChange={v => setData('middle_name', v)}
                                            placeholder="Santos"
                                        />
                                    </Field>

                                    <Field label="Last Name" required error={errors.last_name}>
                                        <TextInput
                                            value={data.last_name}
                                            onChange={v => setData('last_name', v)}
                                            placeholder="Dela Cruz"
                                            error={errors.last_name}
                                        />
                                    </Field>

                                    <Field label="Name Extension">
                                        <select
                                            value={data.name_ext}
                                            onChange={e => setData('name_ext', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                        >
                                            <option value="">None</option>
                                            <option value={'Jr.'}>Jr.</option>
                                            <option value={'Sr.'}>Sr.</option>
                                            <option value={'I'}>I</option>
                                            <option value={'II'}>II</option>
                                            <option value={'III'}>III</option>
                                            <option value={'IV'}>IV</option>
                                            <option value={'V'}>V</option>
                                        </select>
                                    </Field>

                                </div>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 mt-5">

                                    <Field label="Agency" required>
                                        <select
                                            value={data.agency}
                                            onChange={e => setData('agency', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                        >
                                            <option value="Department of Agriculture Regional Field Office 5">Department of Agriculture Regional Field Office 5</option>
                                        </select>
                                    </Field>

                                    <Field label="Division / Unit" required error={errors.division_unit}>
                                        <select
                                            value={data.division_unit}
                                            onChange={e => setData('division_unit', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                        >
                                            <option value="" disabled>Select Division / Unit</option>
                                            {divisions.map(d => (
                                                <option key={d.id} value={d.name}>{d.name}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Section" required error={errors.section}>
                                        <select
                                            value={data.section}
                                            onChange={e => setData('section', e.target.value)}
                                            disabled={!data.division_unit} 
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                                                ${!data.division_unit ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                                        >
                                            <option value="" disabled>
                                                {!data.division_unit ? 'Select a division first' : 'Select Section'}
                                            </option>
                                            {sections.length === 0 && data.division_unit && (
                                                <option value="N/A">N/A</option>
                                            )}
                                            {sections.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-5">

                                    <Field label="Position" required>
                                        <select
                                            value={data.position}
                                            onChange={e => setData('position', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                        >
                                            <option value="" disabled>Select Position</option>
                                            {positions.map(p => (
                                                <option key={p.id} value={p.title}>
                                                    {p.title} (SG {p.salary_grade})
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Employment Type" required>
                                        <select
                                            value={data.employment_type}
                                            onChange={e => setData('employment_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                        >
                                            <option value="" disabled>Select Employment</option>
                                            <option value="JO">Job Order</option>
                                            <option value="COS">Contract of Service</option>
                                            <option value="Permanent">Permanent</option>
                                        </select>
                                    </Field>

                                    {/* Contact */}
                                    <Field label="Email Address" required error={errors.email}>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="email@example.com"
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                                                ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                    </Field>

                                    <Field label="Mobile Number" required error={errors.mobile_number}>
                                        <input
                                            type="text"
                                            value={data.mobile_number}
                                            onChange={e => setData('mobile_number', e.target.value)}
                                            placeholder="09XXXXXXXXX"
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                                                ${errors.mobile_number ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                    </Field>

                                    {/* Password */}
                                    <PasswordInput
                                        id="password"
                                        label="Password"
                                        required
                                        value={data.password}
                                        onChange={v => {
                                            setData('password', v);
                                            setPasswordMismatch('');
                                        }}
                                        placeholder="Minimum 8 characters"
                                        error={errors.password}
                                    />

                                    <PasswordInput
                                        id="password_confirmation"
                                        label="Confirm Password"
                                        required
                                        value={data.password_confirmation}
                                        onChange={v => {
                                            setData('password_confirmation', v);
                                            setPasswordMismatch('');
                                        }}
                                        placeholder="Re-enter password"
                                        error={passwordMismatch || errors.password_confirmation}
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="flex justify-end gap-2 bg-gray-50 border-t px-6 py-4">
                            <button
                                type="button"
                                onClick={() => goTo(1)}
                                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-700 text-sm transition"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => goTo(3)}
                                className="flex items-center gap-1 px-6 py-2 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition"
                            >
                                Review <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Review ── */}
                {step === 3 && (
                    <div>
                        <div className="px-6 sm:px-12 py-8">
                            <h2 className="text-base font-bold text-gray-800 uppercase mb-2 text-center tracking-wide">
                                Review Your Information
                            </h2>
                            <p className="text-sm text-gray-500 text-center mb-8">
                                Please review your details carefully before submitting. Click <strong>Previous</strong> to make changes.
                            </p>

                            <div className="max-w-2xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-4">
                                    Personal Information
                                </h3>
                                <ReviewRow label="Full Name"       value={fullName} />
                                <ReviewRow label="First Name"      value={data.first_name} />
                                <ReviewRow label="Middle Name"     value={data.middle_name} />
                                <ReviewRow label="Last Name"       value={data.last_name} />
                                <ReviewRow label="Name Ext."       value={data.name_ext} />

                                <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mt-6 mb-4">
                                    Employment Details
                                </h3>
                                <ReviewRow label="Agency"          value={data.agency} />
                                <ReviewRow label="Division / Unit" value={data.division_unit} />
                                <ReviewRow label="Section"         value={data.section} />
                                <ReviewRow label="Position"        value={data.position} />
                                <ReviewRow label="Employment Type" value={data.employment_type} />

                                <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mt-6 mb-4">
                                    Contact Details
                                </h3>
                                <ReviewRow label="Email"           value={data.email} />
                                <ReviewRow label="Mobile Number"   value={data.mobile_number} />

                                <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mt-6 mb-4">
                                    Security
                                </h3>
                                <ReviewRow label="Password"        value="••••••••" />
                            </div>

                            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl px-5 py-4 text-xs text-green-700 text-center">
                                After submitting, you will receive a <strong>verification email</strong>. Once verified, an HR Administrator will review and approve your account before you can log in.
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 bg-gray-50 border-t px-6 py-4">
                            <button
                                type="button"
                                onClick={() => goTo(2)}
                                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm transition"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={submit}
                                className="flex items-center gap-1 px-6 py-2 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition disabled:opacity-50"
                            >
                                <Check className="h-4 w-4" />
                                {processing ? 'Submitting...' : 'Submit Registration'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
        
        </div>
    );
}