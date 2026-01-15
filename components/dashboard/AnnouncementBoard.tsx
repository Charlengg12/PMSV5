import { useState, useEffect } from "react";
import { apiService } from "../../utils/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Megaphone,
  Trash2,
  Send,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Users,
  Save,
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

export function AnnouncementBoard({ currentUser }: AnnouncementBoardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Track active slide
  const [showForm, setShowForm] = useState(false);
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
        setCurrentIndex(0); // Reset to first slide on reload
      }
    } catch (error) {
      console.error("Failed to load announcements", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Carousel Navigation ---
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === announcements.length - 1 ? 0 : prev + 1));
  };

  // --- Form Logic ---
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

  const handleEditClick = (ann: Announcement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    try {
      const parsedRoles = JSON.parse(ann.target_role);
      setSelectedRoles(Array.isArray(parsedRoles) ? parsedRoles : ["all"]);
    } catch {
      setSelectedRoles(["all"]);
    }
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setSelectedRoles(["all"]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    try {
      if (editingId) {
        await apiService.updateAnnouncement(editingId, {
          title,
          content,
          targetRoles: selectedRoles,
        });
        Swal.fire({ icon: "success", title: "Updated!", timer: 1000, showConfirmButton: false });
      } else {
        await apiService.createAnnouncement({
          title,
          content,
          targetRoles: selectedRoles,
        });
        Swal.fire({ icon: "success", title: "Posted!", timer: 1000, showConfirmButton: false });
      }
      handleCancelForm();
      fetchAnnouncements();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Operation failed." });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Delete?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#ef4444",
    });

    if (result.isConfirmed) {
      try {
        await apiService.deleteAnnouncement(id);
        // Remove locally and adjust index if needed
        const newAnnouncements = announcements.filter((a) => a.id !== id);
        setAnnouncements(newAnnouncements);
        if (currentIndex >= newAnnouncements.length) {
            setCurrentIndex(Math.max(0, newAnnouncements.length - 1));
        }
        Swal.fire({ icon: "success", title: "Deleted", timer: 1000, showConfirmButton: false });
      } catch (error) {
        Swal.fire({ icon: "error", title: "Could not delete" });
      }
    }
  };

  const renderTargetBadges = (roleString: string) => {
    let roles: string[] = [];
    try {
      roles = JSON.parse(roleString);
    } catch { return null; }
    if (roles.includes("all")) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {roles.map((r) => (
          <Badge key={r} variant="outline" className="text-[10px] h-4 px-1 uppercase border-primary/30 text-primary">
            {r}
          </Badge>
        ))}
      </div>
    );
  };

  const currentAnnouncement = announcements[currentIndex];

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm relative w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Announcements</CardTitle>
          {/* Slide Counter */}
          {!loading && announcements.length > 0 && (
             <span className="text-xs text-muted-foreground ml-2 bg-muted px-2 py-0.5 rounded-full">
                {currentIndex + 1} / {announcements.length}
             </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Navigation Arrows (Only if multiple items) */}
          {announcements.length > 1 && (
            <div className="flex items-center border rounded-md mr-2 bg-background shadow-sm">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-[1px] h-4 bg-border"></div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {canPost && (
            <Button
              variant={showForm ? "secondary" : "outline"}
              size="sm"
              onClick={showForm ? handleCancelForm : () => setShowForm(true)}
            >
              {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showForm ? "Close" : "New"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 min-h-0 flex flex-col min-w-0 w-full">
        
        {/* --- FORM OVERLAY --- */}
        {showForm && (
          <div className="absolute inset-0 z-20 bg-background/95 p-4 sm:p-6 animate-in fade-in zoom-in-95 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{editingId ? "Edit Announcement" : "New Announcement"}</h3>
            </div>
            
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium text-lg"
            />
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none"
            />
            
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    <Badge 
                        variant={selectedRoles.includes("all") ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => toggleRole("all")}
                    >
                        Everyone
                    </Badge>
                    {AVAILABLE_ROLES.map(role => (
                        <Badge
                            key={role}
                            variant={selectedRoles.includes(role) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/80 capitalize"
                            onClick={() => toggleRole(role)}
                        >
                            {role}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit}>
                {editingId ? <Save className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {editingId ? "Update" : "Post"}
              </Button>
            </div>
          </div>
        )}

        {/* --- CAROUSEL CONTENT --- */}
        {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Loading...
            </div>
        ) : announcements.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Megaphone className="h-8 w-8 mb-2 opacity-20" />
                <p>No announcements yet.</p>
            </div>
        ) : (
            // SINGLE CARD VIEW
            <div className="h-full w-full bg-card border rounded-xl p-5 flex flex-col shadow-sm relative group animate-in fade-in duration-300">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-semibold text-lg leading-tight">
                            {currentAnnouncement.title}
                        </h4>
                        <div className="text-xs text-muted-foreground mt-1">
                            {currentAnnouncement.author_name} • {format(new Date(currentAnnouncement.created_at), "MMM d, yyyy")}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-2 pr-1 custom-scrollbar">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {currentAnnouncement.content}
                    </p>
                </div>

                <div className="mt-auto pt-2 border-t flex justify-between items-center">
                    <div className="flex-1">
                        {renderTargetBadges(currentAnnouncement.target_role)}
                    </div>
                    
                    {(isAdmin || currentUser.id === currentAnnouncement.created_by) && (
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                onClick={() => handleEditClick(currentAnnouncement)}
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
  );
}