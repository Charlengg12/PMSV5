import { useState } from "react";
import Swal from "sweetalert2";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { X, UserPlus, Shield, Eye, EyeOff } from "lucide-react";
import { User } from "../../types";
// import { generateSecureId, generateEmployeeNumber } from "../../utils/secureId";
// import { apiService } from "../../utils/apiService";

interface SupervisorSignupFormProps {
  onSignup: (user: User) => void;
  onClose: () => void;
}

export function SupervisorSignupForm({
  onSignup,
  onClose,
}: SupervisorSignupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    "Production",
    "Quality Control",
    "Operations",
    "Manufacturing",
    "Engineering",
    "Safety",
    "Maintenance",
  ];

  // Validation regex patterns
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/; // Only gmail.com allowed
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-])[A-Za-z\d@$!%*?&_\-]{8,}$/;
  const phoneRegex = /^(\+639|09)\d{9}$/; // Format: +639123456789 or 09123456789

  const validateForm = async () => {
    const swalCustomClasses = {
      container: "swal-container",
      popup: "swal-popup !max-w-md",
      title: "swal-title",
      htmlContainer: "swal-content",
      confirmButton: "swal-confirm-button",
      cancelButton: "swal-cancel-button",
    };

    if (!formData.name.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Full name is required",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!formData.email.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Email is required",
        customClass: swalCustomClasses,
      });
      return false;
    } else if (!emailRegex.test(formData.email)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid Gmail address (e.g., example@gmail.com)",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!formData.password.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Password is required",
        customClass: swalCustomClasses,
      });
      return false;
    } else if (!passwordRegex.test(formData.password)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Password",
        text: "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&_-)",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!formData.phone.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Phone number is required",
        customClass: swalCustomClasses,
      });
      return false;
    } else if (!phoneRegex.test(formData.phone)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Phone",
        text: "Phone must be +639XXXXXXXXX or 09XXXXXXXXX (12 or 11 digits)",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!formData.department) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Department selection is required",
        customClass: swalCustomClasses,
      });
      return false;
    }

    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    // Format phone number - only allow digits and + at the start
    if (field === "phone") {
      // Only allow digits and + at the beginning
      let cleaned = value.replace(/[^\d+]/g, "");
      // Ensure + only appears at the start
      if (cleaned.includes("+")) {
        cleaned = "+" + cleaned.replace(/\+/g, "");
      }
      // Limit length: +639XXXXXXXXX (13 chars) or 09XXXXXXXXX (11 chars)
      if (cleaned.startsWith("+")) {
        cleaned = cleaned.slice(0, 13); // +639123456789
      } else {
        cleaned = cleaned.slice(0, 11); // 09123456789
      }
      value = cleaned;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text:
        "Name: " +
        formData.name +
        "\nEmail: " +
        formData.email +
        "\nDepartment: " +
        formData.department,
      icon: "info",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      allowOutsideClick: false,
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

    if (!result.isConfirmed) {
      return;
    }

    // Show loading
    Swal.fire({
      title: "Creating supervisor account...",
      allowOutsideClick: false,
      allowEscapeKey: false,
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
      const response = await apiService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        school: formData.department, // For supervisor, use department as school
        phone: formData.phone,
        role: "supervisor",
      });

      if (response.data && response.data.user) {
        const userData = mapUserDataFromBackend(response.data.user);

        // Fake minimum delay so loading feels consistent (remove/adjust if backend is very fast)
        await new Promise((resolve) => setTimeout(resolve, 2800));

        await Swal.fire({
          title: "Supervisor Created!",
          text: "The supervisor has been successfully added.",
          icon: "success",
          showConfirmButton: false,
          timer: 2200,
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

        onSignup(userData);

        // Optional: close modal / reset form / navigate
        // onClose?.();
        // resetForm();
      } else {
        throw new Error(response.error || "Signup failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create supervisor account";

      await Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
        customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          icon: "swal-icon",
        },
      });
    } finally {
      setIsLoading(false);
      Swal.close(); // Make sure loading is closed in all cases
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto modal p-4 sm:p-6">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              <CardTitle>Create Supervisor Account</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Add a new supervisor to the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                minLength={1}
                maxLength={30}
                id="name"
                type="text"
                placeholder="Enter supervisor's full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                minLength={1}
                maxLength={30}
                id="email"
                type="email"
                placeholder="Enter supervisor's email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                minLength={1}
                maxLength={13}
                id="phone"
                type="tel"
                placeholder="+639123456789 or 09123456789"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: +639XXXXXXXXX or 09XXXXXXXXX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  handleInputChange("department", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Account Information</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="default">Supervisor</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Secure ID:</span>
                  <span className="font-mono text-xs">Auto-generated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="text-xs">Administrator</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Supervisor
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
