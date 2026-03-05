import { Link, usePage } from '@inertiajs/react';
import { Bell, Calendar, Folder, LayoutGrid, MessagesSquare, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useState } from 'react';
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
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

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
    const { auth, unreadNotificationsCount } = usePage<PageProps>().props;
    const roles = auth.user?.roles ?? [];

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
    const [unreadCount, setUnreadCount] = useState(unreadNotificationsCount ?? 0);

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
                                <Link href={dashboard()} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={mainNavItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter
                        items={[{ title: 'Messages', href: '#', icon: MessagesSquare }]}
                        className="mt-auto"
                    />

                    {/* Notifications button with badge */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="group relative flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <span className="relative">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
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