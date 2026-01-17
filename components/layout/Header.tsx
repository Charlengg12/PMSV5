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
  // Updated to include responsive classes compatible with the container
  const getRoleIcon = () => {
    const iconClass = "h-4 w-4 sm:h-5 sm:w-5"; // Defined sizing here for consistency

    switch (currentUser.role) {
      case "admin":
        return <Crown className={iconClass} />;
      case "supervisor":
        return <Shield className={iconClass} />;
      case "fabricator":
        return <Wrench className={iconClass} />;
      case "client":
        return <UserIcon className={iconClass} />;
      default:
        return <UserIcon className={iconClass} />;
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case "admin":
        return (
          <Badge className="bg-accent text-accent-foreground hover:bg-accent/80">
            Admin
          </Badge>
        );
      case "supervisor":
        return (
          <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
            Supervisor
          </Badge>
        );
      case "fabricator":
        return (
          <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Fabricator
          </Badge>
        );
      case "client":
        return (
          <Badge
            variant="outline"
            // Fixed: Added dark mode classes to ensure text/border turn white/light
            className="border-primary text-primary dark:text-foreground dark:border-foreground"
          >
            Client
          </Badge>
        );
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-card border-b shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <ThemeToggle
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            isTransitioning={isTransitioning}
            buttonSize="lg"
            buttonClassName="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12"
          />

          {/* User Profile Container */}
          <div className="flex h-10 sm:h-11 md:h-12 items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 bg-background border border-border rounded-lg">
            {/* Icon Container: Dynamic based on role */}
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-md bg-muted text-foreground shrink-0">
              {getRoleIcon()}
            </div>

            {/* Name and badge only visible on sm and up */}
            <div className="hidden sm:flex min-w-0 flex-col leading-tight">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Added text-foreground to ensure visibility in dark mode */}
                <p className="text-xs md:text-sm font-medium text-foreground truncate max-w-[80px] sm:max-w-[100px] md:max-w-[120px]">
                  {currentUser.name}
                </p>
                <div className="scale-75 sm:scale-90 md:scale-100 shrink-0 origin-left">
                  {getRoleBadge()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
