import { Head, Link, useForm } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect, useRef } from 'react';
import { Eye, EyeOff, Check, ChevronRight, ChevronLeft, TriangleAlert } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

// Types
interface FormData {
    first_name: string;
    middle_name: string;
    last_name: string;
    name_ext: string;
    agency: string;
    division: string;
    section_unit: string;
    position: string;
    salary_grade: number;
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
                const stepNum    = i + 1;
                const isActive   = current === stepNum;
                const isComplete = current > stepNum;
                return (
                    <div key={label}
                        className={`
                            flex-1 flex items-center gap-2 px-4 py-6 transition-colors duration-300
                            ${!isActive && !isComplete ? 'hidden md:flex' : ''}
                            ${isComplete ? 'hidden md:flex' : ''}
                            ${isActive   ? 'bg-green-600 text-white' : ''}
                            ${isComplete ? 'bg-green-100 text-green-700' : ''}
                            ${!isActive && !isComplete ? 'bg-gray-100 text-gray-400' : ''}
                        `}>
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 border
                            ${isActive   ? 'bg-green-700 border-green-700 text-white' : ''}
                            ${isComplete ? 'bg-green-600 border-green-600 text-white' : ''}
                            ${!isActive && !isComplete ? 'border-gray-400 text-gray-400' : ''}
                        `}>
                            {isComplete ? <Check className="h-3 w-3" /> : stepNum}
                        </span>
                        <span className="truncate">{label}</span>
                        <span className="ml-auto text-xs opacity-70 md:hidden whitespace-nowrap">
                            Step {stepNum} of {STEPS.length}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// Password Input
interface PasswordInputProps {
    id: string; value: string; onChange: (v: string) => void;
    placeholder?: string; error?: string; label: string; required?: boolean;
}
function PasswordInput({ id, value, onChange, placeholder, error, label, required }: PasswordInputProps) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input id={id} type={show ? 'text' : 'password'} value={value}
                    onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                        ${error ? 'border-red-400' : 'border-gray-300'}`} />
                <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

// Password strength
function getPasswordStrength(password: string): { level: 'low' | 'medium' | 'high'; color: string; bars: number } {
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { level: 'low',    color: 'bg-red-500',    bars: 1 };
    if (score <= 4) return { level: 'medium', color: 'bg-yellow-400', bars: 2 };
    return               { level: 'high',   color: 'bg-green-500',  bars: 3 };
}

// Field
function Field({ label, required, optional, error, children }: {
    label: string; required?: boolean; optional?: boolean; error?: string; children: React.ReactNode;
}) {
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

function TextInput({ value, onChange, placeholder, error }: {
    value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
    return (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                ${error ? 'border-red-400' : 'border-gray-300'}`} />
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

// Spinner
function Spin() {
    return (
        <svg className="h-4 w-4 animate-spin text-green-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

// Types
interface DivisionData {
    id: number;
    name: string;
    sections: { id: number; name: string }[];
}

//  Main Register Page
export default function Register() {
    const [step, setStep] = useState(1);
    const [passwordMismatch, setPasswordMismatch] = useState('');
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [hasAttemptedNext, setHasAttemptedNext] = useState(false);

    // Data
    const [divisions,   setDivisions]   = useState<DivisionData[]>([]);
    const [positions,   setPositions]   = useState<{ id: number; title: string; salary_grade: number }[]>([]);
    const [loadingDivs, setLoadingDivs] = useState(true);
    const [loadingPos,  setLoadingPos]  = useState(true);

    // Division
    const [divSearch, setDivSearch] = useState('');
    const [divOpen,   setDivOpen]   = useState(false);
    const [divStyle,  setDivStyle]  = useState<React.CSSProperties>({});
    const divRef = useRef<HTMLInputElement>(null);

    // Section
    const [secSearch, setSecSearch] = useState('');
    const [secOpen,   setSecOpen]   = useState(false);
    const [secStyle,  setSecStyle]  = useState<React.CSSProperties>({});
    const secRef = useRef<HTMLInputElement>(null);

    // Position
    const [posSearch, setPosSearch] = useState('');
    const [posOpen,   setPosOpen]   = useState(false);
    const [posStyle,  setPosStyle]  = useState<React.CSSProperties>({});
    const posRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        first_name: '', middle_name: '', last_name: '', name_ext: '',
        agency: 'Department of Agriculture Regional Field Office 5',
        division: '', section_unit: '', position: '', salary_grade: 0,
        employment_type: '', email: '', mobile_number: '',
        password: '', password_confirmation: '',
    });

    // Jump back to step 2 on server errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [errors]);

    // Fetch divisions & positions on mount
    useEffect(() => {
        fetch('/divisions')
            .then(r => r.json())
            .then(d => { setDivisions(d); setLoadingDivs(false); })
            .catch(() => setLoadingDivs(false));
        fetch('/positions')
            .then(r => r.json())
            .then(p => { setPositions(p); setLoadingPos(false); })
            .catch(() => setLoadingPos(false));
    }, []);

    // Derived: sections for the selected division
    const currentSections = divisions.find(d => d.name === data.division)?.sections ?? [];

    // Filtered lists
    const filteredDivisions = divSearch.length < 1
        ? divisions
        : divisions.filter(d => d.name.toLowerCase().includes(divSearch.toLowerCase()));

    const filteredSections = secSearch.length < 1
        ? currentSections
        : currentSections.filter(s => s.name.toLowerCase().includes(secSearch.toLowerCase()));

    const filteredPositions = posSearch.length < 1
        ? positions
        : positions.filter(p => p.title.toLowerCase().includes(posSearch.toLowerCase()));

    // Open helpers (fixed positioning)
    function openDiv() {
        if (divRef.current) {
            const r = divRef.current.getBoundingClientRect();
            setDivStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
        }
        setDivOpen(true);
    }
    function openSec() {
        if (secRef.current) {
            const r = secRef.current.getBoundingClientRect();
            setSecStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
        }
        setSecOpen(true);
    }
    function openPos() {
        if (posRef.current) {
            const r = posRef.current.getBoundingClientRect();
            setPosStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
        }
        setPosOpen(true);
    }

    // Select helpers
    function selectDivision(d: DivisionData) {
        setData('division', d.name);
        setData('section_unit', '');
        setDivSearch(d.name);
        setSecSearch('');
        setDivOpen(false);
        clearError('division');
    }
    function selectSection(s: { id: number; name: string }) {
        setData('section_unit', s.name);
        setSecSearch(s.name);
        setSecOpen(false);
        clearError('section_unit');
    }
    function selectPosition(p: { title: string; salary_grade: number }) {
        setData('position', p.title);
        setData('salary_grade', p.salary_grade);
        setPosSearch(p.title);
        setPosOpen(false);
        clearError('position');
    }

    const validateStep2 = (): boolean => {
        setHasAttemptedNext(true);
        const e: Partial<Record<keyof FormData, string>> = {};
        if (!data.first_name)      e.first_name      = 'First name is required.';
        if (!data.last_name)       e.last_name       = 'Last name is required.';
        if (!data.division)        e.division        = 'Division is required.';
        if (!data.section_unit)    e.section_unit    = 'Section / Unit is required.';
        if (!data.position)        e.position        = 'Position is required.';
        if (!data.employment_type) e.employment_type = 'Employment type is required.';
        if (!data.email)           e.email           = 'Email address is required.';
        if (!data.mobile_number)   e.mobile_number   = 'Mobile number is required.';
        if (!data.password)        e.password        = 'Password is required.';
        else if (data.password.length < 8)
            e.password = 'Password must be at least 8 characters.';
        else if (getPasswordStrength(data.password).level === 'low')
            e.password = 'Password is too weak. Add uppercase letters, numbers, or symbols.';
        if (!data.password_confirmation)
            e.password_confirmation = 'Please confirm your password.';
        else if (data.password !== data.password_confirmation)
            e.password_confirmation = 'Passwords do not match.';
        setFormErrors(e);
        if (Object.keys(e).length > 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); return false; }
        setPasswordMismatch('');
        return true;
    };

    const clearError = (field: keyof FormData) =>
        setFormErrors(prev => ({ ...prev, [field]: undefined }));

    const goTo = (next: number) => {
        if (step === 2 && next === 3 && !validateStep2()) return;
        setStep(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/register', { onFinish: () => reset('password', 'password_confirmation') });
    };

    const fullName = [data.first_name, data.middle_name, data.last_name, data.name_ext]
        .filter(Boolean).join(' ');

    const inputCls = (hasError?: string) =>
        `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white
        ${hasError ? 'border-red-400' : 'border-gray-300'}`;

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 px-2 sm:px-4 pb-20 pt-8">
            <Head title="Register" />

            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-4xl mb-6">
                <div className="flex items-center gap-2">
                    <img src="/images/da-masarig-logo.png" alt="DA RFO 5 Logo" className="h-14 w-14 object-contain" />
                    <div>
                        <h1 className="text-xl font-bold text-green-700">DA RFO 5 — HRMS</h1>
                        <p className="text-sm text-gray-500">Employee Registration Portal</p>
                    </div>
                </div>
                <p className="hidden sm:flex mr-2 text-sm text-gray-500">
                    <span className="mr-1">Already have an account?</span>
                    <Link href="/login" className="text-green-600 hover:underline font-medium cursor-pointer">Log in</Link>
                </p>
            </div>

            <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <StepBar current={step} />

                {/* ── Step 1: Terms ── */}
                {step === 1 && (
                    <div>
                        <div className="px-6 sm:px-16 py-10">
                            <h2 className="text-lg font-bold text-center text-gray-800 mb-6">HRMS Terms and Conditions</h2>
                            <div className="p-6 text-sm text-gray-700 leading-relaxed text-justify">
                                <p className="mb-4">
                                    By signing in for my user account at the <strong>DA RFO 5 HRMS</strong>, I hereby acknowledge
                                    that I have read and understood the Data Privacy Notice. I agree to provide my personal data at
                                    the Electronic Personal Data Sheet (e-PDS), pursuant to <strong>CSC Resolution No. 2500358</strong> promulgated on April 30, 2025.
                                </p>
                                <p>
                                    I knowingly and voluntarily give my consent to DA Human Resource Management Section to collect, use, dispose,
                                    and process my personal information provided in the e-PDS for legitimate purposes stipulated at the Data Privacy Notice.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 bg-gray-50 border-t px-6 py-4">
                            <button disabled className="flex items-center gap-1 px-5 py-2 rounded-lg bg-gray-200 text-gray-400 text-sm cursor-not-allowed">
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button onClick={() => goTo(2)}
                                className="flex items-center gap-1 px-6 py-2 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition">
                                I Agree <ChevronRight className="h-4 w-4" />
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

                            {hasAttemptedNext && Object.keys(formErrors).length > 0 && (
                                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                                    <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>Please fill in all required fields!</span>
                                </div>
                            )}

                            <form id="registerForm" onSubmit={submit}>

                                {/* Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    <Field label="First Name" required error={formErrors.first_name}>
                                        <TextInput value={data.first_name}
                                            onChange={v => { setData('first_name', v); clearError('first_name'); }}
                                            placeholder="Enter your first name" error={formErrors.first_name} />
                                    </Field>
                                    <Field label="Middle Name">
                                        <TextInput value={data.middle_name}
                                            onChange={v => setData('middle_name', v)}
                                            placeholder="Enter your middle name" />
                                    </Field>
                                    <Field label="Last Name" required error={formErrors.last_name}>
                                        <TextInput value={data.last_name}
                                            onChange={v => { setData('last_name', v); clearError('last_name'); }}
                                            placeholder="Enter your last name" error={formErrors.last_name} />
                                    </Field>
                                    <Field label="Name Extension">
                                        <select value={data.name_ext} onChange={e => setData('name_ext', e.target.value)}
                                            className={inputCls()}>
                                            <option value="">None</option>
                                            {['Jr.','Sr.','I','II','III','IV','V'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                </div>

                                {/* Employment */}
                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 mt-5">

                                    {/* Agency */}
                                    <Field label="Agency" required>
                                        <select value={data.agency} onChange={e => setData('agency', e.target.value)}
                                            className={inputCls()}>
                                            <option value="Department of Agriculture Regional Field Office 5">
                                                Department of Agriculture Regional Field Office 5
                                            </option>
                                        </select>
                                    </Field>

                                    {/* Division — searchable */}
                                    <Field label="Division" required error={formErrors.division}>
                                        <div className="relative">
                                            {loadingDivs && (
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                    <Spin />
                                                </div>
                                            )}
                                            <input ref={divRef} value={divSearch} disabled={loadingDivs}
                                                onChange={e => {
                                                    setDivSearch(e.target.value);
                                                    setData('division', e.target.value);
                                                    setData('section_unit', '');
                                                    setSecSearch('');
                                                    openDiv();
                                                    clearError('division');
                                                }}
                                                onFocus={openDiv}
                                                placeholder={loadingDivs ? 'Loading divisions...' : 'Search division'}
                                                className={`${inputCls(formErrors.division)} ${loadingDivs ? 'text-gray-400' : ''}`}
                                                autoComplete="off" />
                                            {divOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setDivOpen(false)} />}
                                            {divOpen && filteredDivisions.length > 0 && (
                                                <ul style={divStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">
                                                    {filteredDivisions.map(d => (
                                                        <li key={d.id} onMouseDown={() => selectDivision(d)}
                                                            className="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50">
                                                            {d.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </Field>

                                    {/* Section*/}
                                    <Field label="Section / Unit" required error={formErrors.section_unit}>
                                        <div className="relative">
                                            {loadingDivs && (
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                    <Spin />
                                                </div>
                                            )}
                                            <input ref={secRef} value={secSearch}
                                                disabled={loadingDivs || !data.division}
                                                onChange={e => {
                                                    setSecSearch(e.target.value);
                                                    setData('section_unit', e.target.value);
                                                    openSec();
                                                    clearError('section_unit');
                                                }}
                                                onFocus={openSec}
                                                placeholder={
                                                    loadingDivs    ? 'Loading...' :
                                                    !data.division ? 'Select a division first' :
                                                    'Search section / unit...'
                                                }
                                                className={`${inputCls(formErrors.section_unit)} ${loadingDivs || !data.division ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                                                autoComplete="off" />
                                            {secOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setSecOpen(false)} />}
                                            {secOpen && filteredSections.length > 0 && (
                                                <ul style={secStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">
                                                    {filteredSections.map(s => (
                                                        <li key={s.id} onMouseDown={() => selectSection(s)}
                                                            className="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50">
                                                            {s.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </Field>
                                </div>

                                {/* Position, Employment, Contact, Password */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-5">

                                    {/* Position — searchable */}
                                    <Field label="Position" required error={formErrors.position}>
                                        <div className="relative">
                                            {loadingPos && (
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                    <Spin />
                                                </div>
                                            )}
                                            <input ref={posRef} value={posSearch} disabled={loadingPos}
                                                onChange={e => {
                                                    setPosSearch(e.target.value);
                                                    setData('position', e.target.value);
                                                    openPos();
                                                    clearError('position');
                                                }}
                                                onFocus={openPos}
                                                placeholder={loadingPos ? 'Loading positions...' : 'Search position'}
                                                className={`${inputCls(formErrors.position)} ${loadingPos ? 'text-gray-400' : ''}`}
                                                autoComplete="off" />
                                            {posOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setPosOpen(false)} />}
                                            {posOpen && filteredPositions.length > 0 && (
                                                <ul style={posStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">
                                                    {filteredPositions.map(p => (
                                                        <li key={p.id} onMouseDown={() => selectPosition(p)}
                                                            className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-green-50">
                                                            <span className="text-gray-800">{p.title}</span>
                                                            <span className="ml-3 shrink-0 text-xs text-gray-400">SG {p.salary_grade}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </Field>

                                    {/* Employment Type */}
                                    <Field label="Employment Type" required error={formErrors.employment_type}>
                                        <select value={data.employment_type}
                                            onChange={e => { setData('employment_type', e.target.value); clearError('employment_type'); }}
                                            className={inputCls(formErrors.employment_type)}>
                                            <option value="" disabled>Select Employment</option>
                                            <option value="JO">Job Order</option>
                                            <option value="COS">Contract of Service</option>
                                            <option value="Permanent">Permanent</option>
                                        </select>
                                    </Field>

                                    {/* Email */}
                                    <Field label="Email Address" required error={formErrors.email || errors.email}>
                                        <input type="email" value={data.email}
                                            onChange={e => { setData('email', e.target.value); clearError('email'); }}
                                            placeholder="email@example.com"
                                            className={inputCls(formErrors.email || errors.email)} />
                                    </Field>

                                    {/* Mobile */}
                                    <Field label="Mobile Number" required error={formErrors.mobile_number}>
                                        <input type="text" value={data.mobile_number}
                                            onChange={e => { setData('mobile_number', e.target.value); clearError('mobile_number'); }}
                                            placeholder="09XXXXXXXXX"
                                            className={inputCls(formErrors.mobile_number)} />
                                    </Field>

                                    {/* Password */}
                                    <PasswordInput id="password" label="Password" required value={data.password}
                                        onChange={v => { setData('password', v); clearError('password'); setPasswordMismatch(''); }}
                                        placeholder="Minimum 8 characters"
                                        error={formErrors.password || errors.password} />

                                    <PasswordInput id="password_confirmation" label="Confirm Password" required value={data.password_confirmation}
                                        onChange={v => { setData('password_confirmation', v); clearError('password_confirmation'); setPasswordMismatch(''); }}
                                        placeholder="Re-enter password"
                                        error={formErrors.password_confirmation || passwordMismatch || errors.password_confirmation} />

                                    {/* Password strength */}
                                    {data.password && (() => {
                                        const s = getPasswordStrength(data.password);
                                        return (
                                            <div className="mt-2 space-y-1.5">
                                                <div className="flex gap-1.5">
                                                    {[1,2,3].map(bar => (
                                                        <div key={bar} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${bar <= s.bars ? s.color : 'bg-gray-200'}`} />
                                                    ))}
                                                </div>
                                                <p className={`text-xs font-medium ${s.level === 'low' ? 'text-red-500' : s.level === 'medium' ? 'text-yellow-500' : 'text-green-600'}`}>
                                                    {s.level === 'low'    && 'Weak — add uppercase, numbers, or symbols'}
                                                    {s.level === 'medium' && 'Fair — getting better, try adding symbols'}
                                                    {s.level === 'high'   && 'Strong password'}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </form>
                        </div>

                        <div className="flex justify-end gap-2 bg-gray-50 border-t px-6 py-4">
                            <button type="button" onClick={() => goTo(1)}
                                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-700 text-sm transition">
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button type="button" onClick={() => goTo(3)}
                                className="flex items-center gap-1 px-6 py-2 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition">
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
                                <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-4">Personal Information</h3>
                                <ReviewRow label="Full Name"   value={fullName} />
                                <ReviewRow label="First Name"  value={data.first_name} />
                                <ReviewRow label="Middle Name" value={data.middle_name} />
                                <ReviewRow label="Last Name"   value={data.last_name} />
                                <ReviewRow label="Name Ext."   value={data.name_ext} />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mt-6 mb-4">Employment Details</h3>
                                <ReviewRow label="Agency"          value={data.agency} />
                                <ReviewRow label="Division"        value={data.division} />
                                <ReviewRow label="Section / Unit"  value={data.section_unit} />
                                <ReviewRow label="Position"        value={data.position} />
                                <ReviewRow label="Salary Grade"    value={data.salary_grade ? `SG ${data.salary_grade}` : '—'} />
                                <ReviewRow label="Employment Type" value={data.employment_type} />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mt-6 mb-4">Contact Details</h3>
                                <ReviewRow label="Email"         value={data.email} />
                                <ReviewRow label="Mobile Number" value={data.mobile_number} />
                            </div>
                            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl px-5 py-4 text-xs text-green-700 text-center">
                                After submitting, you will receive a <strong>One-Time Password (OTP)</strong>. Once verified, an HR Administrator will review and approve your account before you can log in.
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 bg-gray-50 border-t px-6 py-4">
                            <button type="button" onClick={() => goTo(2)}
                                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm transition">
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button type="button" disabled={processing} onClick={submit}
                                className="flex items-center gap-1 px-6 py-2 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition disabled:opacity-50">
                                {processing ? <><Spinner />Submitting</> : <><Check className="h-4 w-4" />Submit Registration</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}