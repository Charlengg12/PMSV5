import { useState, useEffect } from "react";
// Adjust this import path if needed based on your folder structure
import { apiService } from "../../utils/apiService"; 
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Activity, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

// Define the shape of a log entry
interface LogEntry {
  id: number;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // We will add this helper to apiService in a moment
      const response = await apiService.getLogs();
      if (response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
      setError("Failed to load activity history.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to color-code actions
  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("DELETE") || act.includes("DEACTIVATE")) return "destructive"; // Red
    if (act.includes("CREATE") || act.includes("ADD")) return "default"; // Black/Primary
    if (act.includes("LOGIN")) return "secondary"; // Gray
    if (act.includes("UPDATE") || act.includes("EDIT")) return "outline"; // White/Border
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">System Activity Logs</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor all user actions within the system.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading activity history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p>{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[180px]">User</TableHead>
                    <TableHead className="w-[140px]">Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px] text-right">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {/* Ensure you have date-fns installed: npm install date-fns */}
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.user_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {log.user_role}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="line-clamp-2" title={log.description}>
                          {log.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-muted-foreground">
                        {log.ip_address}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}