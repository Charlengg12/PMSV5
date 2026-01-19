import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import {
  UserPlus,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Users,
  Search,
} from "lucide-react";
import { User, Project } from "../../types";
import { apiService } from "../../utils/apiService";
import Swal from "sweetalert2";

interface ClientCreationDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onClientCreated: (client: User) => void;
}

export function ClientCreationDialog({
  open,
  onClose,
  project,
  onClientCreated,
}: ClientCreationDialogProps) {
  // Mode: 'create' | 'existing'
  const [mode, setMode] = useState<"create" | "existing">("create");

  // Create Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Existing Client State
  const [existingClients, setExistingClients] = useState<User[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Shared State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isAssigned = !!(
    project.clientName && project.clientName.trim().length > 0
  );

  // Fetch existing clients when dialog opens
  useEffect(() => {
    if (open) {
      const fetchClients = async () => {
        try {
          const response = await apiService.getUsers({ role: "client" });
          if (response.data) {
            // Handle different API response structures (array vs object with users key)
            const users = Array.isArray(response.data)
              ? response.data
              : response.data.users || [];

            // STRICT FILTER: Only show users with role === 'client'
            const onlyClients = users.filter((u: User) => u.role === "client");

            setExistingClients(onlyClients);
          }
        } catch (error) {
          console.error("Failed to fetch clients", error);
        }
      };
      fetchClients();
    }
  }, [open]);

  if (!open) return null;

  // --- Logic for Create New ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Client name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.phone && !/^(\+639|09)\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid Philippine phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAssigned) return showAssignedWarning();
    if (!validateForm()) return;

        confirmAction(
          "Create client account?",
          `This will create a new client account for ${formData.name} and assign them to ${project.name}.`,
          async () => {
            const response = await apiService.createClient({
              ...formData,
              projectId: project.id,
              projectName: project.name,
            });
            if (response.data) {
              const user = response.data.user || response.data;
              user.clientProjectId = project.id;
              return user;
            } else {
              throw new Error(response.error || "Failed to create client");
            }
          }
        );
  };

  // --- Logic for Select Existing ---
  const handleExistingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAssigned) return showAssignedWarning();

    if (!selectedClientId) {
      setErrors({ selection: "Please select a client" });
      return;
    }

    const clientToAssign = existingClients.find(
      (c) => c.id === selectedClientId
    );
    if (!clientToAssign) return;

        confirmAction(
          "Assign existing client?",
          `This will give ${clientToAssign.name} access to view ${project.name}.`,
          async () => {
            const response = await apiService.updateProject(project.id, {
              clientId: clientToAssign.id,
              clientName: clientToAssign.name,
            });

            if (!response.data) {
              throw new Error(response.error || "Failed to assign client");
            }

            await apiService.updateUser(clientToAssign.id, {
              clientProjectId: project.id,
            });

            return { ...clientToAssign, clientProjectId: project.id };
          }
        );
  };

  // --- Shared Helpers ---
  const showAssignedWarning = () => {
    Swal.fire({
      icon: "warning",
      title: "Client Already Assigned",
      text: `This project already has a client (${project.clientName}).`,
      confirmButtonText: "OK",
      customClass: {
        container: "swal-container",
        popup: "swal-popup",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
        icon: "swal-icon",
      },
    });
  };

  const confirmAction = async (
    title: string,
    text: string,
    action: () => Promise<User>
  ) => {
    const result = await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      customClass: {
        container: "swal-container",
        popup: "swal-popup",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
        icon: "swal-icon",
      },
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Processing...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        container: "swal-container",
        popup: "swal-popup",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
        icon: "swal-icon",
      },
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setIsLoading(true);

    try {
      const client = await action();
      setCreatedClient(client);
      onClientCreated(client);

      Swal.close();
      await Swal.fire({
        title: "Success!",
        text: `Client access for ${client.name} has been set up.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
          icon: "swal-icon",
        },
      });
    } catch (err: any) {
      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Assigned Successfully",
        confirmButtonText: "OK",
        customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
          icon: "swal-icon",
        },
      });
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", phone: "", password: "" });
    setErrors({});
    setCreatedClient(null);
    setShowPassword(false);
    setMode("create");
    setSelectedClientId("");
    setSearchTerm("");
    onClose();
  };

  const filteredClients = existingClients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ────────────────────────────────────────────────
  //  Main Modal Structure
  // ────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-background rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 modal"
        onClick={(e) => e.stopPropagation()}
      >
        {createdClient ? (
          // --- SUCCESS VIEW ---
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Client Assigned!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>{createdClient.name}</strong> is now linked to{" "}
                <strong>{project.name}</strong>
              </p>
            </div>

            {mode === "create" ? (
              // NEW CLIENT: Show credentials
              <div className="space-y-5">
                <Alert>
                  <AlertDescription>
                    Login credentials sent to{" "}
                    <strong>{createdClient.email}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm font-medium">Client Login Credentials</p>
                  <div className="space-y-2.5">
                    {/* Client ID */}
                    <div className="flex items-center justify-between p-2.5 bg-background rounded border">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Client ID
                        </p>
                        <p className="font-mono text-sm">
                          {createdClient.secureId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleCopy(createdClient.secureId, "secureId")
                        }
                      >
                        {copiedField === "secureId" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {/* Email */}
                    <div className="flex items-center justify-between p-2.5 bg-background rounded border">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm">{createdClient.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleCopy(createdClient.email, "email")
                        }
                      >
                        {copiedField === "email" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {/* Password */}
                    <div className="flex items-center justify-between p-2.5 bg-background rounded border">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Password
                        </p>
                        <p className="font-mono text-sm">••••••••</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        As set
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // EXISTING CLIENT: Just show info
              <div className="p-4 bg-blue-50 text-blue-800 rounded mb-6 text-sm text-center border border-blue-100">
                Existing client credentials remain unchanged. The client can now see this project in their dashboard.
              </div>
            )}

            <Button onClick={handleClose} className="w-full mt-4">
              Done
            </Button>
          </div>
        ) : (
          // --- INPUT FORMS ---
          <>
            <div className="p-6 border-b pb-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Assign Client</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <span className="sr-only">Close</span>×
                </Button>
              </div>

              {/* TABS */}
              <div className="flex border-b">
                <button
                  onClick={() => setMode("create")}
                  className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    mode === "create"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create New
                </button>
                <button
                  onClick={() => setMode("existing")}
                  className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    mode === "existing"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Select Existing
                </button>
              </div>
            </div>

            {isAssigned && (
              <div className="px-6 pt-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    Client already assigned: {project.clientName}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {mode === "create" ? (
              // ────────────────────────────────────────────────
              // CREATE NEW FORM
              // ────────────────────────────────────────────────
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                    disabled={isAssigned || isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                    disabled={isAssigned || isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="+639..."
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={errors.phone ? "border-destructive" : ""}
                    disabled={isAssigned || isLoading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 chars"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={errors.password ? "border-destructive" : ""}
                      disabled={isAssigned || isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isAssigned || isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>
                
                {/* --- DISPLAY TEXT ADDED HERE --- */}
                <div className="text-sm text-muted-foreground bg-muted/40 p-3 rounded border">
                   Client will receive login credentials via email and can view project progress & documents only.
                </div>
                {/* ------------------------------- */}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || isAssigned}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Client
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // ────────────────────────────────────────────────
              // SELECT EXISTING FORM
              // ────────────────────────────────────────────────
              <form onSubmit={handleExistingSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Find Client</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={isAssigned || isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select User</Label>
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {existingClients.length === 0
                          ? "Loading clients..."
                          : "No clients found matching search."}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className={`p-3 cursor-pointer hover:bg-muted/50 flex items-center justify-between transition-colors ${
                              selectedClientId === client.id
                                ? "bg-primary/5 border-l-4 border-primary"
                                : ""
                            }`}
                            onClick={() => {
                              if (!isAssigned) {
                                setSelectedClientId(client.id);
                                setErrors({});
                              }
                            }}
                          >
                            <div className="overflow-hidden">
                              <p className="font-medium text-sm truncate">
                                {client.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {client.email}
                              </p>
                            </div>
                            {selectedClientId === client.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.selection && (
                    <p className="text-sm text-destructive">
                      {errors.selection}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      isLoading || isAssigned || !selectedClientId
                    }
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Selected"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
