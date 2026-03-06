import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Check, Lock,
    Search, Trash2, UserCheck, UserX, X
} from 'lucide-react';
import Swal from 'sweetalert2';

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

interface Props {
    employees: PaginatedEmployees;
    filters: { search?: string; status?: string; };
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

// Detail Modal

interface DetailModalProps {
    employee: Employee;
    onClose: () => void;
    onApprove: (emp: Employee) => void;
}

function DetailModal({ employee, onClose, onApprove }: DetailModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        {employee.photo ? (
                            <img src={'/storage/' + employee.photo} className="h-12 w-12 rounded-full object-cover border" alt={getFullName(employee)} />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-green-600 text-white/90 flex items-center justify-center font-semibold">
                                {getInitials(employee)}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">{getFullName(employee)}</p>
                            <p className="text-xs text-gray-400">{employee.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Email</p>
                            {employee.email_verified_at
                                ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Verified</span>
                                : <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Unverified</span>}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Approval</p>
                            {employee.is_approved
                                ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Approved</span>
                                : <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Active</p>
                            {employee.employee_profile?.is_active
                                ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                                : <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-gray-400">Employee No.</p>
                            <p className="font-medium text-gray-700">{employee.employee_profile?.employee_number ?? <span className="italic text-gray-300">Not set</span>}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Employment Type</p>
                            <p className="font-medium text-gray-700">{employee.employee_profile?.employment_type ?? <span className="italic text-gray-300">Not set</span>}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Position</p>
                            <p className="font-medium text-gray-700">{employee.employee_profile?.position ?? <span className="italic text-gray-300">Not set</span>}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Salary Grade</p>
                            <p className="font-medium text-gray-700">{employee.employee_profile?.salary_grade ?? <span className="italic text-gray-300">Not set</span>}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400">Agency</p>
                            <p className="font-medium text-gray-700">{employee.employee_profile?.place_assign ?? <span className="italic text-gray-300">Not set</span>}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400">Division</p>
                            <p className="font-medium text-gray-700">{employee.employee_profile?.division ?? <span className="italic text-gray-300">Not set</span>}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400">Section/Unit</p>
                            <p className="font-medium text-gray-700">{employee.employee_profile?.section ?? <span className="italic text-gray-300">Not set</span>}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t flex justify-end">
                    {employee.email_verified_at && !employee.is_approved && (
                        <button
                            onClick={() => { onApprove(employee); onClose(); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            <Check className="h-4 w-4" />
                            Approve Account
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Index({ employees, filters }: Props) {
    const [search, setSearch]           = useState(filters.search ?? '');
    const [status, setStatus]           = useState(filters.status ?? '');
    const [detailModal, setDetailModal] = useState<Employee | null>(null);

    // ── Local employee list state (starts from server data) ───────────────────
    const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees.data);
    const [localTotal, setLocalTotal]         = useState<number>(employees.total);

    // Keep in sync when Inertia navigates (filters change etc.)
    useEffect(() => {
        setLocalEmployees(employees.data);
        setLocalTotal(employees.total);
    }, [employees.data]);

    // ── Real-time DOM event listeners ─────────────────────────────────────────
    useEffect(() => {
        // New employee registered — prepend to table
        function onEmployeeAdded(e: Event) {
            const data = (e as CustomEvent<Employee>).detail;
            setLocalEmployees(function(prev) {
                // Avoid duplicates
                if (prev.some(function(emp) { return emp.id === data.id; })) return prev;
                return [data, ...prev];
            });
            setLocalTotal(function(prev) { return prev + 1; });
        }

        // Employee approved from drawer — update their row status
        function onEmployeeApproved(e: Event) {
            const { id } = (e as CustomEvent<{ id: number }>).detail;
            setLocalEmployees(function(prev) {
                return prev.map(function(emp) {
                    if (emp.id === id) return Object.assign({}, emp, { is_approved: true });
                    return emp;
                });
            });
            // Also update the detail modal if it's open for this employee
            setDetailModal(function(prev) {
                if (prev && prev.id === id) return Object.assign({}, prev, { is_approved: true });
                return prev;
            });
        }

        // Employee denied/deleted from drawer — remove their row
        function onEmployeeRemoved(e: Event) {
            const { id } = (e as CustomEvent<{ id: number }>).detail;
            setLocalEmployees(function(prev) { return prev.filter(function(emp) { return emp.id !== id; }); });
            setLocalTotal(function(prev) { return Math.max(0, prev - 1); });
            // Close modal if open for this employee
            setDetailModal(function(prev) { return prev && prev.id === id ? null : prev; });
        }

        window.addEventListener('notif:employee-added',    onEmployeeAdded);
        window.addEventListener('notif:employee-approved', onEmployeeApproved);
        window.addEventListener('notif:employee-removed',  onEmployeeRemoved);

        return function() {
            window.removeEventListener('notif:employee-added',    onEmployeeAdded);
            window.removeEventListener('notif:employee-approved', onEmployeeApproved);
            window.removeEventListener('notif:employee-removed',  onEmployeeRemoved);
        };
    }, []);

    const applyFilters = () => {
        router.get('/admin/employees', { search, status }, { preserveState: true, replace: true });
    };

    // ── Approve ───────────────────────────────────────────────────────────────
    const approve = (emp: Employee) => {
        Swal.fire({
            title: 'Approve Account?',
            html: 'Approve <strong>' + getFullName(emp) + '</strong>? They will receive an email notification.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (result.isConfirmed) {
                router.post('/admin/employees/' + emp.id + '/approve', {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        // Update row immediately without reload
                        setLocalEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_approved: true } : e));
                        Toast.fire({ icon: 'success', title: getFullName(emp) + ' has been approved.' });
                    },
                    onError: () => Toast.fire({ icon: 'error', title: 'Something went wrong.' }),
                });
            }
        });
    };

    // ── Toggle approval ───────────────────────────────────────────────────────
    const toggleApproval = (emp: Employee) => {
        const isRevoking = emp.is_approved;
        Swal.fire({
            title: isRevoking ? 'Revoke Access?' : 'Approve Account?',
            html: isRevoking
                ? 'This will <strong>revoke access</strong> for <strong>' + getFullName(emp) + '</strong>.'
                : 'This will <strong>grant access</strong> to <strong>' + getFullName(emp) + '</strong>.',
            icon: isRevoking ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: isRevoking ? '#d97706' : '#16a34a',
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
                            title: isRevoking ? 'Access revoked for ' + getFullName(emp) + '.' : getFullName(emp) + ' has been approved.',
                        });
                    },
                    onError: () => Toast.fire({ icon: 'error', title: 'Something went wrong.' }),
                });
            }
        });
    };

    // ── Delete ────────────────────────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────────
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

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {localTotal} total employee{localTotal !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-4 flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-50">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, employee no., position..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending Approval</option>
                    </select>
                    <button
                        onClick={applyFilters}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 cursor-pointer transition"
                    >
                        Search
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200 overflow-x-auto border-collapse">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-5 text-left">Employee</th>
                                <th className="px-4 py-5 text-left">Employee No.</th>
                                <th className="px-4 py-5 text-left">Position</th>
                                <th className="px-4 py-5 text-left">Division</th>
                                <th className="px-4 py-5 text-left">Type</th>
                                <th className="px-4 py-5 text-center">Status</th>
                                <th className="px-4 py-5 text-center">Approved</th>
                                <th className="px-4 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {localEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400 italic">No employees found.</td>
                                </tr>
                            ) : (
                                localEmployees.map(emp => (
                                    <tr
                                        key={emp.id}
                                        onClick={() => setDetailModal(emp)}
                                        className="hover:bg-gray-50 cursor-pointer transition"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {emp.photo ? (
                                                    <img src={'/storage/' + emp.photo} alt={getFullName(emp)} className="h-9 w-9 rounded-full object-cover border" />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-full bg-green-600 text-white/90 flex items-center justify-center font-semibold text-xs">
                                                        {getInitials(emp)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{getFullName(emp)}</p>
                                                    <p className="text-xs text-gray-400">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {emp.employee_profile?.employee_number ?? <span className="text-gray-300 italic">Not set</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {emp.employee_profile?.position ?? <span className="text-gray-300 italic">Not set</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {emp.employee_profile?.division ?? <span className="text-gray-300 italic">Not set</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {emp.employee_profile?.employment_type ? (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                                    {emp.employee_profile.employment_type}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 italic text-xs">Not set</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {emp.employee_profile ? (
                                                emp.employee_profile.is_active
                                                    ? <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Active</span>
                                                    : <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">Inactive</span>
                                            ) : (
                                                <span className="text-gray-300 italic text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {emp.is_approved
                                                ? <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Approved</span>
                                                : <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">Pending</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                {emp.email_verified_at ? (
                                                    <button
                                                        onClick={() => toggleApproval(emp)}
                                                        className={'p-1.5 rounded-lg transition cursor-pointer ' + (emp.is_approved ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600')}
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
                                                    className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer text-red-500 transition"
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

                {/* Pagination */}
                {employees.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <p>Page {employees.current_page} of {employees.last_page}</p>
                        <div className="flex gap-2">
                            {employees.prev_page_url && (
                                <a href={employees.prev_page_url} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition">Previous</a>
                            )}
                            {employees.next_page_url && (
                                <a href={employees.next_page_url} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition">Next</a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}