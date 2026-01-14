import { ReactNode } from 'react';
import { User } from '../../types';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset } from '../ui/sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentTheme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  isTransitioning?: boolean;
}

export function AppLayout({ children, currentUser, onLogout, currentTheme, onThemeChange, isTransitioning }: AppLayoutProps) {
  return (
    <SidebarProvider storageKey={`sidebar_state_${currentUser.id}`}>
      <div className="min-h-screen flex w-full">
        <AppSidebar currentUser={currentUser} onLogout={onLogout} />
        <SidebarInset className="flex-1 flex flex-col h-svh">
          <Header
            currentUser={currentUser}
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            isTransitioning={isTransitioning}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
