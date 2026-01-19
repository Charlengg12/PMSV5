import { Calendar, Clock, FileText, Download, Phone, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Project, User as UserType } from "../../types";

interface ClientDocumentationProps {
  currentUser: UserType;
  projects: Project[];
  users: UserType[];
}

const formatSize = (size: number) => {
  if (!size) return "0 MB";
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

export function ClientDocumentation({
  currentUser,
  projects,
  users,
}: ClientDocumentationProps) {
  const clientProject =
    projects.find((project) => project.id === currentUser.clientProjectId) ||
    projects.find((project) => project.clientId === currentUser.id);

  if (!clientProject) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-64 rounded-2xl border border-muted-foreground/40 bg-background/70 text-center">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No Project Assigned</h3>
        <p className="text-sm text-muted-foreground">
          Once you are connected to a project, its documentation will appear here.
        </p>
      </div>
    );
  }

  const documentationFiles = clientProject.attachments || [];
  const supervisors = users.filter(
    (user) => user.role === "supervisor" && user.id === clientProject.supervisorId
  );

  const contact = supervisors[0] || null;

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Document Hub
          </p>
          <h1 className="text-2xl font-semibold">Project Documentation</h1>
          <p className="text-sm text-muted-foreground">
            {clientProject.name} — latest shared specifications and progress materials.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Status
              </p>
              <Badge variant="outline" className="text-xs">
                {clientProject.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Last Update
              </p>
              <p className="text-sm font-semibold">
                {formatDate(clientProject.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Supervisor
              </p>
              <p className="text-sm font-semibold">
                {contact ? contact.name : "Unassigned"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4 md:p-6">
          <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Shared Files
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {documentationFiles.length} files
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {documentationFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No files uploaded yet. Ask your team to add the latest documents.
              </p>
            ) : (
              documentationFiles.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(doc.size)} · uploaded {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => doc.url && window.open(doc.url, "_blank")}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="p-4 md:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Next Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Stay notified of upcoming approvals and meetings.
            </p>
            <div className="space-y-2">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold">Client Review Meeting</p>
                <p className="text-xs text-muted-foreground">
                  Scheduled for {formatDate(clientProject.endDate)} · 1 hour
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold">Documentation Walkthrough</p>
                <p className="text-xs text-muted-foreground">
                  Target date {formatDate(clientProject.startDate)} · Virtual call
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 md:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contact ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{contact.name}</p>
                <p className="text-xs text-muted-foreground">
                  Supervisor · {contact.school}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{contact.phone || "No phone provided"}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No direct contact assigned yet.</p>
            )}
            <Separator />
            <Button
              className="w-full"
              onClick={() => alert("Request for clarification sent.")}
            >
              Request Clarification
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
