// resources/js/components/app-sidebar.tsx

import { Link, usePage } from '@inertiajs/react';
import { Calendar, Folder, LayoutGrid, MessagesSquare, ShieldCheck, UserCog, Users } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
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
    [key: string]: unknown;
}

export function AppSidebar() {
    // openMobile is the Sheet open state — only true when the mobile Sheet is open.
    // We close it directly rather than relying on isMobile, which only covers <768px.
    // This also correctly handles tablets (768–1024px) where the Sheet is used.
    const { openMobile, setOpenMobile } = useSidebar();
    const { auth } = usePage<PageProps>().props;
    const roles = Array.isArray(auth.user?.roles) ? auth.user.roles : [];

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

    function closeMobileIfOpen() {
        if (openMobile) setOpenMobile(false);
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch onClick={closeMobileIfOpen}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} onNavClick={closeMobileIfOpen} />
            </SidebarContent>
        </Sidebar>
    );
}