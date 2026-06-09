// resources/js/types/pds.ts

export interface PdsPersonalInfo {
    id?: number;
    user_id?: number;
    // Personal info (moved from employee_profiles)
    date_of_birth?: string;
    sex?: string;
    birth_place?: string;
    civil_status?: string;
    mobile_number?: string;
    // Citizenship
    citizenship?: string;
    citizenship_type?: string;
    citizenship_country?: string;
    // Physical
    height?: number | string;
    weight?: number | string;
    blood_type?: string;
    agency_employee_no?: string; 
    res_house_no?: string;
    res_street?: string;
    res_subdivision?: string;
    res_barangay?: string;
    res_city?: string;
    res_province?: string;
    res_zipcode?: string;
    perm_house_no?: string;
    perm_street?: string;
    perm_subdivision?: string;
    perm_barangay?: string;
    perm_city?: string;
    perm_province?: string;
    perm_zipcode?: string;
    telephone?: string;
    email?: string;
    // Government IDs (moved from employee_profiles)
    umid_number?: string;
    pagibig_number?: string;
    philhealth_number?: string;
    philsys_number?: string;
    tin_number?: string;
}

export interface PdsFamilyBackground {
    spouse_surname?: string;
    spouse_first_name?: string;
    spouse_middle_name?: string;
    spouse_name_ext?: string;
    spouse_occupation?: string;
    spouse_employer?: string;
    spouse_business_address?: string;
    spouse_telephone?: string;
    father_surname?: string;
    father_first_name?: string;
    father_middle_name?: string;
    father_name_ext?: string;
    mother_surname?: string;
    mother_first_name?: string;
    mother_middle_name?: string;
}

export interface PdsChild {
    id?: number;
    full_name: string;
    date_of_birth?: string;
}

export interface PdsEducation {
    id?: number;
    level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
    school_name?: string;
    course?: string;
    period_from?: string;
    period_to?: string;
    highest_level?: string;
    year_graduated?: string;
    honors_received?: string;
}

export interface PdsEligibility {
    id?: number;
    career_service?: string;
    rating?: string;
    date_of_examination?: string;
    place_of_examination?: string;
    license_number?: string;
    license_validity?: string;
    attachment?: string;
}

export interface PdsWorkExperience {
    id?: number;
    date_from?: string;
    date_to?: string;
    is_present?: boolean;
    position_title?: string;
    office?: string;
    department?: string;
    supervisor?: string;
    location?: string;
    salary_grade?: string;
    status_of_appointment?: string;
    is_government_service?: boolean;
    attachment?: string;
}

export interface PdsVoluntaryWork {
    id?: number;
    organization_name?: string;
    organization_address?: string;
    date_from?: string;
    date_to?: string;
    number_of_hours?: number | string;
    position?: string;
    attachment?: string;
}

export interface PdsTraining {
    id?: number;
    title?: string;
    date_from?: string;
    date_to?: string;
    number_of_hours?: number | string;
    type_of_ld?: string;
    conducted_by?: string;
    attachment?: string;
}

export interface PdsOtherInfo {
    special_skills?: string[];
    non_academic_distinctions?: string[];
    organization_memberships?: string[];
}

export interface PdsQuestion {
    q34_a?: boolean | null;
    q34_b?: boolean | null;
    q34_details?: string;
    q35_a?: boolean | null;
    q35_a_details?: string;
    q35_b?: boolean | null;
    q35_b_date?: string;
    q35_b_status?: string;
    q36?: boolean | null;
    q36_details?: string;
    q37?: boolean | null;
    q37_details?: string;
    q38_a?: boolean | null;
    q38_a_details?: string;
    q38_b?: boolean | null;
    q38_b_details?: string;
    q39?: boolean | null;
    q39_details?: string;
    q40_a?: boolean | null;
    q40_a_details?: string;
    q40_b?: boolean | null;
    q40_b_details?: string;
    q40_c?: boolean | null;
    q40_c_details?: string;
}

export interface PdsReference {
    id?: number;
    name?: string;
    address?: string;
    telephone?: string;

}

export interface PdsGovernmentId {
    id_type?: string;
    id_number?: string;
    date_of_issuance?: string;
    place_of_issuance?: string;
    passport_photo?: string | null;
    signature?: string | null;
    date_accomplished?: string | null;
}

export type PdsSaveCallback = (section: string, data: FormData | Record<string, unknown>) => void;

export interface PdsData {
    personal?: PdsPersonalInfo | null;
    family?: PdsFamilyBackground | null;
    children?: PdsChild[];
    education?: PdsEducation[];
    eligibilities?: PdsEligibility[];
    work_experience?: PdsWorkExperience[];
    voluntary_work?: PdsVoluntaryWork[];
    trainings?: PdsTraining[];
    other_info?: PdsOtherInfo | null;
    questions?: PdsQuestion | null;
    references?: PdsReference[];
    government_id?: PdsGovernmentId | null;
}

export interface User {
    id: number;
    name?: string;
    email: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    name_ext?: string;
    photo?: string;
    employee_profile?: {
        employee_number?: string;
        employment_type?: string;
        position?: string;
        salary_grade?: string;
        place_assign?: string;
        division?: string;
        section?: string;
        date_hired?: string;
    };
}