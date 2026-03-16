import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import { User } from "../../types";
import { SidebarTrigger } from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
  const getUserInitials = () => {
    return currentUser.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";
  };

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case "admin":
        return "Administrator";
      case "supervisor":
        return "Supervisor";
      case "fabricator":
        return "Fabricator";
      case "client":
        return "Client";
      default:
        return "User";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-card border-b shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-h-12 items-center gap-3 bg-white px-3 py-2 transition-colors hover:bg-[#f8fbff] dark:bg-slate-900 dark:hover:bg-slate-800">
                <div className="relative shrink-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#f7fbff] text-[#123a68] dark:bg-slate-800 dark:text-slate-100">
                    <span className="text-xs font-bold">{getUserInitials()}</span>
                  </div>
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full border border-white bg-emerald-500 dark:border-slate-900" />
                </div>

                <div className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
                  <p className="max-w-[140px] truncate text-sm font-semibold text-[#111827] dark:text-white">
                    {currentUser.name}
                  </p>
                  <p className="max-w-[140px] truncate text-xs text-[#6b7280] dark:text-slate-400">
                    {getRoleLabel()}
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-[#6b7280] dark:text-slate-400 sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-[280px] bg-white p-0 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3 border-b border-[#edf2f7] px-4 py-4 dark:border-slate-800">
                <div className="relative shrink-0">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#f7fbff] text-[#123a68] dark:bg-slate-800 dark:text-slate-100">
                    <span className="text-sm font-bold">{getUserInitials()}</span>
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111827] dark:text-white">
                    {currentUser.name}
                  </p>
                  <p className="truncate text-xs text-[#6b7280] dark:text-slate-400">
                    {getRoleLabel()}
                  </p>
                </div>
              </div>

              <DropdownMenuLabel className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8ca4] dark:text-slate-500">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={currentTheme}
                onValueChange={(value) =>
                  onThemeChange(value as "light" | "dark" | "auto")
                }
              >
                <DropdownMenuRadioItem
                  value="light"
                  className="mx-2 mb-1 rounded-xl px-3 py-2 text-sm font-medium text-[#123a68] dark:text-slate-200"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="dark"
                  className="mx-2 mb-1 rounded-xl px-3 py-2 text-sm font-medium text-[#123a68] dark:text-slate-200"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="auto"
                  className="mx-2 mb-2 rounded-xl px-3 py-2 text-sm font-medium text-[#123a68] dark:text-slate-200"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Auto
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              {isTransitioning && (
                <>
                  <DropdownMenuSeparator className="bg-[#edf2f7] dark:bg-slate-800" />
                  <DropdownMenuItem
                    disabled
                    className="mx-2 my-2 rounded-xl px-3 py-2 text-xs text-[#7b8ca4] dark:text-slate-500"
                  >
                    Applying theme...
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
