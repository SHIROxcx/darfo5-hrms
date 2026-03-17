import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Check, X, UserCheck, Clock, Bell, Megaphone } from 'lucide-react';
import type { AppNotification, PendingUser, AnnouncementNotifData } from '@/types/notification';

// Helpers

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
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

// Types

type Tab = 'all' | 'unread' | 'pending';

interface AuthUser { id: number; roles: string[]; }
interface PageProps { auth: { user: AuthUser }; [key: string]: unknown; }

// User Detail Modal

function UserDetailModal({
    user, onClose, onApprove, onDeny,
}: {
    user: PendingUser;
    onClose: () => void;
    onApprove: (u: PendingUser) => void;
    onDeny: (u: PendingUser) => void;
}) {
    const ep = user.employee_profile;
    const initials = ((user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')).toUpperCase() || '??';

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        {user.photo
                            ? <img src={'/storage/' + user.photo} className="h-12 w-12 rounded-full object-cover border" alt={fullName(user)} />
                            : <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">{initials}</div>
                        }
                        <div>
                            <p className="font-semibold text-gray-900">{fullName(user)}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="flex gap-3">
                        {[
                            { label: 'Email',    value: 'Verified',  cls: 'text-green-700 bg-green-50' },
                            { label: 'Approval', value: 'Pending',   cls: 'text-yellow-700 bg-yellow-50' },
                            { label: 'Status',   value: ep?.is_active ? 'Active' : 'Inactive', cls: ep?.is_active ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50' },
                        ].map(({ label, value, cls }) => (
                            <div key={label} className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-400 mb-1">{label}</p>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                            ['Employee No.',    ep?.employee_number],
                            ['Employment Type', ep?.employment_type],
                            ['Position',        ep?.position],
                            ['Salary Grade',    ep?.salary_grade],
                        ].map(([label, val]) => (
                            <div key={label as string}>
                                <p className="text-xs text-gray-400">{label}</p>
                                <p className="font-medium text-gray-700">{val ?? <span className="italic text-gray-300">Not set</span>}</p>
                            </div>
                        ))}
                        {[
                            ['Agency',       ep?.place_assign],
                            ['Division/Office',     ep?.division],
                            ['Section/Unit/Office', ep?.section],
                        ].map(([label, val]) => (
                            <div key={label as string} className="col-span-2">
                                <p className="text-xs text-gray-400">{label}</p>
                                <p className="font-medium text-gray-700">{val ?? <span className="italic text-gray-300">Not set</span>}</p>
                            </div>
                        ))}
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400">Registered</p>
                            <p className="font-medium text-gray-700">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t flex justify-end gap-2">
                    <button onClick={() => { onDeny(user); onClose(); }} className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-semibold border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                        Decline
                    </button>
                    <button onClick={() => { onApprove(user); onClose(); }} className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
}

// Pending row

function PendingRow({ user, onApprove, onDeny, onClick }: {
    user: PendingUser;
    onApprove: (u: PendingUser) => void;
    onDeny: (u: PendingUser) => void;
    onClick: (u: PendingUser) => void;
}) {
    return (
        <div className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50 cursor-pointer" onClick={() => onClick(user)}>
            <div className="relative shrink-0">
                <img src={avatarUrl(user)} alt={fullName(user)} className="h-12 w-12 rounded-full object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 ring-2 ring-white">
                    <Clock className="h-2.5 w-2.5 text-white" />
                </span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800">
                    <span className="font-semibold">{fullName(user)}</span>
                    <span className="text-gray-500"> registered and is awaiting approval</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{relativeTime(user.created_at)}</p>
                <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onApprove(user)} className="flex cursor-pointer items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700">Approve</button>
                    <button onClick={() => onDeny(user)}    className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50">Decline</button>
                </div>
            </div>
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
        </div>
    );
}

// Regular notification row

function NotifRow({ notif, onClick }: { notif: AppNotification; onClick: (n: AppNotification) => void }) {
    const isUnread = notif.read_at === null;
    return (
        <div onClick={() => onClick(notif)} className={'group flex items-start gap-3 rounded-xl p-3 transition cursor-pointer ' + (isUnread ? 'hover:bg-green-50/60' : 'hover:bg-gray-50')}>
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
                    {'message' in notif.data ? notif.data.message : 'Notification'}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{relativeTime(notif.created_at)}</p>
            </div>
            {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-500" />}
        </div>
    );
}

// Announcement notification row

function AnnouncementNotifRow({ notif, onClick }: { notif: AppNotification; onClick: (n: AppNotification) => void }) {
    const isUnread = notif.read_at === null;
    const d = notif.data as AnnouncementNotifData;

    function handleClick() {
        // Mark read then scroll to announcements panel
        onClick(notif);
        setTimeout(() => {
            const el = document.getElementById('announcements-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    }

    return (
        <div onClick={handleClick} className={'group flex items-start gap-3 rounded-xl p-3 transition cursor-pointer ' + (isUnread ? 'hover:bg-green-50/60' : 'hover:bg-gray-50')}>
            <div className="relative shrink-0">
                <div className={'flex h-10 w-10 items-center justify-center rounded-full ' + (isUnread ? 'bg-green-100' : 'bg-gray-100')}>
                    <Megaphone className={'h-5 w-5 ' + (isUnread ? 'text-green-600' : 'text-gray-400')} />
                </div>
                {isUnread && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
                        <Check className="h-2 w-2 text-white" />
                    </span>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className={'text-sm leading-snug ' + (isUnread ? 'font-medium text-gray-900' : 'text-gray-500')}>
                    {d.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${d.tagColor}`}>{d.tag}</span>
                    <span className="text-[10px] text-gray-400">{relativeTime(notif.created_at)}</span>
                </div>
            </div>
            {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-500" />}
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
    const { auth } = usePage<PageProps>().props;
    const roles   = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
    const isAdmin = roles.includes('admin') || roles.includes('superadmin');

    const [tab,           setTab]           = useState<Tab>('all');
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [pendingUsers,  setPendingUsers]  = useState<PendingUser[]>([]);
    const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
    const [loading,       setLoading]       = useState(false);
    const [detailUser,    setDetailUser]    = useState<PendingUser | null>(null);

    // Load from server
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        axios.get('/notifications')
            .then(res => {
                const notifs: AppNotification[] = res.data.notifications ?? [];
                const pending: PendingUser[]    = res.data.pendingUsers  ?? [];
                setNotifications(notifs);
                setPendingUsers(pending);
                setApprovedUsers([]);
                const unread = notifs.filter(n => !n.read_at).length + pending.length;
                onUnreadChange?.(unread);
            })
            .finally(() => setLoading(false));
    }, [open]);

    // Real-time window events
    useEffect(() => {
        // New pending registration
        function onNewPending(e: Event) {
            const data = (e as CustomEvent<PendingUser>).detail;
            setPendingUsers(prev => prev.some(u => u.id === data.id) ? prev : [data, ...prev]);
            Toast.fire({ icon: 'info', title: 'New registration pending approval.' });
        }

        // General notification
        function onNewNotification(e: Event) {
            const data = (e as CustomEvent<{ message: string; url: string }>).detail;
            const n: AppNotification = {
                id: 'live-' + Date.now(),
                data,
                read_at: null,
                created_at: new Date().toISOString(),
            };
            setNotifications(prev => [n, ...prev]);
            Toast.fire({ icon: 'success', title: data.message });
        }

        function onNewAnnouncement(e: Event) {
            const data = (e as CustomEvent<{
                id: number; title: string; body: string; date: string; tag: string; tagColor: string;
            }>).detail;

            const announcementData: AnnouncementNotifData = {
                type:            'announcement',
                announcement_id: data.id,
                title:           data.title,
                body:            data.body,
                date:            data.date,
                tag:             data.tag,
                tagColor:        data.tagColor,
            };

            const syntheticNotif: AppNotification = {
                id:         'ann-live-' + data.id,
                data:       announcementData,
                read_at:    null,
                created_at: new Date().toISOString(),
            };

            setNotifications(prev => {
                // Avoid duplicate if the drawer already loaded it from the DB
                const alreadyExists = prev.some(n => {
                    const d = n.data as Partial<AnnouncementNotifData>;
                    return d.type === 'announcement' && d.announcement_id === data.id;
                });
                if (alreadyExists) return prev;
                return [syntheticNotif, ...prev];
            });

            Toast.fire({ icon: 'info', title: '📢 ' + data.title });
        }

        window.addEventListener('notif:new-pending',      onNewPending);
        window.addEventListener('notif:new-notification', onNewNotification);
        window.addEventListener('notif:new-announcement', onNewAnnouncement);
        return () => {
            window.removeEventListener('notif:new-pending',      onNewPending);
            window.removeEventListener('notif:new-notification', onNewNotification);
            window.removeEventListener('notif:new-announcement', onNewAnnouncement);
        };
    }, []);

    // Escape key
    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if (e.key === 'Escape') { if (detailUser) setDetailUser(null); else onClose(); }
        }
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, detailUser]);

    // Mark as read
    function handleNotifClick(notif: AppNotification) {
        // Extract the URL from general notifications before doing anything else
        const url = 'url' in notif.data ? notif.data.url : null;
 
        if (!notif.read_at) {
            setNotifications(prev => prev.map(n =>
                n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
            ));
            window.dispatchEvent(new CustomEvent('notif:decrement'));
 
            if (!String(notif.id).startsWith('ann-live-') && !String(notif.id).startsWith('live-')) {
                axios.post('/notifications/' + notif.id + '/read').catch(() => {
                    // Revert on failure
                    setNotifications(prev => prev.map(n =>
                        n.id === notif.id ? { ...n, read_at: null } : n
                    ));
                    window.dispatchEvent(new CustomEvent('notif:increment'));
                });
            }
        }
 
        // Navigate to the notification's URL if it has one
        if (url) {
            onClose();
            router.visit(url);
        }
    }

    // Pending user actions
    function removePending(userId: number) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        window.dispatchEvent(new CustomEvent('notif:decrement'));
    }

    function approveUser(user: PendingUser) {
        Swal.fire({
            title: 'Approve Account?',
            html: 'Approve <strong>' + fullName(user) + '</strong>? They will receive an email notification.',
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#16a34a', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, Approve',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.post('/admin/employees/' + user.id + '/approve', {}, {
                preserveScroll: true,
                onSuccess: () => {
                    removePending(user.id);
                    setApprovedUsers(prev => [{ ...user, _approved: true } as any, ...prev]);
                    window.dispatchEvent(new CustomEvent('notif:employee-approved', { detail: { id: user.id } }));
                    Toast.fire({ icon: 'success', title: fullName(user) + ' approved.' });
                },
                onError: () => Toast.fire({ icon: 'error', title: 'Something went wrong.' }),
            });
        });
    }

    function denyUser(user: PendingUser) {
        Swal.fire({
            title: 'Decline Registration?',
            html: 'This will permanently delete <strong>' + fullName(user) + '</strong>. This cannot be undone.',
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, Deny',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.delete('/admin/employees/' + user.id, {
                preserveScroll: true,
                onSuccess: () => {
                    removePending(user.id);
                    window.dispatchEvent(new CustomEvent('notif:employee-removed', { detail: { id: user.id } }));
                    Toast.fire({ icon: 'success', title: fullName(user) + ' denied and removed.' });
                },
                onError: () => Toast.fire({ icon: 'error', title: 'Something went wrong.' }),
            });
        });
    }

    // Derived counts
    const allUnread    = notifications.filter(n => !n.read_at);
    const unreadCount  = allUnread.length;
    const pendingCount = pendingUsers.length;

    function isAnnouncementNotif(n: AppNotification): boolean {
        return (n.data as Partial<AnnouncementNotifData>).type === 'announcement';
    }

    function renderNotif(notif: AppNotification) {
        if (isAnnouncementNotif(notif)) {
            return <AnnouncementNotifRow key={notif.id} notif={notif} onClick={handleNotifClick} />;
        }
        return <NotifRow key={notif.id} notif={notif} onClick={handleNotifClick} />;
    }

    const drawerCls   = 'fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-white shadow-2xl transition-transform duration-300 md:w-96 ' + (open ? 'translate-x-0' : 'translate-x-full');
    const backdropCls = 'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ' + (open ? 'opacity-100' : 'pointer-events-none opacity-0');

    return (
        <>
            {detailUser && (
                <UserDetailModal
                    user={detailUser}
                    onClose={() => setDetailUser(null)}
                    onApprove={u => { setDetailUser(null); approveUser(u); }}
                    onDeny={u => { setDetailUser(null); denyUser(u); }}
                />
            )}

            <div onClick={onClose} className={backdropCls} />

            <div className={drawerCls}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-xl font-bold text-green-800">Notifications</h2>
                    <button onClick={onClose} className="cursor-pointer rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-5">
                    {[
                        { id: 'all'     as Tab, label: 'All',     badge: null },
                        { id: 'unread'  as Tab, label: 'Unread',  badge: unreadCount  > 0 ? unreadCount  : null },
                        { id: 'pending' as Tab, label: 'Pending', badge: pendingCount > 0 ? pendingCount : null, adminOnly: true },
                    ].filter(t => !t.adminOnly || isAdmin).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={
                                'cursor-pointer flex items-center gap-1.5 pb-3 pt-1 text-sm font-medium transition border-b-2 ' +
                                (t.id !== 'all' ? 'ml-5 ' : '') +
                                (tab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600')
                            }
                        >
                            {t.label}
                            {t.badge !== null && (
                                <span className={
                                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold ' +
                                    (tab === t.id
                                        ? 'bg-green-600 text-white'
                                        : t.id === 'pending' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500')
                                }>{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-3 py-3">

                    {loading && (
                        <div className="flex flex-col gap-3 mt-2">
                            {[1,2,3].map(i => (
                                <div key={i} className="flex gap-3 p-3 animate-pulse">
                                    <div className="h-10 w-10 rounded-full bg-gray-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* UNREAD TAB */}
                    {!loading && tab === 'unread' && (
                        unreadCount === 0
                            ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                        <Check className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">You're all caught up!</p>
                                    <p className="text-xs text-gray-400 mt-1">No unread notifications</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {allUnread.map(renderNotif)}
                                </div>
                            )
                    )}

                    {/* PENDING TAB */}
                    {!loading && tab === 'pending' && (
                        pendingUsers.length === 0
                            ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                                        <UserCheck className="h-6 w-6 text-green-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No pending approvals</p>
                                    <p className="text-xs text-gray-400 mt-1">All registrations have been reviewed</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {pendingUsers.map(u => (
                                        <PendingRow key={u.id} user={u} onApprove={approveUser} onDeny={denyUser} onClick={setDetailUser} />
                                    ))}
                                </div>
                            )
                    )}

                    {/* ALL TAB */}
                    {!loading && tab === 'all' && (
                        notifications.length === 0 && pendingUsers.length === 0 && approvedUsers.length === 0
                            ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                        <Bell className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {/* Pending registrations */}
                                    {pendingUsers.map(u => (
                                        <PendingRow key={'p-' + u.id} user={u} onApprove={approveUser} onDeny={denyUser} onClick={setDetailUser} />
                                    ))}

                                    {/* Approved this session */}
                                    {approvedUsers.map(u => (
                                        <div key={'a-' + u.id} className="flex items-start gap-3 rounded-xl p-3">
                                            <div className="relative shrink-0">
                                                <img src={avatarUrl(u)} alt={fullName(u)} className="h-10 w-10 rounded-full object-cover opacity-70" />
                                                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
                                                    <Check className="h-2.5 w-2.5 text-white" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">{fullName(u)}</span> was approved</p>
                                                <p className="mt-0.5 text-xs text-gray-400">Just now</p>
                                            </div>
                                            <span className="mt-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">Approved</span>
                                        </div>
                                    ))}

                                    {/* All notifications */}
                                    {notifications.map(renderNotif)}
                                </div>
                            )
                    )}
                </div>
            </div>
        </>
    );
}