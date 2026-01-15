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

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch all logs once on mount
  useEffect(() => {
    fetchLogs();
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
      { threshold: 0.1, rootMargin: "0px 0px 100px 0px" }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, filteredLogs.length]); // ← important: depend on length too

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

  const getActionLabel = (action: string): string => {
    const upper = action.toUpperCase();
    if (upper.includes("DEACTIVATE") || upper.includes("DELETE")) return "Deactivate";
    if (upper.includes("CREATE") || upper.includes("ADD")) return "Create";
    if (upper.includes("UPDATE") || upper.includes("EDIT")) return "Update";
    if (upper.includes("LOGIN") || upper.includes("SIGN_IN")) return "Login";

    return action
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getActionColor = (action: string) => {
    const upper = action.toUpperCase();
    if (upper.includes("DELETE") || upper.includes("DEACTIVATE")) {
      return "bg-red-100 text-red-800 border-red-300";
    }
    if (upper.includes("CREATE") || upper.includes("ADD")) {
      return "bg-blue-100 text-blue-800 border-blue-300";
    }
    if (upper.includes("LOGIN") || upper.includes("SIGN_IN")) {
      return "bg-gray-100 text-gray-800 border-gray-300";
    }
    if (upper.includes("UPDATE") || upper.includes("EDIT")) {
      return "bg-amber-100 text-amber-800 border-amber-300";
    }
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase().trim();
    if (r.includes("admin")) return <Shield className="h-3.5 w-3.5 text-indigo-600" />;
    if (r.includes("supervisor") || r.includes("moderator"))
      return <UserCheck className="h-3.5 w-3.5 text-emerald-600" />;
    if (r.includes("manager") || r.includes("lead"))
      return <UserCog className="h-3.5 w-3.5 text-purple-600" />;
    if (r === "user" || r === "member" || r.includes("regular"))
      return <User className="h-3.5 w-3.5 text-blue-600" />;
    if (r.includes("guest") || r.includes("visitor"))
      return <HelpCircle className="h-3.5 w-3.5 text-gray-500" />;
    return <Crown className="h-3.5 w-3.5 text-amber-600" />;
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
          format(new Date(log.created_at), "MMM d, yyyy h:mm a").toLowerCase().includes(term)
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

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="flex items-center gap-3">
        <Activity className="h-7 w-7 text-blue-600" />
        <h2 className="text-2xl font-bold tracking-tight">System Activity Logs</h2>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Audit Trail</h3>
            <p className="mt-1 text-sm text-gray-500">
              Monitor all user actions within the system.
            </p>
          </div>
          <div>
            <select
              value={selectedAction}
              onChange={handleActionChange}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-w-[180px] cursor-pointer"
            >
              <option value="">All Activities</option>
              <option value="login">Login</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="deactivate">Deactivate</option>
            </select>
          </div>
        </div>

        <div className="border-b px-6 py-4">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search activity logs..."
              className="w-full rounded-md border border-gray-300 bg-white pl-10 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e28a33] pointer-events-none" />
          </div>
          <p className="mt-1 text-sm text-gray-500 p-2">
            <span className="font-semibold text-[#e28a33]">Note: </span>
            You can search by action, user, details, or date & time.
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="text-lg">Loading activity history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-600">
              <AlertTriangle className="h-10 w-10 mb-4" />
              <p className="text-lg">{error}</p>
            </div>
          ) : displayedLogs.length === 0 && page === 1 ? (
            <div className="py-16 text-center text-gray-500">
              <p className="text-lg">
                {searchTerm || selectedAction
                  ? "No matching activity logs found."
                  : "No activity logs found."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        Timestamp
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-right text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {displayedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-700">
                              {format(new Date(log.created_at), "MMM d, yyyy")}
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              {format(new Date(log.created_at), "h:mm a")}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-700">{log.user_name}</div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600 capitalize">
                            {getRoleIcon(log.user_role)}
                            <span>{log.user_role}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getActionColor(
                              log.action
                            )}`}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xl">
                          <div className="line-clamp-2" title={log.description}>
                            {log.description}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-mono text-gray-500">
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
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  ) : (
                    <div className="h-12" /> // trigger area
                  )}
                </div>
              )}

              {!hasMore && displayedLogs.length > 0 && (
                <div className="py-6 text-center text-sm text-gray-500">
                  End of results
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}