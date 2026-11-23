/**
 * Helpers for the salary fields of a PDS work experience row.
 * The grade and step are stored together as "24-2" (CS Form 212 format "00-0").
 */

export function splitGradeStep(value?: string | null): { grade: string; step: string } {
    const [grade = '', step = ''] = (value ?? '').split('-');
    return { grade, step };
}

/** Grade alone while the step is still empty; empty when there is no grade. */
export function joinGradeStep(grade: string, step: string): string {
    if (!grade) return '';
    return step ? `${grade}-${step}` : grade;
}

/** Keeps digits and the first dot, so "P21,877.00" becomes "21877.00". */
export function cleanMoney(raw: string): string {
    const kept = raw.replace(/[^0-9.]/g, '');
    const firstDot = kept.indexOf('.');
    if (firstDot === -1) return kept;
    return kept.slice(0, firstDot + 1) + kept.slice(firstDot + 1).replace(/\./g, '');
}
