import React, { useState, useEffect, useRef, ChangeEvent } from "react";
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
  X,
} from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: number;
  user_name: string | null;
  user_role: string | null;
  action: string | null;
  description: string | null;
  ip_address: string | null;
  created_at: string | null;
}

const ITEMS_PER_PAGE = 5;

export function ActivityLogs() {
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

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const isFiltering = searchTerm.trim() !== "" || selectedAction !== "";

  const safeText = (value: unknown, fallback = "N/A"): string => {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  };

  const safeDate = (value: unknown): Date | null => {
    if (!value) return null;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateSafe = (
    value: unknown,
    pattern: string,
    fallback = "N/A",
  ): string => {
    const parsed = safeDate(value);
    if (!parsed) return fallback;
    return format(parsed, pattern);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const scrollTop = tableContainerRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
      }
    };
    const container = tableContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, selectedAction]);

  useEffect(() => {
    if (isFiltering) {
      setDisplayedLogs(filteredLogs);
      setPage(1);
      setHasMore(false);
    } else {
      setPage(1);
      setDisplayedLogs(filteredLogs.slice(0, ITEMS_PER_PAGE));
      setHasMore(filteredLogs.length > ITEMS_PER_PAGE);
    }
  }, [filteredLogs, isFiltering]);

  useEffect(() => {
    if (isFiltering) return;

    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setDisplayedLogs(filteredLogs.slice(start, end));
    setHasMore(end < filteredLogs.length);
  }, [page, filteredLogs, isFiltering]);

  useEffect(() => {
    if (
      isFiltering ||
      loading ||
      loadingMore ||
      !hasMore ||
      !loadMoreRef.current ||
      !tableContainerRef.current
    ) {
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setPage((prev) => prev + 1);
            setLoadingMore(false);
          }, 300);
        }
      },
      {
        root: tableContainerRef.current,
        rootMargin: "0px 0px 150px 0px",
        threshold: 0.1,
      },
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, filteredLogs.length, page, isFiltering]);

  const fetchLogs = async () => {
    try {
      const response = await apiService.getLogs();
      if (response.data) {
        setLogs(response.data);
        setFilteredLogs(response.data);
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
    tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = () => {
    const csv = [
      ["Timestamp", "User", "Role", "Action", "Description", "IP Address"],
      ...filteredLogs.map((log) => [
        formatDateSafe(log.created_at, "MMM d, yyyy h:mm a"),
        safeText(log.user_name),
        safeText(log.user_role),
        getActionLabel(log.action),
        safeText(log.description),
        safeText(log.ip_address),
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
  const getActionLabel = (action: string | null): string => {
    const normalized = safeText(action, "");
    if (!normalized) return "Unknown";
    const upper = normalized.toUpperCase();
    if (upper.includes("DEACTIVATE") || upper.includes("DELETE"))
      return "Delete";
    if (upper.includes("CREATE") || upper.includes("ADD")) return "Add";
    if (upper.includes("UPDATE") || upper.includes("EDIT")) return "Edit";
    if (upper.includes("LOGIN") || upper.includes("SIGN_IN")) return "Login";
    return normalized
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getActionColor = (action: string | null) => {
    const upper = safeText(action, "").toUpperCase();
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

  const getRoleIcon = (role: string | null) => {
    const r = safeText(role, "").toLowerCase().trim();
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
          safeText(log.user_name, "").toLowerCase().includes(term) ||
          safeText(log.user_role, "").toLowerCase().includes(term) ||
          actionLabel.includes(term) ||
          safeText(log.description, "").toLowerCase().includes(term) ||
          safeText(log.ip_address, "").toLowerCase().includes(term) ||
          formatDateSafe(log.created_at, "MMM d, yyyy h:mm a", "")
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

  const getUserInitials = (name: string | null): string => {
    const normalizedName = safeText(name, "");
    if (!normalizedName) return "?";
    return normalizedName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h2 className="text-xl font-bold sm:text-2xl">
            <Activity className="mr-2 mb-1 inline-block h-6 w-6 text-orange-400" />
            Activity Logs
          </h2>
          <p className="text-sm text-muted-foreground">
            Track and monitor all system activities
          </p>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d9e5f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#123a68] shadow-sm transition-colors hover:bg-[#f8fbff] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-[#e7edf4] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-[#edf2f7] px-6 py-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123a68] dark:text-white">
                Audit Trail
              </h3>
              <p className="mt-1 text-sm text-[#6b7b93] dark:text-slate-400">
                {filteredLogs.length > 0
                  ? `Showing ${displayedLogs.length} of ${filteredLogs.length} activities`
                  : "No activities found"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
              <div className="relative w-full xl:min-w-[360px]">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by User, Action, Or Description..."
                  className="w-full rounded-2xl border border-[#d9e5f2] bg-white py-2.5 pl-11 pr-4 text-sm text-[#123a68] shadow-sm outline-none transition-all placeholder:text-[#8da0b8] focus:border-orange-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-950"
                />
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8da0b8] dark:text-slate-500" />
              </div>

              <select
                value={selectedAction}
                onChange={handleActionChange}
                className="w-full rounded-2xl border border-[#d9e5f2] bg-white px-4 py-2.5 text-sm font-medium text-[#123a68] shadow-sm outline-none transition-all hover:border-[#bfd3ea] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-950 sm:w-auto"
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export
              </button>

              {/* Export Modal */}
              {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-2 sm:p-4">
                  <div className="modal w-full max-w-md overflow-hidden rounded-[1.5rem] border border-[#e7edf4] bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-[#edf2f7] p-6 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2.5 text-lg font-semibold text-[#123a68] dark:text-white">
                          <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Export Activity Logs
                        </h3>
                        <button
                          className="rounded-full p-1.5 text-gray-500 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          onClick={() => setShowExportModal(false)}
                          aria-label="Close"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to export the currently displayed
                        activity logs?
                      </p>
                    </div>
                    <div className="flex flex-col justify-end gap-3 p-6 sm:flex-row">
                      <button
                        className="rounded-2xl border border-[#d9e5f2] bg-white px-4 py-2.5 font-semibold text-[#123a68] transition-colors hover:bg-[#f8fbff] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setShowExportModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded-2xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
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
          <p className="mt-4 flex items-center gap-1.5 text-xs text-[#7c8ca3] dark:text-slate-500">
            <span className="inline-block h-1 w-1 rounded-full bg-orange-500"></span>
            Search across all fields: user name, role, action type, description,
            IP address, and timestamps
          </p>
        </div>

        <div className="bg-white p-6 dark:bg-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 dark:text-gray-400">
              <div className="relative mb-4 rounded-full bg-blue-50 p-4 dark:bg-blue-950/40">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
              <p className="text-lg font-medium text-[#123a68] dark:text-white">
                Loading activity history...
              </p>
              <p className="text-sm mt-2">Please wait</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-red-600 dark:text-red-400">
              <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium dark:text-white">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              >
                Try Again
              </button>
            </div>
          ) : displayedLogs.length === 0 && page === 1 ? (
            <div className="py-24 text-center text-gray-500 dark:text-gray-400">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Activity className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-lg font-medium text-[#123a68] dark:text-white">
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
                ref={tableContainerRef}
                className="relative max-h-[calc(100vh-320px)] overflow-auto border border-[#edf2f7] bg-[#fbfdff] scroll-smooth dark:border-slate-800 dark:bg-slate-950"
              >
                <table className="min-w-full divide-y divide-[#edf2f7] dark:divide-slate-800">
                  <thead className="sticky top-0 z-10 bg-[#123a68]">
                    <tr>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-white"
                      >
                        Timestamp
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-white"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-white"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-white"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-white"
                      >
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f7] dark:divide-slate-800">
                    {displayedLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-[#f7fbff] dark:hover:bg-slate-900"
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-[#123a68] dark:text-white">
                              {formatDateSafe(log.created_at, "MMM d, yyyy")}
                            </div>
                            <div className="mt-1 text-xs text-[#7b8ca4] dark:text-slate-400">
                              {formatDateSafe(log.created_at, "h:mm a")}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-shrink-0">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-[#123a68] text-xs font-bold text-white">
                                {getUserInitials(log.user_name)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[#123a68] dark:text-white">
                                {safeText(log.user_name)}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-xs capitalize text-[#6b7b93] dark:text-slate-400">
                                {getRoleIcon(log.user_role)}
                                <span>{safeText(log.user_role)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold ${getActionColor(log.action)}`}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#5f728d] dark:text-slate-400">
                          <div
                            className="line-clamp-2 max-w-xs leading-6"
                            title={safeText(log.description)}
                          >
                            {safeText(log.description)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-sm text-[#5f728d] dark:text-slate-400">
                          {safeText(log.ip_address)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Load more trigger — only shown when NOT filtering */}
                {!isFiltering && hasMore && (
                  <div
                    ref={loadMoreRef}
                    className="py-10 flex justify-center items-center min-h-[80px]"
                  >
                    {loadingMore ? (
                      <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span>Loading more activities...</span>
                      </div>
                    ) : (
                      <div className="h-10" />
                    )}
                  </div>
                )}

                {!isFiltering && !hasMore && displayedLogs.length > 0 && (
                  <div className="py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="inline-block rounded-2xl bg-gray-100 px-4 py-2 dark:bg-slate-800">
                      You've reached the end
                    </span>
                  </div>
                )}

                {/* Optional message when filtering */}
                {isFiltering && filteredLogs.length > 0 && (
                  <div className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Showing all {filteredLogs.length} matching activities
                  </div>
                )}

                {showScrollTop && (
                  <button
                    onClick={scrollToTop}
                    className="sticky bottom-5 ml-auto mr-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl dark:from-blue-700 dark:to-blue-800"
                    aria-label="Scroll to top"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
