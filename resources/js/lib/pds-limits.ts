/**
 * Longest text each PDS box accepts. PdsController enforces the same numbers on the server;
 * PdsLimitsParityTest fails if the two lists ever differ, so change them together.
 */
export const PDS_MAX = {
    // Personal information
    last_name: 100,
    first_name: 100,
    middle_name: 100,
    name_ext: 10,
    birth_place: 60,
    mobile_number: 20,
    citizenship: 30,
    citizenship_type: 30,
    citizenship_country: 50,
    blood_type: 5,
    agency_employee_no: 30,
    telephone: 30,
    res_house_no: 30,
    res_street: 60,
    res_subdivision: 30,
    res_barangay: 60,
    res_city: 60,
    res_province: 60,
    res_zipcode: 10,
    perm_house_no: 30,
    perm_street: 60,
    perm_subdivision: 30,
    perm_barangay: 60,
    perm_city: 60,
    perm_province: 60,
    perm_zipcode: 10,
    umid_number: 25,
    pagibig_number: 25,
    philhealth_number: 25,
    philsys_number: 25,
    tin_number: 25,
    // Family background
    spouse_surname: 60,
    spouse_first_name: 60,
    spouse_middle_name: 60,
    spouse_name_ext: 10,
    spouse_occupation: 60,
    spouse_employer: 100,
    spouse_business_address: 100,
    spouse_telephone: 30,
    father_surname: 60,
    father_first_name: 60,
    father_middle_name: 60,
    father_name_ext: 10,
    mother_surname: 60,
    mother_first_name: 60,
    mother_middle_name: 60,
    child_full_name: 100,
    // Educational background
    school_name: 100,
    course: 100,
    period_from: 20,
    period_to: 20,
    highest_level: 50,
    year_graduated: 20,
    honors_received: 60,
    // Civil service eligibility
    career_service: 255,
    rating: 20,
    place_of_examination: 100,
    license_number: 30,
    // Work experience
    position_title: 255,
    department: 100,
    office: 100,
    supervisor: 60,
    location: 100,
    status_of_appointment: 50,
    accomplishments: 2000,
    actual_duties: 2000,
    // Voluntary work
    organization_name: 100,
    organization_address: 100,
    position: 60,
    // Learning and development
    title: 255,
    conducted_by: 100,
    // Other information (each skill, distinction or membership)
    tag: 100,
    // Questions
    q34_details: 255,
    q35_a_details: 255,
    q35_b_date: 50,
    q35_b_status: 50,
    q36_details: 255,
    q37_details: 255,
    q38_a_details: 255,
    q38_b_details: 255,
    q39_details: 255,
    q40_a_details: 255,
    q40_b_details: 255,
    q40_c_details: 255,
    // References and government ID
    reference_name: 60,
    reference_address: 150,
    reference_telephone: 30,
    id_type: 50,
    id_number: 30,
    date_of_issuance: 60,
    place_of_issuance: 60,
    date_accomplished: 30,
} as const;

/**
 * May the stored text change from `current` to `next`? An edit that would grow it past `max` is refused, so nothing
 * is ever cut off the end. Shrinking is always allowed, even for an old entry that is already over the limit.
 */
export function acceptsEdit(next: string, current: string, max?: number): boolean {
    return !max || next.length <= max || next.length <= current.length;
}

/** The part of pasted text that still fits once `replaced` selected characters are swapped out. */
export function clipPaste(pasted: string, current: string, replaced: number, max?: number): string {
    return max ? pasted.slice(0, Math.max(0, max - (current.length - replaced))) : pasted;
}
