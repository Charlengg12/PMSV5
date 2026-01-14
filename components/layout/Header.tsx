import { Badge } from "../ui/badge";
import { Shield, Crown, Wrench, User as UserIcon } from "lucide-react";
import { User } from "../../types";
import { ThemeToggle } from "../ui/theme-toggle";
import { SidebarTrigger } from "../ui/sidebar";

interface HeaderProps {
  currentUser: User;
  currentTheme: "light" | "dark" | "auto";
  onThemeChange: (theme: "light" | "dark" | "auto") => void;
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
  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case "supervisor":
        return <Shield className="h-4 w-4" />;
      case "fabricator":
        return <Wrench className="h-4 w-4" />;
      case "client":
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
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
      <header className="sticky top-0 z-20 flex items-center justify-between px-3 md:px-6 py-4 bg-card border-b shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            isTransitioning={isTransitioning}
            buttonSize="lg"
            buttonClassName="h-12 w-12"
          />

          <div className="flex h-12 items-center gap-3 px-3 md:px-4 bg-background border border-input rounded-lg max-w-[220px] md:max-w-none">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted text-primary">
              {getRoleIcon()}
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <div className="flex items-center gap-2">
                <p className="text-xs md:text-sm font-medium truncate">
                  {currentUser.name}
                </p>
                <div className="scale-75 md:scale-100">{getRoleBadge()}</div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}