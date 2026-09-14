import AppLayout from "@/layouts/app-layout";
import { Head } from '@inertiajs/react';
import {
    TicketsPlane, BriefcaseMedical, Award, Activity, Heart,
    Megaphone, Clock, Monitor, Clock8, Clock12, Clock5,
    Paperclip, ExternalLink, FileText, Image, File, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface AttachmentFile { path: string; url: string; name: string; }

interface Announcement {
    id: number;
    title: string;
    body: string;
    date: string;
    tag: string;
    tagColor: string;
    attachments: AttachmentFile[];
    auto_delete: boolean;
    delete_after: string | null;
}


interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
    announcements: Announcement[];
}

// ── Greeting ─────────────────────────────────────────────────────────────────

const MORNING_GREETINGS   = ['Good morning','Rise and shine','Starting the day strong','A wonderful morning to you','Great morning to see you'];
const AFTERNOON_GREETINGS = ['Afternoon','Good afternoon','Enjoy the rest of your day','A bright afternoon to you',"You're doing great today",'Halfway through the day'];
const EVENING_GREETINGS   = ['Evening','Hey, good evening!','Good evening','Great job today','Almost time to rest',"How's your shift going?",'Good to see you this evening','Great work today','Wrapping up for the day','Winding down for the evening'];

const PREVIEW = 3;

function getGreeting(): string {
    const now  = new Date();
    const hour = now.getHours();
    const pool = hour < 12 ? MORNING_GREETINGS : hour < 18 ? AFTERNOON_GREETINGS : EVENING_GREETINGS;
    return pool[now.getTime() % pool.length];
}

// ── Static mock data (DTR + Properties) ───────────────────────────────────────

const dtrs = [
    { date: '2025-01-10', timeIn: '08:01 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '05:02 PM', remarks: '', late: false },
    { date: '2025-01-11', timeIn: '07:59 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '05:03 PM', remarks: '', late: false },
    { date: '2025-01-12', timeIn: '08:15 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '04:59 PM', remarks: 'Late', late: true },
    { date: '2025-01-13', timeIn: '08:05 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '05:00 PM', remarks: '', late: false },
    { date: '2025-12-08', timeIn: '00:00 AM', breakTime: '00:00 PM | 00:00 PM', timeOut: '00:00 PM', remarks: 'Holiday', late: false },
];

const properties = [
    { number: 'PE-001', description: 'Laptop Dell Latitude 3420', acquired: '2022-05-10', status: 'Serviceable' },
    { number: 'PE-002', description: 'HP LaserJet Printer',        acquired: '2021-08-15', status: 'For Repair' },
    { number: 'PE-003', description: 'Epson Scanner',              acquired: '2020-11-21', status: 'Serviceable' },
    { number: 'PE-004', description: 'Office Chair – Ergonomic',   acquired: '2023-01-02', status: 'Serviceable' },
    { number: 'PE-005', description: 'Projector – Acer',           acquired: '2023-02-18', status: 'Not Serviceable' },
];

function TimeInBadge({ time, late }: { time: string; late: boolean }) {
    return (
        <div className={`flex items-center gap-1 px-2 py-1 border rounded-lg max-w-28 text-xs ${late ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
            <Clock8 className="h-3.5 w-3.5 shrink-0" /><span>{time}</span>
        </div>
    );
}
function BreakBadge({ time }: { time: string }) {
    return (
        <div className="flex items-center gap-1 px-2 py-1 border border-yellow-200 rounded-lg bg-yellow-50 text-yellow-600 text-xs max-w-44">
            <Clock12 className="h-3.5 w-3.5 shrink-0" /><span>{time}</span>
        </div>
    );
}
function TimeOutBadge({ time }: { time: string }) {
    return (
        <div className="flex items-center gap-1 px-2 py-1 border border-orange-200 rounded-lg bg-orange-50 text-orange-700 text-xs max-w-28">
            <Clock5 className="h-3.5 w-3.5 shrink-0" /><span>{time}</span>
        </div>
    );
}

function DtrRow({ date, timeIn, breakTime, timeOut, remarks, late }: typeof dtrs[0]) {
    const formatted = new Date(date).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
    const remarksBadge = remarks
        ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${remarks === 'Late' ? 'bg-red-50 text-red-600' : remarks === 'Holiday' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{remarks}</span>
        : null;
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
            <td className="px-4 py-3 text-xs text-gray-700">{formatted}</td>
            <td className="px-4 py-2"><TimeInBadge time={timeIn} late={late} /></td>
            <td className="px-4 py-2"><BreakBadge time={breakTime} /></td>
            <td className="px-4 py-2"><TimeOutBadge time={timeOut} /></td>
            <td className="px-4 py-3">{remarksBadge}</td>
        </tr>
    );
}

function PropertyRow({ number, description, acquired, status }: typeof properties[0]) {
    const statusColor = status === 'Serviceable' ? 'bg-green-50 text-green-700' : status === 'For Repair' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600';
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
            <td className="px-4 py-3 text-xs font-medium text-gray-700">{number}</td>
            <td className="px-4 py-3 text-xs text-gray-600">{description}</td>
            <td className="px-4 py-3 text-xs text-gray-600">{acquired}</td>
            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{status}</span></td>
        </tr>
    );
}

function fileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return <Image className="h-4 w-4" />;
    if (ext === 'pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
}

// ── Announcement Modal ────────────────────────────────────────────────────────

function AnnouncementViewModal({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
    const parsed  = new Date(announcement.date);
    const dayNum  = parsed.toLocaleDateString('en-US', { day: '2-digit' });
    const dayAbbr = parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-lg min-h-60 rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 h-14 w-14 border rounded-lg inline-flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-700 leading-none">{dayNum}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{dayAbbr}</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800 text-base leading-snug">{announcement.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${announcement.tagColor}`}>{announcement.tag}</span>
                                <span className="text-xs text-gray-400">Posted: {announcement.date}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition shrink-0">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{announcement.body}</p>
                    </div>
                    {announcement.attachments.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Paperclip className="h-3 w-3" /> Attachments
                            </p>
                            <div className="space-y-1.5">
                                {announcement.attachments.map((f, i) => (
                                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-sm text-gray-700 group">
                                        <span className="text-green-600 shrink-0">{fileIcon(f.name)}</span>
                                        <span className="truncate flex-1">{f.name}</span>
                                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-green-600 shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Announcement list item ────────────────────────────────────────────────────

function AnnouncementItem({ title, date, tag, tagColor, attachments, onClick }: Omit<Announcement, 'id' | 'body' | 'auto_delete' | 'delete_after'> & { onClick: () => void }) {
    const parsed  = new Date(date);
    const dayNum  = parsed.toLocaleDateString('en-US', { day: '2-digit' });
    const dayAbbr = parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    return (
        <li className="py-3 border-b border-gray-100 last:border-0 px-4 cursor-pointer hover:bg-gray-50 transition" onClick={onClick}>
            <div className="flex items-start gap-3">
                <div className="shrink-0 h-14 w-14 border rounded-lg inline-flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700 leading-none">{dayNum}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{dayAbbr}</span>
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="font-semibold text-green-700 leading-tight mb-1 text-sm">{title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                        <p className="text-xs text-gray-400">Posted: {date}</p>
                        {attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Paperclip className="h-3 w-3" />{attachments.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function EmployeeDashboard({ user, announcements: initialAnnouncements }: Props) {
    const firstName  = user.name.split(' ')[0];
    const greeting   = getGreeting();
    const hour       = new Date().getHours();
    const timeEmoji  = hour < 12 ? '⛅' : hour < 18 ? '🌤️' : '🌙';
    const timeString = new Date().toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements ?? []);
    const [expanded,      setExpanded]      = useState(false);
    const [viewing,       setViewing]       = useState<Announcement | undefined>(undefined);

    const hasMore = announcements.length > PREVIEW;
    const visible = expanded ? announcements : announcements.slice(0, PREVIEW);

    useEffect(() => {
        function onNew(e: Event) {
            const a = (e as CustomEvent<Announcement>).detail;
            setAnnouncements(prev => prev.some(x => x.id === a.id) ? prev : [a, ...prev]);
        }
        function onDeleted(e: Event) {
            const { id } = (e as CustomEvent<{ id: number }>).detail;
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        }
        function onUpdated(e: Event) {
            const updated = (e as CustomEvent<Announcement>).detail;
            setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
        }

        window.addEventListener('announcement:new', onNew);
        window.addEventListener('announcement:deleted', onDeleted);
        window.addEventListener('announcement:updated', onUpdated);
        return () => {
            window.removeEventListener('announcement:new', onNew);
            window.removeEventListener('announcement:deleted', onDeleted);
            window.removeEventListener('announcement:updated', onUpdated);
        };
    }, []);

    useEffect(() => {
        if (window.location.hash === '#announcements-panel') {
            setTimeout(() => {
                document.getElementById('announcements-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, []);

    return (
        <AppLayout>
            <Head title="Employee Dashboard" />

            {viewing && (
                <AnnouncementViewModal
                    announcement={viewing}
                    onClose={() => setViewing(undefined)}
                />
            )}

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full mx-auto">

                {/* Greeting */}
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        <span className="text-green-700">{greeting}, </span>
                        <span className="text-orange-500">{firstName}!</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>{timeEmoji}</span>
                        <span>{timeString}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

                    {/* Left: DTR + Properties */}
                    <div className="flex flex-col gap-4 lg:col-span-3">

                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-700" />
                                <h2 className="text-sm font-semibold text-green-800">Daily Time Record</h2>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-max">
                                    <thead>
                                        <tr className="text-xs font-semibold text-gray-600 uppercase">
                                            <th className="px-4 py-3 border-b">Date</th>
                                            <th className="px-4 py-3 border-b">Time-In</th>
                                            <th className="px-4 py-3 border-b">Break</th>
                                            <th className="px-4 py-3 border-b">Time-Out</th>
                                            <th className="px-4 py-3 border-b">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dtrs.map((row, i) => <DtrRow key={i} {...row} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-green-700" />
                                <h2 className="text-sm font-semibold text-green-800">Property Equipment</h2>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-max">
                                    <thead>
                                        <tr className="text-xs font-semibold text-gray-600 uppercase">
                                            <th className="px-4 py-3 border-b">Property No.</th>
                                            <th className="px-4 py-3 border-b">Description</th>
                                            <th className="px-4 py-3 border-b">Date Acquired</th>
                                            <th className="px-4 py-3 border-b">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {properties.map((p, i) => <PropertyRow key={i} {...p} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Announcements */}
                    <div className="flex flex-col gap-4 lg:col-span-1" id="announcements-panel">
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                                <Megaphone className="h-4 w-4 text-green-700" />
                                <h2 className="text-sm font-semibold text-green-800">Announcements</h2>
                                {announcements.length > 0 && (
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                        {announcements.length}
                                    </span>
                                )}
                            </div>
                            <ul className="flex-1">
                                {announcements.length === 0 ? (
                                    <li className="px-5 py-8 text-center text-xs text-gray-400 italic">
                                        No announcements posted.
                                    </li>
                                ) : (
                                    visible.map(item => (
                                        <AnnouncementItem
                                            key={item.id}
                                            title={item.title}
                                            date={item.date}
                                            tag={item.tag}
                                            tagColor={item.tagColor}
                                            attachments={item.attachments}
                                            onClick={() => setViewing(item)}
                                        />
                                    ))
                                )}
                            </ul>
                            {hasMore && (
                                <div className="px-5 py-3 border-t text-center">
                                    <button onClick={() => setExpanded(p => !p)}
                                        className="text-xs text-green-700 font-medium hover:underline transition">
                                        {expanded ? 'Show less' : `View all ${announcements.length} announcements`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}