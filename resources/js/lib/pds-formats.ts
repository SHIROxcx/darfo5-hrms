/**
 * Format checks for PDS boxes with a known shape, used for the instant messages under the boxes when you press Save.
 * App\Support\PdsRules runs the same checks on the server; PdsFormatsParityTest fails if the table and patterns below
 * ever differ from it. The official PDS convention is to write "N/A" when something does not apply, so the boxes
 * where that makes sense accept it. (The ZIP code is only checked on the server: the form fills it in from the chosen city.) Every check returns null for an empty box: "required" is a separate rule.
 */

/** Government IDs: the digit counts accepted (dashes and spaces are allowed between them) and an example. */
export const PDS_ID_FORMATS = {
    philsys_number: { label: 'PhilSys Card Number (PCN)', digits: [16], example: '1234-5678-9012-3456' },
    tin_number: { label: 'TIN No.', digits: [9, 12, 14], example: '123-456-789' },
    philhealth_number: { label: 'PhilHealth No.', digits: [12], example: '12-345678901-2' },
    pagibig_number: { label: 'PAG-IBIG ID No.', digits: [12], example: '1234-5678-9012' },
    umid_number: { label: 'UMID ID No.', digits: [12], example: '0845-8859385-3' },
} as const;

export type PdsIdField = keyof typeof PDS_ID_FORMATS;

/** Pattern sources; they are compiled with the `u` flag (and `i` where the check says so). */
export const PDS_PATTERNS = {
    mobile: String.raw`^(09|\+?639)\d{9}$`,
    telephone: String.raw`^(?=(?:\D*\d){5})(?:tel\.?\s*)?[0-9\s()+\-./]+(?:\s*(?:loc|local|ext|to|x)\.?\s*\d+(?:\s*/\s*\d+)*)*$`,
    // Deliberately simple: something@something.something with no spaces.
    email: String.raw`^[^\s@]+@[^\s@]+\.[^\s@]+$`,
    name: String.raw`^[\p{L}\p{M}][\p{L}\p{M}\s.\-'’,()]*$`,
    not_applicable: String.raw`^n/a$`,
} as const;

const regex = (name: keyof typeof PDS_PATTERNS, flags = '') => new RegExp(PDS_PATTERNS[name], 'u' + flags);

const isNotApplicable = (value: string) => regex('not_applicable', 'i').test(value.trim());

/** [16] => "16", [9, 12, 14] => "9, 12 or 14". */
const countsText = (counts: readonly number[]) =>
    counts.length > 1 ? `${counts.slice(0, -1).join(', ')} or ${counts[counts.length - 1]}` : String(counts[0]);

/** A government ID: the right number of digits, dashes and spaces allowed, or N/A. */
export function checkGovernmentId(field: PdsIdField, value: string): string | null {
    const text = value.trim();
    if (text === '' || isNotApplicable(text)) return null;

    const { label, digits, example } = PDS_ID_FORMATS[field];
    const count = text.replace(/\D/g, '').length;

    if (!/^[0-9\s-]+$/.test(text) || !(digits as readonly number[]).includes(count)) {
        return `${label} must have ${countsText(digits)} digits, for example ${example}. Dashes and spaces are fine; write N/A if you have none.`;
    }

    return null;
}

/** A Philippine mobile number: 09171234567, 0917 123 4567, +63 (917) 123 4567 or 639171234567. */
export function checkMobile(value: string): string | null {
    const text = value.trim();
    if (text === '') return null;

    return regex('mobile').test(text.replace(/[\s().-]/gu, '')) ? null : 'Mobile No. must look like 09171234567 or +639171234567.';
}

/** A telephone number (a mobile number passes too). `allowNa` is for boxes that may be left as N/A. */
export function checkTelephone(value: string, { allowNa = false, label = 'Telephone No.' } = {}): string | null {
    const text = value.trim();
    if (text === '' || (allowNa && isNotApplicable(text))) return null;

    if (regex('telephone', 'i').test(text)) return null;

    return `${label} may only have numbers, spaces and ( ) + - . / for example (054) 123-4567, optionally followed by loc. 101.${allowNa ? ' Write N/A if none.' : ''}`;
}

/** An email address: something@something.something with no spaces. */
export function checkEmail(value: string): string | null {
    const text = value.trim();
    if (text === '') return null;

    return regex('email').test(text) ? null : 'Email must be a valid email address, like name@example.com.';
}

/** A reference's contact: a phone number (as checkTelephone) or an email address. N/A is not accepted. */
export function checkContact(value: string, label = 'Contact No. / Email'): string | null {
    const text = value.trim();
    if (text === '') return null;

    if (regex('telephone', 'i').test(text) || regex('email').test(text)) return null;

    return `${label} must be a phone number (for example 09171234567) or an email address.`;
}

/** A person's name (or part of one): letters, spaces and . - ' , ( ) only, no numbers. */
export function checkPersonName(value: string, label: string, allowNa = false): string | null {
    const text = value.trim();
    if (text === '' || (allowNa && isNotApplicable(text))) return null;

    return regex('name').test(text) ? null : `${label} may only have letters, spaces and . - ' , ( ) (no numbers).${allowNa ? ' Write N/A if none.' : ''}`;
}
