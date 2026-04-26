import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    Calendar, Clock, CheckCircle2, XCircle, Plus, X, ChevronLeft,
    ChevronRight, Edit2, Ban, FileText, AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveRequest {
    id: number;
    leave_type: string;
    type_code: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string | null;
    status: 'pending' | 'approved' | 'denied' | 'cancelled';
    remarks: string | null;
    created_at: string;
}

interface LeaveCredit {
    leave_type: string;
    type_code: string;
    total: number;
    used: number;
    pending: number;
    available: number;
}

interface LeaveType { id: number; name: string; code: string; }

interface Props {
    requests: LeaveRequest[];
    credits: LeaveCredit[];
    leaveTypes: LeaveType[];
    stats: { pending: number; approved: number; denied: number; };
    year: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
    VL: 'bg-amber-400', SL: 'bg-sky-400',
    PL: 'bg-indigo-400', WL: 'bg-purple-400',
};

const STATUS_STYLE: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-600 border-amber-200',
    approved:  'bg-green-50 text-green-600 border-green-200',
    denied:    'bg-red-50 text-red-600 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_ICON: Record<string, React.ReactNode> = {
    pending:   <Clock className="h-3 w-3" />,
    approved:  <CheckCircle2 className="h-3 w-3" />,
    denied:    <XCircle className="h-3 w-3" />,
    cancelled: <Ban className="h-3 w-3" />,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', opts);
}

function isWeekend(date: Date): boolean { return date.getDay() === 0 || date.getDay() === 6; }

function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function toDateString(d: Date): string { return d.toISOString().slice(0, 10); }

function countWorkingDays(start: string, end: string): number {
    if (!start || !end || end < start) return 0;
    let count = 0;
    let cur = new Date(start + 'T00:00:00');
    const fin = new Date(end + 'T00:00:00');
    while (cur <= fin) { if (!isWeekend(cur)) count++; cur = addDays(cur, 1); }
    return count;
}

// ─── Calendar Date Picker ─────────────────────────────────────────────────────

interface CalendarPickerProps {
    startDate: string;
    endDate: string;
    onSelect: (start: string, end: string) => void;
}

function CalendarPicker({ startDate, endDate, onSelect }: CalendarPickerProps) {
    const today = toDateString(new Date());
    const [viewDate, setViewDate] = useState(() => {
        const d = startDate ? new Date(startDate + 'T00:00:00') : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [picking, setPicking] = useState<'start' | 'end'>('start');

    function prevMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
    function nextMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

    // Build calendar grid
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(toDateString(new Date(year, month, d)));
    }

    function handleDayClick(date: string) {
        if (date < today) return;
        if (picking === 'start') {
            onSelect(date, date >= endDate ? '' : endDate);
            setPicking('end');
        } else {
            if (date < startDate) { onSelect(date, startDate); }
            else { onSelect(startDate, date); }
            setPicking('start');
        }
    }

    function dayClass(date: string): string {
        if (date < today) return 'text-gray-300 cursor-not-allowed';
        const inRange = startDate && endDate && date >= startDate && date <= endDate;
        const isStart = date === startDate;
        const isEnd   = date === endDate;
        const isWknd  = isWeekend(new Date(date + 'T00:00:00'));

        if (isStart || isEnd) return 'bg-green-600 text-white rounded-lg font-bold';
        if (inRange) return `${isWknd ? 'bg-gray-100' : 'bg-green-100'} text-green-800`;
        if (isWknd)  return 'text-gray-300 cursor-not-allowed';
        return 'text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg cursor-pointer';
    }

    const monthName = viewDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="select-none">
            {/* Picking indicator */}
            <div className="flex gap-2 mb-3">
                <button onClick={() => setPicking('start')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition
                        ${picking === 'start' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                    Start: {startDate ? fmt(startDate, { month: 'short', day: 'numeric' }) : 'Pick date'}
                </button>
                <button onClick={() => setPicking('end')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition
                        ${picking === 'end' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                    End: {endDate ? fmt(endDate, { month: 'short', day: 'numeric' }) : 'Pick date'}
                </button>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-2">
                <button onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-gray-700">{monthName}</span>
                <button onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {days.map(d => (
                    <div key={d} className={`text-center text-[10px] font-semibold py-1 ${d === 'Sun' || d === 'Sat' ? 'text-gray-300' : 'text-gray-400'}`}>{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((date, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center">
                        {date ? (
                            <button
                                onClick={() => handleDayClick(date)}
                                disabled={date < today || isWeekend(new Date(date + 'T00:00:00'))}
                                className={`w-full h-full text-xs flex items-center justify-center transition ${dayClass(date)}`}>
                                {new Date(date + 'T00:00:00').getDate()}
                            </button>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Leave Request Modal ───────────────────────────────────────────────────────

interface ModalProps {
    leaveTypes: LeaveType[];
    editing?: LeaveRequest;
    onClose: () => void;
}

function LeaveModal({ leaveTypes, editing, onClose }: ModalProps) {
    const isEdit = !!editing;

    const [typeId,     setTypeId]     = useState<string>(editing ? String(editing.leave_type) : '');
    const [startDate,  setStartDate]  = useState(editing?.start_date ?? '');
    const [endDate,    setEndDate]    = useState(editing?.end_date ?? '');
    const [reason,     setReason]     = useState(editing?.reason ?? '');
    const [errors,     setErrors]     = useState<Record<string, string>>({});
    const [saving,     setSaving]     = useState(false);

    // Find leave type id for editing
    const editTypeId = editing
        ? leaveTypes.find(t => t.name === editing.leave_type)?.id ?? ''
        : '';
    const [leaveTypeId, setLeaveTypeId] = useState<string>(editTypeId ? String(editTypeId) : '');

    const workingDays = countWorkingDays(startDate, endDate);

    function validate() {
        const e: Record<string, string> = {};
        if (!leaveTypeId) e.leave_type_id = 'Please select a leave type.';
        if (!startDate)   e.start_date    = 'Start date is required.';
        if (!endDate)     e.end_date      = 'End date is required.';
        if (workingDays < 1) e.days = 'Please select at least 1 working day.';
        return e;
    }

    function handleSubmit() {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);

        const payload = { leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, reason };

        if (isEdit) {
            router.put(`/my-leave/${editing!.id}`, payload, {
                preserveScroll: true,
                onSuccess: onClose,
                onError: errs => { setErrors(errs as Record<string, string>); setSaving(false); },
            });
        } else {
            router.post('/my-leave', payload, {
                preserveScroll: true,
                onSuccess: onClose,
                onError: errs => { setErrors(errs as Record<string, string>); setSaving(false); },
            });
        }
    }

    const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[96vh]">

                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
                    <h3 className="font-semibold text-green-800 text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {isEdit ? 'Edit Leave Request' : 'Apply for Leave'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                    {/* Leave type */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Leave Type</label>
                        <select
                            value={leaveTypeId}
                            onChange={e => { setLeaveTypeId(e.target.value); setErrors(p => ({ ...p, leave_type_id: '' })); }}
                            className={inputCls}>
                            <option value="">Select leave type…</option>
                            {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                        </select>
                        {errors.leave_type_id && <p className="mt-1 text-xs text-red-500">{errors.leave_type_id}</p>}
                    </div>

                    {/* Calendar */}
                    <div className="rounded-xl border border-gray-200 p-4">
                        <CalendarPicker
                            startDate={startDate}
                            endDate={endDate}
                            onSelect={(s, e) => { setStartDate(s); setEndDate(e); setErrors(p => ({ ...p, start_date: '', end_date: '', days: '' })); }}
                        />
                    </div>

                    {/* Summary */}
                    {startDate && endDate && (
                        <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${workingDays > 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                            <Calendar className={`h-5 w-5 shrink-0 ${workingDays > 0 ? 'text-green-600' : 'text-red-400'}`} />
                            <div>
                                <p className={`text-sm font-bold ${workingDays > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                    {workingDays} working day{workingDays !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {fmt(startDate, { month: 'long', day: 'numeric' })} → {endDate ? fmt(endDate, { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                                </p>
                            </div>
                        </div>
                    )}
                    {errors.days && <p className="text-xs text-red-500">{errors.days}</p>}

                    {/* Reason */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                            Reason <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            className={`${inputCls} resize-none`}
                            placeholder="Briefly describe the reason for your leave…"
                        />
                    </div>

                    {errors.days && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600">{errors.days}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t px-6 py-4 shrink-0">
                    <button onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? (
                            <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>{isEdit ? 'Saving…' : 'Submitting…'}</>
                        ) : isEdit ? 'Save Changes' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Credit Bar ───────────────────────────────────────────────────────────────

function CreditBar({ credit }: { credit: LeaveCredit }) {
    const color = TYPE_COLORS[credit.type_code] ?? 'bg-gray-400';
    const usedPct    = credit.total > 0 ? Math.min(100, (credit.used / credit.total) * 100) : 0;
    const pendingPct = credit.total > 0 ? Math.min(100 - usedPct, (credit.pending / credit.total) * 100) : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-xs font-semibold text-gray-700">{credit.leave_type}</span>
                </div>
                <span className="text-xs font-bold text-green-700">{credit.available} <span className="text-gray-400 font-normal">/ {credit.total}</span></span>
            </div>
            {/* Bar */}
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
                <div className={`h-full ${color} transition-all`} style={{ width: `${usedPct}%` }} />
                <div className="h-full bg-amber-300 transition-all" style={{ width: `${pendingPct}%` }} />
            </div>
            <div className="flex gap-3 mt-1">
                <span className="text-[10px] text-gray-400">Used: <strong>{credit.used}</strong></span>
                {credit.pending > 0 && <span className="text-[10px] text-amber-500">Pending: <strong>{credit.pending}</strong></span>}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeLeaveIndex({ requests, credits, leaveTypes, stats, year }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editing,   setEditing]   = useState<LeaveRequest | undefined>(undefined);
    const [filter,    setFilter]    = useState<string>('all');

    const filtered = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    function openCreate() { setEditing(undefined); setShowModal(true); }
    function openEdit(req: LeaveRequest) { setEditing(req); setShowModal(true); }

    function handleCancel(req: LeaveRequest) {
        Swal.fire({
            title: 'Cancel Leave Request?',
            html: `Cancel your <strong>${req.leave_type}</strong> request (${fmt(req.start_date, { month: 'short', day: 'numeric' })} – ${fmt(req.end_date, { month: 'short', day: 'numeric' })})?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#16a34a', cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, cancel it',
        }).then(result => {
            if (result.isConfirmed) {
                router.post(`/my-leave/${req.id}/cancel`, {}, { preserveScroll: true });
            }
        });
    }

    return (
        <AppLayout>
            <Head title="My Leave" />

            {showModal && (
                <LeaveModal
                    leaveTypes={leaveTypes}
                    editing={editing}
                    onClose={() => { setShowModal(false); setEditing(undefined); }}
                />
            )}

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            My Leave — {year}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage your leave requests and track your credits</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition shadow-sm">
                        <Plus className="h-4 w-4" />
                        Apply for Leave
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left — Requests */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Stat chips */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    label: 'Pending',
                                    val: stats.pending,
                                    icon: <Clock className="h-3.5 w-3.5" />,
                                    chip: 'bg-amber-50 border-amber-200',
                                    iconWrap: 'bg-amber-100 border-amber-200 text-amber-700',
                                },
                                {
                                    label: 'Approved',
                                    val: stats.approved,
                                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                                    chip: 'bg-green-50 border-green-200',
                                    iconWrap: 'bg-green-100 border-green-200 text-green-700',
                                },
                                {
                                    label: 'Denied',
                                    val: stats.denied,
                                    icon: <XCircle className="h-3.5 w-3.5" />,
                                    chip: 'bg-rose-50 border-rose-200',
                                    iconWrap: 'bg-rose-100 border-rose-200 text-rose-600',
                                },
                            ].map(s => (
                                <div key={s.label} className={`rounded-xl border ${s.chip} p-3 flex items-center gap-2.5`}>
                                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${s.iconWrap}`}>
                                        {s.icon}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900 leading-none">{s.val}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Filter tabs */}
                        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                            {['all', 'pending', 'approved', 'denied', 'cancelled'].map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`flex-1 text-xs font-medium rounded-lg py-1.5 transition capitalize
                                        ${filter === f ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Requests list */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-400">
                                    <FileText className="h-8 w-8 opacity-30" />
                                    <p className="text-sm italic">No {filter !== 'all' ? filter : ''} leave requests.</p>
                                    {filter === 'all' && (
                                        <button onClick={openCreate}
                                            className="mt-2 text-xs text-green-600 font-semibold hover:underline">
                                            Apply for your first leave →
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <ul>
                                    {filtered.map(req => {
                                        const color = TYPE_COLORS[req.type_code] ?? 'bg-gray-400';
                                        return (
                                            <li key={req.id} className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition group">
                                                {/* Color stripe */}
                                                <div className={`mt-1 h-10 w-1 rounded-full shrink-0 ${color}`} />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{req.leave_type}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {fmt(req.start_date, { month: 'short', day: 'numeric' })} – {fmt(req.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                <span className="mx-1.5 text-gray-300">·</span>
                                                                <strong>{req.days}</strong> working days
                                                            </p>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[req.status]}`}>
                                                            {STATUS_ICON[req.status]}
                                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    {req.reason && <p className="text-xs text-gray-400 mt-1 truncate">{req.reason}</p>}
                                                    {req.remarks && (
                                                        <p className="text-xs text-amber-600 mt-1 italic">HR: {req.remarks}</p>
                                                    )}
                                                </div>

                                                {/* Actions — only pending */}
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                                        <button onClick={() => openEdit(req)}
                                                            className="p-1.5 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition"
                                                            title="Edit">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={() => handleCancel(req)}
                                                            className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition"
                                                            title="Cancel">
                                                            <Ban className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Right — Credits */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-green-700" />
                                <h2 className="text-sm font-semibold text-green-800">Leave Credits — {year}</h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {credits.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic text-center py-4">No credits allocated yet.</p>
                                ) : (
                                    credits.map(c => <CreditBar key={c.type_code} credit={c} />)
                                )}
                            </div>
                            {/* Legend */}
                            <div className="px-4 pb-4 pt-2 flex gap-3 border-t border-gray-100">
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <span className="h-2 w-3 rounded-sm bg-green-400" /> Used
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <span className="h-2 w-3 rounded-sm bg-amber-300" /> Pending
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <span className="h-2 w-3 rounded-sm bg-gray-100 border" /> Available
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}