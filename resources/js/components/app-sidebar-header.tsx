import { usePage } from '@inertiajs/react';
import { MessagesSquare, Search } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { NotificationDrawer } from '@/components/notification-drawer';
import { Bell } from 'lucide-react';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { PendingUser } from '@/types/notification';
import echo from '@/echo';
import { useEffect } from 'react';

interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    roles: string[];
}

interface PageProps {
    auth: { user: AuthUser };
    unreadNotificationsCount: number;
    [key: string]: unknown;
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, unreadNotificationsCount } = usePage<PageProps>().props;
    const user    = auth?.user;
    const roles   = Array.isArray(user?.roles) ? user.roles : [];
    const userId  = user?.id;
    const isAdmin = roles.includes('admin') || roles.includes('superadmin');

    const getInitials = useInitials();

    const { openMobile, setOpenMobile } = useSidebar();

    const [drawerOpen, setDrawerOpen]   = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(unreadNotificationsCount ?? 0);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    // ── Existing notification channels ────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        if (isAdmin) {
            echo
                .private('admin.notifications')
                .listen('.new-user-registered', function(data: PendingUser) {
                    setUnreadCount(function(prev) { return prev + 1; });
                    window.dispatchEvent(new CustomEvent('notif:new-pending', { detail: data }));
                    window.dispatchEvent(new CustomEvent('notif:employee-added', { detail: data }));
                });
        }

        echo
            .private('user.' + userId)
            .listen('.account-approved', function(data: { message: string; url: string }) {
                setUnreadCount(function(prev) { return prev + 1; });
                window.dispatchEvent(new CustomEvent('notif:new-notification', { detail: data }));
            });

        return function() {
            if (isAdmin) echo.leave('admin.notifications');
            echo.leave('user.' + userId);
        };
    }, [userId, isAdmin]);

    // ── Announcements channel (public — all users receive it) ─────────────────
    // Subscribed here so the channel stays alive across Inertia navigations.
    // Dispatches two window events:
    //   'announcement:new'  → dashboards prepend the item to their list
    //   'notif:new-announcement' → notification drawer adds a notification entry
    useEffect(() => {
        echo
            .channel('announcements')
            .listen('.AnnouncementPosted', function(data: { announcement: {
                id: number; title: string; body: string; date: string; tag: string; tagColor: string;
            }}) {
                // 1. Update dashboard announcement lists
                window.dispatchEvent(new CustomEvent('announcement:new', { detail: data.announcement }));

                // 2. Push a notification into the drawer + bump the badge
                setUnreadCount(function(prev) { return prev + 1; });
                window.dispatchEvent(new CustomEvent('notif:new-announcement', { detail: data.announcement }));
            });

        return function() {
            echo.leaveChannel('announcements');
        };
    }, []); // intentionally no deps — channel is static and never needs to re-subscribe

    useEffect(() => {
        function onDecrement() {
            setUnreadCount(function(prev) { return Math.max(0, prev - 1); });
        }
        window.addEventListener('notif:decrement', onDecrement);
        return function() { window.removeEventListener('notif:decrement', onDecrement); };
    }, []);

    return (
        <>
            <NotificationDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onUnreadChange={setUnreadCount}
            />

            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border/50 bg-green-800 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 md:px-5 sm:rounded-t-xl">

                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer" />
                </div>

                <div className="ml-auto flex items-center gap-2">

                    <button className="relative flex cursor-pointer h-9 w-9 items-center justify-center rounded-full hover:border border-white/15 text-white transition hover:bg-white/20 hover:text-white">
                        <MessagesSquare className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="relative flex cursor-pointer h-9 w-9 items-center justify-center rounded-full hover:border border-white/15 text-white transition hover:bg-white/20 hover:text-white"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-0.5 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-green-800 animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="cursor-pointer rounded-full ring-2 ring-white/70 transition hover:ring-white/90 ml-3">
                                <Avatar className="h-8 w-8 bg-white">
                                    <AvatarImage src={user?.avatar} alt={user?.name} />
                                    <AvatarFallback className="bg-green-600 text-xs font-semibold text-white hover:bg-green-500">
                                        {getInitials(user?.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/50 bg-white px-6 py-2">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            )}
        </>
    );
}