import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // Import createPortal
import { apiService } from "../../utils/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Megaphone,
  Trash2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Users,
  Save,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { User } from "../../types";
import Swal from "sweetalert2";

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  target_role: string;
  created_at: string;
  created_by: string;
}

interface AnnouncementBoardProps {
  currentUser: User;
}

const AVAILABLE_ROLES = ["admin", "supervisor", "fabricator", "client"];

const swalCustomClasses = {
  container: "swal-container",
  popup: "swal-popup",
  title: "swal-title",
  htmlContainer: "swal-content",
  confirmButton: "swal-confirm-button",
  cancelButton: "swal-cancel-button",
  icon: "swal-icon",
};

export function AnnouncementBoard({ currentUser }: AnnouncementBoardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["all"]);

  const canPost = ["admin", "supervisor"].includes(currentUser.role);
  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await apiService.getAnnouncements();
      if (res.data) {
        setAnnouncements(res.data);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Failed to load announcements", error);
    } finally {
      setLoading(false);
    }
  };

  // Carousel Navigation
  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? announcements.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === announcements.length - 1 ? 0 : prev + 1,
    );
  };

  // Role selection logic
  const toggleRole = (role: string) => {
    if (role === "all") {
      setSelectedRoles(["all"]);
      return;
    }

    let newRoles = selectedRoles.filter((r) => r !== "all");

    if (newRoles.includes(role)) {
      newRoles = newRoles.filter((r) => r !== role);
    } else {
      newRoles.push(role);
    }

    if (newRoles.length === 0) newRoles = ["all"];

    setSelectedRoles(newRoles);
  };

  // Modal open handlers
  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSelectedRoles(["all"]);
    setShowModal(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    try {
      const parsedRoles = JSON.parse(ann.target_role);
      setSelectedRoles(Array.isArray(parsedRoles) ? parsedRoles : ["all"]);
    } catch {
      setSelectedRoles(["all"]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  // ─── CREATE / UPDATE with confirmation + loading ───────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete",
        text: "Title and content are required.",
        customClass: swalCustomClasses,
      });
      return;
    }

    const isEdit = !!editingId;
    const actionText = isEdit ? "update" : "post";
    const successText = isEdit ? "Updated!" : "Posted!";

    const result = await Swal.fire({
      title: `${isEdit ? "Update" : "Post"} Announcement?`,
      text: `Are you sure you want to ${actionText} this announcement?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isEdit ? "Update" : "Post",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    // Show loading
    const loadingSwal = Swal.fire({
      title: isEdit ? "Updating..." : "Posting...",
      text: "Please wait...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });

    // Simulate minimum 1.5 seconds runtime
    const startTime = Date.now();
    const MIN_DURATION = 1500;

    try {
      if (isEdit) {
        await apiService.updateAnnouncement(editingId!, {
          title,
          content,
          targetRoles: selectedRoles,
        });
      } else {
        await apiService.createAnnouncement({
          title,
          content,
          targetRoles: selectedRoles,
        });
      }

      // Ensure at least 1.5s has passed
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DURATION) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_DURATION - elapsed),
        );
      }

      loadingSwal.close();

      Swal.fire({
        icon: "success",
        title: successText,
        timer: 1200,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });

      closeModal();
      fetchAnnouncements();
    } catch (error) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DURATION) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_DURATION - elapsed),
        );
      }

      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${actionText} announcement.`,
        customClass: swalCustomClasses,
      });
    }
  };

  // ─── DELETE with confirmation + loading ────────────────────────────────────
  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Delete Announcement?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    // Show loading
    const loadingSwal = Swal.fire({
      title: "Deleting...",
      text: "Please wait...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });

    // Simulate minimum 1.5 seconds runtime
    const startTime = Date.now();
    const MIN_DURATION = 1500;

    try {
      await apiService.deleteAnnouncement(id);

      const newAnnouncements = announcements.filter((a) => a.id !== id);
      setAnnouncements(newAnnouncements);

      if (currentIndex >= newAnnouncements.length) {
        setCurrentIndex(Math.max(0, newAnnouncements.length - 1));
      }

      // Ensure at least 1.5s has passed
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DURATION) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_DURATION - elapsed),
        );
      }

      loadingSwal.close();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Announcement has been removed.",
        timer: 1200,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (error) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DURATION) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_DURATION - elapsed),
        );
      }

      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not delete announcement.",
        customClass: swalCustomClasses,
      });
    }
  };

  const renderTargetBadges = (roleString: string) => {
    let roles: string[] = [];
    try {
      roles = JSON.parse(roleString);
    } catch {
      return null;
    }
    if (roles.includes("all")) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {roles.map((r) => (
          <Badge
            key={r}
            variant="outline"
            className="text-[10px] h-4 px-1 uppercase border-primary/30 text-primary dark:border-primary/50 dark:text-white"
          >
            {r}
          </Badge>
        ))}
      </div>
    );
  };

  const currentAnnouncement = announcements[currentIndex];

  return (
    <>
      <Card className="h-full flex flex-col border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm relative w-full overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 px-4 sm:px-6">
          {/* Left Side: Title & Counter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Megaphone className="h-5 w-5 text-primary dark:text-white" />
            <CardTitle className="text-lg">Announcements</CardTitle>
            {!loading && announcements.length > 0 && (
              <span className="text-xs text-muted-foreground ml-2 bg-muted dark:bg-slate-800 px-2 py-0.5 flex items-center gap-1 whitespace-nowrap rounded-full">
                {currentIndex + 1} / {announcements.length}
              </span>
            )}
          </div>

          {/* Right Side: Actions (Aligns right on mobile) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {announcements.length > 1 && (
              <div className="flex items-center border dark:border-slate-700 rounded-md mr-2 bg-background dark:bg-slate-800 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="w-[1px] h-4 bg-border dark:bg-slate-700"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {canPost && (
              <Button variant="outline" size="sm" onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative flex-1 min-h-0 flex flex-col min-w-0 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : announcements.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              <Megaphone className="h-8 w-8 mb-2 opacity-20 dark:text-slate-300" />
              <p>No announcements yet.</p>
            </div>
          ) : (
            <div className="h-full w-full bg-card dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 flex flex-col shadow-sm relative group animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lg leading-tight dark:text-slate-100">
                    {currentAnnouncement.title}
                  </h4>
                  <div className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                    {currentAnnouncement.author_name} •{" "}
                    {format(
                      new Date(currentAnnouncement.created_at),
                      "MMM d, yyyy",
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-2 pr-1 custom-scrollbar">
                <p className="text-sm text-foreground/90 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {currentAnnouncement.content}
                </p>
              </div>

              <div className="mt-auto pt-2 border-t dark:border-slate-700 flex justify-between items-center">
                <div className="flex-1">
                  {renderTargetBadges(currentAnnouncement.target_role)}
                </div>

                {(isAdmin ||
                  currentUser.id === currentAnnouncement.created_by) && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => openEditModal(currentAnnouncement)}
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(currentAnnouncement.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL WRAPPED IN CREATEPORTAL TO COVER FULL SCREEN */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background dark:bg-slate-900 border dark:border-slate-700 rounded-xl shadow-lg w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="mb-5">
                <h2 className="text-xl font-semibold dark:text-slate-100">
                  {editingId ? "Edit Announcement" : "New Announcement"}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  Share updates with your team.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-100">Title</label>
                  <Input
                    placeholder="e.g. Holiday Schedule"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-100">Content</label>
                  <Textarea
                    placeholder="Write your message here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-100 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Visible To
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border dark:border-slate-700 rounded-md bg-muted/20 dark:bg-slate-800">
                    <Badge
                      variant={
                        selectedRoles.includes("all") ? "default" : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/80 transition-colors px-3 py-1"
                      onClick={() => toggleRole("all")}
                    >
                      Everyone
                    </Badge>
                    {AVAILABLE_ROLES.map((role) => (
                      <Badge
                        key={role}
                        variant={
                          selectedRoles.includes(role) ? "default" : "outline"
                        }
                        className="cursor-pointer hover:bg-primary/80 transition-colors capitalize px-3 py-1"
                        onClick={() => toggleRole(role)}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground dark:text-slate-400">
                    Select "Everyone" or pick specific roles.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingId ? (
                      <Save className="h-4 w-4 mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {editingId ? "Update" : "Post Announcement"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
