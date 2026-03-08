// resources/js/components/notification-drawer.tsx

import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Check, X, UserCheck, UserX, Clock, Bell } from 'lucide-react';
import type { AppNotification, PendingUser } from '@/types/notification';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fullName(u: PendingUser) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;
}

function avatarUrl(u: PendingUser) {
    if (u.photo) return '/storage/' + u.photo;
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName(u)) + '&background=16a34a&color=fff&bold=true';
}

function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'unread' | 'pending' | 'all';

interface AuthUser { id: number; roles: string[]; }
interface PageProps { auth: { user: AuthUser }; [key: string]: unknown; }

// ── User Detail Modal ─────────────────────────────────────────────────────────

function UserDetailModal({
    user,
    onClose,
    onApprove,
    onDeny,
}: {
    user: PendingUser;
    onClose: () => void;
    onApprove: (u: PendingUser) => void;
    onDeny: (u: PendingUser) => void;
}) {
    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
                {/* Header banner */}
                <div className="h-20 bg-gradient-to-r from-green-500 to-emerald-600" />
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 cursor-pointer rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Avatar overlapping banner */}
                <div className="px-5 pb-5">
                    <div className="-mt-10 mb-3 flex items-end justify-between">
                        <img
                            src={avatarUrl(user)}
                            alt={fullName(user)}
                            className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg"
                        />
                        <span className="mb-1 flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700 border border-yellow-200">
                            <Clock className="h-3 w-3" />
                            Pending
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{fullName(user)}</h3>
                    <p className="text-sm text-gray-400 mb-4">{user.email}</p>

                    <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-sm mb-5">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Registered</span>
                            <span className="font-medium text-gray-700">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Email verified</span>
                            <span className="font-medium text-green-600">✓ Yes</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => { onDeny(user); onClose(); }}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                            <UserX className="h-4 w-4" />
                            Deny
                        </button>
                        <button
                            onClick={() => { onApprove(user); onClose(); }}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                            <UserCheck className="h-4 w-4" />
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Pending notification row

function PendingRow({
    user,
    onApprove,
    onDeny,
    onClick,
}: {
    user: PendingUser;
    onApprove: (u: PendingUser) => void;
    onDeny: (u: PendingUser) => void;
    onClick: (u: PendingUser) => void;
}) {
    return (
        <div className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50 cursor-pointer"
            onClick={() => onClick(user)}
        >
            <div className="relative shrink-0">
                <img
                    src={avatarUrl(user)}
                    alt={fullName(user)}
                    className="h-10 w-10 rounded-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 ring-2 ring-white">
                    <Clock className="h-2.5 w-2.5 text-white" />
                </span>
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800">
                    <span className="font-semibold">{fullName(user)}</span>
                    <span className="text-gray-500"> registered and is awaiting approval</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{relativeTime(user.created_at)} · Registration</p>

                {/* Approve / Deny inline buttons */}
                <div className="mt-2 flex gap-2" onClick={function(e) { e.stopPropagation(); }}>
                    <button
                        onClick={() => onApprove(user)}
                        className="flex cursor-pointer items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                    >
                        <Check className="h-3 w-3" />
                        Approve
                    </button>
                    <button
                        onClick={() => onDeny(user)}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        <X className="h-3 w-3" />
                        Decline
                    </button>
                </div>
            </div>

            {/* Unread dot */}
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
        </div>
    );
}

// ── Notification row ──────────────────────────────────────────────────────────

function NotifRow({
    notif,
    onClick,
}: {
    notif: AppNotification;
    onClick: (n: AppNotification) => void;
}) {
    const isUnread = notif.read_at === null;
    return (
        <div
            onClick={() => onClick(notif)}
            className={'group flex items-start gap-3 rounded-xl p-3 transition cursor-pointer ' + (isUnread ? 'hover:bg-green-50/60' : 'hover:bg-gray-50')}
        >
            <div className="relative shrink-0">
                <div className={'flex h-10 w-10 items-center justify-center rounded-full ' + (isUnread ? 'bg-green-100' : 'bg-gray-100')}>
                    <Bell className={'h-5 w-5 ' + (isUnread ? 'text-green-600' : 'text-gray-400')} />
                </div>
                {isUnread && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
                        <Check className="h-2 w-2 text-white" />
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className={'text-sm ' + (isUnread ? 'font-medium text-gray-900' : 'text-gray-600')}>
                    {notif.data?.message ?? 'Notification'}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{relativeTime(notif.created_at)}</p>
            </div>

            {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-500" />}
        </div>
    );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

interface Props {
    open: boolean;
    onClose: () => void;
    onUnreadChange?: (count: number) => void;
}

export function NotificationDrawer({ open, onClose, onUnreadChange }: Props) {
    const { auth } = usePage<PageProps>().props;
    const roles    = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
    const isAdmin  = roles.includes('admin');

    const [tab, setTab]                     = useState<Tab>('unread');
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [pendingUsers, setPendingUsers]   = useState<PendingUser[]>([]);
    // approvedUsers: removed from Pending tab but stay in All tab as a record
    const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading]             = useState(false);
    const [detailUser, setDetailUser]       = useState<PendingUser | null>(null);

    function pushUnread(count: number) {
        if (onUnreadChange) onUnreadChange(count);
    }

    // Load on drawer open
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        axios.get('/notifications')
            .then(function(res) {
                const notifs: AppNotification[] = res.data.notifications ?? [];
                const pending: PendingUser[]    = res.data.pendingUsers ?? [];
                setNotifications(notifs);
                setPendingUsers(pending);
                setApprovedUsers([]);
                const unread = notifs.filter(function(n) { return !n.read_at; }).length + pending.length;
                pushUnread(unread);
            })
            .finally(function() { setLoading(false); });
    }, [open]);

    // Real-time DOM events from app-sidebar Echo listeners
    useEffect(() => {
        function onNewPending(e: Event) {
            const data = (e as CustomEvent<PendingUser>).detail;
            setPendingUsers(function(prev) {
                if (prev.some(function(u) { return u.id === data.id; })) return prev;
                return [data, ...prev];
            });
            Toast.fire({ icon: 'info', title: 'New registration pending approval.' });
        }

        function onNewNotification(e: Event) {
            const data = (e as CustomEvent<{ message: string; url: string }>).detail;
            const newNotif: AppNotification = {
                id: 'live-' + Date.now(),
                data: data,
                read_at: null,
                created_at: new Date().toISOString(),
            };
            setNotifications(function(prev) { return [newNotif, ...prev]; });
            Toast.fire({ icon: 'success', title: data.message });
        }

        window.addEventListener('notif:new-pending', onNewPending);
        window.addEventListener('notif:new-notification', onNewNotification);
        return function() {
            window.removeEventListener('notif:new-pending', onNewPending);
            window.removeEventListener('notif:new-notification', onNewNotification);
        };
    }, []);

    // Escape key
    useEffect(() => {
        function handler(e: KeyboardEvent) { if (e.key === 'Escape') { if (detailUser) setDetailUser(null); else onClose(); } }
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, detailUser]);

    // Mark notification read
    function handleNotifClick(notif: AppNotification) {
        if (notif.read_at) return;
        axios.post('/notifications/' + notif.id + '/read').then(function() {
            setNotifications(function(prev) {
                return prev.map(function(n) {
                    if (n.id === notif.id) return Object.assign({}, n, { read_at: new Date().toISOString() });
                    return n;
                });
            });
            window.dispatchEvent(new CustomEvent('notif:decrement'));
        });
    }

    // Remove from pending list 
    function removePending(userId: number) {
        setPendingUsers(function(prev) { return prev.filter(function(u) { return u.id !== userId; }); });
        window.dispatchEvent(new CustomEvent('notif:decrement'));
    }

    // Approve
    function approveUser(user: PendingUser) {
        Swal.fire({
            title: 'Approve Account?',
            html: 'Approve <strong>' + fullName(user) + '</strong>? They will receive an email notification.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Approve',
        }).then(function(result) {
            if (!result.isConfirmed) return;
            router.post('/admin/employees/' + user.id + '/approve', {}, {
                preserveScroll: true,
                onSuccess: function() {
                    removePending(user.id);
                    // Move to approved list so it still shows in All tab
                    setApprovedUsers(function(prev) { return [Object.assign({}, user, { _approved: true }), ...prev]; });
                    window.dispatchEvent(new CustomEvent('notif:employee-approved', { detail: { id: user.id } }));
                    Toast.fire({ icon: 'success', title: fullName(user) + ' approved.' });
                },
                onError: function() { Toast.fire({ icon: 'error', title: 'Something went wrong.' }); },
            });
        });
    }

    // ── Deny ──────────────────────────────────────────────────────────────────
    function denyUser(user: PendingUser) {
        Swal.fire({
            title: 'Deny & Delete?',
            html: 'This will permanently delete <strong>' + fullName(user) + '</strong>. This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Deny',
        }).then(function(result) {
            if (!result.isConfirmed) return;
            router.delete('/admin/employees/' + user.id, {
                preserveScroll: true,
                onSuccess: function() {
                    removePending(user.id);
                    window.dispatchEvent(new CustomEvent('notif:employee-removed', { detail: { id: user.id } }));
                    Toast.fire({ icon: 'success', title: fullName(user) + ' denied and removed.' });
                },
                onError: function() { Toast.fire({ icon: 'error', title: 'Something went wrong.' }); },
            });
        });
    }

    // ── Derived lists per tab ─────────────────────────────────────────────────
    const unreadNotifs  = notifications.filter(function(n) { return !n.read_at; });
    const pendingCount  = pendingUsers.length;
    const unreadCount   = unreadNotifs.length;

    // ── Render ────────────────────────────────────────────────────────────────
    const drawerCls = 'fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-white shadow-2xl transition-transform duration-300 md:w-96 ' + (open ? 'translate-x-0' : 'translate-x-full');
    const backdropCls = 'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ' + (open ? 'opacity-100' : 'pointer-events-none opacity-0');

    return (
        <>
            {detailUser && (
                <UserDetailModal
                    user={detailUser}
                    onClose={() => setDetailUser(null)}
                    onApprove={function(u) { setDetailUser(null); approveUser(u); }}
                    onDeny={function(u) { setDetailUser(null); denyUser(u); }}
                />
            )}

            <div onClick={onClose} className={backdropCls} />

            <div className={drawerCls}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-5">
                    {/* Unread tab */}
                    <button
                        onClick={() => setTab('unread')}
                        className={'cursor-pointer flex items-center gap-1.5 pb-3 pt-1 text-sm font-medium transition border-b-2 mr-5 ' + (tab === 'unread' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600')}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className={'rounded-full px-1.5 py-0.5 text-[10px] font-bold ' + (tab === 'unread' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500')}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Pending tab — only for admins */}
                    {isAdmin && (
                        <button
                            onClick={() => setTab('pending')}
                            className={'cursor-pointer flex items-center gap-1.5 pb-3 pt-1 text-sm font-medium transition border-b-2 mr-5 ' + (tab === 'pending' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600')}
                        >
                            Pending
                            {pendingCount > 0 && (
                                <span className={'rounded-full px-1.5 py-0.5 text-[10px] font-bold ' + (tab === 'pending' ? 'bg-green-600 text-white' : 'bg-red-100 text-red-600')}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* All tab */}
                    <button
                        onClick={() => setTab('all')}
                        className={'cursor-pointer flex items-center gap-1.5 pb-3 pt-1 text-sm font-medium transition border-b-2 ' + (tab === 'all' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600')}
                    >
                        All
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-3 py-3">
                    {loading && (
                        <div className="flex flex-col gap-3 mt-2">
                            {[1,2,3].map(function(i) {
                                return (
                                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* UNREAD TAB */}
                    {!loading && tab === 'unread' && (
                        <>
                            {unreadNotifs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                        <Check className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">You're all caught up!</p>
                                    <p className="text-xs text-gray-400 mt-1">No unread notifications</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {unreadNotifs.map(function(notif) {
                                        return <NotifRow key={notif.id} notif={notif} onClick={handleNotifClick} />;
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* PENDING TAB */}
                    {!loading && tab === 'pending' && (
                        <>
                            {pendingUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                                        <UserCheck className="h-6 w-6 text-green-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No pending approvals</p>
                                    <p className="text-xs text-gray-400 mt-1">All registrations have been reviewed</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {pendingUsers.map(function(user) {
                                        return (
                                            <PendingRow
                                                key={user.id}
                                                user={user}
                                                onApprove={approveUser}
                                                onDeny={denyUser}
                                                onClick={setDetailUser}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ALL TAB */}
                    {!loading && tab === 'all' && (
                        <>
                            {notifications.length === 0 && pendingUsers.length === 0 && approvedUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                        <Bell className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {/* Still-pending users */}
                                    {pendingUsers.map(function(user) {
                                        return (
                                            <PendingRow
                                                key={'p-' + user.id}
                                                user={user}
                                                onApprove={approveUser}
                                                onDeny={denyUser}
                                                onClick={setDetailUser}
                                            />
                                        );
                                    })}

                                    {/* Approved users this session — shown as resolved */}
                                    {approvedUsers.map(function(user) {
                                        return (
                                            <div key={'a-' + user.id} className="flex items-start gap-3 rounded-xl p-3">
                                                <div className="relative shrink-0">
                                                    <img src={avatarUrl(user)} alt={fullName(user)} className="h-10 w-10 rounded-full object-cover opacity-70" />
                                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
                                                        <Check className="h-2.5 w-2.5 text-white" />
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-gray-500">
                                                        <span className="font-medium text-gray-700">{fullName(user)}</span>
                                                        <span> was approved</span>
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-400">just now · Registration</p>
                                                </div>
                                                <span className="mt-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">Approved</span>
                                            </div>
                                        );
                                    })}

                                    {/* Regular notifications */}
                                    {notifications.map(function(notif) {
                                        return <NotifRow key={notif.id} notif={notif} onClick={handleNotifClick} />;
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}