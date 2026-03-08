// resources/js/components/app-sidebar.tsx

import { Link, usePage } from '@inertiajs/react';
import { Bell, Calendar, Folder, LayoutGrid, MessagesSquare, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import echo from '@/echo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { NotificationDrawer } from '@/components/notification-drawer';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';
import type { PendingUser } from '@/types/notification';

const commonNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
];

const superAdminNavItems: NavItem[] = [
    { title: 'User Management', href: '/superadmin/users', icon: ShieldCheck },
    { title: 'Roles & Permissions', href: '/admin/roles', icon: UserCog },
];

const adminNavItems: NavItem[] = [
    { title: 'Employees', href: '/admin/employees', icon: Users },
    { title: 'Leave Management', href: '/leave', icon: Calendar },
];

const employeeNavItems: NavItem[] = [
    { title: 'My Leave', href: '/my-leave', icon: Calendar },
    { title: 'My Profile', href: '/my-profile', icon: Folder },
];

interface AuthUser {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface PageProps {
    auth: { user: AuthUser };
    unreadNotificationsCount: number;
    [key: string]: unknown;
}

export function AppSidebar() {
    // ✅ useSidebar gives us setOpenMobile to close the sidebar on mobile nav clicks
    const { setOpenMobile, isMobile } = useSidebar();

    const { auth, unreadNotificationsCount } = usePage<PageProps>().props;
    const roles  = Array.isArray(auth.user?.roles) ? auth.user.roles : [];
    const userId = auth.user?.id;

    const isSuperAdmin = roles.includes('superadmin');
    const isAdmin      = roles.includes('admin');
    const isEmployee   = roles.includes('employee');

    const roleNavItems = isSuperAdmin
        ? superAdminNavItems
        : isAdmin
        ? adminNavItems
        : isEmployee
        ? employeeNavItems
        : [];

    const mainNavItems = [...commonNavItems, ...roleNavItems];

    const [drawerOpen, setDrawerOpen]   = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(unreadNotificationsCount ?? 0);

    // ── Real-time Echo subscriptions ─────────────────────────────────────────
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

    // ── Badge decrement ───────────────────────────────────────────────────────
    useEffect(() => {
        function onDecrement() {
            setUnreadCount(function(prev) { return Math.max(0, prev - 1); });
        }
        window.addEventListener('notif:decrement', onDecrement);
        return function() {
            window.removeEventListener('notif:decrement', onDecrement);
        };
    }, []);

    // ── Close mobile sidebar on any nav click ─────────────────────────────────
    function closeMobile() {
        if (isMobile) setOpenMobile(false);
    }

    return (
        <>
            <NotificationDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onUnreadChange={setUnreadCount}
            />

            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                {/* ✅ Close mobile sidebar when logo is clicked */}
                                <Link href={dashboard()} prefetch onClick={closeMobile}>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    {/* ✅ Pass onNavClick so each nav item closes the mobile sidebar */}
                    <NavMain items={mainNavItems} onNavClick={closeMobile} />
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter
                        items={[{ title: 'Messages', href: '#', icon: MessagesSquare }]}
                        className="mt-auto"
                        onNavClick={closeMobile}
                    />

                    {/* close mobile sidebar then open drawer */}
                    <button
                        onClick={function() { closeMobile(); setDrawerOpen(true); }}
                        className="group relative flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <span className="relative">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </span>
                        <span className="group-data-[collapsible=icon]:hidden">Notifications</span>
                    </button>
                    
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </>
    );
}