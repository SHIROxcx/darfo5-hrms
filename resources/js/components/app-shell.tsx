import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

function getCookieSidebarOpen(): boolean {
    if (typeof document === 'undefined') return true;
    const match = document.cookie.match(/(?:^|; )sidebar_state=([^;]*)/);
    if (!match) return true; 
    return match[1] === 'true';
}

export function AppShell({ children, variant = 'header' }: Props) {
    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarProvider defaultOpen={getCookieSidebarOpen()}>
            {children}
        </SidebarProvider>
    );
}