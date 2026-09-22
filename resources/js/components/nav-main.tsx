import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    onNavClick,
}: {
    items: NavItem[];
    onNavClick?: () => void;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const { state, setOpen } = useSidebar();

    // While the sidebar is icon-collapsed, its sub-items are hidden by CSS no
    // matter what the collapsible's own open/closed state is — so clicking a
    // parent nav item (e.g. Settings) would silently toggle nothing visible.
    // Expand the sidebar itself first so the click actually reveals children.
    function handleGroupTriggerClick() {
        if (state === 'collapsed') setOpen(true);
    }

    return (
        <SidebarMenu className="px-2 py-0">
            {items.map((item) => {
                if (item.items && item.items.length > 0) {
                    const groupIsActive = item.items.some((child) => isCurrentUrl(child.href));

                    return (
                        <Collapsible key={item.title} asChild defaultOpen={groupIsActive} className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton isActive={groupIsActive} tooltip={{ children: item.title }} onClick={handleGroupTriggerClick}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((child) => (
                                            <SidebarMenuSubItem key={child.title}>
                                                <SidebarMenuSubButton asChild isActive={isCurrentUrl(child.href)}>
                                                    <Link href={child.href} prefetch onClick={onNavClick}>
                                                        <span>{child.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                }

                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch onClick={onNavClick}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}