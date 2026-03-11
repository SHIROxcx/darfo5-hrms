import AppLayout from "@/layouts/app-layout";
import { Head, Link } from '@inertiajs/react';
import {
    Users, ShieldCheck, Briefcase, SquareUserRound,
    Megaphone, Zap, ChevronRight
} from 'lucide-react';

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
}

// Greeting Logic
const MORNING_GREETINGS = [
    'Good morning',
    'Rise and shine',
    'Top of the morning',
    'Hope your morning is going well',
    'Starting the day strong',
    'A wonderful morning to you',
    'Great morning to see you',
];

const AFTERNOON_GREETINGS = [
    'Good afternoon',
    'Hope your day is going great',
    'Great to see you this afternoon',
    'Keeping up the good work',
    'Hope the day is treating you well',
    'You\'re doing great today',
    'Halfway through the day',
];

const EVENING_GREETINGS = [
    'Good evening',
    'Hope you had a productive day',
    'Almost time to rest',
    'Great work today',
    'Wrapping up for the day',
];

function getGreeting(): { text: string; emoji: string } {
    const now  = new Date();
    const hour = now.getHours();
    const pool =
        hour < 12 ? MORNING_GREETINGS :
        hour < 18 ? AFTERNOON_GREETINGS :
        EVENING_GREETINGS;
    const emoji = hour < 12 ? '🌤️' : hour < 18 ? '☀️' : '🌙';
    const index = now.getTime() % pool.length;
    return { text: pool[index], emoji };
}

// Hard-coded announcements
const announcements = [
    {
        id: 1,
        title: 'Submission of IPCR for Q1 2026',
        body: 'All employees are required to submit their Individual Performance Commitment and Review (IPCR) for Q1 2026 on or before March 31, 2026.',
        date: 'Feb 25, 2026',
        tag: 'Reminder',
        tagColor: 'bg-yellow-100 text-yellow-700',
    },
    {
        id: 2,
        title: 'Office Memorandum: Updated Dress Code Policy',
        body: 'Effective March 1, 2026, all employees are required to observe the updated office dress code as stated in Office Memorandum No. 2026-02.',
        date: 'Feb 20, 2026',
        tag: 'Policy',
        tagColor: 'bg-blue-100 text-blue-700',
    },
    {
        id: 3,
        title: 'Annual Physical Examination Schedule',
        body: 'The Annual Physical Examination for all plantilla employees will be conducted from March 10–14, 2026. Please coordinate with HR for your assigned schedule.',
        date: 'Feb 18, 2026',
        tag: 'Health',
        tagColor: 'bg-green-100 text-green-700',
    },
];

// Score Card
interface ScoreCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

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

// Quick Actions
interface QuickActionProps { label: string; href: string; }
function QuickActionItem({ label, href }: QuickActionProps) {
    return (
        <Link href={href}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-green-50 hover:border-green-600 text-gray-700 hover:text-green-700 transition group">
            <div className="flex items-center gap-3 text-sm font-medium">
                <Zap className="h-4 w-4" />
                {label}
            </div>
            <ChevronRight className="h-4 w-4 transition" />
        </Link>
    );
}

// Announcement Item
interface AnnouncementItemProps { title: string; body: string; date: string; tag: string; tagColor: string; }
function AnnouncementItem({ title, body, date, tag, tagColor }: AnnouncementItemProps) {
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard({ user, stats }: Props) {
    const firstName  = user.name.split(' ')[0];
    const { text: greeting, emoji } = getGreeting();
    const timeString = new Date().toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <AppLayout>
            <Head title="HR Admin Dashboard" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full mx-auto">

                {/* Greeting Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
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

                    {/* Left — Score Cards and Quick Actions */}
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
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                            <div className="px-5 py-4 border-b flex items-center gap-2 bg-gray-50">
                                <Megaphone className="h-4 w-4 text-green-700" />
                                <h2 className="text-sm font-semibold text-green-800">Announcements</h2>
                            </div>
                            <div className="divide-y divide-gray-100 overflow-y-auto max-h-130">
                                {announcements.map(item => (
                                    <AnnouncementItem key={item.id} title={item.title} body={item.body}
                                        date={item.date} tag={item.tag} tagColor={item.tagColor} />
                                ))}
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