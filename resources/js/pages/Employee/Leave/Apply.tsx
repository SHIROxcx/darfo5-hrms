import { Head, Link, router } from '@inertiajs/react';
import type { AxiosError } from 'axios';
import axios from 'axios';
import {
    AlertCircle, ArrowLeft, Calendar, CheckCircle2, ExternalLink, FileText, Loader2, PenLine, Send,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { CalendarPicker, countWorkingDays, fmt } from '@/components/leave/calendar-picker';
import AppLayout from '@/layouts/app-layout';
import { my } from '@/routes/leave';
import { preview, store, update } from '@/routes/leave/apply';

// CSC Form No. 6 (Revised 2020) — Application for Leave, employee side.
// Two steps: Fill (items 1–6) → Review, which shows the real PDF rendered by
// the same pipeline as the filed form (LeaveApplicationPdfService). Section 7
// is filled by HR on the admin review page.

// ─── Types ───────────────────────────────────────────────────────────────────

interface Applicant {
    office: string | null;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    position: string | null;
    salary: number | null;
    salary_grade: string | null;
    date_of_filing: string;
}

interface FormLeaveType {
    id: number;
    code: string;
    name: string;
    tracks_credits: boolean;
    /** FL is charged against VL. */
    charge_to: string | null;
}

interface Application {
    id: number;
    leave_type_id: number;
    other_leave_type: string | null;
    detail_type: string | null;
    detail_text: string | null;
    start_date: string;
    end_date: string;
    commutation_requested: boolean;
}

interface Props {
    applicant: Applicant;
    leaveTypes: FormLeaveType[];
    detailTypesByCode: Record<string, string[]>;
    detailTypesRequiringText: string[];
    /** Available days by type code (VL, SL, WL). */
    credits: Record<string, number>;
    holidays: Record<string, string>;
    today: string;
    hasSignature: boolean;
    /** Set when editing a pending application. */
    application: Application | null;
}

type Errors = Record<string, string>;

// ─── Constants ───────────────────────────────────────────────────────────────

const DETAIL_LABELS: Record<string, string> = {
    within_ph: 'Within the Philippines',
    abroad: 'Abroad (specify)',
    in_hospital: 'In hospital (specify illness)',
    out_patient: 'Out patient (specify illness)',
    slbw_illness: 'Specify illness',
    masters_degree: "Completion of Master's degree",
    bar_board_review: 'BAR/Board examination review',
};

const DETAIL_HEADINGS: Record<string, string> = {
    VL: 'In case of Vacation Leave',
    SPL: 'In case of Special Privilege Leave',
    SL: 'In case of Sick Leave',
    SLW: 'In case of Special Leave Benefits for Women',
    STUDY: 'In case of Study Leave',
};

const DETAIL_PLACEHOLDERS: Record<string, string> = {
    within_ph: 'Place (optional)',
    abroad: 'Country / place',
    in_hospital: 'Illness',
    out_patient: 'Illness',
    slbw_illness: 'Illness',
};

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function peso(n: number): string {
    return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Axios returns error bodies as a Blob when responseType is 'blob'. */
async function readErrorBody(err: unknown): Promise<{ message?: string; errors?: Record<string, string[]> }> {
    const data = (err as AxiosError).response?.data;
    if (data instanceof Blob) {
        try { return JSON.parse(await data.text()); } catch { return {}; }
    }
    return (data as object) ?? {};
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <header className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-green-800">{title}</h2>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </header>
            <div className="p-5">{children}</div>
        </section>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || <span className="text-gray-300 font-normal">—</span>}</p>
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null;
}

function Choice({ checked, onChange, name, children }: {
    checked: boolean; onChange: () => void; name: string; children: React.ReactNode;
}) {
    return (
        <label className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition
            ${checked ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'}`}>
            <input type="radio" name={name} checked={checked} onChange={onChange}
                className="mt-0.5 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer" />
            <span className="text-sm text-gray-800 leading-snug">{children}</span>
        </label>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApplyForLeave({
    applicant, leaveTypes, detailTypesByCode, detailTypesRequiringText,
    credits, holidays, today, hasSignature, application,
}: Props) {
    const isEdit = application !== null;

    const [step, setStep] = useState<'fill' | 'review'>('fill');
    const [leaveTypeId, setLeaveTypeId] = useState<number | null>(application?.leave_type_id ?? null);
    const [otherLeaveType, setOtherLeaveType] = useState(application?.other_leave_type ?? '');
    const [detailType, setDetailType] = useState<string | null>(application?.detail_type ?? null);
    const [detailText, setDetailText] = useState(application?.detail_text ?? '');
    const [startDate, setStartDate] = useState(application?.start_date ?? '');
    const [endDate, setEndDate] = useState(application?.end_date ?? '');
    const [commutation, setCommutation] = useState<boolean>(application?.commutation_requested ?? false);
    const [attest, setAttest] = useState(false);

    const [errors, setErrors] = useState<Errors>({});
    const [previewing, setPreviewing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const topRef = useRef<HTMLDivElement>(null);

    // Release the previous preview's blob URL when it is replaced or the page unmounts.
    useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

    const selectedType = leaveTypes.find(t => t.id === leaveTypeId) ?? null;
    const code = selectedType?.code ?? null;
    const detailOptions = code ? detailTypesByCode[code] ?? [] : [];
    const workingDays = countWorkingDays(startDate, endDate, holidays);

    // Balance this type draws on (VL/SL own, FL → VL); null = not tracked yet.
    const creditCode = selectedType ? (selectedType.charge_to ?? (selectedType.tracks_credits ? selectedType.code : null)) : null;
    const available = creditCode ? credits[creditCode] ?? 0 : null;
    const insufficient = available !== null && workingDays > available;

    function selectType(type: FormLeaveType) {
        setLeaveTypeId(type.id);
        const options = detailTypesByCode[type.code] ?? [];
        // Keep a detail that still applies (VL ↔ SPL share theirs); else reset.
        if (!detailType || !options.includes(detailType)) {
            setDetailType(options.length === 1 ? options[0] : null);
            setDetailText('');
        }
        setErrors(p => ({ ...p, leave_type_id: '', detail_type: '', detail_text: '', other_leave_type: '' }));
    }

    function payload() {
        return {
            leave_type_id: leaveTypeId,
            other_leave_type: code === 'OTH' ? otherLeaveType : null,
            detail_type: detailOptions.length ? detailType : null,
            detail_text: detailOptions.length ? detailText || null : null,
            start_date: startDate,
            end_date: endDate,
            commutation_requested: commutation,
            attest,
            editing_id: application?.id ?? null,
        };
    }

    /** Instant checks; the server validates everything again. */
    function validateLocally(): Errors {
        const e: Errors = {};
        if (!leaveTypeId) e.leave_type_id = 'Please select the type of leave.';
        if (code === 'OTH' && !otherLeaveType.trim()) e.other_leave_type = 'Please specify the leave type.';
        if (detailOptions.length && !detailType) e.detail_type = 'Please complete the details of leave.';
        if (detailType && detailTypesRequiringText.includes(detailType) && !detailText.trim()) e.detail_text = 'Please specify.';
        if (!startDate || !endDate) e.start_date = 'Please select the inclusive dates.';
        else if (workingDays < 1) e.start_date = 'The selected dates contain no working days.';
        return e;
    }

    function showErrors(e: Errors) {
        setErrors(e);
        setStep('fill');
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    async function handlePreview() {
        const local = validateLocally();
        if (Object.keys(local).length) { showErrors(local); return; }

        setPreviewing(true);
        try {
            const res = await axios.post(preview.url(), payload(), { responseType: 'blob' });
            setPdfUrl(URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' })));
            setErrors({});
            setStep('review');
            window.scrollTo({ top: 0 });
        } catch (err) {
            const body = await readErrorBody(err);
            if (body.errors) {
                showErrors(Object.fromEntries(Object.entries(body.errors).map(([k, v]) => [k, v[0]])));
            } else {
                Swal.fire({ icon: 'error', title: 'Could not prepare the form', text: body.message ?? 'Please try again.', confirmButtonColor: '#16a34a' });
            }
        } finally {
            setPreviewing(false);
        }
    }

    function handleSubmit() {
        if (!attest) { setErrors({ attest: 'Please certify that the information is true and correct.' }); return; }
        setSubmitting(true);

        const options = {
            onError: (errs: Errors) => {
                if (errs.form) Swal.fire({ icon: 'error', title: 'Not submitted', text: errs.form, confirmButtonColor: '#16a34a' });
                if (errs.attest) setErrors(errs); else showErrors(errs);
            },
            onFinish: () => setSubmitting(false),
        };

        if (isEdit) router.put(update.url(application.id), payload(), options);
        else router.post(store.url(), payload(), options);
    }

    return (
        <AppLayout>
            <Head title={isEdit ? 'Edit Application for Leave' : 'Apply for Leave'} />

            <div ref={topRef} className="py-6 px-4 sm:px-6 lg:px-8 w-full max-w-5xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Link href={my().url} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-green-700 mb-2">
                            <ArrowLeft className="h-3.5 w-3.5" /> My Leave
                        </Link>
                        <h1 className="text-2xl font-bold text-green-700">{isEdit ? 'Edit Application for Leave' : 'Application for Leave'}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Civil Service Form No. 6, Revised 2020</p>
                    </div>
                    <ol className="flex items-center gap-2 text-xs font-medium">
                        {[['fill', '1', 'Fill in'], ['review', '2', 'Review & submit']].map(([key, n, label], i) => (
                            <li key={key} className="flex items-center gap-2">
                                {i > 0 && <span className="h-px w-6 bg-gray-300" />}
                                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 border
                                    ${step === key ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
                                    <span className="font-bold">{n}</span> {label}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>

                {step === 'fill' ? (
                    <>
                        {/* 1–5 */}
                        <Section title="Applicant" subtitle="Items 1–5, taken from your profile. Contact HR if anything here is wrong.">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2"><ReadOnlyField label="1. Office / Department" value={applicant.office} /></div>
                                <ReadOnlyField label="3. Date of filing" value={fmt(applicant.date_of_filing, { month: 'long', day: 'numeric', year: 'numeric' })} />
                                <ReadOnlyField label="5. Salary" value={applicant.salary !== null ? peso(applicant.salary) : applicant.salary_grade ? `SG ${applicant.salary_grade}` : null} />
                                <ReadOnlyField label="2. Last name" value={applicant.last_name} />
                                <ReadOnlyField label="First name" value={applicant.first_name} />
                                <ReadOnlyField label="Middle name" value={applicant.middle_name} />
                                <ReadOnlyField label="4. Position" value={applicant.position} />
                            </div>
                        </Section>

                        {/* 6.A */}
                        <Section title="6.A Type of leave to be availed of">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {leaveTypes.filter(t => t.code !== 'OTH').map(t => {
                                    const src = t.charge_to ?? (t.tracks_credits ? t.code : null);
                                    return (
                                        <Choice key={t.id} name="leave_type" checked={leaveTypeId === t.id} onChange={() => selectType(t)}>
                                            {t.name}
                                            {src && credits[src] !== undefined && (
                                                <span className="block text-[11px] text-gray-500">
                                                    {credits[src]} day{credits[src] === 1 ? '' : 's'} available{t.charge_to ? ` (charged to ${t.charge_to})` : ''}
                                                </span>
                                            )}
                                        </Choice>
                                    );
                                })}
                            </div>
                            {leaveTypes.filter(t => t.code === 'OTH').map(t => (
                                <div key={t.id} className="mt-3">
                                    <Choice name="leave_type" checked={leaveTypeId === t.id} onChange={() => selectType(t)}>Others</Choice>
                                    {leaveTypeId === t.id && (
                                        <div className="mt-2 ml-9">
                                            <input value={otherLeaveType} onChange={e => setOtherLeaveType(e.target.value)} maxLength={255}
                                                className={inputCls} placeholder="Specify the leave type" />
                                            <FieldError message={errors.other_leave_type} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <FieldError message={errors.leave_type_id} />
                        </Section>

                        {/* 6.B */}
                        <Section title="6.B Details of leave">
                            {!selectedType ? (
                                <p className="text-sm text-gray-400 italic">Select the type of leave first.</p>
                            ) : detailOptions.length === 0 ? (
                                <p className="text-sm text-gray-500">No additional details are needed for {selectedType.name}.</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs italic text-gray-500">{DETAIL_HEADINGS[code!]}:</p>
                                    {detailOptions.length > 1 && detailOptions.map(opt => (
                                        <Choice key={opt} name="detail_type" checked={detailType === opt}
                                            onChange={() => { setDetailType(opt); setErrors(p => ({ ...p, detail_type: '', detail_text: '' })); }}>
                                            {DETAIL_LABELS[opt]}
                                        </Choice>
                                    ))}
                                    <FieldError message={errors.detail_type} />
                                    {detailType && DETAIL_PLACEHOLDERS[detailType] && (
                                        <div className={detailOptions.length > 1 ? 'ml-9' : ''}>
                                            {detailOptions.length === 1 && <label className="mb-1 block text-xs font-medium text-gray-500">{DETAIL_LABELS[detailType]}</label>}
                                            <input value={detailText} onChange={e => { setDetailText(e.target.value); setErrors(p => ({ ...p, detail_text: '' })); }}
                                                maxLength={255} className={inputCls} placeholder={DETAIL_PLACEHOLDERS[detailType]} />
                                            <FieldError message={errors.detail_text} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </Section>

                        {/* 6.C / 6.D */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                            <div className="lg:col-span-3">
                                <Section title="6.C Number of working days applied for" subtitle="Pick the first and last day. Weekends and holidays aren't counted.">
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <CalendarPicker startDate={startDate} endDate={endDate} holidays={holidays} minDate={today}
                                            onSelect={(s, e) => { setStartDate(s); setEndDate(e); setErrors(p => ({ ...p, start_date: '', end_date: '' })); }} />
                                    </div>
                                    {startDate && endDate && (
                                        <div className={`mt-3 rounded-xl px-4 py-3 flex items-center gap-3 border
                                            ${workingDays > 0 && !insufficient ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                            <Calendar className={`h-5 w-5 shrink-0 ${workingDays > 0 && !insufficient ? 'text-green-600' : 'text-red-400'}`} />
                                            <div>
                                                <p className={`text-sm font-bold ${workingDays > 0 && !insufficient ? 'text-green-700' : 'text-red-600'}`}>
                                                    {workingDays} working day{workingDays !== 1 ? 's' : ''}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Inclusive dates: {fmt(startDate, { month: 'long', day: 'numeric' })} – {fmt(endDate, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                {insufficient && (
                                                    <p className="text-xs text-red-600 mt-0.5">Only {available} {creditCode} day{available === 1 ? '' : 's'} available.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <FieldError message={errors.start_date || errors.end_date || errors.days} />
                                </Section>
                            </div>
                            <div className="lg:col-span-2">
                                <Section title="6.D Commutation">
                                    <div className="space-y-2">
                                        <Choice name="commutation" checked={!commutation} onChange={() => setCommutation(false)}>Not requested</Choice>
                                        <Choice name="commutation" checked={commutation} onChange={() => setCommutation(true)}>Requested</Choice>
                                    </div>
                                </Section>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Link href={my().url}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                Cancel
                            </Link>
                            <button type="button" onClick={handlePreview} disabled={previewing}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 cursor-pointer">
                                {previewing ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing form…</> : <><FileText className="h-4 w-4" /> Preview form</>}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                This is the form HR will receive. Check every item before submitting. The <strong>DRAFT</strong> mark
                                is removed once it is filed. Section 7 is completed by HR.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-700">Application for Leave: preview</p>
                                {pdfUrl && (
                                    <a href={pdfUrl} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline">
                                        Open in new tab <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                            {pdfUrl && <iframe src={pdfUrl} title="Application for Leave preview" className="w-full h-[80vh] bg-gray-100" />}
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={attest} onChange={e => { setAttest(e.target.checked); setErrors({}); }}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" />
                                <span className="text-sm text-gray-800">
                                    I certify that the information in this application is true and correct.
                                    <span className="block text-xs text-gray-500 mt-0.5">
                                        {hasSignature
                                            ? 'Your uploaded e-signature and name will be placed on the signature line, with the date and time of filing.'
                                            : 'Your typed name will be placed on the signature line, with the date and time of filing. You can upload an e-signature in your Personal Data Sheet.'}
                                    </span>
                                </span>
                            </label>
                            <FieldError message={errors.attest} />

                            <div className="flex justify-between gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setStep('fill')}
                                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                                    <PenLine className="h-4 w-4" /> Back to edit
                                </button>
                                <button type="button" onClick={handleSubmit} disabled={!attest || submitting}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 cursor-pointer">
                                    {submitting
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                                        : isEdit ? <><CheckCircle2 className="h-4 w-4" /> Save changes</> : <><Send className="h-4 w-4" /> Submit application</>}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
