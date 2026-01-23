import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  DollarSign,
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
        popup: "swal-popup",
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
    ? "flex items-center justify-center px-2 py-2"
    : "flex items-center gap-3 px-3 py-2.5";

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

  const navigationItems = useMemo(() => {
    const baseItems = [
      { title: "Dashboard", url: "#dashboard", icon: LayoutDashboard },
      { title: "Projects", url: "#projects", icon: FolderOpen },
    ];

    if (currentUser.role === "admin") {
      return [
        ...baseItems,
        { title: "Archives", url: "#archives", icon: Archive },
        { title: "Tasks", url: "#tasks", icon: CheckSquare },
        { title: "Users", url: "#users", icon: Users },
        { title: "Revenue", url: "#revenue", icon: DollarSign },
        { title: "Reports", url: "#reports", icon: BarChart3 },
        { title: "Activity Logs", url: "#activity-logs", icon: Activity },
        { title: "Billing", url: "#billing", icon: CreditCard },
        { title: "Settings", url: "#settings", icon: Settings },
      ];
    }

    if (currentUser.role === "supervisor") {
      return [
        ...baseItems,
        { title: "Archives", url: "#archives", icon: Archive },
        { title: "Tasks", url: "#tasks", icon: CheckSquare },
        { title: "Team", url: "#team", icon: Users },
        { title: "Reports", url: "#reports", icon: BarChart3 },
      ];
    }

    if (currentUser.role === "fabricator") {
      return [
        ...baseItems,
        { title: "Work Log", url: "#worklog", icon: Calendar },
        { title: "Materials", url: "#materials", icon: Package },
        { title: "Tasks", url: "#tasks", icon: CheckSquare },
        { title: "Settings", url: "#settings", icon: BarChart3 },
      ];
    }

    if (currentUser.role === "client") {
      return [
        { title: "Dashboard", url: "#dashboard", icon: LayoutDashboard },
        { title: "Project Status", url: "#project-status", icon: Eye },
        { title: "Documentation", url: "#documentation", icon: Download },
      ];
    }

    return baseItems;
  }, [currentUser.role]);

  useEffect(() => {
    const getHash = () => window.location.hash || navigationItems[0]?.url || "#dashboard";
    const updateHash = () => setActiveHash(getHash());
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [navigationItems]);

  return (
    <>
      {showLogoutSpinner && <CustomLogoutSpinner />}

      <Sidebar className="border-r-0 h-screen min-h-screen" collapsible="icon">
        <SidebarContent className="gap-0 bg-sidebar no-scrollbar">
          <div className="border-b border-sidebar-border px-4 py-3">
            <CompanyLogo
              size={isCollapsedDesktop ? "sm" : "md"}
              showText={!isCollapsedDesktop}
              clickable={true}
              className={
                isCollapsedDesktop
                  ? "justify-center"
                  : "max-w-full [&_span]:!text-sidebar-foreground [&_span:last-child]:!text-sidebar-foreground/70"
              }
            />
          </div>

          <SidebarGroup className="py-2">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2 md:group-data-[collapsible=icon]:px-0">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeHash === item.url}
                      className="hover:bg-sidebar-accent rounded-lg transition-colors"
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
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className={isCollapsedDesktop ? "sr-only" : ""}>
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="pt-2 border-t border-sidebar-border px-4 py-5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogoutClick}
                className="h-10 rounded-lg bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90 active:bg-destructive active:text-destructive-foreground"
                tooltip={isCollapsedDesktop ? "Logout" : undefined}
              >
                <LogOut className="h-4 w-4 text-destructive-foreground" />
                <span
                  className={`${isCollapsedDesktop ? "sr-only" : ""} text-destructive-foreground`}
                >
                  Logout
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}