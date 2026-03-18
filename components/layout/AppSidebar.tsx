import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  Package,
  BarChart3,
  Settings,
  Calendar,
  PhilippinePeso,
  Archive,
  Eye,
  Download,
  LogOut,
  Activity,
  CreditCard,
} from "lucide-react";
import { User } from "../../types";
import { useSidebar } from "../ui/sidebar";
import Swal from "sweetalert2";
import { useEffect, useMemo, useState, useRef } from "react";
import { CustomLogoutSpinner } from "../ui/CustomLogoutSpinner";
import { CompanyLogo } from "../ui/company-logo";

interface AppSidebarProps {
  currentUser: User;
  onLogout: () => void;
}

export function AppSidebar({ currentUser, onLogout }: AppSidebarProps) {
  const { isMobile, setOpenMobile, state, setOpen } = useSidebar();
  const [showLogoutSpinner, setShowLogoutSpinner] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [isMd, setIsMd] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);

  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [alertShown, setAlertShown] = useState(false);

  const INACTIVITY_TIME = 300000;
  const COUNTDOWN_TIME = 180000;

  const handleActivity = () => {
    if (alertShown) return;

    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setCountdownSeconds(180);

    inactivityTimeoutRef.current = setTimeout(() => {
      showInactivityWarning();
    }, INACTIVITY_TIME);
  };

  const showInactivityWarning = () => {
    setAlertShown(true);
    setCountdownSeconds(180);

    Swal.fire({
      title: "Inactivity Warning",
      html: `You will be logged out in <strong><span id="countdown">${countdownSeconds}</span></strong> seconds due to inactivity.`,
      icon: "warning",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "Logout Now",
      cancelButtonText: "Stay Logged In",
      didOpen: () => {
        const swalPopup = document.querySelector(".swal2-popup");
        if (swalPopup) {
          const handlePopupHover = () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
            Swal.close();
            setAlertShown(false);
            handleActivity();
          };
          swalPopup.addEventListener("mouseenter", handlePopupHover);
        }

        let seconds = 180;
        countdownIntervalRef.current = setInterval(() => {
          seconds--;
          const countdownElement = document.getElementById("countdown");
          if (countdownElement) countdownElement.textContent = seconds.toString();

          if (seconds <= 0) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            Swal.close();
            performLogout();
          }
        }, 1000);

        countdownTimeoutRef.current = setTimeout(() => {
          Swal.close();
          performLogout();
        }, COUNTDOWN_TIME);
      },
      customClass: {
        container: "swal-container",
        popup: "swal-popup swal-actions-right",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
        icon: "swal-icon",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
        performLogout();
      } else if (result.dismiss) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
        setAlertShown(false);
        handleActivity();
      }
    });
  };

  const performLogout = async () => {
    setShowLogoutSpinner(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("authToken");

      setTimeout(() => {
        setShowLogoutSpinner(false);
        onLogout();
        window.location.href = "/";
      }, 1500);
    }
  };

  useEffect(() => {
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    handleActivity();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [alertShown]);

  useEffect(() => {
    const checkMd = () => {
      const width = window.innerWidth;
      setIsMd(width >= 768 && width < 1024);
    };
    checkMd();
    window.addEventListener("resize", checkMd);
    return () => window.removeEventListener("resize", checkMd);
  }, []);

  useEffect(() => {
    if (isMd) {
      setOpen(false);
      setAutoCollapsed(true);
    } else if (autoCollapsed) {
      setOpen(true);
      setAutoCollapsed(false);
    }
  }, [isMd, setOpen, autoCollapsed]);

  const isCollapsed = state === "collapsed" || isMd;
  const isCollapsedDesktop = isCollapsed && !isMobile;
  const menuLinkClassName = isCollapsedDesktop
    ? "flex items-center justify-center p-5"
    : "flex items-center gap-3 p-5";

  const handleLogoutClick = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      focusCancel: true,
      customClass: {
        container: "swal-container",
        popup: "swal-popup",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
        icon: "swal-icon",
      },
    });

    if (result.isConfirmed) {
      performLogout();
    }
  };

  const navigationGroups = useMemo(() => {
    const homeGroup = {
      title: "Home",
      items: [
        { title: "Dashboard", url: "#dashboard", icon: LayoutDashboard },
      ],
    };

    if (currentUser.role === "admin") {
      return [
        homeGroup,
        {
          title: "Management",
          items: [
            { title: "Projects", url: "#projects", icon: FolderOpen },
            { title: "Archives", url: "#archives", icon: Archive },
            { title: "Tasks", url: "#tasks", icon: CheckSquare },
            { title: "Users", url: "#users", icon: Users },
          ],
        },
        {
          title: "Finance",
          items: [
            { title: "Revenue", url: "#revenue", icon: PhilippinePeso },
            { title: "Billing", url: "#billing", icon: CreditCard },
            { title: "Reports", url: "#reports", icon: BarChart3 },
          ],
        },
        {
          title: "System",
          items: [
            { title: "Activity Logs", url: "#activity-logs", icon: Activity },
            { title: "Settings", url: "#settings", icon: Settings },
          ],
        },
      ];
    }

    if (currentUser.role === "supervisor") {
      return [
        homeGroup,
        {
          title: "Management",
          items: [
            { title: "Projects", url: "#projects", icon: FolderOpen },
            { title: "Archives", url: "#archives", icon: Archive },
            { title: "Tasks", url: "#tasks", icon: CheckSquare },
            { title: "Team", url: "#team", icon: Users },
          ],
        },
        {
          title: "Insights",
          items: [
            { title: "Reports", url: "#reports", icon: BarChart3 },
          ],
        },
      ];
    }

    if (currentUser.role === "fabricator") {
      return [
        homeGroup,
        {
          title: "Workspace",
          items: [
            { title: "Projects", url: "#projects", icon: FolderOpen },
            { title: "Tasks", url: "#tasks", icon: CheckSquare },
            { title: "Work Log", url: "#worklog", icon: Calendar },
            { title: "Materials", url: "#materials", icon: Package },
          ],
        },
        {
          title: "Preferences",
          items: [{ title: "Settings", url: "#settings", icon: Settings }],
        },
      ];
    }

    if (currentUser.role === "client") {
      return [
        homeGroup,
        {
          title: "Project",
          items: [
            { title: "Project Status", url: "#project-status", icon: Eye },
            {
              title: "Documentation",
              url: "#documentation",
              icon: Download,
            },
          ],
        },
      ];
    }

    return [
      homeGroup,
      {
        title: "Management",
        items: [{ title: "Projects", url: "#projects", icon: FolderOpen }],
      },
    ];
  }, [currentUser.role]);

  useEffect(() => {
    const getHash = () =>
      window.location.hash || navigationGroups[0]?.items[0]?.url || "#dashboard";
    const updateHash = () => setActiveHash(getHash());
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [navigationGroups]);

  useEffect(() => {
    if (!activeHash) return;
    const raf = window.requestAnimationFrame(() => {
      const content = document.querySelector('[data-sidebar="content"]');
      if (!content) return;
      const activeItem = content.querySelector(
        '[data-active="true"]'
      ) as HTMLElement | null;
      if (!activeItem) return;

      const contentRect = content.getBoundingClientRect();
      const activeRect = activeItem.getBoundingClientRect();
      const isAbove = activeRect.top < contentRect.top;
      const isBelow = activeRect.bottom > contentRect.bottom;

      if (isAbove || isBelow) {
        activeItem.scrollIntoView({ block: "center", inline: "nearest" });
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [activeHash, navigationGroups]);

  return (
    <>
      {showLogoutSpinner && <CustomLogoutSpinner />}

      <Sidebar
        className="h-screen min-h-screen border-r-0 border-[#1a4572] bg-[#103054] text-white dark:border-slate-800 dark:bg-[#0f1729] dark:text-white [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-[#1a4572] [&_[data-sidebar=sidebar]]:bg-[#103054] [&_[data-sidebar=sidebar]]:text-white dark:[&_[data-sidebar=sidebar]]:border-slate-800 dark:[&_[data-sidebar=sidebar]]:bg-[#0f1729] dark:[&_[data-sidebar=sidebar]]:text-white"
        collapsible="icon"
      >
        <SidebarHeader className="flex h-[73px] shrink-0 items-center border-b border-[#1a4572] px-4 dark:border-slate-800 sm:h-[81px]">
          <CompanyLogo
            size={isCollapsedDesktop ? "sm" : "md"}
            showText={!isCollapsedDesktop}
            clickable={true}
            className={
              isCollapsedDesktop
                ? "justify-center"
                : "max-w-full [&_span:first-child]:!text-white [&_span:last-child]:!text-white/70 dark:[&_span:first-child]:!text-white dark:[&_span:last-child]:!text-white/70"
            }
          />
        </SidebarHeader>

        <SidebarContent className="gap-0 overflow-y-auto overflow-x-hidden bg-transparent no-scrollbar dark:bg-transparent">
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.title} className="px-3 py-4">
              <SidebarGroupLabel className="mb-2 h-auto px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60 group-data-[collapsible=icon]:hidden">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5 md:group-data-[collapsible=icon]:px-0">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={activeHash === item.url}
                        className="app-sidebar-link rounded-lg border border-transparent bg-transparent p-0 text-white shadow-none ring-0 transition-all duration-200 hover:bg-white/10 hover:text-white dark:text-white dark:hover:bg-white/5 dark:hover:text-white data-[active=true]:ring-0"
                        tooltip={isCollapsedDesktop ? item.title : undefined}
                      >
                        <a
                          href={item.url}
                          className={menuLinkClassName}
                          onClick={(e) => {
                            if (item.url.startsWith("#")) {
                              e.preventDefault();
                              window.location.hash = item.url;
                            }
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-current">
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                          </span>
                          <span
                            className={`${isCollapsedDesktop ? "sr-only" : ""} font-normal`}
                          >
                            {item.title}
                          </span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-[#1a4572] px-3 py-4 dark:border-slate-800">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogoutClick}
                className="h-auto rounded-2xl border border-[#f0d6d6] bg-[#fff7f7] p-0 text-[#b94b4b] shadow-none transition-colors hover:bg-[#ffecec] hover:text-[#a33a3a] active:bg-[#ffe3e3] dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50 dark:hover:text-red-200 dark:active:bg-red-950/60"
                tooltip={isCollapsedDesktop ? "Logout" : undefined}
              >
                <div
                  className={
                    isCollapsedDesktop
                      ? "flex items-center justify-center p-3"
                      : "flex items-center gap-3 px-4 py-3"
                  }
                >
                  <span className="flex flex-shrink-0 items-center justify-center rounded-xl text-current shadow-[0_1px_2px_rgba(185,75,75,0.08)] dark:bg-slate-900">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span className={`${isCollapsedDesktop ? "sr-only" : ""} font-normal`}>
                    Logout
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
