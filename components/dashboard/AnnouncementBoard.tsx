import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import Swal from "sweetalert2";
import { apiService } from "../../utils/apiService";
import { User } from "../../types";
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

  const toggleRole = (role: string) => {
    if (role === "all") {
      setSelectedRoles(["all"]);
      return;
    }

    let nextRoles = selectedRoles.filter((entry) => entry !== "all");

    if (nextRoles.includes(role)) {
      nextRoles = nextRoles.filter((entry) => entry !== role);
    } else {
      nextRoles.push(role);
    }

    if (nextRoles.length === 0) nextRoles = ["all"];
    setSelectedRoles(nextRoles);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSelectedRoles(["all"]);
    setShowModal(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);

    try {
      const parsedRoles = JSON.parse(announcement.target_role);
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

    if (title.length > 50) {
      Swal.fire({
        icon: "warning",
        title: "Title Exceeds Limit",
        text: "Title must be less than 50 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (content.length > 200) {
      Swal.fire({
        icon: "warning",
        title: "Content Exceeds Limit",
        text: "Content must be less than 1000 characters.",
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

    const startTime = Date.now();
    const minDuration = 1500;

    try {
      if (isEdit) {
        await apiService.updateAnnouncement(editingId, {
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

      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
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
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
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

    const startTime = Date.now();
    const minDuration = 1500;

    try {
      await apiService.deleteAnnouncement(id);

      const nextAnnouncements = announcements.filter((announcement) => announcement.id !== id);
      setAnnouncements(nextAnnouncements);

      if (currentIndex >= nextAnnouncements.length) {
        setCurrentIndex(Math.max(0, nextAnnouncements.length - 1));
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
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
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
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
      <div className="mt-2 flex flex-wrap gap-2">
        {roles.map((role) => (
          <Badge
            key={role}
            variant="outline"
            className="h-6 rounded-full border-[#e8ebf0] px-2.5 text-[10px] uppercase text-slate-500 dark:border-slate-700 dark:text-slate-300"
          >
            {role}
          </Badge>
        ))}
      </div>
    );
  };

  const currentAnnouncement = announcements[currentIndex];

  return (
    <>
      <Card className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-[#e8ebf0] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="flex w-full flex-col gap-4 border-b border-[#eef2f6] p-0 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8ebf0] bg-white text-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-orange-300">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Announcements
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Team updates and broadcast notices
              </p>
            </div>
            {!loading && announcements.length > 0 && (
              <span className="ml-auto flex items-center gap-1 whitespace-nowrap rounded-full border border-[#e8ebf0] px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {currentIndex + 1} / {announcements.length}
              </span>
            )}
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            {announcements.length > 1 && (
              <div className="mr-2 flex items-center rounded-2xl border border-[#e8ebf0] bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="h-4 w-[1px] bg-[#e8ebf0] dark:bg-slate-700"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {canPost && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl border-[#e8ebf0] bg-white shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                onClick={openCreateModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative flex w-full min-h-0 min-w-0 flex-1 flex-col px-0 pt-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#e8ebf0] bg-white text-muted-foreground dark:border-slate-700 dark:bg-slate-900">
              <Megaphone className="mb-2 h-8 w-8 opacity-20 dark:text-slate-300" />
              <p>No announcements yet.</p>
            </div>
          ) : (
            <div className="group relative flex h-full w-full flex-col rounded-[1.75rem] border border-[#e8ebf0] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
                    {currentAnnouncement.title}
                  </h4>
                  <div className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    {currentAnnouncement.author_name} •{" "}
                    {format(new Date(currentAnnouncement.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              </div>

              <div className="mb-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-200">
                  {currentAnnouncement.content}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-[#eef2f6] pt-4 dark:border-slate-700">
                <div className="flex-1">
                  {renderTargetBadges(currentAnnouncement.target_role)}
                </div>

                {(isAdmin || currentUser.id === currentAnnouncement.created_by) && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                      onClick={() => openEditModal(currentAnnouncement)}
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30"
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

      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="modal relative w-full max-w-lg rounded-[2rem] border border-[#e8ebf0] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-700 dark:bg-slate-900">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 rounded-xl text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {editingId ? "Edit Announcement" : "New Announcement"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
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
                    className="rounded-2xl border-[#e8ebf0] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-100">Content</label>
                  <Textarea
                    placeholder="Write your message here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] rounded-2xl border-[#e8ebf0] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium dark:text-slate-100">
                    <Users className="h-4 w-4" /> Visible To
                  </label>
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-[#e8ebf0] bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <Badge
                      variant={selectedRoles.includes("all") ? "default" : "outline"}
                      className="cursor-pointer rounded-xl px-3 py-1 transition-colors hover:bg-primary/80"
                      onClick={() => toggleRole("all")}
                    >
                      Everyone
                    </Badge>
                    {AVAILABLE_ROLES.map((role) => (
                      <Badge
                        key={role}
                        variant={selectedRoles.includes(role) ? "default" : "outline"}
                        className="cursor-pointer rounded-xl px-3 py-1 capitalize transition-colors hover:bg-primary/80"
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
                  <Button
                    variant="outline"
                    className="rounded-2xl border-[#e8ebf0] bg-white shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button className="rounded-2xl" onClick={handleSubmit}>
                    {editingId ? (
                      <Save className="mr-2 h-4 w-4" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
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
