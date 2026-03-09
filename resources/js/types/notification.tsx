export interface AppNotification {
    id: string;
    data: {
        message: string;
        url: string;
    };
    read_at: string | null;
    created_at: string;
}

export interface EmployeeProfile {
    employee_number: string | null;
    position: string | null;
    salary_grade: string | null;
    place_assign: string | null;
    division: string | null;
    section: string | null;
    employment_type: string | null;
    is_active: boolean;
}

export interface PendingUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    photo: string | null;
    created_at: string;
    employee_profile?: EmployeeProfile;
}