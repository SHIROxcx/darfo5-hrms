import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    ArrowLeft,
    BellRing,
    Check,
    EllipsisVertical,
    X,
} from 'lucide-react';
import type { AppNotification, PendingUser } from '@/types/notification';

// Helpers

function fullName(u: PendingUser) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;
}

function avatarUrl(u: PendingUser) {
    if (u.photo) return '/storage/' + u.photo;
    return 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(fullName(u));
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

function notifClass(isUnread: boolean) {
    const base = 'mb-3 block rounded-lg border p-3 shadow-sm transition hover:bg-gray-50';
    const state = isUnread ? 'border-green-500 bg-white' : 'border-gray-200 bg-gray-50';
    return base + ' ' + state;
}

function drawerClass(open: boolean) {
    const base = 'fixed right-0 top-0 z-50 flex h-full w-72 flex-col rounded-l-lg bg-white shadow-xl transition-transform duration-300 md:w-96';
    return base + ' ' + (open ? 'translate-x-0' : 'translate-x-full');
}

function backdropClass(open: boolean) {
    const base = 'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300';
    return base + ' ' + (open ? 'opacity-100' : 'pointer-events-none opacity-0');
}

function listScreenClass(screen: string) {
    const base = 'absolute inset-0 flex flex-col overflow-y-auto p-4 transition-transform duration-300';
    return base + ' ' + (screen === 'list' ? 'translate-x-0' : '-translate-x-full');
}

function pendingScreenClass(screen: string) {
    const base = 'absolute inset-0 flex flex-col overflow-y-auto p-4 transition-transform duration-300';
    return base + ' ' + (screen === 'pending' ? 'translate-x-0' : 'translate-x-full');
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
});

// Pending user card
function PendingCard({
    user,
    onApprove,
    onDeny,
}: {
    user: PendingUser;
    onApprove: (u: PendingUser) => void;
    onDeny: (u: PendingUser) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative flex items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 p-3 shadow-sm">
            <div className="flex min-w-0 items-start gap-3">
                <img
                    src={avatarUrl(user)}
                    alt={fullName(user)}
                    className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-700">{fullName(user)}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                        Registered: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div ref={menuRef} className="relative flex-shrink-0">
                <button
                    onClick={() => setMenuOpen(function(v) { return !v; })}
                    className="rounded-full p-2 text-gray-600 transition cursor-pointer hover:bg-red-200/80 hover:text-red-800 focus:outline-none"
                >
                    <EllipsisVertical className="h-4 w-4" />
                </button>

                {menuOpen && (
                    <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-md border border-gray-100 bg-white py-1 shadow-lg">
                        <button
                            onClick={() => { setMenuOpen(false); onApprove(user); }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold text-green-700 transition-colors hover:bg-green-50 cursor-pointer"
                        >
                            <span className="rounded-full bg-green-100 p-1">
                                <Check className="h-3 w-3" />
                            </span>
                            Approve
                        </button>
                        <div className="my-0.5 h-px bg-gray-100" />
                        <button
                            onClick={() => { setMenuOpen(false); onDeny(user); }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 cursor-pointer"
                        >
                            <span className="rounded-full bg-red-100 p-1">
                                <X className="h-3 w-3" />
                            </span>
                            Deny
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Main drawer
interface Props {
    open: boolean;
    onClose: () => void;
    onUnreadChange?: (count: number) => void;
}

export function NotificationDrawer({ open, onClose, onUnreadChange }: Props) {
    const [screen, setScreen]               = useState<'list' | 'pending'>('list');
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [pendingUsers, setPendingUsers]   = useState<PendingUser[]>([]);
    const [loading, setLoading]             = useState(false);

    useEffect(() => {
        if (!open) return;
        setScreen('list');
        setLoading(true);
        axios.get('/notifications')
            .then(function(res) {
                const notifs: AppNotification[] = res.data.notifications ?? [];
                const pending: PendingUser[]    = res.data.pendingUsers ?? [];
                setNotifications(notifs);
                setPendingUsers(pending);
                const unread = notifs.filter(function(n) { return !n.read_at; }).length;
                if (onUnreadChange) onUnreadChange(unread);
            })
            .finally(function() { setLoading(false); });
    }, [open]);

    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    function handleNotifClick(notif: AppNotification) {
        if (notif.read_at) return;
        axios.post('/notifications/' + notif.id + '/read').then(function() {
            setNotifications(function(prev) {
                return prev.map(function(n) {
                    if (n.id === notif.id) return Object.assign({}, n, { read_at: new Date().toISOString() });
                    return n;
                });
            });
            const unread = notifications.filter(function(n) { return n.id !== notif.id && !n.read_at; }).length;
            if (onUnreadChange) onUnreadChange(unread);
        });
    }

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
            router.post(
                '/admin/employees/' + user.id + '/approve',
                {},
                {
                    preserveScroll: true,
                    onSuccess: function() {
                        setPendingUsers(function(prev) { return prev.filter(function(u) { return u.id !== user.id; }); });
                        Toast.fire({ icon: 'success', title: fullName(user) + ' approved.' });
                    },
                    onError: function() { Toast.fire({ icon: 'error', title: 'Something went wrong.' }); },
                }
            );
        });
    }

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
            router.delete(
                '/admin/employees/' + user.id,
                {
                    preserveScroll: true,
                    onSuccess: function() {
                        setPendingUsers(function(prev) { return prev.filter(function(u) { return u.id !== user.id; }); });
                        Toast.fire({ icon: 'success', title: fullName(user) + ' denied and removed.' });
                    },
                    onError: function() { Toast.fire({ icon: 'error', title: 'Something went wrong.' }); },
                }
            );
        });
    }

    return (
        <>
            <div onClick={onClose} className={backdropClass(open)} />

            <div className={drawerClass(open)}>

                <div className="flex items-center justify-between border-b px-4 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="relative flex-1 overflow-hidden">

                    {/* List screen */}
                    <div className={listScreenClass(screen)}>

                        {loading && (
                            <p className="mt-5 text-center text-sm italic text-gray-400">Loading…</p>
                        )}

                        {!loading && pendingUsers.length > 0 && (
                            <button
                                onClick={() => setScreen('pending')}
                                className="mb-4 flex w-full items-center justify-between rounded-lg border border-red-300 bg-red-50 p-3 transition hover:bg-red-100 cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-red-500 p-2 text-white">
                                        <BellRing className="h-5 w-5" />
                                    </span>
                                    <span className="font-semibold text-red-600">Pending Approvals</span>
                                </div>
                                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                                    {pendingUsers.length}
                                </span>
                            </button>
                        )}

                        {!loading && notifications.length === 0 && (
                            <p className="mt-5 text-center text-sm italic text-gray-400">No notifications</p>
                        )}

                        {!loading && notifications.map(function(notif) {
                            return (
                                <a
                                    key={notif.id}
                                    href={notif.data && notif.data.url ? notif.data.url : '#'}
                                    onClick={function() { handleNotifClick(notif); }}
                                    className={notifClass(notif.read_at === null)}
                                >
                                    <p className="text-sm text-gray-800">{notif.data && notif.data.message}</p>
                                    <p className="mt-1 text-xs text-gray-400">{relativeTime(notif.created_at)}</p>
                                </a>
                            );
                        })}
                    </div>

                    {/* Pending screen */}
                    <div className={pendingScreenClass(screen)}>
                        <button
                            onClick={() => setScreen('list')}
                            className="sticky top-0 z-10 mb-3 flex items-center gap-2 bg-white py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to notifications
                        </button>

                        {pendingUsers.length === 0 && (
                            <p className="mt-10 text-center text-sm italic text-gray-400">No pending approvals</p>
                        )}

                        <div className="space-y-3">
                            {pendingUsers.map(function(user) {
                                return (
                                    <PendingCard
                                        key={user.id}
                                        user={user}
                                        onApprove={approveUser}
                                        onDeny={denyUser}
                                    />
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}