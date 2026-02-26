import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, Eye, Lock, Search, UserX } from 'lucide-react';

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

function getFullName(emp: Employee): string {
    return [emp.first_name, emp.middle_name, emp.last_name, emp.name_ext]
        .filter(Boolean)
        .join(' ');
}

function getInitials(emp: Employee): string {
    return `${emp.first_name?.[0] ?? ''}${emp.last_name?.[0] ?? ''}`.toUpperCase();
}

export default function Index({ employees, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = () => {
        router.get('/employees', { search, status }, { preserveState: true, replace: true });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') applyFilters();
    };

    const approve = (id: number) => {
        router.post(`/employees/${id}/approve`, {}, {
            onSuccess: () => {},
        });
    };

    return (
        <AppLayout>
            <Head title="Employees" />
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
                            onKeyDown={handleKeyDown}
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
                                    <tr key={emp.id} className="hover:bg-gray-50 transition">
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

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={`/employees/${emp.id}`}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>

                                                {/* Only show approve button if email is verified but not yet approved */}
                                                {emp.email_verified_at && !emp.is_approved && (
                                                    <button
                                                        onClick={() => approve(emp.id)}
                                                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition"
                                                        title="Approve Account"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                )}

                                                {/* Show lock icon if email not yet verified */}
                                                {!emp.email_verified_at && (
                                                    <span
                                                        className="p-1.5 text-gray-300 cursor-not-allowed"
                                                        title="Email not yet verified"
                                                    >
                                                        <Lock className="h-4 w-4" />
                                                    </span>
                                                )}
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
                        <p>
                            Page {employees.current_page} of {employees.last_page}
                        </p>
                        <div className="flex gap-2">
                            {employees.prev_page_url && (
                                <Link
                                    href={employees.prev_page_url}
                                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition"
                                >
                                    Previous
                                </Link>
                            )}
                            {employees.next_page_url && (
                                <Link
                                    href={employees.next_page_url}
                                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}