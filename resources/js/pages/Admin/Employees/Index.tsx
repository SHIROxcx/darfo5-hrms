import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import {
    Check, Lock, ExternalLink, FileDown, Upload,
    Search, Trash2, UserCheck, UserX, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Spinner } from '@/components/ui/spinner';
import { StatusDot } from '@/components/status-dot';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import ServiceRecordImportModal from './ServiceRecordImportModal';
import EmployeeFilters, { type FilterValues } from './EmployeeFilters';

// Types

interface EmployeeProfile {
    employee_number: string | null;
    position: string | null;
    salary_grade: string | null;
    place_assign: string | null;
    division: string | null;
    section: string | null;
    employment_type: string | null;
    is_active: boolean;
}

interface Employee {
    id: number;
    public_token: string;
    first_name: string | null;
    last_name: string | null;
    name_ext: string | null;
    email: string;
    photo: string | null;
    is_approved: boolean;
    email_verified_at: string | null;
    employee_profile: EmployeeProfile | null;
}

interface PaginatedEmployees {
    data: Employee[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Filters {
    search?: string;
    status?: string;
    employment_type?: string;
    division?: string;
}

interface Props {
    employees: PaginatedEmployees;
    filters: Filters;
    divisions: string[];
}

// Helpers

function getFullName(emp: Employee): string {
    return [emp.first_name, emp.last_name, emp.name_ext].filter(Boolean).join(' ') || emp.email;
}

function getInitials(emp: Employee): string {
    return `${emp.first_name?.[0] ?? ''}${emp.last_name?.[0] ?? ''}`.toUpperCase() || '??';
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
});

function firstErrorMessage(errors: Record<string, string>, fallback: string): string {
    const values = Object.values(errors);
    return values.length > 0 ? values[0] : fallback;
}

// Detail Modal

interface DetailModalProps {
    employee: Employee;
    onClose: () => void;
    onApprove: (emp: Employee) => void;
}

function DetailModal({ employee, onClose, onApprove }: DetailModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {employee.photo ? (
                            <img src={'/storage/' + employee.photo} className="h-11 w-11 rounded-full object-cover border border-gray-200" alt={getFullName(employee)} />
                        ) : (
                            <div className="h-11 w-11 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-semibold">
                                {getInitials(employee)}
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-900">{getFullName(employee)}</p>
                            <p className="text-xs text-gray-500">{employee.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    <div className="grid grid-cols-3 divide-x divide-gray-200 rounded-md border border-gray-200">
                        <div className="p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1.5">Email</p>
                            {employee.email_verified_at
                                ? <StatusDot tone="green">Verified</StatusDot>
                                : <StatusDot tone="gray">Unverified</StatusDot>}
                        </div>
                        <div className="p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1.5">Approval</p>
                            {employee.is_approved
                                ? <StatusDot tone="green">Approved</StatusDot>
                                : <StatusDot tone="amber">Pending</StatusDot>}
                        </div>
                        <div className="p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1.5">Employment</p>
                            {employee.employee_profile?.is_active
                                ? <StatusDot tone="green">Active</StatusDot>
                                : <StatusDot tone="gray">Inactive</StatusDot>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Employee No.</p>
                            <p className="font-medium text-gray-900 tabular-nums">{employee.employee_profile?.employee_number ?? <span className="italic font-normal text-gray-400">Not set</span>}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Employment Type</p>
                            <p className="font-medium text-gray-900">{employee.employee_profile?.employment_type ?? <span className="italic font-normal text-gray-400">Not set</span>}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Position</p>
                            <p className="font-medium text-gray-900">{employee.employee_profile?.position ?? <span className="italic font-normal text-gray-400">Not set</span>}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Salary Grade</p>
                            <p className="font-medium text-gray-900 tabular-nums">{employee.employee_profile?.salary_grade ?? <span className="italic font-normal text-gray-400">Not set</span>}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500">Agency</p>
                            <p className="font-medium text-gray-900">{employee.employee_profile?.place_assign ?? <span className="italic font-normal text-gray-400">Not set</span>}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500">Division</p>
                            <p className="font-medium text-gray-900">{employee.employee_profile?.division ?? <span className="italic font-normal text-gray-400">Not set</span>}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500">Section/Unit</p>
                            <p className="font-medium text-gray-900">{employee.employee_profile?.section ?? <span className="italic font-normal text-gray-400">Not set</span>}</p>
                        </div>
                    </div>
                </div>

                {/* Footer — shows View Profile for approved, Approve for pending */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                    {/* Left side: approve button only if pending + verified */}
                    <div>
                        {employee.email_verified_at && !employee.is_approved && (
                            <button
                                onClick={() => { onApprove(employee); onClose(); }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer bg-green-700 text-white rounded-md hover:bg-green-800 transition"
                            >
                                <Check className="h-4 w-4" />
                                Approve Account
                            </button>
                        )}
                    </div>

                    {/* Right side: View Profile always visible for approved employees */}
                    {employee.is_approved && (
                        <button
                            onClick={() => {
                                onClose();
                                router.visit(`/admin/employees/${employee.id}/view`);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer border border-green-700 text-green-800 rounded-md hover:bg-green-50 transition ml-auto"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page

export default function Index({ employees, filters, divisions }: Props) {
    const [search, setSearch]           = useState(filters.search ?? '');
    const [filterValues, setFilterValues] = useState<FilterValues>({
        status:          filters.status ?? '',
        employment_type: filters.employment_type ?? '',
        division:        filters.division ?? '',
    });
    const [isSearching, setIsSearching] = useState(false);
    const [detailModal, setDetailModal] = useState<Employee | null>(null);
    const [importOpen, setImportOpen]   = useState(false);
    const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const debouncedSearch = useDebouncedValue(search, 350);
    const isFirstRun = useRef(true);

    const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees.data);
    const [localTotal, setLocalTotal]         = useState<number>(employees.total);

    // Accumulates id -> public_token across every page visited, since
    // localEmployees only holds the current page but bulk selection
    // (selectedIds) persists across pagination.
    const [tokenById, setTokenById] = useState<Record<number, string>>(() =>
        Object.fromEntries(employees.data.map(e => [e.id, e.public_token]))
    );

    useEffect(() => {
        setLocalEmployees(employees.data);
        setLocalTotal(employees.total);
        setTokenById(prev => {
            const next = { ...prev };
            employees.data.forEach(e => { next[e.id] = e.public_token; });
            return next;
        });
    }, [employees.data]);

    useEffect(() => {
        function onEmployeeAdded(e: Event) {
            const data = (e as CustomEvent<Employee>).detail;
            setLocalEmployees(prev => prev.some(emp => emp.id === data.id) ? prev : [data, ...prev]);
            setLocalTotal(prev => prev + 1);
            setTokenById(prev => ({ ...prev, [data.id]: data.public_token }));
        }
        function onEmployeeApproved(e: Event) {
            const { id } = (e as CustomEvent<{ id: number }>).detail;
            setLocalEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, is_approved: true } : emp));
            setDetailModal(prev => prev && prev.id === id ? { ...prev, is_approved: true } : prev);
        }
        function onEmployeeRemoved(e: Event) {
            const { id } = (e as CustomEvent<{ id: number }>).detail;
            setLocalEmployees(prev => prev.filter(emp => emp.id !== id));
            setLocalTotal(prev => Math.max(0, prev - 1));
            setDetailModal(prev => prev && prev.id === id ? null : prev);
        }
        window.addEventListener('notif:employee-added',    onEmployeeAdded);
        window.addEventListener('notif:employee-approved', onEmployeeApproved);
        window.addEventListener('notif:employee-removed',  onEmployeeRemoved);
        return () => {
            window.removeEventListener('notif:employee-added',    onEmployeeAdded);
            window.removeEventListener('notif:employee-approved', onEmployeeApproved);
            window.removeEventListener('notif:employee-removed',  onEmployeeRemoved);
        };
    }, []);

    function runSearch(nextSearch: string, nextFilters: FilterValues) {
        const params: Record<string, string> = {};
        if (nextSearch) params.search = nextSearch;
        if (nextFilters.status) params.status = nextFilters.status;
        if (nextFilters.employment_type) params.employment_type = nextFilters.employment_type;
        if (nextFilters.division) params.division = nextFilters.division;

        router.get('/admin/employees', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['employees'],
            onStart: () => setIsSearching(true),
            onFinish: () => setIsSearching(false),
        });
    }

    // Debounced live search — skips the very first run so page-load doesn't
    // immediately re-request itself with the same filters it was just given.
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        runSearch(debouncedSearch, filterValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    function handleFilterChange(patch: Partial<FilterValues>) {
        const next = { ...filterValues, ...patch };
        setFilterValues(next);
        runSearch(search, next);
    }

    function toggleSelected(id: number) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    const allOnPageSelected = localEmployees.length > 0 && localEmployees.every(e => selectedIds.has(e.id));

    function toggleSelectAllOnPage() {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allOnPageSelected) {
                localEmployees.forEach(e => next.delete(e.id));
            } else {
                localEmployees.forEach(e => next.add(e.id));
            }
            return next;
        });
    }

    async function generateBulkPdf() {
        if (selectedIds.size === 0 || generatingPdf) return;
        setGeneratingPdf(true);
        try {
            const userTokens = Array.from(selectedIds)
                .map(id => tokenById[id])
                .filter((token): token is string => Boolean(token));
            const response = await axios.post(
                '/admin/service-records/pdf/bulk',
                { user_tokens: userTokens },
                { responseType: 'blob' }
            );
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Service_Records_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            Toast.fire({ icon: 'success', title: `Generated ${selectedIds.size} Service Record PDF${selectedIds.size !== 1 ? 's' : ''}.` });
            setSelectedIds(new Set());
        } catch (err) {
            let message = 'Failed to generate Service Record PDFs.';
            if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
                try {
                    const json = JSON.parse(await err.response.data.text());
                    message = json.message ?? firstErrorMessage(json.errors ?? {}, message);
                } catch {
                    // response wasn't JSON — fall back to the generic message
                }
            }
            Toast.fire({ icon: 'error', title: message });
        } finally {
            setGeneratingPdf(false);
        }
    }

    const approve = (emp: Employee) => {
        Swal.fire({
            title: 'Approve Account?',
            html: 'Approve <strong>' + getFullName(emp) + '</strong>? They will receive an email notification.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#15803d',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (result.isConfirmed) {
                router.post('/admin/employees/' + emp.id + '/approve', {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setLocalEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_approved: true } : e));
                        Toast.fire({ icon: 'success', title: getFullName(emp) + ' has been approved.' });
                    },
                    onError: (errors) => Toast.fire({ icon: 'error', title: firstErrorMessage(errors, 'Something went wrong.') }),
                });
            }
        });
    };

    const toggleApproval = (emp: Employee) => {
        const isRevoking = emp.is_approved;
        Swal.fire({
            title: isRevoking ? 'Revoke Access?' : 'Approve Account?',
            html: isRevoking
                ? 'This will <strong>revoke access</strong> for <strong>' + getFullName(emp) + '</strong>.'
                : 'This will <strong>grant access</strong> to <strong>' + getFullName(emp) + '</strong>.',
            icon: isRevoking ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: isRevoking ? '#d97706' : '#15803d',
            cancelButtonColor: '#6b7280',
            confirmButtonText: isRevoking ? 'Yes, Revoke' : 'Yes, Approve',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (result.isConfirmed) {
                router.post('/admin/employees/' + emp.id + '/toggle-approval', {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setLocalEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_approved: !e.is_approved } : e));
                        Toast.fire({
                            icon: 'success',
                            title: isRevoking
                                ? 'Access revoked for ' + getFullName(emp) + '.'
                                : getFullName(emp) + ' has been approved.',
                        });
                    },
                    onError: (errors) => Toast.fire({ icon: 'error', title: firstErrorMessage(errors, 'Something went wrong.') }),
                });
            }
        });
    };

    const deleteEmployee = (emp: Employee) => {
        Swal.fire({
            title: 'Delete Employee?',
            html: 'This will permanently delete <strong>' + getFullName(emp) + '</strong> and all their records.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (result.isConfirmed) {
                router.delete('/admin/employees/' + emp.id, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setLocalEmployees(prev => prev.filter(e => e.id !== emp.id));
                        setLocalTotal(prev => Math.max(0, prev - 1));
                        Toast.fire({ icon: 'success', title: getFullName(emp) + ' has been deleted.' });
                    },
                    onError: () => Toast.fire({ icon: 'error', title: 'Something went wrong.' }),
                });
            }
        });
    };

    const selectionActive = selectedIds.size > 0;

    return (
        <AppLayout>
            <Head title="Employees" />

            {detailModal && (
                <DetailModal
                    employee={detailModal}
                    onClose={() => setDetailModal(null)}
                    onApprove={approve}
                />
            )}

            {importOpen && (
                <ServiceRecordImportModal
                    onClose={() => setImportOpen(false)}
                    onImported={() => router.reload({ only: ['employees'] })}
                />
            )}

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full mx-auto">
                <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Employees</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {localTotal} on record
                        </p>
                    </div>
                    <button
                        onClick={() => setImportOpen(true)}
                        className="flex w-full md:w-auto shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Upload className="h-4 w-4" /> Import Service Records
                    </button>
                </div>

                {/* Registry */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    {/* Toolbar — search/filters normally; swaps to a contextual bar once rows are selected */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3">
                        {selectionActive ? (
                            <>
                                <p className="text-sm font-medium text-gray-700">
                                    {selectedIds.size} selected
                                </p>
                                <div className="flex items-center gap-3 ml-auto">
                                    <button
                                        onClick={generateBulkPdf}
                                        disabled={generatingPdf}
                                        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-green-700 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-green-800 transition disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {generatingPdf ? <Spinner className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                                        Generate Service Records
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds(new Set())}
                                        className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="relative flex-1 min-w-50">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search name, email, employee no., position..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-700/30 focus:border-green-700"
                                    />
                                </div>
                                <EmployeeFilters
                                    values={filterValues}
                                    divisions={divisions}
                                    onChange={handleFilterChange}
                                />
                            </>
                        )}
                    </div>

                    {/* Table */}
                    <div className="relative overflow-x-auto">
                        {isSearching && (
                            <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/60 pt-10">
                                <Spinner className="h-6 w-6 text-green-700" />
                            </div>
                        )}
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs">
                                <tr>
                                    <th className="px-4 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={allOnPageSelected}
                                            onChange={toggleSelectAllOnPage}
                                            className="h-4 w-4 rounded border-gray-300 accent-green-600 focus:ring-green-600 cursor-pointer"
                                            aria-label="Select all on this page"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">Employee</th>
                                    <th className="px-4 py-3 text-left font-medium">Employee No.</th>
                                    <th className="px-4 py-3 text-left font-medium">Position</th>
                                    <th className="px-4 py-3 text-left font-medium">Division</th>
                                    <th className="px-4 py-3 text-left font-medium">Type</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Approval</th>
                                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {localEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-gray-400 italic">No employees found.</td>
                                    </tr>
                                ) : (
                                    localEmployees.map(emp => (
                                        <tr
                                            key={emp.id}
                                            onClick={() => setDetailModal(emp)}
                                            className="hover:bg-gray-50 cursor-pointer transition"
                                        >
                                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(emp.id)}
                                                    onChange={() => toggleSelected(emp.id)}
                                                    className="h-4 w-4 rounded border-gray-300 accent-green-600 focus:ring-green-600 cursor-pointer"
                                                    aria-label={`Select ${getFullName(emp)}`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {emp.photo ? (
                                                        <img src={'/storage/' + emp.photo} alt={getFullName(emp)} className="h-9 w-9 rounded-full object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="h-9 w-9 rounded-full bg-green-700 text-white flex items-center justify-center font-medium text-xs">
                                                            {getInitials(emp)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{getFullName(emp)}</p>
                                                        <p className="text-xs text-gray-500">{emp.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 tabular-nums">
                                                {emp.employee_profile?.employee_number ?? <span className="text-gray-400 italic">Not set</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {emp.employee_profile?.position ?? <span className="text-gray-400 italic">Not set</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {emp.employee_profile?.division ?? <span className="text-gray-400 italic">Not set</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.employee_profile?.employment_type ? (
                                                    <span className="px-2 py-0.5 rounded-md border border-gray-200 text-gray-600 text-xs">
                                                        {emp.employee_profile.employment_type}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">Not set</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.employee_profile ? (
                                                    emp.employee_profile.is_active
                                                        ? <StatusDot tone="green">Active</StatusDot>
                                                        : <StatusDot tone="gray">Inactive</StatusDot>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.is_approved
                                                    ? <StatusDot tone="green">Approved</StatusDot>
                                                    : <StatusDot tone="amber">Pending</StatusDot>}
                                            </td>
                                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {emp.email_verified_at ? (
                                                        <button
                                                            onClick={() => toggleApproval(emp)}
                                                            className={'p-1.5 rounded-md transition cursor-pointer ' + (emp.is_approved ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-700')}
                                                            title={emp.is_approved ? 'Revoke Access' : 'Approve Account'}
                                                        >
                                                            {emp.is_approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                        </button>
                                                    ) : (
                                                        <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Email not yet verified">
                                                            <Lock className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => deleteEmployee(emp)}
                                                        className="p-1.5 rounded-md hover:bg-red-50 cursor-pointer text-red-600 transition"
                                                        title="Delete Employee"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {employees.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <p>Page {employees.current_page} of {employees.last_page}</p>
                        <div className="flex gap-2">
                            {employees.prev_page_url && (
                                <Link href={employees.prev_page_url} preserveScroll className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition">Previous</Link>
                            )}
                            {employees.next_page_url && (
                                <Link href={employees.next_page_url} preserveScroll className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition">Next</Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
