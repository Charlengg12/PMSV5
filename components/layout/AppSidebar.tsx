// components/AppSidebar.tsx
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  Package,
  BarChart3,
  Settings,
  Calendar,
  DollarSign,
  Archive,
  Eye,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { User } from '../../types';
import { CompanyLogo } from '../ui/company-logo';
import Swal from 'sweetalert2';

interface AppSidebarProps {
  currentUser: User;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const getNavigationItems = () => {
    const baseItems = [
      { title: 'Dashboard', url: '#dashboard', icon: LayoutDashboard },
      { title: 'Projects', url: '#projects', icon: FolderOpen },
    ];

    if (currentUser.role === 'admin') {
      return [
        ...baseItems,
        { title: 'Archives', url: '#archives', icon: Archive },
        { title: 'Tasks', url: '#tasks', icon: CheckSquare },
        { title: 'Users', url: '#users', icon: Users },
        { title: 'Revenue', url: '#revenue', icon: DollarSign },
        { title: 'Reports', url: '#reports', icon: BarChart3 },
        { title: 'Settings', url: '#settings', icon: Settings },
      ];
    }
    if (currentUser.role === 'supervisor') {
      return [
        ...baseItems,
        { title: 'Archives', url: '#archives', icon: Archive },
        { title: 'Tasks', url: '#tasks', icon: CheckSquare },
        { title: 'Team', url: '#team', icon: Users },
        { title: 'Reports', url: '#reports', icon: BarChart3 },
      ];
    }
    if (currentUser.role === 'fabricator') {
      return [
        ...baseItems,
        { title: 'Work Log', url: '#worklog', icon: Calendar },
        { title: 'Materials', url: '#materials', icon: Package },
        { title: 'Tasks', url: '#tasks', icon: CheckSquare },
      ];
    }
    if (currentUser.role === 'client') {
      return [
        { title: 'Dashboard', url: '#dashboard', icon: LayoutDashboard },
        { title: 'Project Status', url: '#project-status', icon: Eye },
        { title: 'Documentation', url: '#documentation', icon: Download },
      ];
    }
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleLogoutClick = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to log out of your account?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      focusCancel: true,
      allowOutsideClick: true,
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-content',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
        icon: 'swal-icon',
      },
    });

    if (result.isConfirmed) {
      await Swal.fire({
        title: 'Logging out...',
        text: 'Please wait a moment',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-content',
          icon: 'swal-icon',
        },
        didOpen: () => {
          Swal.showLoading();

          setTimeout(() => {
            onLogout();
            Swal.close();
          }, 2000);
        },
      });
    }
  };

  return (
    <aside
      className={`
        hidden md:block bg-card border-r border-border
        fixed top-0 left-0 z-30 h-screen
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="relative flex items-center justify-between px-4 pt-5 pb-4 border-b border-border">
        <div
          className={`transition-all duration-200 ${
            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}
        >
          <CompanyLogo size="md" showText={!isCollapsed} clickable={true} />
        </div>

        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 bg-background border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-sm"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex flex-col h-[calc(100vh-80px)]">
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.title}>
                <a
                  href={item.url}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                    hover:bg-accent hover:text-accent-foreground transition-colors
                    ${
                      window.location.hash === item.url
                        ? 'bg-accent/70 text-accent-foreground font-medium'
                        : 'text-muted-foreground'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.title : undefined}
                  onClick={(e) => {
                    if (item.url.startsWith('#')) {
                      e.preventDefault();
                      window.location.hash = item.url;
                    }
                  }}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-3 bg-muted/30 mt-auto mb-3">
          <button
            onClick={handleLogoutClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
              text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300
              transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}