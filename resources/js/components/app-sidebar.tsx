import { Link, usePage } from '@inertiajs/react';
import { Calendar, FileText, Folder, LayoutGrid, MessagesSquare, ScrollText, Settings, ShieldCheck, UserCog, Users } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { index as memosIndex } from '@/routes/admin/memos';
import { index as myMemosIndex } from '@/routes/memos';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';``
import { dashboard } from '@/routes';

const commonNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
];

const referenceDataNavItem: NavItem = {
    title: 'Settings',
    href: '/admin/reference-data/holidays',
    icon: Settings,
    items: [
        { title: 'Holidays', href: '/admin/reference-data/holidays' },
        { title: 'Positions', href: '/admin/reference-data/positions' },
        { title: 'Eligibilities', href: '/admin/reference-data/eligibilities' },
        { title: "Bachelor's Degrees", href: '/admin/reference-data/bachelors-degrees' },
        { title: 'Graduate Programs', href: '/admin/reference-data/graduate-programs' },
        { title: 'Divisions & Sections', href: '/admin/reference-data/divisions' },
    ],
};

const superAdminNavItems: NavItem[] = [
    { title: 'User Management', href: '/superadmin/users', icon: ShieldCheck },
    { title: 'Roles & Permissions', href: '/admin/roles', icon: UserCog },
    { title: 'Leave Management', href: '/admin/leave', icon: Calendar },
    { title: 'Memos', href: memosIndex(), icon: ScrollText },
    referenceDataNavItem,
];

const adminNavItems: NavItem[] = [
    { title: 'Personal Data Sheet', href: '/pds', icon: FileText },
    { title: 'Employee Management', href: '/admin/employees', icon: Users },
    { title: 'Leave Management', href: '/admin/leave', icon: Calendar },
    { title: 'Memos', href: memosIndex(), icon: ScrollText },
    referenceDataNavItem,
];

const employeeNavItems: NavItem[] = [
    { title: 'Personal Data Sheet', href: '/pds', icon: FileText },
    { title: 'My Leave', href: '/my-leave', icon: Calendar },
    { title: 'Memos', href: myMemosIndex(), icon: ScrollText },
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