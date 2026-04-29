import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    Calendar, CheckCircle2, XCircle, Clock, Users,
    ChevronLeft, ChevronRight, Search, SlidersHorizontal,
    X, Check, Ban, Info,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveBar {
    id: number;
    type: string;
    type_code: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string | null;
    status: 'pending' | 'approved' | 'denied' | 'cancelled';
    remarks: string | null;
    created_at: string;
}

interface Employee {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    leaves: LeaveBar[];
}

interface LeaveType { id: number; name: string; code: string; }

interface Props {
    employees: Employee[];
    leaveTypes: LeaveType[];
    weekStart: string;
    weekEnd: string;
    filters: { leave_type_id?: string; status?: string; search?: string; week_start?: string; };
    stats: { pending: number; approved: number; denied: number; on_leave_today: number; };
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Color palette keyed by leave type code — maps to Tailwind bg + text classes
const TYPE_COLORS: Record<string, { bar: string; label: string; dot: string }> = {
    VL:    { bar: 'bg-amber-400',   label: 'text-amber-700',   dot: 'bg-amber-400' },
    SL:    { bar: 'bg-sky-400',     label: 'text-sky-700',     dot: 'bg-sky-400' },
    ML:    { bar: 'bg-pink-400',    label: 'text-pink-700',    dot: 'bg-pink-400' },
    PL:    { bar: 'bg-indigo-400',  label: 'text-indigo-700',  dot: 'bg-indigo-400' },
    WL:   { bar: 'bg-purple-400',  label: 'text-purple-700',  dot: 'bg-purple-400' },
    SOLO:  { bar: 'bg-orange-400',  label: 'text-orange-700',  dot: 'bg-orange-400' },
    STUDY: { bar: 'bg-teal-400',    label: 'text-teal-700',    dot: 'bg-teal-400' },
    VAWC:  { bar: 'bg-red-400',     label: 'text-red-700',     dot: 'bg-red-400' },
    RL:    { bar: 'bg-lime-400',    label: 'text-lime-700',    dot: 'bg-lime-400' },
    SLW:   { bar: 'bg-fuchsia-400', label: 'text-fuchsia-700', dot: 'bg-fuchsia-400' },
    CL:    { bar: 'bg-cyan-400',    label: 'text-cyan-700',    dot: 'bg-cyan-400' },
    AL:    { bar: 'bg-rose-400',    label: 'text-rose-700',    dot: 'bg-rose-400' },
    FL:    { bar: 'bg-yellow-400',  label: 'text-yellow-700',  dot: 'bg-yellow-400' },
};
const DEFAULT_COLOR = { bar: 'bg-gray-400', label: 'text-gray-700', dot: 'bg-gray-400' };

const STATUS_BADGE: Record<string, string> = {
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

function addDays(dateStr: string, n: number): string {
    const d = new Date(dateStr); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}

function buildDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    let cur = start;
    while (cur <= end) { dates.push(cur); cur = addDays(cur, 1); }
    return dates;
}

function fmt(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', opts);
}

function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
}

function isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().slice(0, 10);
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, iconColor }: {
    label: string; value: number;
    icon: React.ReactNode; color: string; iconColor: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border ${color}`}>
                <div className={iconColor}>{icon}</div>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
    leave: LeaveBar & { employee: string; email: string };
    onClose: () => void;
    onApprove: (id: number, remarks: string) => void;
    onDeny: (id: number, remarks: string) => void;
}

function DetailModal({ leave, onClose, onApprove, onDeny }: DetailModalProps) {
    const [remarks, setRemarks] = useState('');
    const [acting, setActing]   = useState<'approve' | 'deny' | null>(null);
    const color = TYPE_COLORS[leave.type_code] ?? DEFAULT_COLOR;

    function handleApprove() {
        setActing('approve');
        onApprove(leave.id, remarks);
    }
    function handleDeny() {
        setActing('deny');
        onDeny(leave.id, remarks);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color.dot}`} />
                        <h3 className="font-semibold text-green-800 text-sm">{leave.type}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Employee */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                            {leave.employee.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">{leave.employee}</p>
                            <p className="text-xs text-gray-500">{leave.email}</p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">From</p>
                            <p className="text-sm font-bold text-gray-800">{fmt(leave.start_date, { month: 'short', day: 'numeric' })}</p>
                            <p className="text-[10px] text-gray-400">{fmt(leave.start_date, { year: 'numeric' })}</p>
                        </div>
                        <div className="rounded-xl border border-green-100 bg-green-50 p-3 flex flex-col items-center justify-center">
                            <p className="text-xl font-bold text-green-700">{leave.days}</p>
                            <p className="text-[10px] text-green-600">working days</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">To</p>
                            <p className="text-sm font-bold text-gray-800">{fmt(leave.end_date, { month: 'short', day: 'numeric' })}</p>
                            <p className="text-[10px] text-gray-400">{fmt(leave.end_date, { year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[leave.status]}`}>
                            {STATUS_ICON[leave.status]}
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400">Filed: {leave.created_at}</span>
                    </div>

                    {/* Reason */}
                    {leave.reason && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Reason</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{leave.reason}</p>
                        </div>
                    )}

                    {/* Existing remarks */}
                    {leave.remarks && (
                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                            <p className="text-xs font-semibold text-amber-600 mb-0.5">HR Remarks</p>
                            <p className="text-sm text-amber-800">{leave.remarks}</p>
                        </div>
                    )}

                    {/* Action remarks input — only for pending */}
                    {leave.status === 'pending' && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                                Remarks <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 resize-none"
                                placeholder="Add a note for the employee…"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {leave.status === 'pending' && (
                    <div className="flex justify-end gap-2 border-t px-6 py-4">
                        <button
                            disabled={acting !== null}
                            onClick={handleDeny}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                            <XCircle className="h-3.5 w-3.5" />
                            {acting === 'deny' ? 'Denying…' : 'Deny'}
                        </button>
                        <button
                            disabled={acting !== null}
                            onClick={handleApprove}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" />
                            {acting === 'approve' ? 'Approving…' : 'Approve'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLeaveIndex({ employees, leaveTypes, weekStart, weekEnd, filters, stats }: Props) {

    const dates = buildDateRange(weekStart, weekEnd);

    // Filters state
    const [search,   setSearch]   = useState(filters.search ?? '');
    const [typeId,   setTypeId]   = useState(filters.leave_type_id ?? '');
    const [status,   setStatus]   = useState(filters.status ?? '');
    const [viewing,  setViewing]  = useState<(LeaveBar & { employee: string; email: string }) | null>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    function navigate(direction: 'prev' | 'next') {
        const d = new Date(weekStart + 'T00:00:00');
        d.setDate(d.getDate() + (direction === 'next' ? 11 : -11));
        applyFilters({ week_start: d.toISOString().slice(0, 10) });
    }

    function applyFilters(overrides: Record<string, string> = {}) {
        router.get('/admin/leave', {
            ...(search   ? { search }         : {}),
            ...(typeId   ? { leave_type_id: typeId } : {}),
            ...(status   ? { status }          : {}),
            week_start: weekStart,
            ...overrides,
        }, { preserveState: true, preserveScroll: true });
    }

    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => applyFilters(), 400);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [search, typeId, status]);

    function handleApprove(id: number, remarks: string) {
        router.post(`/admin/leave/${id}/approve`, { remarks }, {
            preserveScroll: true,
            onSuccess: () => setViewing(null),
        });
    }

    function handleDeny(id: number, remarks: string) {
        router.post(`/admin/leave/${id}/deny`, { remarks }, {
            preserveScroll: true,
            onSuccess: () => setViewing(null),
        });
    }

    function openLeave(leave: LeaveBar, employee: string, email: string) {
        setViewing({ ...leave, employee, email });
    }

    // Compute bar position and width (in grid columns) for a leave bar
    function barStyle(leave: LeaveBar) {
        const start = leave.start_date < weekStart ? weekStart : leave.start_date;
        const end   = leave.end_date   > weekEnd   ? weekEnd   : leave.end_date;
        const colStart = dates.indexOf(start);
        const colEnd   = dates.indexOf(end);
        if (colStart === -1 || colEnd === -1) return null;
        return { colStart, colSpan: colEnd - colStart + 1 };
    }

    const COL_W = 64; // px per day column

    return (
        <AppLayout>
            <Head title="Leave Management" />

            {viewing && (
                <DetailModal
                    leave={viewing}
                    onClose={() => setViewing(null)}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                />
            )}

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full">

                {/* Page header */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            Leave Management
                        </h1>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard label="Pending requests"  value={stats.pending}        icon={<Clock className="h-6 w-6" />}       color="bg-green-50 border-green-200"  iconColor="text-green-600" />
                    <StatCard label="On leave today"    value={stats.on_leave_today} icon={<Users className="h-6 w-6" />}       color="bg-green-50 border-green-200"      iconColor="text-green-600" />
                    <StatCard label="Approved"    value={stats.approved}       icon={<CheckCircle2 className="h-6 w-6"/>} color="bg-green-50 border-green-200"  iconColor="text-green-600" />
                    <StatCard label="Denied"      value={stats.denied}         icon={<XCircle className="h-6 w-6" />}     color="bg-green-50 border-green-200"      iconColor="text-green-600" />
                </div>

                {/* Filters */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 px-4 py-3 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search Employee"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                        />
                    </div>

                    {/* Leave type */}
                    <select
                        value={typeId}
                        onChange={e => setTypeId(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-white">
                        <option value="">All Leave Types</option>
                        {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    {/* Status */}
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-white">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                    </select>

                    {/* Week navigation */}
                    <div className="flex items-center gap-1 ml-auto">
                        <button onClick={() => navigate('prev')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 px-2 whitespace-nowrap">
                            {fmt(weekStart, { month: 'short', day: 'numeric' })} – {fmt(weekEnd, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button onClick={() => navigate('next')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {leaveTypes.map(t => {
                        const c = TYPE_COLORS[t.code] ?? DEFAULT_COLOR;
                        return (
                            <span key={t.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <span className={`h-2 w-4 rounded-sm ${c.bar}`} />
                                {t.name}
                            </span>
                        );
                    })}
                </div>

                {/* Gantt Table */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <div style={{ minWidth: `${200 + dates.length * COL_W}px` }}>

                            {/* Date header row */}
                            <div className="flex border-b border-gray-200 bg-gray-50">
                                {/* Employee column header */}
                                <div className="shrink-0 w-48 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
                                    Employee
                                </div>
                                {/* Date columns */}
                                {dates.map(date => (
                                    <div
                                        key={date}
                                        style={{ width: COL_W }}
                                        className={`shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-100 last:border-0
                                            ${isWeekend(date) ? 'bg-gray-100' : ''}
                                            ${isToday(date) ? 'bg-green-50' : ''}`}>
                                        <span className={`text-[10px] font-medium uppercase ${isToday(date) ? 'text-green-600' : 'text-gray-400'}`}>
                                            {fmt(date, { weekday: 'short' })}
                                        </span>
                                        <span className={`text-sm font-bold ${isToday(date) ? 'text-green-700' : isWeekend(date) ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {fmt(date, { day: 'numeric' })}
                                        </span>
                                        <span className={`text-[9px] ${isToday(date) ? 'text-green-500' : 'text-gray-400'}`}>
                                            {fmt(date, { month: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Employee rows */}
                            {employees.length === 0 ? (
                                <div className="flex items-center justify-center py-16 text-sm text-gray-400 italic">
                                    No employees with leave requests found for this period.
                                </div>
                            ) : (
                                employees.map(emp => (
                                    <div key={emp.id} className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors min-h-14">

                                        {/* Employee info */}
                                        <div className="shrink-0 w-48 px-4 py-3 flex items-center gap-2 border-r border-gray-200">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                                                {emp.avatar
                                                    ? <img src={emp.avatar} className="h-8 w-8 rounded-full object-cover" alt="" />
                                                    : emp.name.charAt(0)
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 truncate">{emp.name}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{emp.email}</p>
                                            </div>
                                        </div>

                                        {/* Date grid + leave bars */}
                                        <div className="relative flex flex-1">
                                            {/* Grid lines */}
                                            {dates.map(date => (
                                                <div
                                                    key={date}
                                                    style={{ width: COL_W }}
                                                    className={`shrink-0 border-r border-gray-100 last:border-0
                                                        ${isWeekend(date) ? 'bg-gray-50' : ''}
                                                        ${isToday(date) ? 'bg-green-50/40' : ''}`}
                                                />
                                            ))}

                                            {/* Absolute-positioned leave bars */}
                                            {emp.leaves.map(leave => {
                                                const pos = barStyle(leave);
                                                if (!pos) return null;
                                                const color = TYPE_COLORS[leave.type_code] ?? DEFAULT_COLOR;
                                                const isPending = leave.status === 'pending';

                                                return (
                                                    <button
                                                        key={leave.id}
                                                        title={`${leave.type} — ${leave.status}`}
                                                        onClick={() => openLeave(leave, emp.name, emp.email)}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${pos.colStart * COL_W + 3}px`,
                                                            width: `${pos.colSpan * COL_W - 6}px`,
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                        }}
                                                        className={`
                                                            h-7 rounded-md flex items-center px-2 gap-1.5 text-white
                                                            text-[10px] font-semibold truncate cursor-pointer
                                                            hover:brightness-95 active:scale-[0.98] transition-all shadow-sm
                                                            ${color.bar}
                                                            ${isPending ? 'opacity-80 border-2 border-dashed border-white/60' : ''}
                                                        `}>
                                                        {isPending && <Clock className="h-2.5 w-2.5 shrink-0" />}
                                                        <span className="truncate">{leave.type_code}</span>
                                                        <span className="ml-auto shrink-0 opacity-80">{leave.days}d</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Legend for status patterns */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-6 rounded bg-amber-400 border-2 border-dashed border-white/60 opacity-80" />
                        Pending approval
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-6 rounded bg-green-400" />
                        Approved
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-6 rounded bg-red-300" />
                        Denied
                    </span>
                </div>
            </div>
        </AppLayout>
    );
}