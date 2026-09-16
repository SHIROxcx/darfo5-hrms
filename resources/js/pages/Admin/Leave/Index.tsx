import { Head, router } from '@inertiajs/react';
import {
    Search, ChevronLeft, ChevronRight, Check, X, Clock,
    CheckCircle2, XCircle, Ban, CalendarDays,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveTypeOption { id: number; name: string; code: string; }

interface TodayStats {
    on_leave_today: number;
}

interface Scoreboard {
    pending: number;
    approved: number;
    completed: number;
    denied: number;
}

interface DayLeaveEntry { id: number; employee: string; photo: string | null; leave_type: string; type_code: string; }

interface CalendarData {
    month: string;
    monthLabel: string;
    leavesByDate: Record<string, DayLeaveEntry[]>;
    holidays: Record<string, string>;
}

interface UpcomingLeave {
    id: number; employee: string; photo: string | null;
    leave_type: string; type_code: string; start_date: string; end_date: string;
}

type LeaveStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

interface ActivityRow {
    id: number;
    employee: string;
    email: string;
    photo: string | null;
    employee_number: string | null;
    job_title: string | null;
    leave_type_id: number;
    leave_type: string;
    type_code: string;
    submit_date: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string | null;
    remarks: string | null;
    status: LeaveStatus;
}

interface Props {
    stats: TodayStats;
    scoreboard: Scoreboard;
    calendar: CalendarData;
    upcomingLeaves: UpcomingLeave[];
    activity: ActivityRow[];
    leaveTypes: LeaveTypeOption[];
    totalEmployees: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bar: string; label: string; dot: string }> = {
    VL:    { bar: 'bg-green-500',   label: 'text-green-700',   dot: 'bg-green-500' },
    SL:    { bar: 'bg-sky-400',     label: 'text-sky-700',     dot: 'bg-sky-400' },
    ML:    { bar: 'bg-pink-400',    label: 'text-pink-700',    dot: 'bg-pink-400' },
    PL:    { bar: 'bg-amber-400',   label: 'text-amber-700',   dot: 'bg-amber-400' },
    WL:    { bar: 'bg-purple-400',  label: 'text-purple-700',  dot: 'bg-purple-400' },
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

const STATUS_PILL: Record<string, string> = {
    approved:  'bg-green-600 text-white',
    denied:    'bg-red-500 text-white',
    cancelled: 'bg-gray-200 text-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
    approved: 'Approved', denied: 'Denied', cancelled: 'Cancelled', pending: 'Pending',
};

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function fmtDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateShort(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtPeriod(start: string, end: string): string {
    if (start === end) return fmtDate(start);
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    if (sameMonth) {
        return `${s.getDate()}–${e.getDate()} ${e.toLocaleDateString('en-GB', { month: 'short' })} ${e.getFullYear()}`;
    }
    return `${fmtDateShort(start)} – ${fmtDate(end)}`;
}

function buildQuery(month: string): Record<string, string> {
    return { month };
}

function getMonthGrid(monthStr: string): (string | null)[] {
    const [year, month] = monthStr.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
}

function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name, photo, className = 'h-9 w-9 text-[11px]' }: { name: string; photo?: string | null; className?: string }) {
    if (photo) {
        return <img src={`/storage/${photo}`} alt={name} className={`${className} rounded-full object-cover border border-gray-200 shrink-0`} />;
    }
    return (
        <div className={`${className} rounded-full bg-green-700 text-white flex items-center justify-center font-semibold shrink-0`}>
            {initials(name)}
        </div>
    );
}

// ─── Leave requests scoreboard ──────────────────────────────────────────────

function LeaveScoreboard({ stats, scoreboard, totalEmployees }: {
    stats: TodayStats; scoreboard: Scoreboard; totalEmployees: number;
}) {
    const requestTotal = scoreboard.pending + scoreboard.approved + scoreboard.completed + scoreboard.denied;
    const requestTotalSafe = requestTotal || 1;
    const onLeavePct = totalEmployees > 0 ? Math.round((stats.on_leave_today / totalEmployees) * 100) : 0;

    const tiles = [
        { key: 'on_leave_today', label: 'On Leave Today', value: stats.on_leave_today, pct: onLeavePct },
        { key: 'pending',   label: 'Pending',   value: scoreboard.pending,   pct: Math.round((scoreboard.pending / requestTotalSafe) * 100) },
        { key: 'approved',  label: 'Approved',  value: scoreboard.approved,  pct: Math.round((scoreboard.approved / requestTotalSafe) * 100) },
        { key: 'completed', label: 'Completed', value: scoreboard.completed, pct: Math.round((scoreboard.completed / requestTotalSafe) * 100) },
        { key: 'denied',    label: 'Denied',    value: scoreboard.denied,    pct: Math.round((scoreboard.denied / requestTotalSafe) * 100) },
    ];

    return (
        <div className="rounded-2xl bg-green-600 border border-green-600 text-white shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-white uppercase tracking-widest">Leave Requests Scoreboard</p>
                <p className="text-[11px]">{requestTotal.toLocaleString()} total requests</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-white/60">
                {tiles.map(t => (
                    <div key={t.key} className="px-4 py-5 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-bold tabular-nums text-white">{t.value.toLocaleString()}</span>
                        <span className="text-[11px] font-semibold text-white uppercase tracking-wide mt-1.5">{t.label}</span>
                        <span className="text-[10px] text-white mt-0.5">{t.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Day popover ────────────────────────────────────────────────────────────

const DAY_POPOVER_MAX = 5;

function DayPopover({ date, entries, holidayName, align, onClose, innerRef }: {
    date: string; entries: DayLeaveEntry[]; holidayName: string | null; align: 'left' | 'center' | 'right'; onClose: () => void;
    innerRef: React.RefObject<HTMLDivElement | null>;
}) {
    const visible = entries.slice(0, DAY_POPOVER_MAX);
    const extra   = entries.length - visible.length;
    const label   = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Anchor to whichever edge keeps the popover inside the card instead of
    // always centering, which overflows into neighboring cards near the sides.
    const position = align === 'left'
        ? 'left-0'
        : align === 'right'
            ? 'right-0'
            : 'left-1/2 -translate-x-1/2';

    return (
        <div
            ref={innerRef}
            className={`absolute z-20 top-full mt-1.5 ${position} w-56 rounded-xl bg-white border border-gray-200 shadow-lg p-3 text-left`}
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            {holidayName && (
                <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                    <p className="text-xs font-medium text-orange-700 truncate">{holidayName}</p>
                </div>
            )}
            {entries.length > 0 && (
                <ul className="space-y-2">
                    {visible.map(e => {
                        const color = TYPE_COLORS[e.type_code] ?? DEFAULT_COLOR;
                        return (
                            <li key={e.id} className="flex items-center gap-2">
                                <Avatar name={e.employee} photo={e.photo} className="h-6 w-6 text-[9px]" />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{e.employee}</p>
                                    <p className={`text-[10px] truncate ${color.label}`}>{e.leave_type}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            {extra > 0 && <p className="text-[10px] text-gray-400 mt-2">+{extra} more</p>}
        </div>
    );
}

// ─── Month calendar ─────────────────────────────────────────────────────────

function MonthCalendar({ calendar, onNavigate, isNavigating }: {
    calendar: CalendarData; onNavigate: (dir: 'prev' | 'next') => void; isNavigating: boolean;
}) {
    const cells = getMonthGrid(calendar.month);
    const today = todayStr();
    const [openDate, setOpenDate] = useState<string | null>(null);
    // Attached to whichever DayPopover is currently open (only one at a time),
    // so the outside-click check below is scoped to the popup itself — not the
    // whole calendar card — and closes it on any click that isn't inside it.
    const popoverRef = useRef<HTMLDivElement>(null);

    const [renderedMonth, setRenderedMonth] = useState(calendar.month);
    if (calendar.month !== renderedMonth) {
        setRenderedMonth(calendar.month);
        setOpenDate(null);
    }

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpenDate(null);
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">{calendar.monthLabel}</p>
                <div className="flex items-center gap-1">
                    <button disabled={isNavigating} onClick={() => onNavigate('prev')}
                        className="h-6 w-6 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-default">
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button disabled={isNavigating} onClick={() => onNavigate('next')}
                        className="h-6 w-6 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-default">
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-400">{d}</span>
                ))}
                {cells.map((date, i) => {
                    if (!date) return <span key={i} />;
                    const day = Number(date.slice(-2));
                    const isToday = date === today;
                    const entries = calendar.leavesByDate[date] ?? [];
                    const hasLeave = entries.length > 0;
                    const holidayName = calendar.holidays[date] ?? null;
                    const isHoliday = holidayName !== null;
                    const isClickable = hasLeave || isHoliday;
                    const isOpen = openDate === date;
                    const col = i % 7;
                    const isWeekend = col === 0 || col === 6;
                    const align = col <= 1 ? 'left' : col >= 5 ? 'right' : 'center';
                    return (
                        <div key={date} className="relative flex flex-col items-center gap-0.5 sm:gap-1 py-0.5">
                            <button
                                type="button"
                                onClick={() => isClickable && setOpenDate(isOpen ? null : date)}
                                aria-label={[
                                    String(day),
                                    holidayName,
                                    hasLeave ? `${entries.length} on leave` : null,
                                ].filter(Boolean).join(', ')}
                                className={`flex aspect-square w-full max-w-9 sm:max-w-10 lg:max-w-11 xl:max-w-12 items-center justify-center rounded-full text-xs sm:text-sm transition
                                    ${isToday ? 'bg-green-600 text-white font-bold' : isHoliday ? 'text-orange-600 font-semibold' : 'text-gray-600'}
                                    ${isClickable && !isToday ? 'hover:bg-gray-100 cursor-pointer' : isClickable ? 'cursor-pointer' : 'cursor-default'}`}>
                                {day}
                            </button>
                            <span className="flex items-center gap-0.5 h-1.5 sm:h-2">
                                <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${hasLeave && !isToday && !isWeekend ? 'bg-green-500' : 'bg-transparent'}`} />
                                <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isHoliday && !isToday ? 'bg-orange-500' : 'bg-transparent'}`} />
                            </span>
                            {isOpen && <DayPopover date={date} entries={entries} holidayName={holidayName} align={align} onClose={() => setOpenDate(null)} innerRef={popoverRef} />}
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" /> On leave</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-500" /> Holiday</span>
                <span className="text-gray-400">— tap a date for details</span>
            </div>
        </div>
    );
}

// ─── Upcoming leaves ────────────────────────────────────────────────────────

function UpcomingLeavesCard({ items }: { items: UpcomingLeave[] }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Employee Leaves</p>
            </div>
            <ul className="divide-y divide-gray-50 flex-1 min-h-0 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                    <li className="px-5 py-8 text-center text-xs text-gray-400 italic">No upcoming leave.</li>
                ) : items.map(it => {
                    const color = TYPE_COLORS[it.type_code] ?? DEFAULT_COLOR;
                    return (
                        <li key={it.id} className="flex items-center gap-3 px-5 py-2.5">
                            <Avatar name={it.employee} photo={it.photo} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{it.employee}</p>
                                <p className={`text-xs truncate ${color.label}`}>{it.leave_type} · {fmtPeriod(it.start_date, it.end_date)}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// ─── Detail modal ───────────────────────────────────────────────────────────

function DetailModal({ leave, onClose, onApprove, onDeny }: {
    leave: ActivityRow;
    onClose: () => void;
    onApprove: (id: number, remarks: string) => void;
    onDeny: (id: number, remarks: string) => void;
}) {
    const [remarks, setRemarks] = useState('');
    const [acting, setActing]   = useState<'approve' | 'deny' | null>(null);
    const color = TYPE_COLORS[leave.type_code] ?? DEFAULT_COLOR;

    function handleApprove() { setActing('approve'); onApprove(leave.id, remarks); }
    function handleDeny()    { setActing('deny');    onDeny(leave.id, remarks); }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col">

                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color.dot}`} />
                        <h3 className="font-semibold text-green-800 text-sm">{leave.leave_type}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <Avatar name={leave.employee} photo={leave.photo} className="h-9 w-9 text-sm" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{leave.employee}</p>
                            <p className="text-xs text-gray-500 truncate">{leave.job_title ?? leave.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">From</p>
                            <p className="text-sm font-bold text-gray-800">{fmtDateShort(leave.start_date)}</p>
                        </div>
                        <div className="rounded-xl border border-green-100 bg-green-50 p-3 flex flex-col items-center justify-center">
                            <p className="text-xl font-bold text-green-700">{leave.days}</p>
                            <p className="text-[10px] text-green-600">day{leave.days === 1 ? '' : 's'}</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">To</p>
                            <p className="text-sm font-bold text-gray-800">{fmtDateShort(leave.end_date)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[leave.status]}`}>
                            {STATUS_ICON[leave.status]}
                            {STATUS_LABEL[leave.status]}
                        </span>
                        <span className="text-xs text-gray-400">Filed: {fmtDate(leave.submit_date)}</span>
                    </div>

                    {leave.reason && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Reason</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{leave.reason}</p>
                        </div>
                    )}

                    {leave.remarks && (
                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                            <p className="text-xs font-semibold text-amber-600 mb-0.5">HR Remarks</p>
                            <p className="text-sm text-amber-800">{leave.remarks}</p>
                        </div>
                    )}

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

                {leave.status === 'pending' && (
                    <div className="flex justify-end gap-2 border-t px-6 py-4">
                        <button
                            disabled={acting !== null}
                            onClick={handleDeny}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                            <XCircle className="h-3.5 w-3.5" />
                            {acting === 'deny' ? 'Denying…' : 'Deny'}
                        </button>
                        <button
                            disabled={acting !== null}
                            onClick={handleApprove}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" />
                            {acting === 'approve' ? 'Approving…' : 'Approve'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminLeaveIndex({
    stats, scoreboard, calendar, upcomingLeaves,
    activity, leaveTypes, totalEmployees,
}: Props) {
    const [search, setSearch] = useState('');
    const [typeId, setTypeId] = useState('');
    const [status, setStatus] = useState('');
    const [sort,   setSort]   = useState('newest');
    const [viewing, setViewing]   = useState<ActivityRow | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [isNavigatingMonth, setIsNavigatingMonth] = useState(false);

    // Kept in local state (rather than read straight from the `calendar` prop)
    // so a `notif:leave-calendar-updated` broadcast — fired for every admin tab
    // whenever anyone approves or cancels an approved leave — can patch it live,
    // without an Inertia round-trip. Server-driven changes (month navigation,
    // any other full page visit) simply overwrite it via the effect below,
    // which stays authoritative.
    const [localCalendar, setLocalCalendar] = useState<CalendarData>(calendar);

    // Same idea as `localCalendar` above, but for the scoreboard tiles and the
    // activity table: kept in local state so a new submission or a review (by
    // this admin in another tab, or by a different admin altogether) can patch
    // them live via broadcasts, without an Inertia round-trip.
    const [localScoreboard, setLocalScoreboard] = useState<Scoreboard>(scoreboard);
    const [localActivity,   setLocalActivity]   = useState<ActivityRow[]>(activity);

    useEffect(() => {
        setLocalCalendar(calendar);
    }, [calendar]);

    useEffect(() => {
        setLocalScoreboard(scoreboard);
    }, [scoreboard]);

    useEffect(() => {
        setLocalActivity(activity);
    }, [activity]);

    useEffect(() => {
        function onLeaveCalendarUpdated(e: Event) {
            const { action, dates, entry } = (e as CustomEvent<{
                action: 'added' | 'removed'; dates: string[]; entry: DayLeaveEntry;
            }>).detail;

            setLocalCalendar(prev => {
                const relevantDates = dates.filter(d => d.startsWith(prev.month));
                if (relevantDates.length === 0) return prev;

                const leavesByDate = { ...prev.leavesByDate };
                for (const date of relevantDates) {
                    const existing = leavesByDate[date] ?? [];
                    if (action === 'added') {
                        if (existing.some(entr => entr.id === entry.id)) continue;
                        leavesByDate[date] = [...existing, entry];
                    } else {
                        leavesByDate[date] = existing.filter(entr => entr.id !== entry.id);
                    }
                }
                return { ...prev, leavesByDate };
            });
        }
        window.addEventListener('notif:leave-calendar-updated', onLeaveCalendarUpdated);
        return () => window.removeEventListener('notif:leave-calendar-updated', onLeaveCalendarUpdated);
    }, []);

    // New leave request submitted (any employee, any tab) — prepend to the
    // activity table and bump the pending tile.
    useEffect(() => {
        function onSubmitted(e: Event) {
            const row = (e as CustomEvent<ActivityRow>).detail;
            setLocalActivity(prev => prev.some(r => r.id === row.id) ? prev : [row, ...prev]);
            setLocalScoreboard(prev => ({ ...prev, pending: prev.pending + 1 }));
        }
        window.addEventListener('notif:leave-request-submitted', onSubmitted);
        return () => window.removeEventListener('notif:leave-request-submitted', onSubmitted);
    }, []);

    // A leave request was reviewed (by this admin or another) — patch its row's
    // status/remarks in place and move it out of the pending tile.
    useEffect(() => {
        function onReviewed(e: Event) {
            const { id, status: newStatus, remarks } = (e as CustomEvent<{
                id: number; status: LeaveStatus; remarks: string | null;
            }>).detail;

            setLocalActivity(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, remarks } : r));
            setLocalScoreboard(prev => {
                const next = { ...prev, pending: Math.max(0, prev.pending - 1) };
                if (newStatus === 'approved') next.approved += 1;
                else if (newStatus === 'denied') next.denied += 1;
                return next;
            });
        }
        window.addEventListener('notif:leave-request-reviewed-admin', onReviewed);
        return () => window.removeEventListener('notif:leave-request-reviewed-admin', onReviewed);
    }, []);

    // Employee cancelled their own request — flip its row to "cancelled" in
    // place (so it drops out of the pending tile and its Approve/Deny buttons
    // disappear), and if an admin is mid-review of that exact request, patch
    // the open modal too so it can't be approved/denied out from under the
    // employee. This is the guard the real-time wiring exists for.
    useEffect(() => {
        function onCancelled(e: Event) {
            const { id, previous_status, employee } = (e as CustomEvent<{
                id: number; previous_status: 'pending' | 'approved'; employee: string;
            }>).detail;

            setLocalActivity(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
            setLocalScoreboard(prev => {
                const next = { ...prev };
                if (previous_status === 'pending') next.pending = Math.max(0, prev.pending - 1);
                else next.approved = Math.max(0, prev.approved - 1);
                return next;
            });

            setViewing(prev => {
                if (!prev || prev.id !== id) return prev;
                Toast.fire({ icon: 'warning', title: `${employee} just cancelled this request.` });
                return { ...prev, status: 'cancelled' };
            });
        }
        window.addEventListener('notif:leave-request-cancelled', onCancelled);
        return () => window.removeEventListener('notif:leave-request-cancelled', onCancelled);
    }, []);

    // Deep link from a "new leave request" notification: /admin/leave?highlight={id}
    // opens the review modal for that request straight away.
    useEffect(() => {
        const id = Number(new URLSearchParams(window.location.search).get('highlight'));
        if (!id) return;
        const row = localActivity.find(r => r.id === id);
        if (row) setViewing(row);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pure client-side search/filter/sort over the full `activity` list — same
    // instant, no-debounce, no-reload pattern as the employee registry and the
    // reference-data tables. `activity` already arrives newest-first from the
    // server, so "Newest first" needs no re-sort.
    const filteredActivity = localActivity.filter(row => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term
            || row.employee.toLowerCase().includes(term)
            || (row.employee_number ?? '').toLowerCase().includes(term);
        const matchesType = !typeId || row.leave_type_id === Number(typeId);
        const matchesStatus = !status || row.status === status;
        return matchesSearch && matchesType && matchesStatus;
    });
    const sortedActivity = (() => {
        switch (sort) {
            case 'oldest':   return [...filteredActivity].reverse();
            case 'duration': return [...filteredActivity].sort((a, b) => b.days - a.days);
            case 'name':     return [...filteredActivity].sort((a, b) => a.employee.localeCompare(b.employee));
            default:         return filteredActivity;
        }
    })();

    function navigateMonth(direction: 'prev' | 'next') {
        const [year, month] = calendar.month.split('-').map(Number);
        const d = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
        const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        router.get('/admin/leave', buildQuery(newMonth), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            // Only the calendar prop changes when switching months — everything else
            // on this page (scoreboard, activity table, etc.) is wrapped in a closure
            // on the backend, so Inertia skips those queries entirely for this request.
            only: ['calendar'],
            // Suppress the global top-loading bar; a small in-place spinner over just
            // the calendar (below) gives feedback without implying a full page reload.
            showProgress: false,
            onStart: () => setIsNavigatingMonth(true),
            onFinish: () => setIsNavigatingMonth(false),
        });
    }

    function handleApprove(id: number, remarks: string) {
        router.post(`/admin/leave/${id}/approve`, { remarks }, { preserveScroll: true, onSuccess: () => setViewing(null) });
    }
    function handleDeny(id: number, remarks: string) {
        router.post(`/admin/leave/${id}/deny`, { remarks }, { preserveScroll: true, onSuccess: () => setViewing(null) });
    }

    const pendingIdsVisible = sortedActivity.filter(r => r.status === 'pending').map(r => r.id);
    const allPendingSelected = pendingIdsVisible.length > 0 && pendingIdsVisible.every(id => selected.includes(id));

    function toggleSelectAll() {
        setSelected(allPendingSelected ? [] : pendingIdsVisible);
    }
    function toggleRow(id: number) {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    async function bulkAct(action: 'approve' | 'deny') {
        setBulkBusy(true);
        for (const id of selected) {
            await new Promise<void>(resolve => {
                router.post(`/admin/leave/${id}/${action}`, {}, {
                    preserveScroll: true, preserveState: true, onFinish: () => resolve(),
                });
            });
        }
        setSelected([]);
        setBulkBusy(false);
        Toast.fire({ icon: 'success', title: action === 'approve' ? 'Selected requests approved' : 'Selected requests denied' });
    }

    return (
        <AppLayout>
            <Head title="Leave Management" />

            {viewing && (
                <DetailModal leave={viewing} onClose={() => setViewing(null)} onApprove={handleApprove} onDeny={handleDeny} />
            )}

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full space-y-5">

                <div>
                    <h1 className="text-2xl font-bold text-green-700">Leave Management</h1>
                    <p className="text-sm text-gray-500 mt-1">See who's out today and review requests.</p>
                </div>

                {/* Today's snapshot */}
                <LeaveScoreboard stats={stats} scoreboard={localScoreboard} totalEmployees={totalEmployees} />

                {/* Calendar + upcoming */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <MonthCalendar calendar={localCalendar} onNavigate={navigateMonth} isNavigating={isNavigatingMonth} />
                    <UpcomingLeavesCard items={upcomingLeaves} />
                </div>

                {/* Leave activity */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-gray-800 mr-auto flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-green-700" /> Leave Activity
                        </p>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search employee, ID…"
                                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 w-48"
                            />
                        </div>

                        <select
                            value={typeId}
                            onChange={e => setTypeId(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-white">
                            <option value="">All Types</option>
                            {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>

                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-white">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                        </select>

                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-white">
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="duration">Longest duration</option>
                            <option value="name">Name (A–Z)</option>
                        </select>
                    </div>

                    {selected.length > 0 && (
                        <div className="flex items-center justify-between bg-green-50 border-b border-green-100 px-5 py-2.5">
                            <p className="text-sm text-green-800 font-medium">{selected.length} request{selected.length === 1 ? '' : 's'} selected</p>
                            <div className="flex gap-2">
                                <button disabled={bulkBusy} onClick={() => bulkAct('deny')}
                                    className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                                    Deny selected
                                </button>
                                <button disabled={bulkBusy} onClick={() => bulkAct('approve')}
                                    className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50">
                                    {bulkBusy ? 'Working…' : 'Approve selected'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto overflow-y-auto max-h-72">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-white">
                                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                    <th className="pl-5 pr-2 py-2.5 font-semibold w-8">
                                        <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAll}
                                            disabled={pendingIdsVisible.length === 0}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer disabled:opacity-30" />
                                    </th>
                                    <th className="px-3 py-2.5 font-semibold">Name</th>
                                    <th className="px-3 py-2.5 font-semibold">Job Title</th>
                                    <th className="px-3 py-2.5 font-semibold">Type</th>
                                    <th className="px-3 py-2.5 font-semibold">Submit Date</th>
                                    <th className="px-3 py-2.5 font-semibold">Period</th>
                                    <th className="px-3 py-2.5 font-semibold">Duration</th>
                                    <th className="px-3 py-2.5 font-semibold">Reason</th>
                                    <th className="px-5 py-2.5 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedActivity.length === 0 ? (
                                    <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400 italic">No leave requests match these filters.</td></tr>
                                ) : sortedActivity.map(row => {
                                    const color = TYPE_COLORS[row.type_code] ?? DEFAULT_COLOR;
                                    const isPending = row.status === 'pending';
                                    return (
                                        <tr key={row.id} className={`border-t border-gray-50 hover:bg-gray-50/60 transition-colors ${selected.includes(row.id) ? 'bg-green-50/40' : ''}`}>
                                            <td className="pl-5 pr-2 py-2.5">
                                                <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)}
                                                    disabled={!isPending}
                                                    className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer disabled:opacity-20" />
                                            </td>
                                            <td className="px-3 py-2.5 cursor-pointer" onClick={() => setViewing(row)}>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar name={row.employee} photo={row.photo} className="h-8 w-8 text-[10px]" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-800 truncate">{row.employee}</p>
                                                        {row.employee_number && <p className="text-[11px] text-gray-400">{row.employee_number}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap cursor-pointer" onClick={() => setViewing(row)}>
                                                {row.job_title ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap cursor-pointer" onClick={() => setViewing(row)}>
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${color.label}`}>
                                                    <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                                                    {row.leave_type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap cursor-pointer" onClick={() => setViewing(row)}>
                                                {fmtDate(row.submit_date)}
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap cursor-pointer" onClick={() => setViewing(row)}>
                                                {fmtPeriod(row.start_date, row.end_date)}
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap cursor-pointer" onClick={() => setViewing(row)}>
                                                {row.days} Day{row.days === 1 ? '' : 's'}
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500 max-w-40 truncate cursor-pointer" onClick={() => setViewing(row)}>
                                                {row.reason ?? '—'}
                                            </td>
                                            <td className="px-5 py-2.5">
                                                {isPending ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setViewing(row)}
                                                            title="Review to deny"
                                                            className="h-6 w-6 cursor-pointer rounded-full border border-red-200 bg-white text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setViewing(row)}
                                                            title="Review to approve"
                                                            className="flex cursor-pointer items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-600 hover:text-white transition">
                                                            <Check className="h-3 w-3" /> Approve
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[row.status]}`}>
                                                            {STATUS_LABEL[row.status]}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {sortedActivity.length > 0 && (
                        <div className="text-sm text-gray-500 px-5 py-3.5 border-t border-gray-100">
                            <p>{sortedActivity.length} request{sortedActivity.length === 1 ? '' : 's'}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
