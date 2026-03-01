import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { Bell, Calendar, Folder, LayoutGrid, MessagesSquare, Users, ShieldCheck, UserCog } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

// shared by ALL roles 
const commonNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

// superadmin only 
const superAdminNavItems: NavItem[] = [
    {
        title: 'User Management',
        href: '/superadmin/users',
        icon: ShieldCheck,
    },
    {
        title: 'Roles & Permissions',
        href: '/admin/roles',
        icon: UserCog,
    },
];

// hr admin only
const adminNavItems: NavItem[] = [
    {
        title: 'Employees',
        href: '/admin/employees',
        icon: Users,
    },
    {
        title: 'Leave Management',
        href: '/leave',
        icon: Calendar,
    },
];

// employee only
const employeeNavItems: NavItem[] = [
    {
        title: 'My Leave',
        href: '/my-leave',
        icon: Calendar,
    },
    {
        title: 'My Profile',
        href: '/my-profile',
        icon: Folder,
    },
];

// ── footer nav (all roles) 
const footerNavItems: NavItem[] = [
    {
        title: 'Messages',
        href: '#',
        icon: MessagesSquare,
    },
    {
        title: 'Notifications',
        href: '#',
        icon: Bell,
    },
];

// types
interface AuthUser {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface PageProps {
    auth: {
        user: AuthUser;
    };
    [key: string]: unknown;
}

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;
    const roles = auth.user?.roles ?? [];

    const isSuperAdmin = roles.includes('superadmin');
    const isAdmin      = roles.includes('admin');
    const isEmployee   = roles.includes('employee');

    // nav items based on role
    const roleNavItems: NavItem[] = isSuperAdmin
        ? superAdminNavItems
        : isAdmin
        ? adminNavItems
        : isEmployee
        ? employeeNavItems
        : [];

    // merge common items and role-specific items
    const mainNavItems = [...commonNavItems, ...roleNavItems];

    return (
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}