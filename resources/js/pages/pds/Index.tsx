import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { User, PdsData, PdsSaveCallback } from '@/types/pds';
import {
    User as UserIcon, Users, BookOpen, Award, Briefcase,
    Heart, BookMarked, Info, HelpCircle, UserCheck,
    CheckCircle2, Circle, ChevronRight, FileText,
    ChevronLeft,
    Dot
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
    eligibilities: { id: number; title: string; abbreviation: string }[];
}

const SECTIONS = [
    { id: 'personal',        label: 'I. Personal Information',  icon: UserIcon,   page: 1 },
    { id: 'family',          label: 'II. Family Background',    icon: Users,      page: 1 },
    { id: 'education',       label: 'III. Education',           icon: BookOpen,   page: 1 },
    { id: 'eligibility',     label: 'IV. Eligibility',          icon: Award,      page: 2 },
    { id: 'work_experience', label: 'V. Work Experience',       icon: Briefcase,  page: 2 },
    { id: 'voluntary_work',  label: 'VI. Voluntary Work',       icon: Heart,      page: 3 },
    { id: 'trainings',       label: 'VII. Trainings',           icon: BookMarked, page: 3 },
    { id: 'other_info',      label: 'VIII. Other Information',  icon: Info,       page: 3 },
    { id: 'questions',       label: 'IX. Questions',            icon: HelpCircle, page: 4 },
    { id: 'references',      label: "X. References & ID",       icon: UserCheck,  page: 4 },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

function getSectionCompletion(sectionId: SectionId, pdsData: PdsData): boolean {
    switch (sectionId) {
        case 'personal':        return !!pdsData.personal?.date_of_birth;
        case 'family':          return !!pdsData.family?.father_surname;
        case 'education':       return (pdsData.education?.length ?? 0) > 0;
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

export default function PdsIndex({ user, pdsData, eligibilities }: Props) {
    const [activeSection, setActiveSection] = useState<SectionId>('personal');
    const [saving, setSaving] = useState(false);

    const completedCount = SECTIONS.filter(s => getSectionCompletion(s.id, pdsData)).length;
    const progressPct = Math.round((completedCount / SECTIONS.length) * 100);

    const handleSave: PdsSaveCallback = (section, data) => {
        setSaving(true);

        const hasFiles = data && Object.values(data).some(v => v instanceof File);

        if (hasFiles) {
            const fd = new FormData();
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            Object.entries(data).forEach(([k, v]) => {
                if (v instanceof File) fd.append(k, v);
                else if (v !== null && v !== undefined) fd.append(k, String(v));
            });
            fetch(`/pds/save/${section}`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': token },
                body: fd,
            })
                .then(res => {
                    if (res.ok || res.status === 302) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Saved!',
                            text: 'Your information has been saved successfully.',
                            confirmButtonColor: '#16a34a',
                            timer: 1500,
                            timerProgressBar: true,
                        });
                        router.reload({ only: ['pdsData'] });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save. Please try again.', confirmButtonColor: '#dc2626' });
                    }
                })
                .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Network error. Please try again.', confirmButtonColor: '#dc2626' }))
                .finally(() => setSaving(false));
            return;
        }

        router.post(`/pds/save/${section}`, data as any, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved!',
                    text: 'Your information has been saved successfully.',
                    confirmButtonColor: '#16a34a',
                    timer: 1500,
                    timerProgressBar: true,
                });
            },
            onFinish: () => setSaving(false),
        });
    };

    const renderSection = () => {
        const props = { user, pdsData, onSave: handleSave, saving };
        switch (activeSection) {
            case 'personal':        return <PersonalInfoSection {...props} />;
            case 'family':          return <FamilyBackgroundSection {...props} />;
            case 'education':       return <EducationSection {...props} />;
            case 'eligibility':     return <EligibilitySection {...props} eligibilities={eligibilities} />;
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
            <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>

                {/* PDS Header */}
                <div className="shrink-0 bg-white border-b border-gray-200 p-2 lg:p-4">
                    <div className="lg:flex items-center justify-between">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-600 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-md lg:text-lg font-semibold text-green-800">CS Form No. 212 — Personal Data Sheet</h1>
                                <p className="text-sm text-gray-500">
                                    {user.last_name}, {user.first_name} {user.middle_name}
                                    <Dot className="inline text-gray-700" />
                                    {pdsData.personal?.agency_employee_no ?? 'No employee number'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 lg:px-4 mt-3 lg:mt-0">
                            <p className="uppercase text-xs text-green-700 font-semibold">PDS Completion</p>
                            <div className="flex-1 w-40 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full w-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-green-700 shrink-0">{progressPct}%</span>
                        </div>
                    </div>
                </div>

                {/* Body row */}
                <div className="flex flex-1 overflow-hidden">
                    <aside className="w-14 lg:w-64 shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                        <nav className="p-2 lg:p-3 space-y-0.5">
                            {SECTIONS.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                const isDone = getSectionCompletion(section.id, pdsData);

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        title={section.label}
                                        className={`
                                            relative w-full flex items-center justify-center lg:justify-start
                                            gap-2.5 px-0 lg:px-3 py-2.5
                                            rounded-lg text-left text-sm cursor-pointer transition-all group
                                            ${isActive
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        {/* Icon — always visible, centered on mobile */}
                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-green-100' : 'text-gray-400 group-hover:text-gray-500'}`} />

                                        {/* Label — desktop only */}
                                        <span className="hidden lg:block flex-1 truncate font-medium">
                                            {section.label}
                                        </span>

                                        {/* Completion — desktop: full icon; mobile: small dot badge */}
                                        {isDone ? (
                                            <>
                                                <CheckCircle2 className={`hidden lg:block w-3.5 h-3.5 shrink-0 ${isActive ? 'text-green-200' : 'text-green-500'}`} />
                                                <span className={`
                                                    lg:hidden absolute top-1 right-1
                                                    w-1.5 h-1.5 rounded-full
                                                    ${isActive ? 'bg-green-200' : 'bg-green-500'}
                                                `} />
                                            </>
                                        ) : (
                                            <Circle className={`hidden lg:block w-3.5 h-3.5 shrink-0 ${isActive ? 'text-green-300' : 'text-gray-300'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Footer summary — desktop only */}
                        <div className="hidden lg:block p-3 border-t border-gray-200 mt-2">
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs text-green-700 font-medium mb-1">
                                    {completedCount} of {SECTIONS.length} Sections Completed
                                </p>
                                <p className="text-xs text-green-600">CS Form 212 (Revised 2025)</p>
                            </div>
                        </div>
                    </aside>

                    {/* Right column */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">

                        {/* Scrollable content */}
                        <main className="flex-1 overflow-y-auto">
                            <div className="max-w-full lg:max-w-7xl mx-auto p-4 lg:p-6">
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