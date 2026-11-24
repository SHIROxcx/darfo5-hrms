// Types shared by the memo pages. A memo is only an uploaded file: its subject is the file's name.

export type MemoStatus = 'draft' | 'published' | 'withdrawn';

/** One line of the admin memo list. */
export interface MemoRow {
    id: number;
    subject: string;
    memo_date: string;
    status: MemoStatus;
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
    search: string | null;
}

export interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** A draft as the edit form receives it. */
export interface MemoFormData {
    id: number;
    subject: string;
    file_name: string | null;
}

/** One line of the employee memo list. */
export interface EmployeeMemoRow {
    id: number;
    subject: string;
    memo_date: string;
}

export interface EmployeeMemoFilters {
    search: string | null;
    year: number | null;
}

/** A published memo as the employee page shows it. */
export interface EmployeeMemoDetail {
    id: number;
    subject: string;
    memo_date: string;
    file_name: string | null;
    has_file: boolean;
}

/** One memo as the admin page shows it. */
export interface MemoDetail {
    id: number;
    status: MemoStatus;
    subject: string;
    memo_date: string;
    file_name: string | null;
    has_file: boolean;
    published_at: string | null;
    published_by_name: string | null;
    withdrawn_reason: string | null;
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
