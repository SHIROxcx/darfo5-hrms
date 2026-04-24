import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { User, PdsData, PdsSaveCallback } from '@/types/pds';
import {
    User as UserIcon, Users, BookOpen, Award, Briefcase, Download,
    Heart, BookMarked, Info, HelpCircle, UserCheck,
    CheckCircle2, Circle, ChevronRight, FileText,
    ChevronLeft, Dot, Eye, X, Printer
} from 'lucide-react';
import Swal from 'sweetalert2';

// Section components
import PersonalInfoSection from '@/pages/pds/sections/PersonalInfoSection';
import FamilyBackgroundSection from '@/pages/pds/sections/FamilyBackgroundSection';
import EducationSection from '@/pages/pds/sections/EducationSection';
import EligibilitySection from '@/pages/pds/sections/EligibilitySection';
import WorkExperienceSection from '@/pages/pds/sections/WorkExperienceSection';
import VoluntaryWorkSection from '@/pages/pds/sections/VoluntaryWorkSection';
import TrainingSection from '@/pages/pds/sections/TrainingSection';
import OtherInfoSection from '@/pages/pds/sections/OtherInfoSection';
import QuestionsSection from '@/pages/pds/sections/QuestionsSection';
import ReferencesSection from '@/pages/pds/sections/ReferencesSection';

interface Props {
    user: User;
    pdsData: PdsData;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Personal Data Sheet', href: '/pds' },
];

const SECTIONS = [
    { id: 'personal',      label: 'I. Personal Information',      icon: UserIcon,   page: 1 },
    { id: 'family',        label: 'II. Family Background',         icon: Users,      page: 1 },
    { id: 'education',     label: 'III. Educational Background',   icon: BookOpen,   page: 1 },
    { id: 'eligibility',   label: 'IV. Civil Service Eligibility', icon: Award,      page: 2 },
    { id: 'work_experience', label: 'V. Work Experience',          icon: Briefcase,  page: 2 },
    { id: 'voluntary_work',  label: 'VI. Voluntary Work',          icon: Heart,      page: 3 },
    { id: 'trainings',     label: 'VII. Learning & Development',   icon: BookMarked, page: 3 },
    { id: 'other_info',    label: 'VIII. Other Information',       icon: Info,       page: 3 },
    { id: 'questions',     label: 'IX. Questions',                 icon: HelpCircle, page: 4 },
    { id: 'references',    label: "X. References & Photo",      icon: UserCheck,  page: 4 },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

function getSectionCompletion(sectionId: SectionId, pdsData: PdsData): boolean {
    switch (sectionId) {
        case 'personal':      return !!pdsData.personal?.date_of_birth;
        case 'family':        return !!pdsData.family?.father_surname;
        case 'education':     return (pdsData.education?.length ?? 0) > 0;
        case 'eligibility':   return (pdsData.eligibilities?.length ?? 0) > 0;
        case 'work_experience': return (pdsData.work_experience?.length ?? 0) > 0;
        case 'voluntary_work':  return (pdsData.voluntary_work?.length ?? 0) > 0;
        case 'trainings':     return (pdsData.trainings?.length ?? 0) > 0;
        case 'other_info':    return (pdsData.other_info?.special_skills?.length ?? 0) > 0;
        case 'questions':     return pdsData.questions?.q34_a !== undefined && pdsData.questions?.q34_a !== null;
        case 'references':    return (pdsData.references?.length ?? 0) > 0;
        default:              return false;
    }
}


// PDF Preview Modal

function PdfPreviewModal({ userId, onClose }: { userId: number; onClose: () => void }) {
    const previewUrl = `/pds/preview/${userId}`;
    const downloadUrl = `/pds/download/${userId}`;
    const [loaded, setLoaded] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        // Prevent body scroll while modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-200 flex flex-col bg-black/80" onClick={onClose}>
            {/* Top bar */}
            <div
                className="shrink-0 flex items-center justify-between px-5 py-3 bg-gray-900"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold text-sm">CS Form 212 — Personal Data Sheet</span>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* PDF iframe */}
            <div className="flex-1 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Loading skeleton */}
                {!loaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-800">
                        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-300 text-sm">Generating PDF preview…</p>
                    </div>
                )}
                <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    style={{ display: loaded ? 'block' : 'none' }}
                    onLoad={() => setLoaded(true)}
                    title="PDS Preview"
                />
            </div>

            {/* Bottom bar hint */}
            <div
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-2 bg-gray-900 text-gray-400 text-xs"
                onClick={e => e.stopPropagation()}
            >
                <span>Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-xs">Esc</kbd> to close</span>
                <span> <Dot /> </span>
                <span>Use your browser&apos;s built-in print button inside the PDF viewer to print</span>
            </div>
        </div>
    );
}

export default function PdsIndex({ user, pdsData }: Props) {
    const [activeSection, setActiveSection] = useState<SectionId>('personal');
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const completedCount = SECTIONS.filter(s => getSectionCompletion(s.id, pdsData)).length;
    const progressPct = Math.round((completedCount / SECTIONS.length) * 100);

    const handleSave: PdsSaveCallback = async (section, data) => {
        setSaving(true);
        const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        const hasFiles = Object.values(data).some(v => v instanceof File);

        try {
            let res: Response;
            if (hasFiles) {
                const fd = new FormData();
                Object.entries(data).forEach(([k, v]) => {
                    if (v instanceof File) {
                        fd.append(k, v);
                    } else if (Array.isArray(v)) {
                        // Serialize arrays (like references) as JSON string
                        fd.append(k, JSON.stringify(v));
                    } else if (v !== null && v !== undefined) {
                        fd.append(k, String(v));
                    }
                });
                res = await fetch(`/pds/save/${section}`, {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': token },
                    body: fd,
                });
            } else {
                res = await fetch(`/pds/save/${section}`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': token,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
            }

            if (!res.ok) throw new Error('Save failed');

            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'Your information has been saved successfully.',
                confirmButtonColor: '#16a34a',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false,
            });

            router.reload({ only: ['pdsData'] });

        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save. Please try again.', confirmButtonColor: '#dc2626' });
            throw e;
        } finally {
            setSaving(false);
        }
    };

    const renderSection = () => {
        const props = { user, pdsData, onSave: handleSave, saving };
        switch (activeSection) {
            case 'personal':      return <PersonalInfoSection {...props} />;
            case 'family':        return <FamilyBackgroundSection {...props} />;
            case 'education':     return <EducationSection {...props} />;
            case 'eligibility':   return <EligibilitySection {...props} />;
            case 'work_experience': return <WorkExperienceSection {...props} />;
            case 'voluntary_work':  return <VoluntaryWorkSection {...props} />;
            case 'trainings':     return <TrainingSection {...props} />;
            case 'other_info':    return <OtherInfoSection {...props} />;
            case 'questions':     return <QuestionsSection {...props} />;
            case 'references':    return <ReferencesSection {...props} />;
            default:              return null;
        }
    };

    const currentSectionIdx = SECTIONS.findIndex(s => s.id === activeSection);

    return (
        <AppLayout>
            <Head title="Personal Data Sheet" />

            {/* PDF Preview Modal */}
            {showPreview && (
                <PdfPreviewModal
                    userId={user.id!}
                    onClose={() => setShowPreview(false)}
                />
            )}

            <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>

                {/* PDS Header */}
                <div className="shrink-0 bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-green-800">CS Form No. 212 — Personal Data Sheet</h1>
                                <p className="text-sm text-gray-500">
                                    {user.last_name}, {user.first_name} {user.middle_name}
                                    <Dot className="inline text-gray-700" />
                                    {pdsData.personal?.agency_employee_no ?? 'No employee number'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-xs font-semibold text-green-700">{progressPct}% Complete</div>
                                <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1">
                                    <div
                                        className="h-full bg-green-600 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPreview(true)}
                                title='Preview'
                                className="flex items-center gap-1.5 p-3 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body row */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar */}
                    <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto shrink-0">
                        <nav className="p-3 space-y-0.5">
                            {SECTIONS.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                const isDone = getSectionCompletion(section.id, pdsData);

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm cursor-pointer transition-all group ${
                                            isActive
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-green-100' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                        <span className="flex-1 truncate font-medium">{section.label}</span>
                                        {isDone ? (
                                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-green-200' : 'text-green-500'}`} />
                                        ) : (
                                            <Circle className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-green-300' : 'text-gray-300'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-3 border-t border-gray-200 mt-2">
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs text-green-700 font-medium mb-1">{completedCount} of {SECTIONS.length} Sections Completed</p>
                                <p className="text-xs text-green-600">CS Form 212 (Revised 2025)</p>
                            </div>
                        </div>
                    </aside>

                    {/* Right column */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">

                        {/* Scrollable content */}
                        <main className="flex-1 overflow-y-auto">
                            <div className="max-w-full lg-max-w-8xl mx-auto px-6 py-6">
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    {renderSection()}
                                </div>
                            </div>
                        </main>

                        {/* Sticky footer nav */}
                        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
                            <button
                                onClick={() => currentSectionIdx > 0 && setActiveSection(SECTIONS[currentSectionIdx - 1].id)}
                                disabled={currentSectionIdx === 0}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            <span className="text-xs text-gray-400">
                                Section {currentSectionIdx + 1} of {SECTIONS.length}
                            </span>
                            <button
                                onClick={() => currentSectionIdx < SECTIONS.length - 1 && setActiveSection(SECTIONS[currentSectionIdx + 1].id)}
                                disabled={currentSectionIdx === SECTIONS.length - 1}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}