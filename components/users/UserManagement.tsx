import { useEffect, useMemo, useState } from "react";
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
  Lock,      // Added
  Loader2,   // Added
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
  popup: "swal-popup",
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
  
  // -- Secure ID Logic --
  const [showSecureIds, setShowSecureIds] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  // -------------------

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [editEmailError, setEditEmailError] = useState<string>("");
  const [editPhoneError, setEditPhoneError] = useState<string>("");
  const [editGcashError, setEditGcashError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (showInactiveModal && currentUser.role === "admin") {
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
            timer: 2500,
            customClass: swalCustomClasses,
          });
        } finally {
          setLoadingInactive(false);
        }
      };
      fetchInactive();
    }
  }, [showInactiveModal, currentUser.role]);

  // --- NEW: Handle Password Verification ---
  const handleToggleSecureIds = () => {
    if (showSecureIds) {
      // Hide immediately
      setShowSecureIds(false);
    } else {
      // Show password modal
      setVerifyPassword("");
      setVerifyError("");
      setShowPasswordModal(true);
    }
  };

  const handleVerifyPassword = async () => {
    if (!verifyPassword) {
      setVerifyError("Please enter your password");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");

    try {
      // Call the API function we added earlier
      await apiService.verifyPassword(verifyPassword);
      
      // If successful:
      setShowSecureIds(true);
      setShowPasswordModal(false);
      
      Swal.fire({
        icon: "success",
        title: "Verified",
        text: "Secure IDs are now visible.",
        timer: 1500,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });

    } catch (err: any) {
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

    if (!emailRegex.test(editingUser.email)) {
      setEditEmailError(
        "Please enter a valid Gmail address (example@gmail.com)"
      );
      hasError = true;
    } else setEditEmailError("");

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
    } else setEditPhoneError("");

    if (editingUser.gcashNumber && !gcashRegex.test(editingUser.gcashNumber)) {
      setEditGcashError("GCash must start with 09 and be 11 digits");
      hasError = true;
    } else if (
      editingUser.gcashNumber &&
      editingUser.gcashNumber.length !== 11
    ) {
      setEditGcashError("GCash number must be exactly 11 digits");
      hasError = true;
    } else setEditGcashError("");

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

  const canManageUsers = currentUser.role === "admin";
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter((user) => {
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
  }, [normalizedSearch, users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + rowsPerPage
  );
  const visibleUserIds = useMemo(
    () => paginatedUsers.map((user) => user.id),
    [paginatedUsers]
  );
  const selectedVisibleCount = visibleUserIds.filter((id) =>
    selectedUserIds.includes(id)
  ).length;
  const allVisibleSelected =
    visibleUserIds.length > 0 && selectedVisibleCount === visibleUserIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const columnCount = 5 + (showSecureIds ? 1 : 0) + (canManageUsers ? 2 : 0);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const userIds = new Set(users.map((user) => user.id));
    setSelectedUserIds((prev) => prev.filter((id) => userIds.has(id)));
  }, [users]);

  return (
    <div className="space-y-6 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex flex-wrap gap-3">
          {canManageUsers && (
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setShowInactiveModal(true)}
            >
              <UserX className="h-4 w-4 mr-2" />
              Inactive Users
            </Button>
          )}
          {canManageUsers && (
            <Button
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setShowSupervisorForm(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Supervisor
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle>System Users</CardTitle>
            <Button
              variant={showSecureIds ? "destructive" : "outline"} // Red when showing
              size="sm"
              onClick={handleToggleSecureIds}
            >
              {showSecureIds ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showSecureIds ? "Hide" : "Show"} Secure IDs
            </Button>
            {/* ---------------------- */}

          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="w-full md:w-72">
              <Input
                placeholder="Search by name, email, role, or school..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Rows</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              {canManageUsers && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedUserIds.length === 0}
                  onClick={handleDeactivateSelected}
                >
                  Deactivate Selected
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto max-w-full">
            <Table className="w-full min-w-[900px] table-fixed [&_th]:whitespace-normal [&_td]:whitespace-normal">
              <TableHeader>
                <TableRow>
                  {canManageUsers && (
                    <TableHead className="w-10 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={
                            allVisibleSelected
                              ? true
                              : someVisibleSelected
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={(value) => {
                            if (value) {
                              const next = new Set(selectedUserIds);
                              visibleUserIds.forEach((id) => next.add(id));
                              setSelectedUserIds(Array.from(next));
                            } else {
                              setSelectedUserIds((prev) =>
                                prev.filter(
                                  (id) => !visibleUserIds.includes(id)
                                )
                              );
                            }
                          }}
                          aria-label="Select all visible users"
                        />
                      </div>
                    </TableHead>
                  )}
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Contact</TableHead>
                  {showSecureIds && <TableHead>Secure ID</TableHead>}
                  <TableHead>Employee #</TableHead>
                  {canManageUsers && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      className="text-center text-muted-foreground"
                    >
                      No users match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/40">
                      {canManageUsers && (
                        <TableCell className="p-0 text-center align-middle">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedUserIds.includes(user.id)}
                              disabled={user.id === currentUser.id}
                              onCheckedChange={(value) => {
                                if (value) {
                                  setSelectedUserIds((prev) =>
                                    prev.includes(user.id)
                                      ? prev
                                      : [...prev, user.id]
                                  );
                                } else {
                                  setSelectedUserIds((prev) =>
                                    prev.filter((id) => id !== user.id)
                                  );
                                }
                              }}
                              aria-label={`Select ${user.name}`}
                            />
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <div>{user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="break-all">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          <span className="md:hidden">
                            {getRoleIcon(user.role)}
                          </span>
                          <span className="hidden md:inline">
                            {user.role.toUpperCase()}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.school || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {user.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {user.phone}
                            </div>
                          )}
                          {user.gcashNumber && (
                            <div className="text-muted-foreground">
                              GCash: {user.gcashNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {showSecureIds && (
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                            {user.secureId || "N/A"}
                          </code>
                        </TableCell>
                      )}
                      <TableCell>
                        <code className="text-xs font-mono">
                          {user.employeeNumber || "N/A"}
                        </code>
                      </TableCell>
                      {canManageUsers && (
                        <TableCell className="text-right">
                          <div className="flex flex-row flex-nowrap gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label="Edit"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 md:hidden" />
                              <span className="hidden md:inline">Edit</span>
                            </Button>
                            {user.id !== currentUser.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                aria-label="Deactivate"
                                onClick={() => handleDeactivateUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 md:hidden" />
                                <span className="hidden md:inline">
                                  Deactivate
                                </span>
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
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length === 0
                ? "No users found."
                : `Showing ${startIndex + 1}-${endIndex} of ${
                    filteredUsers.length
                  }`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span className="text-sm">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- NEW: Password Verification Modal --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-5 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Verification
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowPasswordModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Please enter your admin password to reveal Secure IDs.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-pass">Password</Label>
                <Input
                    id="verify-pass"
                    type="password"
                    placeholder="Enter password..."
                    value={verifyPassword}
                    onChange={(e) => {
                        setVerifyPassword(e.target.value);
                        setVerifyError("");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleVerifyPassword();
                    }}
                    className={verifyError ? "border-destructive" : ""}
                    autoFocus
                />
                {verifyError && (
                    <p className="text-sm text-destructive">{verifyError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleVerifyPassword} disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Show"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------- */}

      {/* Inactive Users Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
             {/* ... (Existing Inactive Modal Content) ... */}
            <div className="p-5 sm:p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Inactive / Deactivated Users
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInactiveModal(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                These accounts are deactivated and cannot log in.
              </p>
            </div>

            <div className="flex-1 overflow-hidden p-4 sm:p-6">
              {loadingInactive ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading inactive users...
                </div>
              ) : inactiveUsers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Users className="h-14 w-14 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No inactive users found</p>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[180px]">Name</TableHead>
                        <TableHead className="min-w-[110px]">Role</TableHead>
                        <TableHead className="min-w-[140px]">School</TableHead>
                        <TableHead className="min-w-[160px]">Contact</TableHead>
                        {showSecureIds && (
                          <TableHead className="min-w-[140px]">
                            Secure ID
                          </TableHead>
                        )}
                        <TableHead className="min-w-[110px]">
                          Employee #
                        </TableHead>
                        <TableHead className="min-w-[140px] text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactiveUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="break-all">
                                {user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.school || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {user.phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="h-3.5 w-3.5 shrink-0" />
                                  {user.phone}
                                </div>
                              )}
                              {user.gcashNumber && (
                                <div className="text-muted-foreground">
                                  GCash: {user.gcashNumber}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {showSecureIds && (
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                                {user.secureId || "N/A"}
                              </code>
                            </TableCell>
                          )}
                          <TableCell>
                            <code className="text-xs font-mono">
                              {user.employeeNumber || "N/A"}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRestoreUser(user.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1.5" />
                              Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Signup Form */}
      {showSupervisorForm && (
        <SupervisorSignupForm
          onSignup={handleCreateSupervisor}
          onClose={() => setShowSupervisorForm(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
             {/* ... (Existing Edit Modal Content - matching your code) ... */}
            <div className="p-5 sm:p-6 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit User</h2>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Update user information.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingUser.name || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                  />
                </div>
                <div>
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
                    <p className="text-sm text-destructive mt-1.5">
                      {editEmailError}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editingUser.phone || ""}
                    maxLength={13}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, "");
                      if (val.includes("+")) val = "+" + val.replace(/\+/g, "");
                      val = val.startsWith("+")
                        ? val.slice(0, 13)
                        : val.slice(0, 11);
                      setEditingUser({ ...editingUser, phone: val });
                      setEditPhoneError("");
                    }}
                    className={editPhoneError ? "border-destructive" : ""}
                  />
                  {editPhoneError && (
                    <p className="text-sm text-destructive mt-1.5">
                      {editPhoneError}
                    </p>
                  )}
                </div>

                <div>
                  <Label>GCash Number</Label>
                  <Input
                    value={editingUser.gcashNumber || ""}
                    maxLength={11}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/[^\d]/g, "")
                        .slice(0, 11);
                      setEditingUser({ ...editingUser, gcashNumber: val });
                      setEditGcashError("");
                    }}
                    className={editGcashError ? "border-destructive" : ""}
                  />
                  {editGcashError && (
                    <p className="text-sm text-destructive mt-1.5">
                      {editGcashError}
                    </p>
                  )}
                </div>

                <div>
                  <Label>School / Institution</Label>
                  <Input
                    value={editingUser.school || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, school: e.target.value })
                    }
                  />
                </div>

                <div>
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

                <div>
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

                <div>
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
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveUser} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!canManageUsers && (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Limited Access</h3>
            <p className="text-muted-foreground">
              Only administrators can manage users and view inactive accounts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
