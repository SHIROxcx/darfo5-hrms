import type { PdsData } from '@/types/pds';
import { isEducationComplete } from '@/pages/pds/sections/EducationSection';

export type PdsSectionId =
    | 'personal' | 'family' | 'education' | 'eligibility' | 'work_experience'
    | 'voluntary_work' | 'trainings' | 'other_info' | 'questions' | 'references';

export const PDS_SECTION_IDS: PdsSectionId[] = [
    'personal', 'family', 'education', 'eligibility', 'work_experience',
    'voluntary_work', 'trainings', 'other_info', 'questions', 'references',
];

export function getSectionCompletion(sectionId: PdsSectionId, pdsData: PdsData): boolean {
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

/** Single source of truth for "% of PDS complete" — used by both the PDS page and the Profile page. */
export function calculatePdsCompletion(pdsData: PdsData | null | undefined): number {
    if (!pdsData) return 0;
    const completed = PDS_SECTION_IDS.filter(id => getSectionCompletion(id, pdsData)).length;
    return Math.round((completed / PDS_SECTION_IDS.length) * 100);
}