import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertTriangle, CheckCircle, Eye,
    Lock, Search, Trash2, UserCheck, UserX, X
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────

interface EmployeeProfile {
    employee_number: string | null;
    position: string | null;
    place_assign: string | null;
    division: string | null;
    employment_type: string | null;
    is_active: boolean;
}

interface Employee {
    id: number;
    first_name: string | null;
    middle_name: string | null;
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
    filters: {
        search?: string;
        status?: string;
    };
}

// ── Helpers ────────────────────────────────────────────────────────

function getFullName(emp: Employee): string {
    return [emp.first_name, emp.middle_name, emp.last_name, emp.name_ext]
        .filter(Boolean)
        .join(' ') || emp.email;
}

function getInitials(emp: Employee): string {
    return `${emp.first_name?.[0] ?? ''}${emp.last_name?.[0] ?? ''}`.toUpperCase() || '??';
}

// ── Detail Modal ───────────────────────────────────────────────────

interface DetailModalProps {
    employee: Employee;
    onClose: () => void;
    onApprove: (id: number) => void;
}

function DetailModal({ employee, onClose, onApprove }: DetailModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        {employee.photo ? (
                            <img
                                src={`/storage/${employee.photo}`}
                                className="h-12 w-12 rounded-full object-cover border"
                                alt={getFullName(employee)}
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                                {getInitials(employee)}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">{getFullName(employee)}</p>
                            <p className="text-xs text-gray-400">{employee.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">

                    {/* Status Row */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Email</p>
                            {employee.email_verified_at ? (
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    Verified
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Unverified
                                </span>
                            )}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Approval</p>
                            {employee.is_approved ? (
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    Approved
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                                    Pending
                                </span>
                            )}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Active</p>
                            {employee.employee_profile?.is_active ? (
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                    Inactive
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-gray-400">Employee No.</p>
                            <p className="font-medium text-gray-800">
                                {employee.employee_profile?.employee_number ?? (
                                    <span className="italic text-gray-300">Not set</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Employment Type</p>
                            <p className="font-medium text-gray-800">
                                {employee.employee_profile?.employment_type ?? (
                                    <span className="italic text-gray-300">Not set</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Position</p>
                            <p className="font-medium text-gray-800">
                                {employee.employee_profile?.position ?? (
                                    <span className="italic text-gray-300">Not set</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Division</p>
                            <p className="font-medium text-gray-800">
                                {employee.employee_profile?.division ?? (
                                    <span className="italic text-gray-300">Not set</span>
                                )}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400">Place of Assignment</p>
                            <p className="font-medium text-gray-800">
                                {employee.employee_profile?.place_assign ?? (
                                    <span className="italic text-gray-300">Not set</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex justify-between items-center">
                    {/* Approve button — only if verified but not yet approved */}
                    <div>
                        {employee.email_verified_at && !employee.is_approved && (
                            <button
                                onClick={() => { onApprove(employee.id); onClose(); }}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Approve Account
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm Modal ───────────────────────────────────────────

interface DeleteModalProps {
    employee: Employee;
    onClose: () => void;
}

function DeleteModal({ employee, onClose }: DeleteModalProps) {
    const [processing, setProcessing] = useState(false);

    const confirm = () => {
        setProcessing(true);
        router.delete(`/admin/employees/${employee.id}`, {
            onSuccess: () => { setProcessing(false); onClose(); },
            onError:   () => setProcessing(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Delete Employee</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to permanently delete{' '}
                    <span className="font-semibold text-gray-800">{getFullName(employee)}</span>?
                    This will remove all their profile, education, and eligibility records.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirm}
                        disabled={processing}
                        className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {processing ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function Index({ employees, filters }: Props) {
    const [search, setSearch]           = useState(filters.search ?? '');
    const [status, setStatus]           = useState(filters.status ?? '');
    const [detailModal, setDetailModal] = useState<Employee | null>(null);
    const [deleteModal, setDeleteModal] = useState<Employee | null>(null);

    const applyFilters = () => {
        router.get('/admin/employees', { search, status }, {
            preserveState: true,
            replace: true,
        });
    };

    const approve = (id: number) => {
        router.post(`/admin/employees/${id}/approve`, {}, {
            preserveScroll: true,
        });
    };

    const toggleApproval = (emp: Employee) => {
        router.post(`/admin/employees/${emp.id}/toggle-approval`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Employees" />

            {/* Detail Modal */}
            {detailModal && (
                <DetailModal
                    employee={detailModal}
                    onClose={() => setDetailModal(null)}
                    onApprove={approve}
                />
            )}

            {/* Delete Modal */}
            {deleteModal && (
                <DeleteModal
                    employee={deleteModal}
                    onClose={() => setDeleteModal(null)}
                />
            )}

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {employees.total} total employee{employees.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4 flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, employee no., position..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending Approval</option>
                    </select>
                    <button
                        onClick={applyFilters}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                        Search
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left">Employee</th>
                                <th className="px-4 py-3 text-left">Employee No.</th>
                                <th className="px-4 py-3 text-left">Position</th>
                                <th className="px-4 py-3 text-left">Division</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Approved</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        <UserX className="mx-auto h-8 w-8 mb-2" />
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map(emp => (
                                    <tr
                                        key={emp.id}
                                        onClick={() => setDetailModal(emp)}
                                        className="hover:bg-blue-50 cursor-pointer transition"
                                    >
                                        {/* Employee Name + Avatar */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {emp.photo ? (
                                                    <img
                                                        src={`/storage/${emp.photo}`}
                                                        alt={getFullName(emp)}
                                                        className="h-9 w-9 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
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
                                            {emp.employee_profile?.employee_number ?? (
                                                <span className="text-gray-300 italic">Not set</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {emp.employee_profile?.position ?? (
                                                <span className="text-gray-300 italic">Not set</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {emp.employee_profile?.division ?? (
                                                <span className="text-gray-300 italic">Not set</span>
                                            )}
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

                                        {/* Active/Inactive badge */}
                                        <td className="px-4 py-3 text-center">
                                            {emp.employee_profile ? (
                                                emp.employee_profile.is_active ? (
                                                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                                                        Inactive
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-gray-300 italic text-xs">—</span>
                                            )}
                                        </td>

                                        {/* Approval badge */}
                                        <td className="px-4 py-3 text-center">
                                            {emp.is_approved ? (
                                                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                                                    Pending
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions — stopPropagation prevents row click */}
                                        <td
                                            className="px-4 py-3 text-center"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-center gap-2">

                                                {/* View Details */}
                                                <button
                                                    onClick={() => setDetailModal(emp)}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {/* Toggle Approval — only if email verified */}
                                                {emp.email_verified_at ? (
                                                    <button
                                                        onClick={() => toggleApproval(emp)}
                                                        className={`p-1.5 rounded-lg transition ${
                                                            emp.is_approved
                                                                ? 'hover:bg-yellow-50 text-yellow-600'
                                                                : 'hover:bg-green-50 text-green-600'
                                                        }`}
                                                        title={emp.is_approved ? 'Revoke Access' : 'Approve Account'}
                                                    >
                                                        {emp.is_approved
                                                            ? <UserX className="h-4 w-4" />
                                                            : <UserCheck className="h-4 w-4" />
                                                        }
                                                    </button>
                                                ) : (
                                                    <span
                                                        className="p-1.5 text-gray-300 cursor-not-allowed"
                                                        title="Email not yet verified"
                                                    >
                                                        <Lock className="h-4 w-4" />
                                                    </span>
                                                )}

                                                {/* Delete */}
                                                <button
                                                    onClick={() => setDeleteModal(emp)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
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
                                <a href={employees.prev_page_url} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition">
                                    Previous
                                </a>
                            )}
                            {employees.next_page_url && (
                                <a href={employees.next_page_url} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition">
                                    Next
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}