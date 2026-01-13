// components/layout/AppLayout.tsx
import { ReactNode, useState } from 'react';
import { User } from '../../types';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentTheme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  isTransitioning?: boolean;
}

export function AppLayout({
  children,
  currentUser,
  onLogout,
  currentTheme,
  onThemeChange,
  isTransitioning,
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <div className="relative min-h-screen w-full">
      <AppSidebar
        currentUser={currentUser}
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main content area – shifts when sidebar collapses */}
      <div
        className={`
          flex flex-col min-h-screen
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}
        `}
      >
        <Header
          currentUser={currentUser}
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
          isTransitioning={isTransitioning}
          isSidebarCollapsed={isCollapsed}
        />

        <main className="flex-1 overflow-auto p-4 mt-24 bg-background md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}