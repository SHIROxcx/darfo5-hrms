// Types shared by the memo pages.

/** A person in the saved list HR picks memo signatories from. */
export interface SignatoryRow {
    id: number;
    name: string;
    position: string;
    is_active: boolean;
    /** Address of the saved picture (admin only), or null when there is none. */
    signature_url: string | null;
}

export interface SignatoryLimits {
    name: number;
    position: number;
}

export type MemoStatus = 'draft' | 'published' | 'withdrawn';
export type MemoMode = 'written' | 'uploaded';

/** One line of the admin memo list. */
export interface MemoRow {
    id: number;
    type: string;
    number_label: string | null;
    subject: string;
    memo_date: string;
    status: MemoStatus;
    mode: MemoMode;
    published_at: string | null;
    created_by_name: string | null;
}

export interface MemoCounts {
    draft: number;
    published: number;
    withdrawn: number;
}

export interface MemoFilters {
    status: MemoStatus | null;
    type: string | null;
    search: string | null;
}

export interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** A signatory HR can pick for a memo (active ones only). */
export interface PickableSignatory {
    id: number;
    name: string;
    position: string;
    has_signature: boolean;
}

/** The signatory rows of a draft as the form edits them. */
export interface PickedSignatory {
    signatory_id: number;
    label: string;
}

/** A draft as the edit form receives it. */
export interface MemoFormData {
    id: number;
    type: string;
    subject: string;
    addressed_to: string;
    memo_date: string;
    memo_time: string | null;
    mode: MemoMode;
    body: string | null;
    reference: string | null;
    file_name: string | null;
    signatories: { signatory_id: number; label: string | null }[];
}

/** One line of the employee memo list. */
export interface EmployeeMemoRow {
    id: number;
    type: string;
    number_label: string | null;
    subject: string;
    memo_date: string;
    memo_time: string | null;
    addressed_to: string;
}

export interface EmployeeMemoFilters {
    search: string | null;
    year: number | null;
}

/** A published memo as the employee page shows it. */
export interface EmployeeMemoDetail {
    id: number;
    type: string;
    number_label: string | null;
    subject: string;
    addressed_to: string;
    memo_date: string;
    memo_time: string | null;
    mode: MemoMode;
    body: string | null;
    file_name: string | null;
    has_file: boolean;
}

/** One signatory line on a published memo. */
export interface MemoSignatoryLine {
    label: string | null;
    name: string;
    position: string;
}

/** One memo as the admin page shows it. */
export interface MemoDetail {
    id: number;
    type: string;
    status: MemoStatus;
    number_label: string | null;
    subject: string;
    addressed_to: string;
    memo_date: string;
    memo_time: string | null;
    mode: MemoMode;
    body: string | null;
    reference: string | null;
    file_name: string | null;
    has_file: boolean;
    published_at: string | null;
    published_by_name: string | null;
    withdrawn_reason: string | null;
}

/** A signatory line on the admin page. */
export interface MemoSignatoryDetail {
    label: string | null;
    name: string;
    position: string;
    has_signature: boolean;
}

/** One line of a memo's history, with its words already made. */
export interface MemoEvent {
    id: number;
    action: string;
    label: string;
    user_name: string | null;
    created_at: string;
    details: Record<string, unknown> | null;
}

/** What the admin may do with the memo in its current status. */
export interface MemoCan {
    edit: boolean;
    publish: boolean;
    withdraw: boolean;
    restore: boolean;
    delete: boolean;
}
