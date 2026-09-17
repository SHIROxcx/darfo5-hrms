// Single source of truth for `employee_profiles.employment_type` values and
// their display labels. The stored value is always lowercase (normalized
// server-side in EmployeeProfile::setEmploymentTypeAttribute()) — options
// here use lowercase `value`s to match, and `employmentTypeLabel()` maps a
// stored value back to a human-friendly label wherever it's shown as plain
// text instead of inside a <select>.

export interface EmploymentTypeOption {
    value: string;
    label: string;
}

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentTypeOption[] = [
    { value: 'jo',        label: 'JO' },
    { value: 'cos',       label: 'COS)' },
    { value: 'pakyaw',    label: 'Pakyaw' },
    { value: 'permanent', label: 'Permanent' },
];

export function employmentTypeLabel(value?: string | null): string {
    if (!value) return '';
    const match = EMPLOYMENT_TYPE_OPTIONS.find(t => t.value === value.toLowerCase());
    return match?.label ?? value;
}
