import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Search, ShieldCheck, Trash2, UserCheck,
    UserX, ChevronDown, X, AlertTriangle
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    first_name: string | null;
    last_name: string | null;
    middle_name: string | null;
    name_ext: string | null;
    email: string;
    photo: string | null;
    is_approved: boolean;
    email_verified_at: string | null;
    roles: Role[];
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    users: PaginatedUsers;
    roles: Role[];
    filters: { search?: string; role?: string };
}

// ── Helpers ────────────────────────────────────────────────────────

function getFullName(user: User): string {
    return [user.first_name, user.middle_name, user.last_name, user.name_ext]
        .filter(Boolean).join(' ') || user.email;
}

function getInitials(user: User): string {
    return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '??';
}

const roleBadgeColor: Record<string, string> = {
    admin:    'bg-green-50 text-green-700',
    employee: 'bg-blue-50 text-blue-700',
};

// ── Role Assignment Modal ──────────────────────────────────────────

interface RoleModalProps {
    user: User;
    roles: Role[];
    onClose: () => void;
}

function RoleModal({ user, roles, onClose }: RoleModalProps) {
    const currentRole = user.roles[0]?.name ?? '';
    const [selected, setSelected] = useState(currentRole);
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        if (selected === currentRole) {
            onClose();
            return;
        }
        setProcessing(true);
        router.post(
            `/superadmin/users/${user.id}/role`,
            { role: selected },
            {
                onSuccess: () => { setProcessing(false); onClose(); },
                onError:   () => setProcessing(false),
            }
        );
    };

    return (
        // Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        {user.photo ? (
                            <img
                                src={`/storage/${user.photo}`}
                                className="h-10 w-10 rounded-full object-cover border"
                                alt={getFullName(user)}
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                                {getInitials(user)}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">{getFullName(user)}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-500 mb-4">
                        Select the role to assign to this user. This will replace their current role immediately.
                    </p>

                    <div className="space-y-3">
                        {roles.map(role => (
                            <label
                                key={role.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                                    selected === role.name
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.name}
                                    checked={selected === role.name}
                                    onChange={() => setSelected(role.name)}
                                    className="accent-blue-600"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900 capitalize">{role.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {role.name === 'admin'
                                            ? 'HR Staff — can manage employees, payroll, and leave requests'
                                            : 'Regular employee — self-service access only'}
                                    </p>
                                </div>
                                {selected === role.name && (
                                    <ShieldCheck className="ml-auto h-5 w-5 text-blue-600 shrink-0" />
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm Modal ───────────────────────────────────────────

interface DeleteModalProps {
    user: User;
    onClose: () => void;
}

function DeleteModal({ user, onClose }: DeleteModalProps) {
    const [processing, setProcessing] = useState(false);

    const confirm = () => {
        setProcessing(true);
        router.delete(`/superadmin/users/${user.id}`, {
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
                <h2 className="text-lg font-bold text-gray-900 mb-1">Delete User</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to permanently delete{' '}
                    <span className="font-semibold text-gray-800">{getFullName(user)}</span>?
                    This action cannot be undone and will remove all their data.
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

export default function Index({ users, roles, filters }: Props) {
    const [search, setSearch]         = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters.role ?? '');
    const [roleModal, setRoleModal]   = useState<User | null>(null);
    const [deleteModal, setDeleteModal] = useState<User | null>(null);

    const applyFilters = () => {
        router.get('/superadmin/users', { search, role: roleFilter }, {
            preserveState: true,
            replace: true,
        });
    };

    const toggleApproval = (user: User) => {
        router.post(`/superadmin/users/${user.id}/toggle-approval`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title="User Management" />

            {/* Role Modal */}
            {roleModal && (
                <RoleModal
                    user={roleModal}
                    roles={roles}
                    onClose={() => setRoleModal(null)}
                />
            )}

            {/* Delete Modal */}
            {deleteModal && (
                <DeleteModal
                    user={deleteModal}
                    onClose={() => setDeleteModal(null)}
                />
            )}

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {users.total} user{users.total !== 1 ? 's' : ''} (excluding superadmin)
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-4 flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
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
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-center">Email Verified</th>
                                <th className="px-4 py-3 text-center">Account Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map(user => (
                                    // Clicking the row opens the role modal
                                    <tr
                                        key={user.id}
                                        onClick={() => setRoleModal(user)}
                                        className="hover:bg-blue-50 cursor-pointer transition"
                                    >
                                        {/* User Info */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.photo ? (
                                                    <img
                                                        src={`/storage/${user.photo}`}
                                                        className="h-9 w-9 rounded-full object-cover border"
                                                        alt={getFullName(user)}
                                                    />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                                                        {getInitials(user)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{getFullName(user)}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role Badge */}
                                        <td className="px-4 py-3">
                                            {user.roles[0] ? (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColor[user.roles[0].name] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {user.roles[0].name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-300 italic">No role</span>
                                            )}
                                        </td>

                                        {/* Email Verified */}
                                        <td className="px-4 py-3 text-center">
                                            {user.email_verified_at ? (
                                                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>

                                        {/* Approval Status */}
                                        <td className="px-4 py-3 text-center">
                                            {user.is_approved ? (
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
                                        <td
                                            className="px-4 py-3 text-center"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Toggle Approval */}
                                                <button
                                                    onClick={() => toggleApproval(user)}
                                                    className={`p-1.5 rounded-lg transition ${
                                                        user.is_approved
                                                            ? 'hover:bg-yellow-50 text-yellow-600'
                                                            : 'hover:bg-green-50 text-green-600'
                                                    }`}
                                                    title={user.is_approved ? 'Revoke Access' : 'Approve Account'}
                                                >
                                                    {user.is_approved
                                                        ? <UserX className="h-4 w-4" />
                                                        : <UserCheck className="h-4 w-4" />
                                                    }
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => setDeleteModal(user)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                                                    title="Delete User"
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
                {users.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <p>Page {users.current_page} of {users.last_page}</p>
                        <div className="flex gap-2">
                            {users.prev_page_url && (
                                <a href={users.prev_page_url} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition">
                                    Previous
                                </a>
                            )}
                            {users.next_page_url && (
                                <a href={users.next_page_url} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition">
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