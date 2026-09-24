import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, CheckCircle2, Download, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { approve, deny, index } from '@/routes/admin/leave';

// CSC Form 6 review: the filed form on the left, section 7 (7.A–7.D) on the
// right. In v1 a single admin fills all of section 7 and decides in one step.
// The signatory names printed on the form come from config/leave.php.

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'pending' | 'approved' | 'denied' | 'cancelled';

interface Application {
    id: number;
    status: Status;
    employee: string;
    photo: string | null;
    position: string | null;
    office: string | null;
    leave_type: string;
    type_code: string;
    other_leave_type: string | null;
    /** Whether approval deducts VL/SL credits (VL, SL, and FL via VL). */
    tracks_credits: boolean;
    start_date: string;
    end_date: string;
    days: number;
    date_of_filing: string;
    remarks: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    pdf_url: string;
}

interface Section7 {
    credits_as_of: string | null;
    vl_total_earned: number | null;
    vl_less_this: number | null;
    vl_balance: number | null;
    sl_total_earned: number | null;
    sl_less_this: number | null;
    sl_balance: number | null;
    recommendation?: 'for_approval' | 'for_disapproval' | null;
    recommendation_reason?: string | null;
    approved_days_with_pay: number | null;
    approved_days_without_pay: number | null;
    approved_others?: string | null;
    disapproval_reason?: string | null;
}

interface Props {
    application: Application;
    section7: Section7;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<Status, string> = {
    pending:   'bg-amber-50 text-amber-600 border-amber-200',
    approved:  'bg-green-50 text-green-600 border-green-200',
    denied:    'bg-red-50 text-red-600 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const inputCls = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-600';

function fmtDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminLeaveReview({ application: app, section7 }: Props) {
    const editable = app.status === 'pending';

    const [values, setValues] = useState<Section7>({
        ...section7,
        recommendation: section7.recommendation ?? 'for_approval',
        recommendation_reason: section7.recommendation_reason ?? '',
        approved_others: section7.approved_others ?? '',
        disapproval_reason: section7.disapproval_reason ?? '',
    });
    const [decision, setDecision] = useState<'approve' | 'deny'>(app.status === 'denied' ? 'deny' : 'approve');
    const [remarks, setRemarks] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [acting, setActing] = useState(false);

    function set<K extends keyof Section7>(key: K, value: Section7[K]) {
        setValues(prev => {
            const next = { ...prev, [key]: value };
            // Keep 7.A balances consistent while HR edits the figures.
            if (key === 'vl_total_earned' || key === 'vl_less_this') {
                next.vl_balance = round((next.vl_total_earned ?? 0) - (next.vl_less_this ?? 0));
            }
            if (key === 'sl_total_earned' || key === 'sl_less_this') {
                next.sl_balance = round((next.sl_total_earned ?? 0) - (next.sl_less_this ?? 0));
            }
            return next;
        });
        setErrors(p => ({ ...p, [key]: '' }));
    }

    function num(key: keyof Section7) {
        return (e: React.ChangeEvent<HTMLInputElement>) =>
            set(key, (e.target.value === '' ? null : Number(e.target.value)) as never);
    }

    function submit() {
        const isApprove = decision === 'approve';
        const common = {
            remarks: remarks || null,
            credits_as_of: values.credits_as_of,
            vl_total_earned: values.vl_total_earned, vl_less_this: values.vl_less_this, vl_balance: values.vl_balance,
            sl_total_earned: values.sl_total_earned, sl_less_this: values.sl_less_this, sl_balance: values.sl_balance,
            recommendation: values.recommendation,
            recommendation_reason: values.recommendation === 'for_disapproval' ? values.recommendation_reason : null,
        };
        const data = isApprove
            ? { ...common, approved_days_with_pay: values.approved_days_with_pay, approved_days_without_pay: values.approved_days_without_pay, approved_others: values.approved_others || null }
            : { ...common, disapproval_reason: values.disapproval_reason };

        Swal.fire({
            title: isApprove ? 'Approve this application?' : 'Disapprove this application?',
            html: `${app.employee} — ${app.leave_type}, ${app.days} working day${app.days === 1 ? '' : 's'}.<br><small>Section 7 is saved on the form and the final PDF is archived.</small>`,
            icon: 'question', showCancelButton: true,
            confirmButtonColor: isApprove ? '#16a34a' : '#dc2626', cancelButtonColor: '#6b7280',
            confirmButtonText: isApprove ? 'Approve' : 'Disapprove',
        }).then(result => {
            if (!result.isConfirmed) return;
            setActing(true);
            router.post(isApprove ? approve.url(app.id) : deny.url(app.id), data, {
                preserveScroll: true,
                onError: errs => {
                    setErrors(errs);
                    if (errs.action) Swal.fire({ icon: 'error', title: 'Not saved', text: errs.action, confirmButtonColor: '#16a34a' });
                },
                onFinish: () => setActing(false),
            });
        });
    }

    return (
        <AppLayout>
            <Head title={`Leave application — ${app.employee}`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Link href={index().url} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-green-700 mb-2">
                            <ArrowLeft className="h-3.5 w-3.5" /> Leave Management
                        </Link>
                        <h1 className="text-2xl font-bold text-green-700">Application for Leave</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {app.employee}{app.position ? ` · ${app.position}` : ''} · filed {fmtDate(app.date_of_filing)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[app.status]}`}>{app.status}</span>
                        <a href={`${app.pdf_url}?download=1`}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                            <Download className="h-3.5 w-3.5" /> Download PDF
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
                    {/* The form */}
                    <div className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-700">
                                {editable ? 'As filed by the employee' : 'Final form (archived)'}
                            </p>
                            <a href={app.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline">
                                Open in new tab <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                        {/* Keyed on status so the completed form loads after a decision. */}
                        <iframe key={app.status} src={`${app.pdf_url}?v=${app.status}`} title="Application for Leave" className="w-full h-[85vh] bg-gray-100" />
                    </div>

                    {/* Section 7 */}
                    <div className="xl:col-span-2 space-y-4">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-[11px] text-gray-400 uppercase tracking-wide">Leave type</p><p className="font-semibold text-gray-800">{app.type_code === 'OTH' && app.other_leave_type ? `Others: ${app.other_leave_type}` : app.leave_type}</p></div>
                            <div><p className="text-[11px] text-gray-400 uppercase tracking-wide">Working days</p><p className="font-semibold text-gray-800">{app.days}</p></div>
                            <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase tracking-wide">Inclusive dates</p><p className="font-semibold text-gray-800">{fmtDate(app.start_date)} – {fmtDate(app.end_date)}</p></div>
                            {!app.tracks_credits && (
                                <p className="col-span-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                    This leave type doesn't deduct leave credits yet (credit rules pending HR policy). 7.A still certifies the VL/SL balances.
                                </p>
                            )}
                        </div>

                        {/* 7.A */}
                        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-green-800">7.A Certification of leave credits</h2>
                            <p className="text-xs text-gray-500 mb-3">{editable ? 'Pre-filled from current balances. Correct them if needed.' : 'As certified.'}</p>
                            <label className="block text-xs font-medium text-gray-500 mb-1">As of</label>
                            <input type="date" value={values.credits_as_of ?? ''} disabled={!editable} onChange={e => set('credits_as_of', e.target.value)} className={`${inputCls} mb-3 max-w-44`} />
                            <FieldError message={errors.credits_as_of} />
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[11px] text-gray-400 uppercase tracking-wide">
                                        <th className="text-left font-semibold pb-1.5"></th>
                                        <th className="text-left font-semibold pb-1.5 px-1">Vacation</th>
                                        <th className="text-left font-semibold pb-1.5 px-1">Sick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {([['Total earned', 'total_earned'], ['Less this application', 'less_this'], ['Balance', 'balance']] as const).map(([label, key]) => (
                                        <tr key={key}>
                                            <td className="py-1 pr-2 text-xs italic text-gray-600">{label}</td>
                                            {(['vl', 'sl'] as const).map(p => {
                                                const field = `${p}_${key}` as keyof Section7;
                                                return (
                                                    <td key={p} className="py-1 px-1">
                                                        <input type="number" step="0.01" value={(values[field] as number | null) ?? ''} onChange={num(field)}
                                                            disabled={!editable} className={inputCls} />
                                                        <FieldError message={errors[field]} />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        {/* 7.B */}
                        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-2">
                            <h2 className="text-sm font-semibold text-green-800 mb-1">7.B Recommendation</h2>
                            {(['for_approval', 'for_disapproval'] as const).map(r => (
                                <label key={r} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                                    <input type="radio" name="recommendation" checked={values.recommendation === r} disabled={!editable}
                                        onChange={() => set('recommendation', r)} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" />
                                    {r === 'for_approval' ? 'For approval' : 'For disapproval due to…'}
                                </label>
                            ))}
                            {values.recommendation === 'for_disapproval' && (
                                <textarea rows={2} value={values.recommendation_reason ?? ''} disabled={!editable}
                                    onChange={e => set('recommendation_reason', e.target.value)} className={`${inputCls} resize-none`} placeholder="Reason" />
                            )}
                            <FieldError message={errors.recommendation || errors.recommendation_reason} />
                        </section>

                        {/* 7.C / 7.D */}
                        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                                {(['approve', 'deny'] as const).map(d => (
                                    <button key={d} type="button" disabled={!editable} onClick={() => setDecision(d)}
                                        className={`flex-1 text-xs font-semibold rounded-lg py-1.5 transition cursor-pointer disabled:cursor-default
                                            ${decision === d ? (d === 'approve' ? 'bg-white text-green-700 shadow-sm' : 'bg-white text-red-600 shadow-sm') : 'text-gray-500'}`}>
                                        {d === 'approve' ? '7.C Approved for' : '7.D Disapproved due to'}
                                    </button>
                                ))}
                            </div>

                            {decision === 'approve' ? (
                                <div className="space-y-2">
                                    {([['approved_days_with_pay', 'days with pay'], ['approved_days_without_pay', 'days without pay']] as const).map(([field, label]) => (
                                        <div key={field}>
                                            <div className="flex items-center gap-2">
                                                <input type="number" min={0} max={app.days} step="0.5" value={values[field] ?? ''} onChange={num(field)}
                                                    disabled={!editable} className={`${inputCls} w-24`} />
                                                <span className="text-sm text-gray-700">{label}</span>
                                            </div>
                                            <FieldError message={errors[field]} />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Others (specify)</label>
                                        <input value={values.approved_others ?? ''} onChange={e => set('approved_others', e.target.value)} disabled={!editable} className={inputCls} />
                                    </div>
                                    {app.tracks_credits && editable && (
                                        <p className="text-xs text-gray-500">Only the days with pay are deducted from leave credits.</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <textarea rows={3} value={values.disapproval_reason ?? ''} onChange={e => set('disapproval_reason', e.target.value)}
                                        disabled={!editable} className={`${inputCls} resize-none`} placeholder="Reason for disapproval" />
                                    <FieldError message={errors.disapproval_reason} />
                                </div>
                            )}

                            {editable ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Note to the employee <span className="font-normal text-gray-400">(optional, not printed)</span>
                                        </label>
                                        <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className={`${inputCls} resize-none`} />
                                    </div>
                                    <button type="button" onClick={submit} disabled={acting}
                                        className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 cursor-pointer
                                            ${decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                        {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : decision === 'approve' ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        {acting ? 'Saving…' : decision === 'approve' ? 'Approve application' : 'Disapprove application'}
                                    </button>
                                </>
                            ) : (
                                <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600 flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-gray-400 shrink-0" />
                                    <span>
                                        {app.status === 'cancelled'
                                            ? 'The employee cancelled this application.'
                                            : <>Decided{app.reviewed_by ? ` by ${app.reviewed_by}` : ''}{app.reviewed_at ? ` on ${fmtDate(app.reviewed_at.slice(0, 10))}` : ''}.</>}
                                        {app.remarks && <span className="block mt-1">Note: {app.remarks}</span>}
                                    </span>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function round(n: number): number {
    return Math.round(n * 100) / 100;
}
