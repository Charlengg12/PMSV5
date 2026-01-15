import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  UserPlus,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Save,
  X,
  UserX,
  Users,
  UserCheck,
  Crown,
  Wrench,
  User as UserIcon,
  Edit,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { SupervisorSignupForm } from "../auth/SupervisorSignupForm";
import { User } from "../../types";
import Swal from "sweetalert2";

interface UserManagementProps {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User;
}

const swalCustomClasses = {
  container: "swal-container",
  popup: "swal-popup !max-w-md",
  title: "swal-title",
  htmlContainer: "swal-content",
  confirmButton: "swal-confirm-button",
  cancelButton: "swal-cancel-button",
  icon: "swal-icon",
};

export function UserManagement({
  users,
  setUsers,
  currentUser,
}: UserManagementProps) {
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);

  const [showSecureIds, setShowSecureIds] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);

  const [editEmailError, setEditEmailError] = useState("");
  const [editPhoneError, setEditPhoneError] = useState("");
  const [editGcashError, setEditGcashError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all"); // "all" | "admin" | "supervisor" | "fabricator" | "client"

  const [displayCount, setDisplayCount] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  const canManageUsers = currentUser.role === "admin";

  // Fetch inactive users
  useEffect(() => {
    if (!showInactiveModal || !canManageUsers) return;

    const fetchInactive = async () => {
      setLoadingInactive(true);
      try {
        const response = await apiService.getInactiveUsers();
        if (response.data) {
          setInactiveUsers(response.data.map(mapUserDataFromBackend));
        }
      } catch (err) {
        console.error("Failed to load inactive users", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Could not load inactive users.",
          timer: 2200,
          customClass: swalCustomClasses,
        });
      } finally {
        setLoadingInactive(false);
      }
    };
    fetchInactive();
  }, [showInactiveModal, canManageUsers]);

  // Secure ID toggle
  const handleToggleSecureIds = () => {
    if (showSecureIds) {
      setShowSecureIds(false);
      return;
    }

    setVerifyPassword("");
    setVerifyError("");
    setShowPasswordModal(true);
  };

  const handleVerifyPassword = async () => {
    if (!verifyPassword.trim()) {
      setVerifyError("Password is required");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");

    try {
      await apiService.verifyPassword(verifyPassword);
      setShowSecureIds(true);
      setShowPasswordModal(false);

      Swal.fire({
        icon: "success",
        title: "Access Granted",
        text: "Secure IDs are now visible",
        timer: 1400,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch {
      setVerifyError("Incorrect password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateSupervisor = async (newSupervisor: User) => {
    try {
      const response = await apiService.getUsers();
      if (response.data) {
        setUsers(response.data.map(mapUserDataFromBackend));
      }
    } catch (err) {
      console.error("Refresh after supervisor creation failed", err);
    }
    setShowSupervisorForm(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setEditEmailError("");
    setEditPhoneError("");
    setEditGcashError("");
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^(\+639|09)\d{9}$/;
    const gcashRegex = /^09\d{9}$/;

    let hasError = false;

    if (!emailRegex.test(editingUser.email ?? "")) {
      setEditEmailError("Please enter a valid Gmail address (example@gmail.com)");
      hasError = true;
    } else {
      setEditEmailError("");
    }

    if (editingUser.phone && !phoneRegex.test(editingUser.phone)) {
      setEditPhoneError("Phone must be +639xxxxxxxxx or 09xxxxxxxxx");
      hasError = true;
    } else if (
      editingUser.phone &&
      editingUser.phone.length !== 13 &&
      editingUser.phone.length !== 11
    ) {
      setEditPhoneError("Phone must be 11 or 13 digits");
      hasError = true;
    } else {
      setEditPhoneError("");
    }

    if (editingUser.gcashNumber && !gcashRegex.test(editingUser.gcashNumber)) {
      setEditGcashError("GCash must start with 09 and be 11 digits");
      hasError = true;
    } else if (
      editingUser.gcashNumber &&
      editingUser.gcashNumber.length !== 11
    ) {
      setEditGcashError("GCash number must be exactly 11 digits");
      hasError = true;
    } else {
      setEditGcashError("");
    }

    if (hasError) return;

    const original = users.find((u) => u.id === editingUser.id);
    if (original && JSON.stringify(original) === JSON.stringify(editingUser)) {
      Swal.fire({
        icon: "info",
        title: "No changes",
        text: "Nothing was modified.",
        timer: 1400,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
      setShowEditModal(false);
      setEditingUser(null);
      return;
    }

    const result = await Swal.fire({
      title: "Save changes?",
      text: "This will update the user's information.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Saving...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });

    setTimeout(async () => {
      try {
        await apiService.updateUser(editingUser.id, editingUser);
        const res = await apiService.getUsers();
        if (res.data) setUsers(res.data.map(mapUserDataFromBackend));

        Swal.close();
        Swal.fire({
          icon: "success",
          title: "User Updated",
          timer: 1600,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });

        setShowEditModal(false);
        setEditingUser(null);
      } catch (err) {
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Could not save changes.",
          customClass: swalCustomClasses,
        });
      }
    }, 1800);
  };

  const handleDeactivateUser = async (userId: string) => {
    if (userId === currentUser.id) {
      Swal.fire({
        icon: "warning",
        title: "Cannot deactivate yourself",
        text: "Please ask another admin to do this.",
        customClass: swalCustomClasses,
      });
      return;
    }

    const result = await Swal.fire({
      title: "Deactivate user?",
      text: "User will no longer be able to log in.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, deactivate",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Deactivating...",
      text: "Please wait a moment.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });

    setTimeout(async () => {
      try {
        await apiService.makeUserInactive(userId);
        const [activeRes, inactiveRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getInactiveUsers(),
        ]);
        if (activeRes.data) {
          setUsers(activeRes.data.map(mapUserDataFromBackend));
        }
        if (inactiveRes.data) {
          setInactiveUsers(inactiveRes.data.map(mapUserDataFromBackend));
        }

        Swal.close();
        Swal.fire({
          icon: "success",
          title: "User Deactivated",
          timer: 1600,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
      } catch (err: any) {
        Swal.close();
        console.error("Deactivation failed:", err);
        Swal.fire({
          icon: "error",
          title: "Deactivation Failed",
          text: err?.response?.data?.message || "Server error",
          customClass: swalCustomClasses,
        });
      }
    }, 1800);
  };

  const handleDeactivateSelected = async () => {
    const targetIds = selectedUserIds.filter((id) => id !== currentUser.id);
    if (targetIds.length === 0) return;

    const result = await Swal.fire({
      title: "Deactivate selected users?",
      text: `This will deactivate ${targetIds.length} user(s).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, deactivate",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Deactivating...",
      text: "Please wait a moment.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });

    setTimeout(async () => {
      try {
        await Promise.all(
          targetIds.map((userId) => apiService.makeUserInactive(userId))
        );
        const [activeRes, inactiveRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getInactiveUsers(),
        ]);
        if (activeRes.data) {
          setUsers(activeRes.data.map(mapUserDataFromBackend));
        }
        if (inactiveRes.data) {
          setInactiveUsers(inactiveRes.data.map(mapUserDataFromBackend));
        }

        setSelectedUserIds([]);
        Swal.close();
        Swal.fire({
          icon: "success",
          title: "Users Deactivated",
          timer: 1600,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
      } catch (err: any) {
        Swal.close();
        console.error("Bulk deactivation failed:", err);
        Swal.fire({
          icon: "error",
          title: "Deactivation Failed",
          text: err?.response?.data?.message || "Server error",
          customClass: swalCustomClasses,
        });
      }
    }, 1800);
  };

  const handleRestoreUser = async (userId: string) => {
    const result = await Swal.fire({
      title: "Restore user?",
      text: "User will be able to log in again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Restoring...",
      text: "Please wait a moment.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });

    setTimeout(async () => {
      try {
        await apiService.makeUserActive(userId);
        const [activeRes, inactiveRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getInactiveUsers(),
        ]);
        if (activeRes.data) {
          setUsers(activeRes.data.map(mapUserDataFromBackend));
        }
        if (inactiveRes.data) {
          setInactiveUsers(inactiveRes.data.map(mapUserDataFromBackend));
        }

        Swal.close();
        Swal.fire({
          icon: "success",
          title: "User Restored",
          text: "Account is now active again.",
          timer: 1800,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
      } catch (err: any) {
        Swal.close();
        console.error("Restore failed:", err);
        Swal.fire({
          icon: "error",
          title: "Restore Failed",
          text: err?.response?.data?.message || "Server error",
          customClass: swalCustomClasses,
        });
      }
    }, 1800);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "supervisor":
        return "default";
      case "fabricator":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3.5 w-3.5" />;
      case "supervisor":
        return <Shield className="h-3.5 w-3.5" />;
      case "fabricator":
        return <Wrench className="h-3.5 w-3.5" />;
      case "client":
        return <UserIcon className="h-3.5 w-3.5" />;
      default:
        return <UserIcon className="h-3.5 w-3.5" />;
    }
  };

  // ────────────────────────────────────────────────
  // Filtering + displayed users logic
  // ────────────────────────────────────────────────
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    let result = users;

    // Role filter
    if (selectedRole !== "all") {
      result = result.filter((user) => user.role === selectedRole);
    }

    // Text search
    if (normalizedSearch) {
      result = result.filter((user) => {
        const haystack = [
          user.name,
          user.email,
          user.role,
          user.school,
          user.employeeNumber,
          user.secureId,
          user.phone,
          user.gcashNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    return result;
  }, [users, normalizedSearch, selectedRole]);

  const displayedUsers = useMemo(() => {
    return filteredUsers.slice(0, displayCount);
  }, [filteredUsers, displayCount]);

  const hasMore = displayCount < filteredUsers.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    // Small delay to simulate network + give smooth feel
    setTimeout(() => {
      setDisplayCount((prev) => prev + 5);
      setLoadingMore(false);
    }, 500);
  }, [hasMore, loadingMore]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(5);
  }, [searchTerm, selectedRole]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreTriggerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loadingMore, loadMore]);

  // Keep selected IDs in sync when users list changes
  useEffect(() => {
    const userIds = new Set(users.map((user) => user.id));
    setSelectedUserIds((prev) => prev.filter((id) => userIds.has(id)));
  }, [users]);

  return (
    <div className="space-y-6 px-2 sm:px-4 lg:px-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {/* add user icon */}
            <UserIcon className="h-6 w-6 inline mr-2" />
            User Management
            </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users, roles and permissions
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canManageUsers && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowInactiveModal(true)}
              >
                <UserX size={16} />
                Inactive Users
              </Button>

              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm"
                onClick={() => setShowSupervisorForm(true)}
              >
                <UserPlus size={16} />
                Add Supervisor
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">System Users</CardTitle>

            <Button
              variant={showSecureIds ? "destructive" : "outline"}
              size="sm"
              className="gap-2"
              onClick={handleToggleSecureIds}
            >
              {showSecureIds ? <EyeOff size={16} /> : <Eye size={16} />}
              {showSecureIds ? "Hide" : "Show"} Secure IDs
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col-reverse lg:flex-row justify-between lg:items-end gap-5 mb-6">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-4.5 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search name, email, school, employee #, phone, GCash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/40 border-muted-foreground/30"
              />
              <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-[#ef4444]">Note:</span> Search is case-insensitive and supports partial matches.</p>
            </div>

            <div className="min-w-[200px]">
              <Label className="text-sm mb-1.5 block">Filter by Role:</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="fabricator">Fabricator</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {canManageUsers && selectedUserIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeactivateSelected}
              >
                Deactivate {selectedUserIds.length}
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {canManageUsers && (
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={
                          displayedUsers.length > 0 &&
                          displayedUsers.every((u) => selectedUserIds.includes(u.id))
                        }
                        indeterminate={
                          displayedUsers.some((u) => selectedUserIds.includes(u.id)) &&
                          !displayedUsers.every((u) => selectedUserIds.includes(u.id))
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUserIds((prev) => [
                              ...new Set([...prev, ...displayedUsers.map((u) => u.id)]),
                            ]);
                          } else {
                            setSelectedUserIds((prev) =>
                              prev.filter((id) => !displayedUsers.some((u) => u.id === id))
                            );
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead className="min-w-[200px]">Name & Email</TableHead>
                  <TableHead className="min-w-[110px]">Role</TableHead>
                  <TableHead className="min-w-[140px]">School</TableHead>
                  <TableHead className="min-w-[160px]">Contact</TableHead>
                  {showSecureIds && <TableHead className="min-w-[160px]">Secure ID</TableHead>}
                  <TableHead className="min-w-[120px]">Employee #</TableHead>
                  {canManageUsers && <TableHead className="w-28 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={100} className="h-48 text-center text-muted-foreground">
                      No users found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/60 transition-colors">
                      {canManageUsers && (
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            disabled={user.id === currentUser.id}
                            onCheckedChange={(checked) => {
                              setSelectedUserIds((prev) =>
                                checked
                                  ? [...prev, user.id]
                                  : prev.filter((id) => id !== user.id)
                              );
                            }}
                          />
                        </TableCell>
                      )}

                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Mail size={13} className="shrink-0" />
                          <span className="break-all">{user.email}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          className="font-medium capitalize"
                        >
                          <span className="md:hidden mr-1.5">{getRoleIcon(user.role)}</span>
                          <span className="hidden md:inline">{user.role}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground capitalize">
                        {user.school || "—"}
                      </TableCell>

                      <TableCell className="text-sm">
                        {user.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={14} className="shrink-0 text-muted-foreground" />
                            {user.phone}
                          </div>
                        )}
                        {user.gcashNumber && (
                          <div className="text-xs text-muted-foreground/80 mt-1 italic">
                            GCash: {user.gcashNumber}
                          </div>
                        )}
                      </TableCell>

                      {showSecureIds && (
                        <TableCell>
                          <code className="text-xs font-mono bg-muted px-2.5 py-1 rounded break-all">
                            {user.secureId || "—"}
                          </code>
                        </TableCell>
                      )}

                      <TableCell>
                        <code className="text-xs font-mono text-muted-foreground">
                          {user.employeeNumber || "—"}
                        </code>
                      </TableCell>

                      {canManageUsers && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit size={16} />
                            </Button>

                            {user.id !== currentUser.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeactivateUser(user.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Load more area */}
          {hasMore && (
            <div
              ref={loadMoreTriggerRef}
              className="py-10 flex justify-center items-center text-sm text-muted-foreground"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading more users...
                </>
              ) : (
                "Scroll down to load more"
              )}
            </div>
          )}

          {!hasMore && filteredUsers.length > 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              All matching users have been loaded
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No users match the current filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background/95 backdrop-blur-md border shadow-2xl rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2.5">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Check
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPasswordModal(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Enter your password to view Secure IDs.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="verify-password">Password</Label>
                <Input
                  id="verify-password"
                  type="password"
                  autoFocus
                  value={verifyPassword}
                  onChange={(e) => {
                    setVerifyPassword(e.target.value);
                    setVerifyError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                  className={verifyError ? "border-destructive" : ""}
                />
                {verifyError && (
                  <p className="text-sm text-destructive mt-1.5">{verifyError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifyPassword}
                  disabled={isVerifying || !verifyPassword.trim()}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Users Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2.5">
                  <UserX className="h-5 w-5 text-destructive" />
                  Inactive / Deactivated Users
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInactiveModal(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                These accounts are currently deactivated and cannot log in.
              </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loadingInactive ? (
                <div className="h-full flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  Loading...
                </div>
              ) : inactiveUsers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Users className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No inactive users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="min-w-[200px]">Name & Email</TableHead>
                      <TableHead className="min-w-[110px]">Role</TableHead>
                      <TableHead className="min-w-[140px]">School</TableHead>
                      <TableHead className="min-w-[160px]">Contact</TableHead>
                      {showSecureIds && <TableHead className="min-w-[160px]">Secure ID</TableHead>}
                      <TableHead className="min-w-[120px]">Employee #</TableHead>
                      <TableHead className="min-w-[140px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <Mail size={13} />
                            <span className="break-all">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {user.school || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone size={14} className="shrink-0" />
                              {user.phone}
                            </div>
                          )}
                          {user.gcashNumber && (
                            <div className="text-xs text-muted-foreground/80 mt-1">
                              GCash: {user.gcashNumber}
                            </div>
                          )}
                        </TableCell>
                        {showSecureIds && (
                          <TableCell>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                              {user.secureId || "—"}
                            </code>
                          </TableCell>
                        )}
                        <TableCell>
                          <code className="text-xs font-mono text-muted-foreground">
                            {user.employeeNumber || "—"}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRestoreUser(user.id)}
                          >
                            <UserCheck size={16} className="mr-1.5" />
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit User</h2>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                  <X size={20} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Update user details below
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingUser.name || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editingUser.email || ""}
                    onChange={(e) => {
                      setEditingUser({ ...editingUser, email: e.target.value });
                      setEditEmailError("");
                    }}
                    className={editEmailError ? "border-destructive" : ""}
                  />
                  {editEmailError && (
                    <p className="text-sm text-destructive">{editEmailError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editingUser.phone || ""}
                    maxLength={13}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, "");
                      if (val.includes("+")) val = "+" + val.replace(/\+/g, "");
                      val = val.startsWith("+") ? val.slice(0, 13) : val.slice(0, 11);
                      setEditingUser({ ...editingUser, phone: val });
                      setEditPhoneError("");
                    }}
                    className={editPhoneError ? "border-destructive" : ""}
                  />
                  {editPhoneError && (
                    <p className="text-sm text-destructive">{editPhoneError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>GCash Number</Label>
                  <Input
                    value={editingUser.gcashNumber || ""}
                    maxLength={11}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "").slice(0, 11);
                      setEditingUser({ ...editingUser, gcashNumber: val });
                      setEditGcashError("");
                    }}
                    className={editGcashError ? "border-destructive" : ""}
                  />
                  {editGcashError && (
                    <p className="text-sm text-destructive">{editGcashError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>School / Institution</Label>
                  <Input
                    value={editingUser.school || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, school: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(v) =>
                      setEditingUser({
                        ...editingUser,
                        role: v as User["role"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="fabricator">Fabricator</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Secure ID</Label>
                  <Input
                    value={editingUser.secureId || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        secureId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Employee #</Label>
                  <Input
                    value={editingUser.employeeNumber || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        employeeNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="w-full sm:w-auto"
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUser}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                >
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupervisorForm && (
        <SupervisorSignupForm
          onSignup={handleCreateSupervisor}
          onClose={() => setShowSupervisorForm(false)}
        />
      )}

      {!canManageUsers && (
        <Card className="mt-10 border-dashed bg-muted/30">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/70 mb-4" />
            <h3 className="text-lg font-medium mb-2">Administrator Access Required</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Only admins can manage users, view inactive accounts, add supervisors, edit details or reveal secure IDs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}