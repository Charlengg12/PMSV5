import { Calendar, Clock, FileText, Download, Trash2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import Swal from "sweetalert2";
import {
  Project,
  User as UserType,
  WorkLogEntry,
  ProjectAttachment,
  ProjectFeedback,
} from "../../types";

interface ClientDocumentationProps {
  currentUser: UserType;
  projects: Project[];
  users: UserType[];
  workLogs: WorkLogEntry[];
  onUpdateProject?: (project: Project) => void;
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
  workLogs,
  onUpdateProject,
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
          Once you are connected to a project, its documentation will appear
          here.
        </p>
      </div>
    );
  }

  const supervisors = users.filter(
    (user) =>
      user.role === "supervisor" && user.id === clientProject.supervisorId,
  );

  const contact = supervisors[0] || null;

  type DocumentationEntry = {
    attachment: ProjectAttachment;
    source: "project" | "worklog";
  };

  const documentationFiles = (() => {
    const entries = new Map<string, DocumentationEntry>();

    (clientProject.attachments || []).forEach((attachment) => {
      entries.set(attachment.id, { attachment, source: "project" });
    });

    const logAttachments = workLogs
      .filter((log) => log.projectId === clientProject.id)
      .flatMap((log) => log.attachments || []);

    logAttachments.forEach((attachment) => {
      if (!entries.has(attachment.id)) {
        entries.set(attachment.id, { attachment, source: "worklog" });
      }
    });

    return Array.from(entries.values());
  })();

  const [feedbackInput, setFeedbackInput] = useState("");

  const sortedFeedback = [...(clientProject.feedbackEntries ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!onUpdateProject) return;
    const result = await Swal.fire({
      title: "Remove shared file?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    const remainingAttachments = (clientProject.attachments || []).filter(
      (attachment) => attachment.id !== attachmentId,
    );
    onUpdateProject({ ...clientProject, attachments: remainingAttachments });
  };

  const handleSubmitFeedback = () => {
    if (!onUpdateProject || !feedbackInput.trim()) return;

    const newFeedback: ProjectFeedback = {
      id: `feedback-${clientProject.id}-${Date.now()}`,
      projectId: clientProject.id,
      comment: feedbackInput.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
      visibilityRoles: ["supervisor", "admin"],
    };

    onUpdateProject({
      ...clientProject,
      feedbackEntries: [newFeedback, ...(clientProject.feedbackEntries ?? [])],
    });

    setFeedbackInput("");
  };

  return (
    <div className="space-y-6">
      <Card className="px-4 py-4 md:px-6 md:py-8 bg-white border border-slate-200 shadow-md">
        <CardHeader className="p-0 space-y-3">
          {/* Container for Label and Badge */}
          <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-semibold tracking-[0.4em] text-[0.65rem] uppercase text-slate-500">
              <span>Document Hub</span>
            </div>

            {/* Badge moved here */}
            <Badge
              variant="outline"
              className="text-[0.6rem] px-3 py-1 rounded-full uppercase tracking-[0.35em]"
            >
              {clientProject.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Title (Badge removed from here) */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Project Documentation
          </h1>

          <p className="text-base text-slate-600 max-w-2xl">
            {clientProject.name} — up-to-date specs, progress photos, and
            approval materials prepared for your review.
          </p>
        </CardHeader>

        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-6 text-sm text-slate-500">
            <div className="flex flex-col gap-1">
              <span className="uppercase tracking-[0.3em] text-[0.65rem]">
                Last Updated
              </span>
              <span className="text-base font-semibold text-slate-900">
                {formatDate(clientProject.createdAt)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="uppercase tracking-[0.3em] text-[0.65rem]">
                Supervisor
              </span>
              <span className="text-base font-semibold text-slate-900">
                {contact ? contact.name : "Unassigned"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Shared Files Card */}
        <Card className="p-4 md:p-6">
          <CardHeader className="p-0 flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Shared Files
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {documentationFiles.length} files
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 mt-4">
            {documentationFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No files uploaded yet. Ask your team to add the latest
                documents.
              </p>
            ) : (
              documentationFiles.map(({ attachment: doc, source }) => {
                const isImage = doc.type?.startsWith("image");
                const isDeletable = !!onUpdateProject;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                  >
                    {/* Left Side: Content (Added min-w-0 for truncation) */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isImage ? (
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={doc.url}
                            alt={doc.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <FileText className="h-6 w-6 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-medium truncate"
                          title={doc.name}
                        >
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatSize(doc.size)} · Uploaded{" "}
                          {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Actions (Added shrink-0) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          doc.url && window.open(doc.url, "_blank")
                        }
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {isDeletable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-destructive text-destructive-foreground border border-destructive/50 rounded hover:bg-destructive/80"
                          onClick={() => handleDeleteAttachment(doc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card className="p-4 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Share status updates, questions, or concerns so your supervisor and
              admin can act on them quickly.
            </p>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {sortedFeedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No feedback yet. Tell your team what's on your mind.
                </p>
              ) : (
                sortedFeedback.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border px-4 py-3 space-y-1"
                  >
                    <p className="text-sm text-slate-900">{entry.comment}</p>
                    <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">
                      <span>
                        {entry.createdByName || entry.createdByRole || "Client"}
                      </span>
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="client-feedback"
                className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground"
              >
                Write feedback
              </label>
              <Textarea
                id="client-feedback"
                rows={3}
                placeholder="Summarize how the project feels at this stage."
                value={feedbackInput}
                onChange={(event) => setFeedbackInput(event.target.value)}
                disabled={!onUpdateProject}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  type="button"
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackInput.trim() || !onUpdateProject}
                >
                  Send Feedback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
