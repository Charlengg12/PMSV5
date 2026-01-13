// components/layout/Header.tsx
import { useState } from 'react';
import { CustomLogoutSpinner } from '../ui/CustomLogoutSpinner';
import { Badge } from '../ui/badge';
import { Shield, Crown } from 'lucide-react';
import { User } from '../../types';
import { ThemeToggle } from '../ui/theme-toggle';

interface HeaderProps {
  currentUser: User;
  currentTheme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  isTransitioning?: boolean;
  isSidebarCollapsed: boolean;
}

export function Header({
  currentUser,
  currentTheme,
  onThemeChange,
  isTransitioning,
  isSidebarCollapsed,
}: HeaderProps) {
  const [showLogoutSpinner] = useState(false);

  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Badge className="bg-accent text-accent-foreground">Admin</Badge>;
      case 'supervisor':
        return <Badge className="bg-primary text-primary-foreground">Supervisor</Badge>;
      case 'fabricator':
        return <Badge className="bg-secondary text-secondary-foreground">Fabricator</Badge>;
      case 'client':
        return <Badge variant="outline" className="border-primary text-primary">Client</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <>
      {showLogoutSpinner && <CustomLogoutSpinner />}

      <header
        className={`
          fixed top-0 z-20
          left-0 right-0
          flex items-center justify-between
          px-4 md:px-6 py-5
          bg-card border-b shadow-sm
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'md:left-16' : 'md:left-64'}
        `}
      >
        <div className="flex items-center gap-4">
          {/* You can add mobile sidebar trigger here later if needed */}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            isTransitioning={isTransitioning}
          />

          <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg">
            {getRoleIcon()}

            <div className="text-right">
              <p className="text-sm font-medium truncate max-w-[140px] md:max-w-[220px]">
                {currentUser.name}
              </p>
              <div className="flex items-center justify-end gap-2">
                {getRoleBadge()}
                <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
                  {currentUser.secureId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}