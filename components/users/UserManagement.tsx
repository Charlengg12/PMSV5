import { useState, useEffect } from "react";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
  const [showSecureIds, setShowSecureIds] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [editEmailError, setEditEmailError] = useState<string>("");
  const [editPhoneError, setEditPhoneError] = useState<string>("");
  const [editGcashError, setEditGcashError] = useState<string>("");

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
      setEditEmailError("Please enter a valid Gmail address (example@gmail.com)");
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
    } else if (editingUser.gcashNumber && editingUser.gcashNumber.length !== 11) {
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

  const canManageUsers = currentUser.role === "admin";

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
            <Button size="sm" className="whitespace-nowrap" onClick={() => setShowSupervisorForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Supervisor
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle>Active Users</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecureIds(!showSecureIds)}
            >
              {showSecureIds ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSecureIds ? "Hide" : "Show"} Secure IDs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead className="min-w-[110px]">Role</TableHead>
                  <TableHead className="min-w-[140px]">School</TableHead>
                  <TableHead className="min-w-[160px]">Contact</TableHead>
                  {showSecureIds && <TableHead className="min-w-[140px]">Secure ID</TableHead>}
                  <TableHead className="min-w-[110px]">Employee #</TableHead>
                  {canManageUsers && <TableHead className="min-w-[160px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div>{user.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[180px]">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.school || "—"}</TableCell>
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
                          {user.secureId || "—"}
                        </code>
                      </TableCell>
                    )}
                    <TableCell>
                      <code className="text-xs font-mono">
                        {user.employeeNumber || "—"}
                      </code>
                    </TableCell>
                    {canManageUsers && (
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                          {user.id !== currentUser.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeactivateUser(user.id)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inactive Users Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-5 sm:p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Inactive / Deactivated Users
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowInactiveModal(false)}>
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
                        {showSecureIds && <TableHead className="min-w-[140px]">Secure ID</TableHead>}
                        <TableHead className="min-w-[110px]">Employee #</TableHead>
                        <TableHead className="min-w-[140px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactiveUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[180px]">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.school || "—"}</TableCell>
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
                                {user.secureId || "—"}
                              </code>
                            </TableCell>
                          )}
                          <TableCell>
                            <code className="text-xs font-mono">
                              {user.employeeNumber || "—"}
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
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
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
                    <p className="text-sm text-destructive mt-1.5">{editEmailError}</p>
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
                      val = val.startsWith("+") ? val.slice(0, 13) : val.slice(0, 11);
                      setEditingUser({ ...editingUser, phone: val });
                      setEditPhoneError("");
                    }}
                    className={editPhoneError ? "border-destructive" : ""}
                  />
                  {editPhoneError && (
                    <p className="text-sm text-destructive mt-1.5">{editPhoneError}</p>
                  )}
                </div>

                <div>
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
                    <p className="text-sm text-destructive mt-1.5">{editGcashError}</p>
                  )}
                </div>

                <div>
                  <Label>School / Institution</Label>
                  <Input
                    value={editingUser.school || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, school: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(v) =>
                      setEditingUser({ ...editingUser, role: v as User["role"] })
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
                    onChange={(e) => setEditingUser({ ...editingUser, secureId: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Employee #</Label>
                  <Input
                    value={editingUser.employeeNumber || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, employeeNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
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