import { Head, router, usePage } from '@inertiajs/react';
import {
    Camera, Pencil, Plus,
    GraduationCap, Award, MessagesSquare, BadgeCheck, X,
    AwardIcon,
    Dot,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeProfile {
    employee_number: string | null;
    employment_type: string | null;
    position: string | null;
    salary_grade: string | null;
    place_assign: string | null;
    division: string | null;
    section: string | null;
    date_hired: string | null;
    is_active: boolean;
}

// Personal / government data now comes from pds_personal_info
interface PersonalInfo {
    sex: 'Male' | 'Female' | null;
    birth_place: string | null;
    civil_status: string | null;
    mobile_number: string | null;
    agency_employee_no: string | null;
    umid_number: string | null;
    pagibig_number: string | null;
    philhealth_number: string | null;
    philsys_number: string | null;
    tin_number: string | null;
}

// Mapped from pds_education where level = 'College'
interface Degree {
    id: number;
    degree: string | null;        // maps from pds_education.course
    school_name: string | null;
    period_from: string | null;
    period_to: string | null;
    year_graduated: string | null;
    honors_received: string | null;
}

// Mapped from pds_education where level = 'Graduate Studies'
interface GraduateStudy {
    id: number;
    program: string | null;       // maps from pds_education.course
    school_name: string | null;
    period_from: string | null;
    period_to: string | null;
}

// Mapped from pds_eligibilities
interface UserEligibility {
    id: number;
    eligibility: string | null;   // maps from pds_eligibilities.career_service
    rating: string | null;
    date_of_examination: string | null;
    place_of_examination: string | null;
    license_number: string | null;
    license_validity: string | null;
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
    personal_info: PersonalInfo | null;       // ← was parts of employee_profile
    degrees: Degree[];
    graduate_studies: GraduateStudy[];
    eligibilities: UserEligibility[];
}

interface DivisionData { id: number; name: string; sections: { id: number; name: string }[] }
interface PositionData  { id: number; title: string; salary_grade: number }

interface PageProps {
    auth: { user: { id: number; roles: string[] } };
    profileUser: ProfileUser;
    canEditCompany: boolean;
    divisionAbbreviations: Record<string, string>;
    sectionAbbreviations: Record<string, string>;
    [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(u: ProfileUser) {
    return ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase()
        || u.name?.[0]?.toUpperCase() || '?';
}

function fullName(u: ProfileUser) {
    const mid = u.middle_name ? u.middle_name[0].toUpperCase() + '.' : null;
    return [u.first_name, mid, u.last_name, u.name_ext].filter(Boolean).join(' ') || u.name;
}

/** Format a period string pair from PDS (period_from / period_to). */
function educationPeriod(from: string | null, to: string | null) {
    if (!from && !to) return null;
    return [from || '—', to || 'Present'].join(' – ');
}

function calcCompletion(user: ProfileUser): number {
    const ep  = user.employee_profile;
    const pi  = user.personal_info;
    const checks = [
        !!user.photo,
        !!(user.first_name && user.last_name),
        !!user.email,
        !!pi?.mobile_number,
        !!ep?.position,
        !!ep?.place_assign,
        !!ep?.division,
        !!ep?.employment_type,
        !!ep?.date_hired,
        !!pi?.sex,
        !!pi?.civil_status,
        !!pi?.birth_place,
        user.degrees.length > 0,
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function EditBtn({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick}
            className="flex cursor-pointer items-center gap-1.5 rounded-full p-1.5 text-xs font-semibold text-white hover:bg-green-700 transition bg-green-600">
            <Pencil className="h-5 w-5" />
        </button>
    );
}

function InfoGrid({ items }: { items: { label: string; value: string | null | undefined }[] }) {
    const visible = items.filter(i => i.value);
    if (!visible.length) return <p className="text-sm text-gray-400 italic">No information available.</p>;
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ label, value }) => (
                <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
            ))}
        </div>
    );
}

function SectionBlock({ title, children }: {
    title: string; children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-green-900">{title}</h3>
            {children}
        </div>
    );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

function ModalShell({ title, onClose, onSave, saving, children }: {
    title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-semibold text-green-800">{title}</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">{children}</div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={onClose}
                        className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? <><Spinner /> Saving</> : 'Save Changes'}
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

// Edit Personal — writes to users + pds_personal_info
function EditPersonalModal({ user, isOwn, onClose }: { user: ProfileUser; isOwn: boolean; onClose: () => void }) {
    const pi = user.personal_info;
    const [form, setForm] = useState({
        first_name:    user.first_name    ?? '',
        middle_name:   user.middle_name   ?? '',
        last_name:     user.last_name     ?? '',
        name_ext:      user.name_ext      ?? '',
        email:         user.email         ?? '',
        sex:           pi?.sex            ?? '',
        birth_place:   pi?.birth_place    ?? '',
        civil_status:  pi?.civil_status   ?? '',
        mobile_number: pi?.mobile_number  ?? '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    function save() {
        setSaving(true);
        const url = isOwn ? '/profile/personal' : '/profile/' + user.id + '/personal';
        router.post(url, form, {
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
                <Field label="Suffix">
                    <select value={form.name_ext} onChange={set('name_ext')} className={inputCls}>
                        <option value="">None</option>
                        {['Jr', 'Sr', 'I', 'II', 'III'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Email"><input type="email" value={form.email} onChange={set('email')} className={inputCls} /></Field>
            <Field label="Mobile Number"><input value={form.mobile_number} onChange={set('mobile_number')} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Sex">
                    <select value={form.sex} onChange={set('sex')} className={inputCls}>
                        <option value="">— Select —</option>
                        <option>Male</option><option>Female</option>
                    </select>
                </Field>
                <Field label="Civil Status">
                    <select value={form.civil_status} onChange={set('civil_status')} className={inputCls}>
                        <option value="">— Select —</option>
                        {['Single', 'Married', 'Widowed', 'Separated', 'Other'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Place of Birth">
                <input value={form.birth_place} onChange={set('birth_place')} className={inputCls} />
            </Field>
        </ModalShell>
    );
}

// Edit Company — writes to employee_profiles
function EditCompanyModal({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
    const ep = user.employee_profile;
    const [form, setForm] = useState({
        employment_type: ep?.employment_type ?? '',
        position:        ep?.position        ?? '',
        salary_grade:    ep?.salary_grade    ?? '',
        division:        ep?.division        ?? '',
        section:         ep?.section         ?? '',
        date_hired:      ep?.date_hired ? ep.date_hired.substring(0, 10) : '',
    });
    const [saving, setSaving] = useState(false);
    const [divisions,   setDivisions]   = useState<DivisionData[]>([]);
    const [positions,   setPositions]   = useState<PositionData[]>([]);
    const [loadingDivs, setLoadingDivs] = useState(true);
    const [loadingPos,  setLoadingPos]  = useState(true);

    const [posSearch, setPosSearch] = useState(ep?.position ?? '');
    const [posOpen,   setPosOpen]   = useState(false);
    const [posStyle,  setPosStyle]  = useState<React.CSSProperties>({});
    const posRef = useRef<HTMLInputElement>(null);

    const [divSearch, setDivSearch] = useState(ep?.division ?? '');
    const [divOpen,   setDivOpen]   = useState(false);
    const [divStyle,  setDivStyle]  = useState<React.CSSProperties>({});
    const divRef = useRef<HTMLInputElement>(null);

    const [secSearch, setSecSearch] = useState(ep?.section ?? '');
    const [secOpen,   setSecOpen]   = useState(false);
    const [secStyle,  setSecStyle]  = useState<React.CSSProperties>({});
    const secRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/divisions').then(r => r.json()).then(d => { setDivisions(d); setLoadingDivs(false); }).catch(() => setLoadingDivs(false));
        fetch('/positions').then(r => r.json()).then(d => { setPositions(d); setLoadingPos(false); }).catch(() => setLoadingPos(false));
    }, []);

    const currentSections = divisions.find(d => d.name === form.division)?.sections ?? [];
    const filteredPos = posSearch.length < 1 ? positions : positions.filter(p => p.title.toLowerCase().includes(posSearch.toLowerCase()));
    const filteredDiv = divSearch.length < 1 ? divisions : divisions.filter(d => d.name.toLowerCase().includes(divSearch.toLowerCase()));
    const filteredSec = secSearch.length < 1 ? currentSections : currentSections.filter(s => s.name.toLowerCase().includes(secSearch.toLowerCase()));

    function openPos() { if (posRef.current) { const r = posRef.current.getBoundingClientRect(); setPosStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 }); } setPosOpen(true); }
    function openDiv() { if (divRef.current) { const r = divRef.current.getBoundingClientRect(); setDivStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 }); } setDivOpen(true); }
    function openSec() { if (secRef.current) { const r = secRef.current.getBoundingClientRect(); setSecStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 }); } setSecOpen(true); }

    function selectPosition(p: PositionData) { setForm(f => ({ ...f, position: p.title, salary_grade: String(p.salary_grade) })); setPosSearch(p.title); setPosOpen(false); }
    function selectDivision(d: DivisionData) { setForm(f => ({ ...f, division: d.name, section: '' })); setDivSearch(d.name); setSecSearch(''); setDivOpen(false); }
    function selectSection(s: { id: number; name: string }) { setForm(f => ({ ...f, section: s.name })); setSecSearch(s.name); setSecOpen(false); }

    function save() {
        setSaving(true);
        router.post('/profile/' + user.id + '/company', form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    }

    const Spin = () => (
        <svg className="h-4 w-4 animate-spin text-green-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );

    const SearchInput = ({ refEl, value, disabled, onChange, onFocus, loading, placeholder }: any) => (
        <div className="relative">
            {loading && <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><Spin /></div>}
            <input ref={refEl} value={value} disabled={disabled} onChange={onChange} onFocus={onFocus}
                className={`${inputCls} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : loading ? 'text-gray-400' : ''}`}
                placeholder={placeholder} autoComplete="off" />
        </div>
    );

    return (
        <ModalShell title="Edit Company Info" onClose={onClose} onSave={save} saving={saving}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Agency Employee No.">
                    <div className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400 select-none cursor-not-allowed">
                        {user.personal_info?.agency_employee_no || ep?.employee_number || '—'}
                    </div>
                </Field>
                <Field label="Employment Type">
                    <select value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))} className={inputCls}>
                        <option value="">— Select —</option>
                        <option value="JO">Job Order (JO)</option>
                        <option value="COS">Contract of Service (COS)</option>
                        <option value="Permanent">Permanent</option>
                    </select>
                </Field>
            </div>
            <Field label="Position">
                <SearchInput refEl={posRef} value={posSearch} disabled={loadingPos} loading={loadingPos}
                    onChange={(e: any) => { setPosSearch(e.target.value); openPos(); setForm(f => ({ ...f, position: e.target.value })); }}
                    onFocus={openPos} placeholder={loadingPos ? 'Loading positions...' : 'Search position title'} />
                {posOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setPosOpen(false)} />}
                {posOpen && filteredPos.length > 0 && (
                    <ul style={posStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">
                        {filteredPos.map((p: PositionData) => (
                            <li key={p.id} onMouseDown={() => selectPosition(p)}
                                className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-green-50">
                                <span className="text-gray-800">{p.title}</span>
                                <span className="ml-3 shrink-0 text-xs text-gray-400">SG {p.salary_grade}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Field>
            <Field label="Salary Grade">
                <input value={form.salary_grade ? `SG ${form.salary_grade}` : ''} readOnly
                    className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`}
                    placeholder="Auto-filled from position" />
            </Field>
            <Field label="Division">
                <SearchInput refEl={divRef} value={divSearch} disabled={loadingDivs} loading={loadingDivs}
                    onChange={(e: any) => { setDivSearch(e.target.value); openDiv(); setForm(f => ({ ...f, division: e.target.value, section: '' })); setSecSearch(''); }}
                    onFocus={openDiv} placeholder={loadingDivs ? 'Loading divisions...' : 'Search division/office'} />
                {divOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setDivOpen(false)} />}
                {divOpen && filteredDiv.length > 0 && (
                    <ul style={divStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">
                        {filteredDiv.map((d: DivisionData) => (
                            <li key={d.id} onMouseDown={() => selectDivision(d)}
                                className="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50">{d.name}</li>
                        ))}
                    </ul>
                )}
            </Field>
            <Field label="Section / Unit">
                <SearchInput refEl={secRef} value={secSearch} disabled={loadingDivs || !form.division} loading={false}
                    onChange={(e: any) => { setSecSearch(e.target.value); openSec(); setForm(f => ({ ...f, section: e.target.value })); }}
                    onFocus={openSec}
                    placeholder={loadingDivs ? 'Loading...' : !form.division ? 'Select a division first' : 'Search section / unit...'} />
                {secOpen && <div className="fixed inset-0" style={{ zIndex: 9998 }} onMouseDown={() => setSecOpen(false)} />}
                {secOpen && filteredSec.length > 0 && (
                    <ul style={secStyle} className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">
                        {filteredSec.map((s: { id: number; name: string }) => (
                            <li key={s.id} onMouseDown={() => selectSection(s)}
                                className="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50">{s.name}</li>
                        ))}
                    </ul>
                )}
            </Field>
            <Field label="Date Hired">
                <input type="date" value={form.date_hired} onChange={e => setForm(f => ({ ...f, date_hired: e.target.value }))} className={inputCls} />
            </Field>
        </ModalShell>
    );
}

// Edit Government IDs — writes to pds_personal_info
function EditGovernmentModal({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
    const pi = user.personal_info;
    const [form, setForm] = useState({
        umid_number:       pi?.umid_number       ?? '',
        pagibig_number:    pi?.pagibig_number     ?? '',
        philsys_number:    pi?.philsys_number     ?? '',
        philhealth_number: pi?.philhealth_number  ?? '',
        tin_number:        pi?.tin_number         ?? '',
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
            <Field label="UMID Number">
                <input value={form.umid_number} onChange={set('umid_number')} className={inputCls} />
            </Field>
            <Field label="Pag-IBIG Number">
                <input value={form.pagibig_number} onChange={set('pagibig_number')} className={inputCls} />
            </Field>
            <Field label="PhilSys Number">
                <input value={form.philsys_number} onChange={set('philsys_number')} className={inputCls} />
            </Field>
            <Field label="PhilHealth Number">
                <input value={form.philhealth_number} onChange={set('philhealth_number')} className={inputCls} />
            </Field>
            <Field label="TIN Number">
                <input value={form.tin_number} onChange={set('tin_number')} className={inputCls} />
            </Field>
        </ModalShell>
    );
}

// ─── Completion Donut ─────────────────────────────────────────────────────────

function CompletionDonut({ percent }: { percent: number }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative flex items-center justify-center">
                <svg width="140" height="140" className="-rotate-90">
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#00a63e" strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(percent / 100) * circ} ${circ}`}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-gray-900">{percent}%</span>
                    <span className="text-xs text-gray-400">Completed</span>
                </div>
            </div>
            <p className="mt-3 text-xs text-center text-gray-400 leading-snug px-2">
                {percent === 100 ? '✓ Profile complete!' : 'Complete your profile via the PDS page'}
            </p>
        </div>
    );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

type Section = 'personal' | 'company' | 'education' | 'eligibility' | 'government';

const navItems: { id: Section; label: string }[] = [
    { id: 'personal',    label: 'About' },
    { id: 'company',     label: 'Agency' },
    { id: 'education',   label: 'Education' },
    { id: 'eligibility', label: 'Eligibility' },
    { id: 'government',  label: 'Government IDs' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Profile', href: '/profile' }];

export default function ProfileShow() {
    const { auth, profileUser: user, canEditCompany } = usePage<PageProps>().props;

    const ep      = user.employee_profile;
    const pi      = user.personal_info;
    const isOwn   = auth.user.id === user.id;
    const canEdit = isOwn || canEditCompany;
    const name    = fullName(user);
    const avatar  = user.photo ? '/storage/' + user.photo : null;
    const progress = calcCompletion(user);

    const photoRef  = useRef<HTMLInputElement>(null);
    const tabBarRef = useRef<HTMLDivElement>(null);
    const [activeSection, setActiveSection] = useState<Section>('personal');
    const [tabSticky, setTabSticky]         = useState(false);

    useEffect(() => {
        const el = tabBarRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setTabSticky(!entry.isIntersecting),
            { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const [modal, setModal] = useState<'personal' | 'company' | 'government' | null>(null);

    function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = new FormData();
        data.append('photo', file);
        router.post('/profile/photo', data, { preserveScroll: true });
    }

    const visibleNav = navItems.filter(n =>
        n.id !== 'government' || canEditCompany || isOwn
    );

    // ── Tab Bar ──────────────────────────────────────────────────────────────

    const TabBar = ({ sticky = false }: { sticky?: boolean }) => {
        const [moreOpen, setMoreOpen] = useState(false);
        const mobileHidden = visibleNav.slice(3);

        return (
            <div className={cn('bg-white border-b border-gray-200 rounded-none sm:rounded-b-2xl shadow-sm', sticky && 'shadow-sm')}>
                <div className={cn('flex items-center', sticky ? 'max-w-5xl mx-auto px-4 sm:px-6' : 'px-4 sm:px-6')}>
                    {sticky && (
                        <div className="mr-6 shrink-0 hidden sm:flex items-center gap-2.5 py-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-green-700 shrink-0">
                                {avatar
                                    ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
                                    : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">{getInitials(user)}</div>
                                }
                            </div>
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-40">{name}</span>
                        </div>
                    )}

                    <nav className="flex flex-1 relative">
                        {visibleNav.map(({ id, label }, idx) => (
                            <button key={id} onClick={() => setActiveSection(id)}
                                className={cn(
                                    'relative shrink-0 cursor-pointer px-4 py-3.5 text-sm font-semibold transition whitespace-nowrap',
                                    idx >= 3 ? 'hidden sm:block' : '',
                                    activeSection === id
                                        ? 'text-green-700'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                )}>
                                {label}
                                {activeSection === id && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-green-600" />
                                )}
                            </button>
                        ))}

                        {mobileHidden.length > 0 && (
                            <div className="relative sm:hidden">
                                <button onClick={() => setMoreOpen(o => !o)}
                                    className={cn(
                                        'relative flex shrink-0 cursor-pointer items-center gap-1 px-4 py-3.5 text-sm font-semibold transition whitespace-nowrap',
                                        mobileHidden.some(n => n.id === activeSection)
                                            ? 'text-green-700'
                                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                    )}>
                                    More
                                    <svg className={cn('h-3.5 w-3.5 transition-transform', moreOpen && 'rotate-180')}
                                        viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                    </svg>
                                    {mobileHidden.some(n => n.id === activeSection) && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-green-600" />
                                    )}
                                </button>
                                {moreOpen && (
                                    <>
                                        <div className="fixed inset-10 z-10" onClick={() => setMoreOpen(false)} />
                                        <div className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-xl border border-gray-100 bg-white shadow-xl py-1">
                                            {mobileHidden.map(({ id, label }) => (
                                                <button key={id} onClick={() => { setActiveSection(id); setMoreOpen(false); }}
                                                    className={cn(
                                                        'flex w-full cursor-pointer items-center px-4 py-2.5 text-sm font-semibold transition',
                                                        activeSection === id ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50'
                                                    )}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </nav>

                    {sticky && isOwn && (
                        <button onClick={() => setModal('personal')}
                            className="ml-4 shrink-0 hidden sm:flex cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">
                            <Pencil className="h-3.5 w-3.5" /> Edit profile
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            {/* Modals */}
            {modal === 'personal'   && <EditPersonalModal   user={user} isOwn={isOwn} onClose={() => setModal(null)} />}
            {modal === 'company'    && <EditCompanyModal    user={user} onClose={() => setModal(null)} />}
            {modal === 'government' && <EditGovernmentModal user={user} onClose={() => setModal(null)} />}

            <div className="sm:px-6 sm:py-4 space-y-0 h-full">

                {/* HERO */}
                <div className="sm:rounded-t-2xl bg-white shadow-sm overflow-hidden">
                    <div className="relative h-36 sm:h-52 lg:h-64 w-full bg-green-700">
                        <img src="/images/desktop-wallpaper.png" alt="Banner"
                            className="h-full w-full object-cover object-[25%_48%]" />
                        <div className="absolute inset-0 bg-linear-to-r from-green-900/80 via-green-700/60 to-green-500/50" />
                    </div>

                    <div className="relative px-5 sm:px-8 pb-0">
                        <div className="absolute -top-20 sm:-top-16 left-5 sm:left-8">
                            <div className="relative">
                                <div className="h-28 w-28 sm:h-32 sm:w-32 lg:h-40 lg:w-40 overflow-hidden rounded-full border-4 border-white shadow-md bg-white">
                                    {avatar
                                        ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
                                        : <div className="flex h-full w-full items-center justify-center bg-green-700 text-3xl font-bold text-white">{getInitials(user)}</div>
                                    }
                                </div>
                                {isOwn && (
                                    <>
                                        <button onClick={() => photoRef.current?.click()}
                                            className="absolute bottom-1 right-1 lg:right-3 flex cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-green-600 border-2 border-white text-white hover:bg-green-700 transition">
                                            <Camera className="h-4 w-4" />
                                        </button>
                                        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-10 sm:pt-4 pb-4 sm:pl-36 lg:pl-44">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-semibold text-green-800 leading-tight">{name}</h1>
                                    {progress === 100 && (
                                        <BadgeCheck className="text-white bg-green-600 w-5 h-5" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{ep?.position ?? 'No position set'}</p>
                            </div>

                            <div className="flex items-center justify-end gap-2 shrink-0 mt-5">
                                {isOwn ? (
                                    <button onClick={() => setModal('personal')}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition">
                                        <Pencil className="h-4 w-4" />
                                        Edit profile
                                    </button>
                                ) : (
                                    <button disabled title="Messaging coming soon"
                                        className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-400">
                                        <MessagesSquare className="w-4 h-4" /> Message
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB BAR */}
                <div ref={tabBarRef} className="rounded-none sm:rounded-b-2xl overflow-visible mb-4">
                    <TabBar />
                </div>

                {/* Mobile completion bar */}
                {progress < 100 && (
                    <div className="flex lg:hidden items-center gap-3 mb-4 px-4 p-2 rounded-lg shadow-sm sm:mx-1 mx-3">
                        <p className="uppercase text-sm text-green-700 font-semibold">Profile Completion</p>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-green-700 shrink-0">{progress}%</span>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-4 items-start">

                    {/* Completion donut — desktop */}
                    {progress < 100 && (
                        <div className="hidden lg:block w-56 shrink-0 rounded-2xl bg-white shadow-sm py-6">
                            <p className="text-xs font-semibold text-green-800 text-center mb-4 uppercase tracking-wide">
                                Profile Completion
                            </p>
                            <CompletionDonut percent={progress} />
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 w-full rounded-2xl bg-white shadow-sm px-5 sm:px-8 py-8">

                        {/* PERSONAL */}
                        {activeSection === 'personal' && (
                            <div className="space-y-5">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-base font-semibold text-green-800">Overview</h2>
                                    {canEdit && <EditBtn onClick={() => setModal('personal')} />}
                                </div>
                                <Separator />
                                <InfoGrid items={[
                                    { label: 'Full Name',      value: name },
                                    { label: 'Sex',            value: pi?.sex },
                                    { label: 'Civil Status',   value: pi?.civil_status },
                                    { label: 'Place of Birth', value: pi?.birth_place },
                                    { label: 'Mobile Number',  value: pi?.mobile_number },
                                    { label: 'Email',          value: user.email },
                                ]} />
                            </div>
                        )}

                        {/* COMPANY */}
                        {activeSection === 'company' && (
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-base font-semibold text-green-800">Company Information</h2>
                                    {canEditCompany && <EditBtn onClick={() => setModal('company')} />}
                                </div>
                                <Separator />
                                <InfoGrid items={[
                                    { label: 'Employee No.',      value: ep?.employee_number },
                                    { label: 'Position',          value: ep?.position },
                                    { label: 'Employment Type',   value: ep?.employment_type },
                                    { label: 'Salary Grade',      value: ep?.salary_grade },
                                    { label: 'Agency',            value: ep?.place_assign },
                                    { label: 'Division / Office', value: ep?.division },
                                    { label: 'Section / Unit',    value: ep?.section },
                                    {
                                        label: 'Date Hired',
                                        value: ep?.date_hired
                                            ? new Date(ep.date_hired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                            : null,
                                    },
                                ]} />
                            </div>
                        )}

                        {/* EDUCATION — read-only, sourced from pds_education */}
                        {activeSection === 'education' && (
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-base font-semibold text-green-800">Education</h2>
                                    {/* Editing happens in the PDS page */}
                                    <span className="text-xs text-gray-400 italic">Edit via PDS page</span>
                                </div>
                                <Separator />

                                <SectionBlock title="Bachelor's Degree">
                                    {user.degrees.length === 0
                                        ? <p className="text-sm text-gray-400 italic">No college education records found in PDS</p>
                                        : (
                                            <div className="space-y-3">
                                                {user.degrees.map(d => (
                                                    <div key={d.id}
                                                        className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
                                                            <GraduationCap className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-700 text-sm">{d.degree ?? '—'}</p>
                                                            {d.school_name && (
                                                                <p className="text-xs text-gray-500 mt-0.5">{d.school_name}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {educationPeriod(d.period_from, d.period_to) ?? '—'}
                                                                {d.year_graduated && 
                                                                    <>  
                                                                        <Dot className='w-5 h-5 inline'/>
                                                                        Graduated {d.year_graduated}
                                                                    </>  
                                                                }
                                                            </p>
                                                            {d.honors_received && (
                                                                <p className="text-xs text-green-700 mt-0.5">{d.honors_received}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </SectionBlock>

                                <SectionBlock title="Graduate Studies">
                                    {user.graduate_studies.length === 0
                                        ? <p className="text-sm text-gray-400 italic">No graduate studies records in PDS yet.</p>
                                        : (
                                            <div className="space-y-3">
                                                {user.graduate_studies.map(g => (
                                                    <div key={g.id}
                                                        className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
                                                            <GraduationCap className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">{g.program ?? '—'}</p>
                                                            {g.school_name && (
                                                                <p className="text-xs text-gray-500 mt-0.5">{g.school_name}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {educationPeriod(g.period_from, g.period_to) ?? '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </SectionBlock>
                            </div>
                        )}

                        {/* ELIGIBILITY — read-only, sourced from pds_eligibilities */}
                        {activeSection === 'eligibility' && (
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-base font-semibold text-green-800">Eligibilities & Licenses</h2>
                                    <span className="text-xs text-gray-400 italic">Edit via PDS page</span>
                                </div>
                                <Separator />
                                {user.eligibilities.length === 0
                                    ? <p className="text-sm text-gray-400 italic">No eligibility records in PDS yet.</p>
                                    : (
                                        <div className="space-y-3">
                                            {user.eligibilities.map(e => (
                                                <div key={e.id}
                                                    className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
                                                        <Award className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{e.eligibility ?? '—'}</p>
                                                        {e.date_of_examination && (
                                                            <p className="text-xs text-gray-500">
                                                            {new Date(e.date_of_examination).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                        )}
                                                            {e.place_of_examination && (
                                                            <p className="text-xs text-gray-500">{e.place_of_examination}</p>
                                                        )}
                                                        {e.rating && (
                                                            <p className="text-xs text-gray-500">Rating: {e.rating}</p>
                                                        )}
                                                        {e.license_number && (
                                                            <>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    License No. {e.license_number}
                                                                    {e.license_validity && 
                                                                        <>
                                                                            <p>Valid until {new Date(e.license_validity).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                                        </>
                                                                    }
                                                                </div>
                                                                <p>

                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }
                            </div>
                        )}

                        {/* GOVERNMENT IDs — sourced from pds_personal_info */}
                        {activeSection === 'government' && (canEditCompany || isOwn) && (
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-base font-semibold text-green-800">Government Issued IDs</h2>
                                    {(canEditCompany || isOwn) && <EditBtn onClick={() => setModal('government')} />}
                                </div>
                                <Separator />
                                <InfoGrid items={[
                                    { label: 'UMID Number',       value: pi?.umid_number },
                                    { label: 'Pag-IBIG Number',   value: pi?.pagibig_number },
                                    { label: 'PhilSys Number',    value: pi?.philsys_number },
                                    { label: 'PhilHealth Number', value: pi?.philhealth_number },
                                    { label: 'TIN Number',        value: pi?.tin_number },
                                ]} />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}