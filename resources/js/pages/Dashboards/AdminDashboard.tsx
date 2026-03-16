import AppLayout from "@/layouts/app-layout";
import { Head, router } from '@inertiajs/react';
import {
    Users, ShieldCheck, Briefcase, SquareUserRound,
    Megaphone, Zap, ChevronRight, Plus, X, Tag,
    FileText, Calendar,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Announcement {
    id: number;
    title: string;
    body: string;
    date: string;
    tag: string;
    tagColor: string;
}

interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
    stats: {
        total: number;
        permanent: number;
        job_order: number;
        cos: number;
    };
    announcements: Announcement[];
}

// ── Greeting ─────────────────────────────────────────────────────────────────

const MORNING_GREETINGS   = ['Good morning','Rise and shine','Starting the day strong','A wonderful morning to you','Great morning to see you'];
const AFTERNOON_GREETINGS = ['Afternoon','Good afternoon','Enjoy the rest of your day','A bright afternoon to you','You\'re doing great today','Halfway through the day'];
const EVENING_GREETINGS   = ['Evening','Hey, good evening!','Good evening','Great job today','Almost time to rest','How\'s your shift going?','Good to see you this evening','Great work today','Wrapping up for the day','Winding down for the evening'];

function getGreeting(): { text: string; emoji: string } {
    const now  = new Date();
    const hour = now.getHours();
    const pool = hour < 12 ? MORNING_GREETINGS : hour < 18 ? AFTERNOON_GREETINGS : EVENING_GREETINGS;
    const emoji = hour < 12 ? '🌤️' : hour < 18 ? '☀️' : '🌙';
    return { text: pool[now.getTime() % pool.length], emoji };
}

// ── Tag colour map ────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
    Reminder: 'bg-yellow-100 text-yellow-700',
    Policy:   'bg-blue-100 text-blue-700',
    Health:   'bg-green-100 text-green-700',
    Holiday:  'bg-red-100 text-red-700',
    General:  'bg-gray-100 text-gray-600',
};

const TAGS = ['Reminder', 'Policy', 'Health', 'Holiday', 'General'];

// ── Max description length ────────────────────────────────────────────────────

const MAX_BODY = 200;

// ── Sub-components ────────────────────────────────────────────────────────────

interface ScoreCardProps { label: string; value: number; icon: React.ReactNode; color: string; bg: string; }
function ScoreCard({ label, value, icon, color, bg }: ScoreCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border border-green-200 ${bg}`}>
                <div className={color}>{icon}</div>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

interface QuickActionProps { label: string; href: string; }
function QuickActionItem({ label, href }: QuickActionProps) {
    return (
        <a href={href}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-green-50 hover:border-green-600 text-gray-700 hover:text-green-700 transition group">
            <div className="flex items-center gap-3 text-sm font-medium">
                <Zap className="h-4 w-4" />{label}
            </div>
            <ChevronRight className="h-4 w-4 transition" />
        </a>
    );
}

function AnnouncementItem({ title, body, date, tag, tagColor }: Omit<Announcement, 'id'>) {
    return (
        <div className="px-5 py-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                <span className="text-xs text-gray-400 shrink-0">{date}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-2 mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
        </div>
    );
}

// ── Post Announcement Modal ───────────────────────────────────────────────────

interface PostModalProps { onClose: () => void; onPosted: (a: Announcement) => void; }

function PostAnnouncementModal({ onClose, onPosted }: PostModalProps) {
    const [title,   setTitle]   = useState('');
    const [body,    setBody]    = useState('');
    const [date,    setDate]    = useState('');
    const [tag,     setTag]     = useState('General');
    const [saving,  setSaving]  = useState(false);
    const [errors,  setErrors]  = useState<Record<string, string>>({});
    const bodyLeft = MAX_BODY - body.length;
    const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600';

    function validate() {
        const e: Record<string, string> = {};
        if (!title.trim())        e.title = 'Title is required.';
        if (!body.trim())         e.body  = 'Description is required.';
        if (body.length > MAX_BODY) e.body = `Max ${MAX_BODY} characters.`;
        if (!date)                e.date  = 'Date is required.';
        return e;
    }

    function handleSubmit() {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        router.post('/announcements', { title, body, date, tag }, {
            preserveScroll: true,
            onSuccess: () => {
                // The real-time broadcast will prepend the item to both dashboards.
                // We close the modal here; the Echo listener handles the UI update.
                setSaving(false);
                onClose();
            },
            onError: (errs) => { setErrors(errs as Record<string, string>); setSaving(false); },
        });
    }

    // Close on backdrop click
    function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={handleBackdrop}
        >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-green-700" />
                        <h3 className="font-semibold text-green-800 text-sm">Post Announcement</h3>
                    </div>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">

                    {/* Title */}
                    <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <FileText className="h-3.5 w-3.5" /> Title
                        </label>
                        <input
                            value={title}
                            onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })); }}
                            className={inputCls}
                            placeholder="e.g. Submission of IPCR for Q1 2026"
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description + counter */}
                    <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Description</span>
                            <span className={bodyLeft < 20 ? 'text-red-500 font-semibold' : bodyLeft < 50 ? 'text-yellow-500' : 'text-gray-400'}>
                                {bodyLeft} / {MAX_BODY}
                            </span>
                        </label>
                        <textarea
                            value={body}
                            onChange={e => { setBody(e.target.value.slice(0, MAX_BODY)); setErrors(p => ({ ...p, body: '' })); }}
                            rows={4}
                            className={`${inputCls} resize-none`}
                            placeholder="Brief description of the announcement…"
                        />
                        {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <Calendar className="h-3.5 w-3.5" /> Announcement Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })); }}
                            className={inputCls}
                        />
                        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                    </div>

                    {/* Tag */}
                    <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <Tag className="h-3.5 w-3.5" /> Category
                        </label>
                        <select value={tag} onChange={e => setTag(e.target.value)} className={inputCls}>
                            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
                    >
                        {saving ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                </svg>
                                Posting…
                            </>
                        ) : 'Post Announcement'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard({ user, stats, announcements: initialAnnouncements }: Props) {
    const firstName                       = user.name.split(' ')[0];
    const { text: greeting, emoji }       = getGreeting();
    const timeString                      = new Date().toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements ?? []);
    const [showModal,     setShowModal]     = useState(false);

    // ── Real-time listener ────────────────────────────────────────────────────
    // The Echo subscription lives in app-sidebar-header (always-mounted).
    // It dispatches 'announcement:new' so we just listen to the window event.
    useEffect(() => {
        function onNew(e: Event) {
            const announcement = (e as CustomEvent<Announcement>).detail;
            setAnnouncements(prev => {
                if (prev.some(a => a.id === announcement.id)) return prev;
                return [announcement, ...prev];
            });
        }
        window.addEventListener('announcement:new', onNew);
        return () => window.removeEventListener('announcement:new', onNew);
    }, []);

    return (
        <AppLayout>
            <Head title="HR Admin Dashboard" />

            {/* Post Announcement Modal */}
            {showModal && (
                <PostAnnouncementModal
                    onClose={() => setShowModal(false)}
                    onPosted={(a) => setAnnouncements(prev => [a, ...prev])}
                />
            )}

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full mx-auto">

                {/* Greeting Header */}
                <div className="mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        <span className="text-green-700">{greeting}, </span>
                        <span className="text-orange-500">{firstName}!</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>{emoji}</span>
                        <span>{timeString}</span>
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Left — Score Cards + Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ScoreCard label="Total Employees"       value={stats.total}     icon={<Users className="h-6 w-6" />}          color="text-green-600" bg="bg-green-50" />
                            <ScoreCard label="Permanent Employees"   value={stats.permanent} icon={<ShieldCheck className="h-6 w-6" />}    color="text-green-600" bg="bg-green-50" />
                            <ScoreCard label="Job Order Employees"   value={stats.job_order} icon={<Briefcase className="h-6 w-6" />}      color="text-green-600" bg="bg-green-50" />
                            <ScoreCard label="Contractual Employees" value={stats.cos}       icon={<SquareUserRound className="h-6 w-6" />} color="text-green-600" bg="bg-green-50" />
                        </div>

                        <div>
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 ml-3">
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <QuickActionItem label="Manage Employees" href="/admin/employees" />
                                <QuickActionItem label="Leave Requests"   href="/admin/leave" />
                            </div>
                        </div>
                    </div>

                    {/* Right — Announcements */}
                    <div className="lg:col-span-1" id="announcements-panel">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                            {/* Panel header with + button */}
                            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-green-700" />
                                    <h2 className="text-sm font-semibold text-green-800">Announcements</h2>
                                </div>
                                <button
                                    onClick={() => setShowModal(true)}
                                    title="Post new announcement"
                                    className="flex cursor-pointer items-center justify-center h-7 w-7 rounded-full bg-green-600 text-white hover:bg-green-700 transition shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Announcement list */}
                            <div className="divide-y divide-gray-100 overflow-y-auto max-h-130">
                                {announcements.length === 0 ? (
                                    <div className="px-5 py-8 text-center text-xs text-gray-400">
                                        No announcements yet.
                                    </div>
                                ) : (
                                    announcements.map(item => (
                                        <AnnouncementItem
                                            key={item.id}
                                            title={item.title}
                                            body={item.body}
                                            date={item.date}
                                            tag={item.tag}
                                            tagColor={item.tagColor}
                                        />
                                    ))
                                )}
                            </div>

                            <div className="px-5 py-3 border-t text-center">
                                <button className="text-xs text-blue-600 hover:underline">
                                    View all announcements
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}