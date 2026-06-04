import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { User, PdsData, PdsSaveCallback } from '@/types/pds';
import {
    User as UserIcon, Users, Award, Briefcase, Download,
    Heart, BookMarked, Info, HelpCircle, UserCheck,
    CheckCircle2, Circle, ChevronRight, FileText,
    ChevronLeft, Dot, X,
    GraduationCap,
    HeartHandshake,
    BriefcaseBusiness,
    ClipboardList,
} from 'lucide-react';
import Swal from 'sweetalert2';

// Section components
import PersonalInfoSection from '@/pages/pds/sections/PersonalInfoSection';
import FamilyBackgroundSection from '@/pages/pds/sections/FamilyBackgroundSection';
import EducationSection, { isEducationComplete } from '@/pages/pds/sections/EducationSection';
import EligibilitySection from '@/pages/pds/sections/EligibilitySection';
import WorkExperienceSection from '@/pages/pds/sections/WorkExperienceSection';
import VoluntaryWorkSection from '@/pages/pds/sections/VoluntaryWorkSection';
import TrainingSection from '@/pages/pds/sections/TrainingSection';
import OtherInfoSection from '@/pages/pds/sections/OtherInfoSection';
import QuestionsSection from '@/pages/pds/sections/QuestionsSection';
import ReferencesSection from '@/pages/pds/sections/ReferencesSection';

// NEW: Work Experience Sheet modal
import WorkExperienceSheetModal from '@/pages/pds/WorkExperienceSheetModal';

interface Props {
    user: User;
    pdsData: PdsData;
}

const SECTIONS = [
    { id: 'personal',        label: 'I. Personal Information',       icon: UserIcon,            page: 1 },
    { id: 'family',          label: 'II. Family Background',         icon: Users,               page: 1 },
    { id: 'education',       label: 'III. Education',                icon: GraduationCap,       page: 1 },
    { id: 'eligibility',     label: 'IV. Licenses & Eligibilities',  icon: Award,               page: 2 },
    { id: 'work_experience', label: 'V. Work Experience',            icon: BriefcaseBusiness,   page: 2 },
    { id: 'voluntary_work',  label: 'VI. Voluntary Work',            icon: HeartHandshake,      page: 3 },
    { id: 'trainings',       label: 'VII. L&D Interventions',        icon: BookMarked,          page: 3 },
    { id: 'other_info',      label: 'VIII. Other Information',       icon: Info,                page: 3 },
    { id: 'questions',       label: 'IX. Legal Declarations',        icon: HelpCircle,          page: 4 },
    { id: 'references',      label: "X. References & ID",            icon: UserCheck,           page: 4 },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

function getSectionCompletion(sectionId: SectionId, pdsData: PdsData): boolean {
    switch (sectionId) {
        case 'personal':        return !!pdsData.personal?.date_of_birth;
        case 'family':          return !!pdsData.family?.father_surname;
        case 'education':       return isEducationComplete(pdsData.education);
        case 'eligibility':     return (pdsData.eligibilities?.length ?? 0) > 0;
        case 'work_experience': return (pdsData.work_experience?.length ?? 0) > 0;
        case 'voluntary_work':  return (pdsData.voluntary_work?.length ?? 0) > 0;
        case 'trainings':       return (pdsData.trainings?.length ?? 0) > 0;
        case 'other_info':      return (pdsData.other_info?.special_skills?.length ?? 0) > 0;
        case 'questions':       return pdsData.questions?.q34_a !== undefined && pdsData.questions?.q34_a !== null;
        case 'references':      return (pdsData.references?.length ?? 0) > 0;
        default:                return false;
    }
}

// ── PDF Preview Modal ──────────────────────────────────────────────────────────

function PdfPreviewModal({ userId, onClose }: { userId: number; onClose: () => void }) {
    const previewUrl  = `/pds/preview/${userId}`;
    const downloadUrl = `/pds/download/${userId}`;
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-200 flex flex-col bg-black/80" onClick={onClose}>
            {/* Top bar */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-gray-900" onClick={e => e.stopPropagation()}>
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

            {/* Bottom hint */}
            <div className="shrink-0 flex items-center justify-center gap-2 px-5 py-2 bg-gray-900 text-gray-400 text-xs" onClick={e => e.stopPropagation()}>
                <span>Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-xs">Esc</kbd> to close</span>
                <span><Dot /></span>
                <span>Use your browser&apos;s built-in print button inside the PDF viewer to print</span>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PdsIndex({ user, pdsData }: Props) {
    const [activeSection, setActiveSection] = useState<SectionId>('personal');
    const [saving, setSaving]               = useState(false);
    const [showPreview, setShowPreview]     = useState(false);
    const [showWes,     setShowWes]         = useState(false);   // ← NEW

    const completedCount = SECTIONS.filter(s => getSectionCompletion(s.id, pdsData)).length;
    const progressPct    = Math.round((completedCount / SECTIONS.length) * 100);

    const handleSave: PdsSaveCallback = async (section, data) => {
        setSaving(true);

        try {
            const payload = data instanceof FormData
                ? data
                : (() => {
                    const hasFiles = Object.values(data as Record<string, unknown>)
                        .some(v => v instanceof File);

                    if (!hasFiles) return data;

                    const fd = new FormData();
                    Object.entries(data as Record<string, unknown>).forEach(([k, v]) => {
                        if (v instanceof File)                   fd.append(k, v);
                        else if (Array.isArray(v))               fd.append(k, JSON.stringify(v));
                        else if (v !== null && v !== undefined)  fd.append(k, String(v));
                    });
                    return fd;
                })();

            await axios.post(`/pds/save/${section}`, payload, {
                headers: payload instanceof FormData
                    ? { 'Content-Type': 'multipart/form-data' }
                    : {},
            });

            Swal.fire({
                icon: 'success',
                text: 'Your information has been saved successfully!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                customClass: {
                    popup: '!rounded-xl !shadow-lg !text-sm',
                },
            });

            router.reload({ only: ['pdsData'] });
        } catch (e: any) {
            if (e.response?.status === 422) {
                const errors = e.response.data?.errors ?? {};
                const firstError = (Object.values(errors).flat() as string[])[0];
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: firstError ?? 'Failed to save. Please try again.',
                    confirmButtonColor: '#dc2626',
                });
                return;
            }
            throw e;
        } finally {
            setSaving(false);
        }
    };

    const renderSection = () => {
        const props = { user, pdsData, onSave: handleSave, saving };
        switch (activeSection) {
            case 'personal':        return <PersonalInfoSection {...props} />;
            case 'family':          return <FamilyBackgroundSection {...props} />;
            case 'education':       return <EducationSection {...props} />;
            case 'eligibility':     return <EligibilitySection {...props} />;
            case 'work_experience': return <WorkExperienceSection {...props} />;
            case 'voluntary_work':  return <VoluntaryWorkSection {...props} />;
            case 'trainings':       return <TrainingSection {...props} />;
            case 'other_info':      return <OtherInfoSection {...props} />;
            case 'questions':       return <QuestionsSection {...props} />;
            case 'references':      return <ReferencesSection {...props} />;
            default:                return null;
        }
    };

    const currentSectionIdx = SECTIONS.findIndex(s => s.id === activeSection);

    return (
        <AppLayout>
            <Head title="Personal Data Sheet" />

            {showPreview && (
                <PdfPreviewModal userId={user.id!} onClose={() => setShowPreview(false)} />
            )}

            {/* NEW: Work Experience Sheet modal */}
            <WorkExperienceSheetModal
                open={showWes}
                onClose={() => setShowWes(false)}
                user={user}
                pdsData={pdsData}
            />

            <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>

                {/* Header */}
                <div className="shrink-0 bg-white border-b border-gray-200 p-4">
                    <div className="block sm:flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="hidden w-12 h-12 rounded-lg bg-green-600 lg:flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm sm:text-md md:text-lg font-semibold text-green-800">CS Form No. 212 — Personal Data Sheet</h1>
                                <div className="text-right flex items-center gap-2">
                                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                                        <div
                                            className="h-full bg-green-600 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <div className="text-xs font-semibold text-green-700">{progressPct}% Complete</div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action buttons ── */}
                        <div className="flex items-center justify-end gap-2 mt-3 sm:mt-0">
                            {/* Generate Work Experience Sheet — NEW */}
                            <button
                                onClick={() => setShowWes(true)}
                                title="Generate Work Experience Sheet"
                                className="flex items-center gap-2 p-3 bg-white border border-green-600 hover:bg-green-50 text-green-700 text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer"
                            >
                                <ClipboardList className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Work Experience Sheet</span>
                                <span className="sm:hidden">WES</span>
                            </button>

                            {/* Generate PDS — existing */}
                            <button
                                onClick={() => setShowPreview(true)}
                                title="Generate PDS"
                                className="flex items-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer"
                            >
                                <FileText className="w-3.5 h-3.5" /> Generate PDS
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Sidebar ─────────────────────────────────────────────── */}
                    <aside className="w-14 lg:w-68 shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                        <nav className="p-2 lg:p-3 space-y-0.5">
                            {SECTIONS.map((section) => {
                                const Icon    = section.icon;
                                const isActive = activeSection === section.id;
                                const isDone   = getSectionCompletion(section.id, pdsData);

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        title={section.label}
                                        className={`
                                            relative w-full flex items-center
                                            justify-center lg:justify-start
                                            gap-2.5 px-0 lg:px-3 py-2.5
                                            rounded-lg text-left text-sm cursor-pointer transition-all group
                                            ${isActive
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-green-100' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                        <span className="hidden lg:block flex-1 truncate font-medium">
                                            {section.label}
                                        </span>
                                        {isDone ? (
                                            <>
                                                <CheckCircle2 className={`hidden lg:block w-3.5 h-3.5 shrink-0 ${isActive ? 'text-green-200' : 'text-green-500'}`} />
                                                <span className={`lg:hidden absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-200' : 'bg-green-500'}`} />
                                            </>
                                        ) : (
                                            <Circle className={`hidden lg:block w-3.5 h-3.5 shrink-0 ${isActive ? 'text-green-300' : 'text-gray-300'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="hidden lg:block p-3 border-t border-gray-200 mt-2">
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs text-green-700 font-medium mb-1">
                                    {completedCount} of {SECTIONS.length} Sections Completed
                                </p>
                                <p className="text-xs text-green-600">CS Form 212 (Revised 2025)</p>
                            </div>
                        </div>
                    </aside>

                    {/* ── Content ───────────────────────────────────────────── */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        <main className="flex-1 overflow-y-auto">
                            <div className="max-w-full lg:max-w-8xl mx-auto p-4 md:p-6">
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    {renderSection()}
                                </div>
                            </div>
                        </main>

                        {/* Footer nav */}
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