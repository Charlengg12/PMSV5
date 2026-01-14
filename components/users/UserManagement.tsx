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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
  Crown,
  Wrench,
  User as UserIcon,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { SupervisorSignupForm } from "../auth/SupervisorSignupForm";
import { User } from "../../types";
import Swal from "sweetalert2";

interface UserManagementProps {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User;
}

export function UserManagement({
  users,
  setUsers,
  currentUser,
}: UserManagementProps) {
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);
  const [showSecureIds, setShowSecureIds] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editEmailError, setEditEmailError] = useState<string>("");
  const [editPhoneError, setEditPhoneError] = useState<string>("");
  const [editGcashError, setEditGcashError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const handleCreateSupervisor = async (newSupervisor: User) => {
    // After adding, fetch the latest users from backend for true refresh
    try {
      const response = await apiService.getUsers();
      if (response.data) {
        const mapped = response.data.map(mapUserDataFromBackend);
        setUsers(mapped);
      } else {
        // fallback: add locally if fetch fails
        setUsers([...users, newSupervisor]);
      }
    } catch (err) {
      setUsers([...users, newSupervisor]);
    }
    setShowSupervisorForm(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setEditEmailError("");
    setEditPhoneError("");
    setEditGcashError("");
    setShowEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      const phoneRegex = /^(\+639|09)\d{9}$/;
      const gcashRegex = /^09\d{9}$/;
      let hasError = false;

      if (!emailRegex.test(editingUser.email)) {
        setEditEmailError(
          "Please enter a valid Gmail address (e.g., example@gmail.com)"
        );
        hasError = true;
      } else {
        setEditEmailError("");
      }

      if (editingUser.phone && !phoneRegex.test(editingUser.phone)) {
        setEditPhoneError("Phone must be +639123456789 or 09123456789");
        hasError = true;
      } else if (
        editingUser.phone &&
        editingUser.phone.length !== 13 &&
        editingUser.phone.length !== 11
      ) {
        setEditPhoneError("Phone must be 13 or 11 digits");
        hasError = true;
      } else {
        setEditPhoneError("");
      }

      if (
        editingUser.gcashNumber &&
        !gcashRegex.test(editingUser.gcashNumber)
      ) {
        setEditGcashError(
          "GCash number must be 11 digits starting with 09 (e.g., 09123456789)"
        );
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

      // Check if any field actually changed
      const originalUser = users.find((u) => u.id === editingUser.id);
      if (
        originalUser &&
        JSON.stringify(originalUser) === JSON.stringify(editingUser)
      ) {
        Swal.fire({
          icon: "info",
          title: "No Changes Detected",
          text: "No information was changed.",
          showConfirmButton: false,
          timer: 1500,
        });
        setShowEditDialog(false);
        setEditingUser(null);
        return;
      }

      // Update user in database
      try {
        await apiService.updateUser(editingUser.id, editingUser);
        // Refresh user list from backend
        const response = await apiService.getUsers();
        if (response.data) {
          const mapped = response.data.map(mapUserDataFromBackend);
          setUsers(mapped);
        }
        setShowEditDialog(false);
        setEditingUser(null);
        Swal.fire({
          icon: "success",
          title: "User Updated!",
          text: "The user information has been successfully updated.",
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Could not update user information.",
        });
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await Swal.fire({
      title: "Deactivate User?",
      text: "This action can be undone by reactivating.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });
    if (result.isConfirmed) {
      // Optionally, call backend to set is_active = 0
      try {
        await apiService.updateUser(userId, { is_active: 0 });
        const response = await apiService.getUsers();
        if (response.data) {
          const mapped = response.data.map(mapUserDataFromBackend);
          setUsers(mapped);
        } else {
          setUsers(users.filter((u) => u.id !== userId));
        }
        Swal.fire({
          icon: "success",
          title: "User Deactivated",
          text: "The user has been deactivated.",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Failed to Deactivate",
          text: "Could not deactivate the user.",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
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
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / rowsPerPage)
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndex = Math.min(
    startIndex + rowsPerPage,
    filteredUsers.length
  );
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + rowsPerPage
  );
  const columnCount =
    5 + (showSecureIds ? 1 : 0) + (currentUser.role === "admin" ? 1 : 0);
  const visibleUserIds = useMemo(
    () => paginatedUsers.map((user) => user.id),
    [paginatedUsers]
  );
  const selectedVisibleCount = visibleUserIds.filter((id) =>
    selectedUserIds.includes(id)
  ).length;
  const allVisibleSelected =
    visibleUserIds.length > 0 &&
    selectedVisibleCount === visibleUserIds.length;
  const someVisibleSelected =
    selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    const userIds = new Set(users.map((user) => user.id));
    setSelectedUserIds((prev) => prev.filter((id) => userIds.has(id)));
  }, [users]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>User Management</h2>
        {canManageUsers && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowSupervisorForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Supervisor
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>System Users</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecureIds(!showSecureIds)}
            >
              {showSecureIds ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showSecureIds ? "Hide" : "Show"} Secure IDs
            </Button>
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
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
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
                          prev.filter((id) => !visibleUserIds.includes(id))
                        );
                      }
                    }}
                    aria-label="Select all visible users"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>School/Institution</TableHead>
                <TableHead>Contact</TableHead>
                {showSecureIds && <TableHead>Secure ID</TableHead>}
                <TableHead>Employee #</TableHead>
                {currentUser.role === "admin" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount + 1}
                    className="text-center text-muted-foreground"
                  >
                    No users match your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
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
                    <TableCell>{user.school}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.gcashNumber && (
                          <div className="text-sm text-muted-foreground">
                            GCash: {user.gcashNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {showSecureIds && (
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {user.secureId}
                        </code>
                      </TableCell>
                    )}
                    <TableCell>
                      <code className="text-xs">{user.employeeNumber}</code>
                    </TableCell>
                    {currentUser.role === "admin" && (
                      <TableCell>
                        <div className="flex gap-2">
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
                              variant="outline"
                              size="sm"
                              className="border-destructive text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label="Deactivate"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive md:hidden" />
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
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
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

      {!canManageUsers && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">Limited Access</h3>
              <p className="text-muted-foreground">
                Only administrators can manage users and create supervisor
                accounts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showSupervisorForm && (
        <SupervisorSignupForm
          onSignup={handleCreateSupervisor}
          onClose={() => setShowSupervisorForm(false)}
        />
      )}

      {showEditDialog && editingUser && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingUser.name || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
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
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingUser.phone || ""}
                    maxLength={13}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, "");
                      if (val.includes("+")) {
                        val = "+" + val.replace(/\+/g, "");
                      }
                      if (val.startsWith("+")) {
                        val = val.slice(0, 13);
                      } else {
                        val = val.slice(0, 11);
                      }
                      setEditingUser({ ...editingUser, phone: val });
                      setEditPhoneError("");
                    }}
                    className={editPhoneError ? "border-destructive" : ""}
                  />
                  {editPhoneError && (
                    <p className="text-sm text-destructive">{editPhoneError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gcashNumber">GCash Number</Label>
                  <Input
                    id="gcashNumber"
                    value={editingUser.gcashNumber || ""}
                    maxLength={11}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d]/g, "");
                      val = val.slice(0, 11);
                      setEditingUser({
                        ...editingUser,
                        gcashNumber: val,
                      });
                      setEditGcashError("");
                    }}
                    className={editGcashError ? "border-destructive" : ""}
                  />
                  {editGcashError && (
                    <p className="text-sm text-destructive">{editGcashError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="school">School/Institution</Label>
                  <Input
                    id="school"
                    value={editingUser.school || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, school: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        role: value as User["role"],
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
                  <Label htmlFor="secureId">Secure ID</Label>
                  <Input
                    id="secureId"
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
                  <Label htmlFor="employeeNumber">Employee #</Label>
                  <Input
                    id="employeeNumber"
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
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
