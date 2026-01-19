import { useState, useEffect, useRef, ChangeEvent } from "react";
import { apiService } from "../../utils/apiService";
import {
  Activity,
  Loader2,
  AlertTriangle,
  Search,
  Shield,
  UserCheck,
  User,
  UserCog,
  Crown,
  HelpCircle,
  RefreshCw,
  Download,
  ChevronUp,
  Plus,
  Edit3,
  Trash2,
  LogIn,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: number;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 5;

export function ActivityLogs() {
  // Export confirmation modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch all logs once on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  // Scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
        if (scrollTop > 0) {
          setHasUserScrolled(true);
        }
      }
    };
    const ref = contentRef.current;
    ref?.addEventListener("scroll", handleScroll);
    return () => ref?.removeEventListener("scroll", handleScroll);
  }, []);

  // Re-apply filters whenever source data or filter inputs change
  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, selectedAction]);

  // When filteredLogs changes → reset pagination state
  useEffect(() => {
    setPage(1);
    setDisplayedLogs([]);
    setHasMore(true);
  }, [filteredLogs]);

  // Whenever page or filteredLogs changes → slice the correct portion
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setDisplayedLogs(filteredLogs.slice(start, end));
    setHasMore(end < filteredLogs.length);
  }, [page, filteredLogs]);

  // Infinite scroll observer
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (loading || loadingMore || !hasMore || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          // Small delay gives smoother feel & prevents double triggers
          setTimeout(() => {
            setPage((prev) => prev + 1);
            setLoadingMore(false);
          }, 400);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 100px 0px" },
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, filteredLogs.length, hasUserScrolled]); // ← important: depend on length too

  const fetchLogs = async () => {
    try {
      const response = await apiService.getLogs();
      if (response.data) {
        setLogs(response.data);
        setFilteredLogs(response.data); // initial sync
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
      setError("Failed to load activity history.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchLogs();
  };

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show modal instead of exporting immediately
  const handleExport = () => {
    setShowExportModal(true);
  };

  // Actual export logic
  const confirmExport = () => {
    const csv = [
      ["Timestamp", "User", "Role", "Action", "Description", "IP Address"],
      ...filteredLogs.map((log) => [
        format(new Date(log.created_at), "MMM d, yyyy h:mm a"),
        log.user_name,
        log.user_role,
        getActionLabel(log.action),
        log.description,
        log.ip_address,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    setShowExportModal(false);
  };

  const getActionLabel = (action: string): string => {
    const upper = action.toUpperCase();
    if (upper.includes("DEACTIVATE") || upper.includes("DELETE"))
      return "Delete";
    if (upper.includes("CREATE") || upper.includes("ADD")) return "Add";
    if (upper.includes("UPDATE") || upper.includes("EDIT")) return "Edit";
    if (upper.includes("LOGIN") || upper.includes("SIGN_IN")) return "Login";

    return action
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getActionColor = (action: string) => {
    const upper = action.toUpperCase();
    if (upper.includes("DELETE") || upper.includes("DEACTIVATE")) {
      return "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950 dark:text-red-200 text-red-800";
    }
    if (upper.includes("CREATE") || upper.includes("ADD")) {
      return "border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-200 text-emerald-800";
    }
    if (upper.includes("LOGIN") || upper.includes("SIGN_IN")) {
      return "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950 dark:text-blue-200 text-blue-800";
    }
    if (upper.includes("UPDATE") || upper.includes("EDIT")) {
      return "border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950 dark:text-amber-200 text-amber-800";
    }
    return "border-l-4 border-l-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-200 text-gray-800";
  };

  const getActionIcon = (action: string) => {
    const upper = action.toUpperCase();
    if (upper.includes("DELETE") || upper.includes("DEACTIVATE"))
      return <Trash2 className="h-3 w-3" />;
    if (upper.includes("CREATE") || upper.includes("ADD"))
      return <Plus className="h-3 w-3" />;
    if (upper.includes("LOGIN") || upper.includes("SIGN_IN"))
      return <LogIn className="h-3 w-3" />;
    if (upper.includes("UPDATE") || upper.includes("EDIT"))
      return <Edit3 className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase().trim();
    if (r.includes("admin"))
      return (
        <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
      );
    if (r.includes("supervisor") || r.includes("moderator"))
      return (
        <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      );
    if (r.includes("manager") || r.includes("lead"))
      return (
        <UserCog className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
      );
    if (r === "user" || r === "member" || r.includes("regular"))
      return <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
    if (r.includes("guest") || r.includes("visitor"))
      return (
        <HelpCircle className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
      );
    return <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
  };

  const applyFilters = () => {
    let result = [...logs];

    if (selectedAction) {
      result = result.filter((log) => {
        const label = getActionLabel(log.action).toLowerCase();
        return label === selectedAction.toLowerCase();
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((log) => {
        const actionLabel = getActionLabel(log.action).toLowerCase();
        return (
          log.user_name.toLowerCase().includes(term) ||
          log.user_role.toLowerCase().includes(term) ||
          actionLabel.includes(term) ||
          log.description.toLowerCase().includes(term) ||
          log.ip_address.toLowerCase().includes(term) ||
          format(new Date(log.created_at), "MMM d, yyyy h:mm a")
            .toLowerCase()
            .includes(term)
        );
      });
    }

    setFilteredLogs(result);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleActionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedAction(e.target.value);
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-20"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-3">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Activity Logs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track and monitor all system activities
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {/* Filters & Actions Bar */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Audit Trail
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {filteredLogs.length > 0
                  ? `Showing ${displayedLogs.length} of ${filteredLogs.length} activities`
                  : "No activities found"}
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedAction}
                onChange={handleActionChange}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none cursor-pointer"
              >
                <option value="">All Activities</option>
                <option value="add">Add</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
              </select>
              <button
                onClick={handleExport}
                disabled={displayedLogs.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              {/* Export Confirmation Modal */}
              {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-2 sm:p-4">
                  <div className="modal bg-white dark:bg-gray-800 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl w-full max-w-md sm:max-w-md max-w-xs sm:w-full overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2.5">
                          <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Export Activity Logs
                        </h3>
                        <button
                          className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full p-1.5 transition-colors"
                          onClick={() => setShowExportModal(false)}
                          aria-label="Close"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                        Are you sure you want to export the currently displayed
                        activity logs?
                      </p>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                      <button
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => setShowExportModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors font-semibold"
                        onClick={confirmExport}
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-800">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by user, action, or description..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-blue-500"></span>
            Search across all fields: user name, role, action type, description,
            IP address, and timestamps
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-white dark:bg-gray-800">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
              <div className="relative mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
              <p className="text-lg font-medium dark:text-white">
                Loading activity history...
              </p>
              <p className="text-sm mt-2">Please wait</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-600 dark:text-red-400">
              <div className="bg-red-100 dark:bg-red-900 rounded-full p-4 mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium dark:text-white">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : displayedLogs.length === 0 && page === 1 ? (
            <div className="py-20 text-center text-gray-500 dark:text-gray-400">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-lg font-medium dark:text-white">
                {searchTerm || selectedAction
                  ? "No matching activities found"
                  : "No activity logs found"}
              </p>
              <p className="text-sm mt-2">
                {searchTerm || selectedAction
                  ? "Try adjusting your filters"
                  : "Activities will appear here"}
              </p>
            </div>
          ) : (
            <>
              <div
                ref={contentRef}
                className="max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-auto"
              >
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="sticky top-0 z-10 bg-white dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold text-white dark:text-gray-300 uppercase tracking-wider"
                      >
                        Timestamp
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold text-white dark:text-gray-300 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold text-white dark:text-gray-300 uppercase tracking-wider"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold text-white dark:text-gray-300 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-right text-xs font-semibold text-white dark:text-gray-300 uppercase tracking-wider"
                      >
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {displayedLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {format(new Date(log.created_at), "MMM d, yyyy")}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(log.created_at), "h:mm a")}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold">
                                {getUserInitials(log.user_name)}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {log.user_name}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 capitalize">
                                {getRoleIcon(log.user_role)}
                                <span>{log.user_role}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <span
                            className={`inline-flex items-center border-l-4 px-3 py-1 text-xs font-medium ${getActionColor(
                              log.action,
                            )}`}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div
                            className="line-clamp-2 max-w-xs"
                            title={log.description}
                          >
                            {log.description}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-mono text-gray-600 dark:text-gray-400">
                          {log.ip_address}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div ref={loadMoreRef} className="py-10 flex justify-center">
                  {loadingMore ? (
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span>Loading more activities...</span>
                    </div>
                  ) : (
                    <div className="h-12" /> // trigger area
                  )}
                </div>
              )}

              {!hasMore && displayedLogs.length > 0 && (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <span className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    You've reached the end
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-full p-3 shadow-lg hover:shadow-xl hover:scale-110 transition-all z-50"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
