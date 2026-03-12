import AppLayout from "@/layouts/app-layout";
import { Head } from '@inertiajs/react';
import {
    TicketsPlane, BriefcaseMedical, Award, Activity,
    Megaphone, Clock, Monitor, Clock8, Clock12, Clock5
} from 'lucide-react';

interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
}

// Greeting Logic
const MORNING_GREETINGS = [
    'Good morning',
    'Rise and shine',
    'Starting the day strong',
    'A wonderful morning to you',
    'Great morning to see you',
];

const AFTERNOON_GREETINGS = [
    'Afternoon',
    'Good afternoon',
    'Enjoy the rest of your day',
    'A bright afternoon to you',
    'You\'re doing great today',
    'Halfway through the day',
];

const EVENING_GREETINGS = [
    'Evening',
    'Hey, good evening!',
    'Good evening',
    'Great job today',
    'Almost time to rest',
    ' How\'s your shift going?',
    'Good to see you this evening',
    'Great work today',
    'Wrapping up for the day',
    'Winding down for the evening',
];

function getGreeting(firstName: string): string {
    const now  = new Date();
    const hour = now.getHours();

    const pool =
        hour < 12 ? MORNING_GREETINGS :
        hour < 18 ? AFTERNOON_GREETINGS :
        EVENING_GREETINGS;

    const seed = now.getTime();
    const index = seed % pool.length;

    return pool[index];
}

// Leave Balances
const leaveBalances = [
    { label: 'Vacation Leave',  value: 5, icon: 'vacation',  color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    { label: 'Sick Leave',      value: 3, icon: 'sick',      color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    { label: 'Privilege Leave', value: 5, icon: 'privilege', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    { label: 'Wellness Leave',  value: 5, icon: 'wellness',  color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
];

// DTR
const dtrs = [
    { date: '2025-01-10', timeIn: '08:01 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '05:02 PM', remarks: '', late: false },
    { date: '2025-01-11', timeIn: '07:59 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '05:03 PM', remarks: '', late: false },
    { date: '2025-01-12', timeIn: '08:15 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '04:59 PM', remarks: 'Late', late: true },
    { date: '2025-01-13', timeIn: '08:05 AM', breakTime: '12:00 PM | 01:00 PM', timeOut: '05:00 PM', remarks: '', late: false },
    { date: '2025-12-08', timeIn: '00:00 AM', breakTime: '00:00 PM | 00:00 PM', timeOut: '00:00 PM', remarks: 'Holiday', late: false },
];

// Properties
const properties = [
    { number: 'PE-001', description: 'Laptop Dell Latitude 3420',  acquired: '2022-05-10', status: 'Serviceable' },
    { number: 'PE-002', description: 'HP LaserJet Printer',         acquired: '2021-08-15', status: 'For Repair' },
    { number: 'PE-003', description: 'Epson Scanner',               acquired: '2020-11-21', status: 'Serviceable' },
    { number: 'PE-004', description: 'Office Chair – Ergonomic',    acquired: '2023-01-02', status: 'Serviceable' },
    { number: 'PE-005', description: 'Projector – Acer',            acquired: '2023-02-18', status: 'Not Serviceable' },
];

// Announcements
const announcements = [
    { id: 1, title: 'Submission of IPCR for Q1 2026',           body: 'All employees are required to submit their IPCR for Q1 2026 on or before March 31, 2026.',                                                                          date: 'Feb 25, 2026', tag: 'Reminder', tagColor: 'bg-yellow-100 text-yellow-700' },
    { id: 2, title: 'Office Memorandum: Updated Dress Code Policy', body: 'Effective March 1, 2026, all employees are required to observe the updated office dress code as stated in Office Memorandum No. 2026-02.',                        date: 'Feb 20, 2026', tag: 'Policy',   tagColor: 'bg-blue-100 text-blue-700'   },
    { id: 3, title: 'Annual Physical Examination Schedule',       body: 'The Annual Physical Examination will be conducted from March 10–14, 2026.',                                                                                          date: 'Feb 18, 2026', tag: 'Health',   tagColor: 'bg-green-100 text-green-700' },
    { id: 4, title: 'Holiday Notice: Araw ng Kagitingan',         body: 'April 9, 2026 (Thursday) is a Regular Holiday. Government offices will be closed.',                                                                                  date: 'Feb 15, 2026', tag: 'Holiday',  tagColor: 'bg-red-100 text-red-700'     },
];

// Leave Icon
function LeaveIcon({ type }: { type: string }) {
    if (type === 'vacation')  return <TicketsPlane className="h-7 w-7" />;
    if (type === 'sick')      return <BriefcaseMedical className="h-7 w-7" />;
    if (type === 'privilege') return <Award className="h-7 w-7" />;
    return <Activity className="h-7 w-7" />;
}

interface LeaveCardProps { label: string; value: number; icon: string; color: string; bg: string; }
function LeaveCard({ label, value, icon, color, bg }: LeaveCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <span className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border border-green-200 ${bg} ${color}`}>
                <LeaveIcon type={icon} />
            </span>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

function TimeInBadge({ time, late }: { time: string; late: boolean }) {
    return (
        <div className={`flex items-center gap-1 px-2 py-1 border rounded-lg max-w-28 text-xs
            ${late ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
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
        ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${remarks === 'Late'    ? 'bg-red-50 text-red-600'   : ''}
            ${remarks === 'Holiday' ? 'bg-blue-50 text-blue-600' : ''}
            ${!['Late','Holiday'].includes(remarks) ? 'bg-gray-100 text-gray-600' : ''}`}>{remarks}</span>
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
    const statusColor =
        status === 'Serviceable' ? 'bg-green-50 text-green-700' :
        status === 'For Repair'  ? 'bg-yellow-50 text-yellow-700' :
        'bg-red-50 text-red-600';
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
            <td className="px-4 py-3 text-xs font-medium text-gray-700">{number}</td>
            <td className="px-4 py-3 text-xs text-gray-600">{description}</td>
            <td className="px-4 py-3 text-xs text-gray-600">{acquired}</td>
            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{status}</span></td>
        </tr>
    );
}

function AnnouncementItem({ title, body, date, tag, tagColor }: typeof announcements[0]) {
    return (
        <div className="px-5 py-4 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                <span className="text-xs text-gray-400 shrink-0">{date}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-2 mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
        </div>
    );
}

// Main Dashboard
export default function EmployeeDashboard({ user }: Props) {
    const firstName  = user.name.split(' ')[0];
    const greeting   = getGreeting(firstName);
    const hour       = new Date().getHours();
    const timeEmoji  = hour < 12 ? '⛅' : hour < 18 ? '🌤️' : '🌙';
    const timeString = new Date().toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <AppLayout>
            <Head title="Employee Dashboard" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full mx-auto">

                {/* Greeting Header */}
                <div className="mb-6">
                    <h1 className="text-xl xl:text-2xl font-semibold leading-snug">
                        <span className="text-green-700">{greeting}, </span>
                        <span className="text-orange-500">{firstName}!</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>{timeEmoji}</span>
                        <span>{timeString}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

                    {/* Leave Score Cards */}
                    <div className="lg:col-span-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {leaveBalances.map(item => (
                                <LeaveCard key={item.label} label={item.label} value={item.value}
                                    icon={item.icon} color={item.color} bg={item.bg} />
                            ))}
                        </div>
                    </div>

                    {/* Left Column: DTR + Properties */}
                    <div className="flex flex-col gap-4 lg:col-span-3">

                        {/* Daily Time Record */}
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

                        {/* Property Equipment */}
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

                    {/* Right Column: Announcements */}
                    <div className="flex flex-col gap-4 lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                                <Megaphone className="h-4 w-4 text-green-700" />
                                <h2 className="text-sm font-semibold text-green-800">Announcements</h2>
                            </div>
                            <div className="overflow-y-auto max-h-150 flex-1">
                                {announcements.map(item => (
                                    <AnnouncementItem key={item.id} title={item.title} body={item.body}
                                        date={item.date} tag={item.tag} tagColor={item.tagColor} />
                                ))}
                            </div>
                            <div className="px-5 py-3 border-t text-center">
                                <button className="text-xs text-green-600 hover:underline">View all announcements</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}