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
  Activity, // <--- Added Activity Icon
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

  // Auto-logout activity tracking
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [alertShown, setAlertShown] = useState(false);
  const INACTIVITY_TIME = 300000; // 5 minds
  const COUNTDOWN_TIME = 180000; // 3 minutes countdown

  // Handle activity detection
  const handleActivity = () => {
    // If alert is already shown, don't reset it on activity detection
    if (alertShown) return;

    // Clear existing timeouts
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Reset countdown
    setCountdownSeconds(180);

    // Set new inactivity timeout
    inactivityTimeoutRef.current = setTimeout(() => {
      showInactivityWarning();
    }, INACTIVITY_TIME);
  };

  // Show inactivity warning
  const showInactivityWarning = () => {
    setAlertShown(true);
    setCountdownSeconds(180);

    Swal.fire({
      title: "Inactivity Warning",
      html: `<div>You will be logged out in <strong><span id="countdown">${countdownSeconds}</span></strong> due to inactivity.</div>`,
      icon: "warning",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      didOpen: () => {
        // Add hover listener to dismiss alert
        const swalPopup = document.querySelector(".swal2-popup");
        if (swalPopup) {
          const handlePopupHover = () => {
            // Clear all timers
            if (countdownIntervalRef.current)
              clearInterval(countdownIntervalRef.current);
            if (countdownTimeoutRef.current)
              clearTimeout(countdownTimeoutRef.current);
            // Close alert and reset
            Swal.close();
            setAlertShown(false);
            handleActivity();
          };
          swalPopup.addEventListener("mouseenter", handlePopupHover);
        }

        // Start countdown
        let seconds = 180;
        countdownIntervalRef.current = setInterval(() => {
          seconds--;
          const countdownElement = document.getElementById("countdown");
          if (countdownElement) {
            countdownElement.textContent = seconds.toString();
          }
          if (seconds <= 0) {
            if (countdownIntervalRef.current)
              clearInterval(countdownIntervalRef.current);
            Swal.close();
            setShowLogoutSpinner(true);
            setTimeout(() => {
              setShowLogoutSpinner(false);
              onLogout();
            }, 3000);
          }
        }, 1000);

        // Set timeout for final logout
        countdownTimeoutRef.current = setTimeout(() => {
          Swal.close();
          setShowLogoutSpinner(true);
          setTimeout(() => {
            setShowLogoutSpinner(false);
            onLogout();
          }, 3000);
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
        // User clicked Logout button
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current);
        if (countdownTimeoutRef.current)
          clearTimeout(countdownTimeoutRef.current);
        setShowLogoutSpinner(true);
        setTimeout(() => {
          setShowLogoutSpinner(false);
          onLogout();
        }, 3000);
      } else if (result.dismiss) {
        // User clicked Cancel button
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current);
        if (countdownTimeoutRef.current)
          clearTimeout(countdownTimeoutRef.current);
        setAlertShown(false);
        // Reset activity tracking
        handleActivity();
      }
    });
  };

  // Setup activity listeners
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

    // Initial timeout
    handleActivity();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimeoutRef.current)
        clearTimeout(inactivityTimeoutRef.current);
      if (countdownTimeoutRef.current)
        clearTimeout(countdownTimeoutRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [alertShown]);
  // Detect md (iPad) screen
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
      setOpen(false); // collapse sidebar on md
      setAutoCollapsed(true);
    } else if (autoCollapsed) {
      setOpen(true); // restore sidebar on desktop
      setAutoCollapsed(false);
    }
  }, [isMd, setOpen, autoCollapsed]);
  const isCollapsed = state === "collapsed" || isMd;
  const isCollapsedDesktop = isCollapsed && !isMobile;
  const menuLinkClassName = isCollapsedDesktop
    ? "flex items-center justify-center px-2 py-2"
    : "flex items-center gap-3 px-3 py-2.5";

  // SweetAlert logout confirmation
  const handleLogoutClick = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
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
      setShowLogoutSpinner(true);
      setTimeout(() => {
        setShowLogoutSpinner(false);
        onLogout();
      }, 3000); // 3s delay for spinner effect
    }
  };

  // Base navigation items for all users
  const navigationItems = useMemo(() => {
    const baseItems = [
      {
        title: "Dashboard",
        url: "#dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Projects",
        url: "#projects",
        icon: FolderOpen,
      },
    ];

    // Role-specific navigation items
    if (currentUser.role === "admin") {
      return [
        ...baseItems,
        {
          title: "Archives",
          url: "#archives",
          icon: Archive,
        },
        {
          title: "Tasks",
          url: "#tasks",
          icon: CheckSquare,
        },
        {
          title: "Users",
          url: "#users",
          icon: Users,
        },
        {
          title: "Revenue",
          url: "#revenue",
          icon: DollarSign,
        },
        {
          title: "Reports",
          url: "#reports",
          icon: BarChart3,
        },
        // --- ADDED ACTIVITY LOGS HERE ---
        {
          title: "Activity Logs",
          url: "#activity-logs",
          icon: Activity,
        },
        // -------------------------------
        {
          title: "Settings",
          url: "#settings",
          icon: Settings,
        },
      ];
    }

    if (currentUser.role === "supervisor") {
      return [
        ...baseItems,
        {
          title: "Archives",
          url: "#archives",
          icon: Archive,
        },
        {
          title: "Tasks",
          url: "#tasks",
          icon: CheckSquare,
        },
        {
          title: "Team",
          url: "#team",
          icon: Users,
        },
        {
          title: "Reports",
          url: "#reports",
          icon: BarChart3,
        },
      ];
    }

    if (currentUser.role === "fabricator") {
      return [
        ...baseItems,
        {
          title: "Work Log",
          url: "#worklog",
          icon: Calendar,
        },
        {
          title: "Materials",
          url: "#materials",
          icon: Package,
        },
        {
          title: "Tasks",
          url: "#tasks",
          icon: CheckSquare,
        },
      ];
    }

    if (currentUser.role === "client") {
      return [
        {
          title: "Dashboard",
          url: "#dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Project Status",
          url: "#project-status",
          icon: Eye,
        },
        {
          title: "Documentation",
          url: "#documentation",
          icon: Download,
        },
      ];
    }
    return baseItems;
  }, [currentUser.role]);

  useEffect(() => {
    const getHash = () =>
      window.location.hash || navigationItems[0]?.url || "#dashboard";
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
                          // Ensure hash updates even if default is prevented by wrappers
                          const href = item.url;
                          if (href.startsWith("#")) {
                            e.preventDefault();
                            window.location.hash = href;
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
                  className={`${
                    isCollapsedDesktop ? "sr-only" : ""
                  } text-destructive-foreground`}
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
