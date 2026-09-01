export interface EmployeeProfile {
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

export interface PersonalInfo {
    sex: 'Male' | 'Female' | null;
    birth_place: string | null;
    date_of_birth: string | null;
    civil_status: string | null;
    mobile_number: string | null;
    height: string | null;
    weight: string | null;
    blood_type: string | null;
    agency_employee_no: string | null;
    umid_number: string | null;
    pagibig_number: string | null;
    philhealth_number: string | null;
    philsys_number: string | null;
    tin_number: string | null;
}

export interface Degree {
    id: number;
    degree: string | null;
    school_name: string | null;
    period_from: string | null;
    period_to: string | null;
    year_graduated: string | null;
    honors_received: string | null;
}

export interface GraduateStudy {
    id: number;
    program: string | null;
    school_name: string | null;
    period_from: string | null;
    period_to: string | null;
}

export interface UserEligibility {
    id: number;
    eligibility: string | null;
    rating: string | null;
    date_of_examination: string | null;
    place_of_examination: string | null;
    license_number: string | null;
    license_validity: string | null;
}

export interface ProfileUser {
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
    personal_info: PersonalInfo | null;
    degrees: Degree[];
    graduate_studies: GraduateStudy[];
    eligibilities: UserEligibility[];
}
