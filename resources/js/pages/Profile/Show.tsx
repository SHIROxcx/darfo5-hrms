import { Head, router, usePage } from '@inertiajs/react';
import {
    Award, BookOpen, Briefcase, Building2, Calendar,
    Camera, Check, ChevronRight, Edit2, GraduationCap,
    Hash, Heart, Layers, Mail, MapPin, Phone, Plus,
    Shield, User, X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Spinner } from '@/components/ui/spinner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmployeeProfile {
    sex: 'Male' | 'Female' | null;
    birth_place: string | null;
    civil_status: string | null;
    mobile_number: string | null;
    employee_number: string | null;
    employment_type: string | null;
    position: string | null;
    salary_grade: string | null;
    place_assign: string | null;
    division: string | null;
    section: string | null;
    date_hired: string | null;
    is_active: boolean;
    gsis_number: string | null;
    sss_number: string | null;
    pagibig_number: string | null;
    tin_number: string | null;
    philhealth_number: string | null;
}

interface Degree {
    id: number;
    degree: string;
    start_month: string | null;
    start_year: number | null;
    end_month: string | null;
    end_year: number | null;
}

interface GraduateStudy {
    id: number;
    program: string;
    start_month: string | null;
    start_year: number | null;
    end_month: string | null;
    end_year: number | null;
}

interface Eligibility {
    id: number;
    eligibility: string;
    issue_month: string | null;
    issue_year: number | null;
    date_issued: string | null;
    place_issued: string | null;
}

interface ProfileUser {
    id: number;
    name: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    name_ext: string | null;
    email: string;
    photo: string | null;
    is_approved: boolean;
    roles: string[];
    employee_profile: EmployeeProfile | null;
    degrees: Degree[];
    graduate_studies: GraduateStudy[];
    eligibilities: Eligibility[];
}

interface PageProps {
    auth: { user: { id: number; roles: string[] } };
    profileUser: ProfileUser;
    canEditCompany: boolean;
    [key: string]: unknown;
}

// Helpers

function getInitials(u: ProfileUser) {
    return ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() || u.name?.[0]?.toUpperCase() || '?';
}

function fullName(u: ProfileUser) {
    return [u.first_name, u.middle_name, u.last_name, u.name_ext].filter(Boolean).join(' ') || u.name;
}

function dateRange(sm: string | null, sy: number | null, em: string | null, ey: number | null) {
    const start = [sm, sy].filter(Boolean).join(' ') || '—';
    const end   = [em, ey].filter(Boolean).join(' ') || 'Present';
    return start + ' – ' + end;
}

// Shared UI

function SectionCard({ icon: Icon, title, action, children }: {
    icon: any; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a3a2a]/8 text-[#1a3a2a]">
                        <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
                </div>
                {action}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function EditBtn({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2d6a4f] hover:bg-green-50 transition">
            <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
    );
}

function AddBtn({ onClick, label = 'Add' }: { onClick: () => void; label?: string }) {
    return (
        <button onClick={onClick} className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2d6a4f] hover:bg-green-50 transition">
            <Plus className="h-3.5 w-3.5" /> {label}
        </button>
    );
}

function InfoGrid({ items }: { items: { label: string; value: string | null | undefined }[] }) {
    const visible = items.filter(i => i.value);
    if (!visible.length) return <p className="text-sm text-gray-400 italic">No information available.</p>;
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ label, value }) => (
                <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
            ))}
        </div>
    );
}

function ModalShell({ title, onClose, onSave, saving, children }: {
    title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-semibold text-green-800">{title}</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">{children}</div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={onSave} disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? <><Spinner /> Saving</> : 'Save Changes' } 
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";
const selectCls = inputCls;

// Modals

function EditPersonalModal({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
    const ep = user.employee_profile;
    const [form, setForm] = useState({
        first_name:    user.first_name    ?? '',
        middle_name:   user.middle_name   ?? '',
        last_name:     user.last_name     ?? '',
        name_ext:      user.name_ext      ?? '',
        email:         user.email         ?? '',
        sex:           ep?.sex            ?? '',
        birth_place:   ep?.birth_place    ?? '',
        civil_status:  ep?.civil_status   ?? '',
        mobile_number: ep?.mobile_number  ?? '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    function save() {
        setSaving(true);
        router.post('/profile/personal', form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    }

    return (
        <ModalShell title="Edit Personal Info" onClose={onClose} onSave={save} saving={saving}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="First Name"><input value={form.first_name} onChange={set('first_name')} className={inputCls} /></Field>
                <Field label="Middle Name"><input value={form.middle_name} onChange={set('middle_name')} className={inputCls} /></Field>
                <Field label="Last Name"><input value={form.last_name} onChange={set('last_name')} className={inputCls} /></Field>
                <Field label="Suffix (Jr., Sr., II)">
                    <select value={form.name_ext} onChange={set('name_ext')} className={inputCls}>
                        <option value="">None</option>
                        <option>Jr</option>
                        <option>Sr</option>
                        <option>I</option>
                        <option>II</option>
                        <option>III</option>
                    </select>
                </Field>
            </div>
            <Field label="Email"><input type="email" value={form.email} onChange={set('email')} className={inputCls} /></Field>
            <Field label="Mobile Number"><input value={form.mobile_number} onChange={set('mobile_number')} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Sex">
                    <select value={form.sex} onChange={set('sex')} className={selectCls}>
                        <option value="">— Select —</option>
                        <option>Male</option>
                        <option>Female</option>
                    </select>
                </Field>
                <Field label="Civil Status">
                    <select value={form.civil_status} onChange={set('civil_status')} className={selectCls}>
                        <option value="">— Select —</option>
                        {['Single','Married','Widowed','Separated','Other'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Place of Birth"><input value={form.birth_place} onChange={set('birth_place')} className={inputCls} /></Field>
        </ModalShell>
    );
}

function EditCompanyModal({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
    const ep = user.employee_profile;
    const [form, setForm] = useState({
        employee_number: ep?.employee_number ?? '',
        employment_type: ep?.employment_type ?? '',
        position:        ep?.position        ?? '',
        salary_grade:    ep?.salary_grade    ?? '',
        place_assign:    ep?.place_assign    ?? '',
        division:        ep?.division        ?? '',
        section:         ep?.section         ?? '',
        date_hired:      ep?.date_hired      ?? '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    function save() {
        setSaving(true);
        router.post('/profile/' + user.id + '/company', form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    }

    return (
        <ModalShell title="Edit Company Info" onClose={onClose} onSave={save} saving={saving}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Employee No."><input value={form.employee_number} onChange={set('employee_number')} className={inputCls} /></Field>
                <Field label="Employment Type"><input value={form.employment_type} onChange={set('employment_type')} className={inputCls} /></Field>
            </div>
            <Field label="Position"><input value={form.position} onChange={set('position')} className={inputCls} /></Field>
            <Field label="Salary Grade"><input value={form.salary_grade} onChange={set('salary_grade')} className={inputCls} /></Field>
            <Field label="Agency / Place Assigned"><input value={form.place_assign} onChange={set('place_assign')} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Division"><input value={form.division} onChange={set('division')} className={inputCls} /></Field>
                <Field label="Section / Unit"><input value={form.section} onChange={set('section')} className={inputCls} /></Field>
            </div>
            <Field label="Date Hired"><input type="date" value={form.date_hired} onChange={set('date_hired')} className={inputCls} /></Field>
        </ModalShell>
    );
}

function EditGovernmentModal({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
    const ep = user.employee_profile;
    const [form, setForm] = useState({
        gsis_number:       ep?.gsis_number       ?? '',
        sss_number:        ep?.sss_number        ?? '',
        pagibig_number:    ep?.pagibig_number    ?? '',
        tin_number:        ep?.tin_number        ?? '',
        philhealth_number: ep?.philhealth_number ?? '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    function save() {
        setSaving(true);
        router.post('/profile/' + user.id + '/government', form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    }

    return (
        <ModalShell title="Edit Government IDs" onClose={onClose} onSave={save} saving={saving}>
            <Field label="GSIS Number"><input value={form.gsis_number} onChange={set('gsis_number')} className={inputCls} /></Field>
            <Field label="SSS Number"><input value={form.sss_number} onChange={set('sss_number')} className={inputCls} /></Field>
            <Field label="Pag-IBIG Number"><input value={form.pagibig_number} onChange={set('pagibig_number')} className={inputCls} /></Field>
            <Field label="TIN Number"><input value={form.tin_number} onChange={set('tin_number')} className={inputCls} /></Field>
            <Field label="PhilHealth Number"><input value={form.philhealth_number} onChange={set('philhealth_number')} className={inputCls} /></Field>
        </ModalShell>
    );
}

function DegreeModal({ userId, degree, onClose }: {
    userId: number; degree?: Degree; onClose: () => void;
}) {
    const [form, setForm] = useState({
        degree:      degree?.degree      ?? '',
        start_month: degree?.start_month ?? '',
        start_year:  degree?.start_year  ? String(degree.start_year) : '',
        end_month:   degree?.end_month   ?? '',
        end_year:    degree?.end_year    ? String(degree.end_year)   : '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function save() {
        setSaving(true);
        const url = degree ? '/profile/degree/' + degree.id : '/profile/' + userId + '/degree';
        router.post(url, form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    }

    return (
        <ModalShell title={degree ? 'Edit Degree' : 'Add Degree'} onClose={onClose} onSave={save} saving={saving}>
            <Field label="Degree / Course">
                <input value={form.degree} onChange={set('degree')} className={inputCls} placeholder="e.g. Bachelor of Science in Computer Science" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Start Month">
                    <select value={form.start_month} onChange={e => setForm(f => ({...f, start_month: e.target.value}))} className={selectCls}>
                        <option value="">— Month —</option>
                        {months.map(m => <option key={m}>{m}</option>)}
                    </select>
                </Field>
                <Field label="Start Year"><input value={form.start_year} onChange={set('start_year')} className={inputCls} placeholder="2018" /></Field>
                <Field label="End Month">
                    <select value={form.end_month} onChange={e => setForm(f => ({...f, end_month: e.target.value}))} className={selectCls}>
                        <option value="">— Month —</option>
                        {months.map(m => <option key={m}>{m}</option>)}
                    </select>
                </Field>
                <Field label="End Year"><input value={form.end_year} onChange={set('end_year')} className={inputCls} placeholder="2022" /></Field>
            </div>
        </ModalShell>
    );
}

function GraduateStudyModal({ userId, program, onClose }: {
    userId: number; program?: GraduateStudy; onClose: () => void;
}) {
    const [form, setForm] = useState({
        program:     program?.program      ?? '',
        start_month: program?.start_month ?? '',
        start_year:  program?.start_year  ? String(program.start_year) : '',
        end_month:   program?.end_month   ?? '',
        end_year:    program?.end_year    ? String(program.end_year)   : '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function save() {
        setSaving(true);
        const url = program ? '/profile/program/' + program.id : '/profile/' + userId + '/program';
        router.post(url, form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    }

    return (
        <ModalShell title={program ? 'Edit Program' : 'Add Program'} onClose={onClose} onSave={save} saving={saving}>
            <Field label="program / Course">
                <input value={form.program} onChange={set('program')} className={inputCls} placeholder="e.g. Master in Information Technology" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Start Month">
                    <select value={form.start_month} onChange={e => setForm(f => ({...f, start_month: e.target.value}))} className={selectCls}>
                        <option value="">— Month —</option>
                        {months.map(m => <option key={m}>{m}</option>)}
                    </select>
                </Field>
                <Field label="Start Year"><input value={form.start_year} onChange={set('start_year')} className={inputCls} placeholder="2018" /></Field>
                <Field label="End Month">
                    <select value={form.end_month} onChange={e => setForm(f => ({...f, end_month: e.target.value}))} className={selectCls}>
                        <option value="">— Month —</option>
                        {months.map(m => <option key={m}>{m}</option>)}
                    </select>
                </Field>
                <Field label="End Year"><input value={form.end_year} onChange={set('end_year')} className={inputCls} placeholder="2022" /></Field>
            </div>
        </ModalShell>
    );
}

function EligibilityModal({ userId, item, onClose }: {
    userId: number; item?: Eligibility; onClose: () => void;
}) {
    const [form, setForm] = useState({
        eligibility:  item?.eligibility  ?? '',
        issue_month:  item?.issue_month  ?? '',
        issue_year:   item?.issue_year   ? String(item.issue_year) : '',
        date_issued:  item?.date_issued  ?? '',
        place_issued: item?.place_issued ?? '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    function save() {
        setSaving(true);
        const url = item ? '/profile/eligibility/' + item.id : '/profile/' + userId + '/eligibility';
        router.post(url, form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    }

    return (
        <ModalShell title={item ? 'Edit Eligibility' : 'Add Eligibility'} onClose={onClose} onSave={save} saving={saving}>
            <Field label="Eligibility / License">
                <input value={form.eligibility} onChange={set('eligibility')} className={inputCls} placeholder="e.g. Civil Service Professional" />
            </Field>
            <Field label="Date Issued"><input type="date" value={form.date_issued} onChange={set('date_issued')} className={inputCls} /></Field>
            <Field label="Place Issued"><input value={form.place_issued} onChange={set('place_issued')} className={inputCls} /></Field>
        </ModalShell>
    );
}

// Completion donut

function CompletionDonut({ percent }: { percent: number }) {
    const r   = 54;
    const circ = 2 * Math.PI * r;
    const dash = (percent / 100) * circ;

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative flex items-center justify-center">
                <svg width="140" height="140" className="-rotate-90">
                    {/* track */}
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    {/* progress */}
                    <circle
                        cx="70" cy="70" r={r} fill="none"
                        stroke="#00a63e"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-gray-900">{percent}%</span>
                    <span className="text-xs text-gray-400">Completed</span>
                </div>
            </div>
            <p className="mt-3 text-xs text-center text-gray-400 leading-snug px-2">
                {percent === 100
                    ? '✓ Profile complete!'
                    : 'Complete your profile to unlock all features'}
            </p>
        </div>
    );
}

// Profile completion calculator

function calcCompletion(user: ProfileUser): number {
    const ep = user.employee_profile;
    const checks = [
        !!user.photo,
        !!(user.first_name && user.last_name),
        !!user.email,
        !!ep?.mobile_number,
        !!ep?.position,
        !!ep?.place_assign,
        !!ep?.division,
        !!ep?.employment_type,
        !!ep?.date_hired,
        !!ep?.sex,
        !!ep?.civil_status,
        !!ep?.birth_place,
        user.degrees.length > 0,
        // user.eligibilities.length > 0,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
}

// Main Page

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Profile', href: '/profile' }];

export default function ProfileShow() {
    const { auth, profileUser: user, canEditCompany } = usePage<PageProps>().props;
    const ep     = user.employee_profile;
    const isOwn  = auth.user.id === user.id;
    const name   = fullName(user);
    const avatar = user.photo ? '/storage/' + user.photo : null;
    const pct    = calcCompletion(user);

    const photoRef = useRef<HTMLInputElement>(null);

    const [modal, setModal] = useState<
        'personal' | 'company' | 'government' |
        { type: 'degree';       item?: Degree }      |
        { type: 'program';      item?: GraduateStudy }      |
        { type: 'eligibility';  item?: Eligibility } |
        null
    >(null);

    function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = new FormData();
        data.append('photo', file);
        router.post('/profile/photo', data, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            {/* Modals */}
            {modal === 'personal'   && <EditPersonalModal  user={user} onClose={() => setModal(null)} />}
            {modal === 'company'    && <EditCompanyModal   user={user} onClose={() => setModal(null)} />}
            {modal === 'government' && <EditGovernmentModal user={user} onClose={() => setModal(null)} />}
            {modal !== null && typeof modal === 'object' && modal.type === 'degree' &&
                <DegreeModal userId={user.id} degree={modal.item} onClose={() => setModal(null)} />}
            {modal !== null && typeof modal === 'object' && modal.type === 'program' &&
                <GraduateStudyModal userId={user.id} program={modal.item} onClose={() => setModal(null)} />}
            {modal !== null && typeof modal === 'object' && modal.type === 'eligibility' &&
                <EligibilityModal userId={user.id} item={modal.item} onClose={() => setModal(null)} />}

            <div className="px-4 md:px-12 py-6 space-y-5">

                {/* HERO ROW: profile card + completion card */}
                <div className="flex gap-4 items-stretch">

                    {/*  HERO ROW: profile card + completion card */}
                    <div className="flex gap-4 items-stretch w-full">

                        {/* ── Main hero card ── */}
                        <div className="relative flex-1 rounded-2xl bg-white shadow-sm overflow-hidden">

                            {/* Banner */}
                            <div className="relative h-44 w-full bg-green-700">
                                <img
                                    src="/images/desktop-wallpaper.png"
                                    alt=""
                                    className="h-full w-full object-cover object-[25%_48%]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-700/60 to-green-500/50" />
                            </div>

                            {/* Avatar — overlaps the banner */}
                            <div className="absolute left-5 top-28">
                                <div className="relative">
                                    <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-md bg-white">
                                        {avatar
                                            ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
                                            : <div className="flex h-full w-full items-center justify-center bg-green-700 text-3xl font-bold text-white">{getInitials(user)}</div>
                                        }
                                    </div>
                                    {isOwn && (
                                        <>
                                            <button
                                                onClick={() => photoRef.current?.click()}
                                                className="absolute bottom-1 right-2 flex cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-green-600 border-2 border-white shadow text-white hover:bg-green-700 transition"
                                            >
                                                <Camera className="h-4 w-4" />
                                            </button>
                                            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Name + position — below banner, offset to clear the avatar */}
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between px-5 pt-4 pb-5">
                                <div className="pl-40">
                                    <h1 className="text-2xl font-semibold text-green-800 leading-tight">{name}</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {ep?.position ?? 'No position set'}
                                    </p>
                                    {ep?.division && (
                                        <p className="text-xs text-gray-400 mt-0.5">{ep.division}</p>
                                    )}
                                    {ep?.division && (
                                        <p className="text-xs text-gray-400 mt-0.5">{ep.section ? ep.section : ''}</p>
                                    )}
                                </div>
                            </div>

                            {/* Edit button — bottom right */}
                            {isOwn && (
                                <button
                                    title="Edit Profile"
                                    onClick={() => setModal('personal')}
                                    className="absolute bottom-5 right-5 flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 p-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-green-700 transition"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* ── Completion donut card ── */}
                        {pct < 100 && (
                            <div className=" w-56 shrink-0 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-center p-4">
                                <CompletionDonut percent={pct} />
                            </div>
                        )}
                    </div>
                </div>

                {/* PERSONAL INFO */}
                <SectionCard icon={User} title="Personal Information"
                    action={isOwn ? <EditBtn onClick={() => setModal('personal')} /> : undefined}>
                    <InfoGrid items={[
                        { label: 'Full Name',     value: name },
                        { label: 'Sex',           value: ep?.sex },
                        { label: 'Civil Status',  value: ep?.civil_status },
                        { label: 'Place of Birth',value: ep?.birth_place },
                        { label: 'Mobile Number', value: ep?.mobile_number },
                        { label: 'Email',         value: user.email },
                    ]} />
                </SectionCard>

                {/* COMPANY INFO */}
                <SectionCard icon={Building2} title="Company Information"
                    action={canEditCompany ? <EditBtn onClick={() => setModal('company')} /> : undefined}>
                    <InfoGrid items={[
                        { label: 'Employee No.',    value: ep?.employee_number },
                        { label: 'Position',        value: ep?.position },
                        { label: 'Employment Type', value: ep?.employment_type },
                        { label: 'Salary Grade',    value: ep?.salary_grade },
                        { label: 'Agency',          value: ep?.place_assign },
                        { label: 'Division',        value: ep?.division },
                        { label: 'Section / Unit',  value: ep?.section },
                        { label: 'Date Hired',      value: ep?.date_hired ? new Date(ep.date_hired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null },
                    ]} />
                </SectionCard>

                {/* EDUCATION (DEGREES) */}
                <SectionCard icon={GraduationCap} title="Education"
                    action={isOwn ? <AddBtn onClick={() => setModal({ type: 'degree' })} label="Add Degree" /> : undefined}>
                    {user.degrees.length === 0
                        ? <p className="text-sm text-gray-400 italic">No education records added yet.</p>
                        : <div className="space-y-4">
                            {user.degrees.map(d => (
                                <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a3a2a] text-white font-bold text-sm">
                                            {d.degree[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{d.degree}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{dateRange(d.start_month, d.start_year, d.end_month, d.end_year)}</p>
                                        </div>
                                    </div>
                                    {isOwn && (
                                        <button onClick={() => setModal({ type: 'degree', item: d })}
                                            className="shrink-0 cursor-pointer text-xs font-medium text-green-700 hover:text-green-800">Edit</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    }
                </SectionCard>

                {/* GRADUATE STUDIES */}
                {(user.graduate_studies.length > 0 || isOwn) && (
                    <SectionCard icon={BookOpen} title="Graduate Studies"
                        action={isOwn ? <AddBtn onClick={() => setModal({ type: 'program' })} label="Add" /> : undefined}>
                        {user.graduate_studies.length === 0
                            ? <p className="text-sm text-gray-400 italic">No graduate studies added yet.</p>
                            : <div className="space-y-4">
                                {user.graduate_studies.map(g => (
                                    <div key={g.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a3a2a] text-white font-bold text-sm">
                                                {g.program[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{g.program}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{dateRange(g.start_month, g.start_year, g.end_month, g.end_year)}</p>
                                            </div>
                                        </div>
                                        {isOwn && (
                                        <button onClick={() => setModal({ type: 'program', item: g })}
                                            className="shrink-0 cursor-pointer text-xs font-medium text-green-700 hover:text-green-800">Edit</button>
                                    )}
                                    </div>
                                ))}
                            </div>
                        }
                    </SectionCard>
                )}

                {/* ELIGIBILITIES */}
                <SectionCard icon={Award} title="Civil Service Eligibility / Licenses"
                    action={isOwn ? <AddBtn onClick={() => setModal({ type: 'eligibility' })} label="Add" /> : undefined}>
                    {user.eligibilities.length === 0
                        ? <p className="text-sm text-gray-400 italic">No eligibilities added yet.</p>
                        : <div className="space-y-3">
                            {user.eligibilities.map(e => (
                                <div key={e.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{e.eligibility}</p>
                                            <p className="text-xs text-gray-400">
                                                {e.date_issued ? new Date(e.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                                                {e.place_issued ? ' | ' + e.place_issued : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {isOwn && (
                                        <button onClick={() => setModal({ type: 'eligibility', item: e })}
                                            className="cursor-pointer text-xs font-medium text-green-700 hover:text-green-800">Edit</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    }
                </SectionCard>

                {/* GOVERNMENT IDs */}
                {(canEditCompany || isOwn) && (
                    <SectionCard icon={Hash} title="Government IDs"
                        action={canEditCompany ? <EditBtn onClick={() => setModal('government')} /> : undefined}>
                        <InfoGrid items={[
                            { label: 'GSIS Number',       value: ep?.gsis_number },
                            { label: 'SSS Number',        value: ep?.sss_number },
                            { label: 'Pag-IBIG Number',   value: ep?.pagibig_number },
                            { label: 'TIN Number',        value: ep?.tin_number },
                            { label: 'PhilHealth Number', value: ep?.philhealth_number },
                        ]} />
                    </SectionCard>
                )}

            </div>
        </AppLayout>
    );
}