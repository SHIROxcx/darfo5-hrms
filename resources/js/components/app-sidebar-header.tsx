// resources/js/components/app-sidebar-header.tsx

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

// Types

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

// Header

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, unreadNotificationsCount } = usePage<PageProps>().props;
    const user    = auth?.user;
    const roles   = Array.isArray(user?.roles) ? user.roles : [];
    const userId  = user?.id;
    const isAdmin = roles.includes('admin');

    const getInitials = useInitials();
    const { isMobile, setOpenMobile } = useSidebar();

    const [drawerOpen, setDrawerOpen]   = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(unreadNotificationsCount ?? 0);

    // Current day/date display
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

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

            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border/50 bg-green-800 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 md:px-5">

                {/* Left — sidebar trigger on mobile */}
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer" />
                </div>

                {/* Date — hidden on small screens */}
                <span className="hidden select-none text-sm text-white/80 md:block whitespace-nowrap">
                    {today}
                </span>

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-2">

                    {/* Messages */}
                    <button className="relative flex cursor-pointer h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white">
                        <MessagesSquare className="h-4 w-4" />
                    </button>

                    {/* Notifications */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="relative flex cursor-pointer h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 transition hover:bg-white/20 hover:text-white"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-green-800 animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* User avatar */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="cursor-pointer rounded-full ring-2 ring-white/40 transition hover:ring-white/40">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.avatar} alt={user?.name} />
                                    <AvatarFallback className="bg-green-600 text-xs font-semibold text-white">
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

            {/* Breadcrumb row */}
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/50 bg-white px-6 py-2">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            )}
        </>
    );
}