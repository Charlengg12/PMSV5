import { useState } from "react";
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
import { Alert, AlertDescription } from "../ui/alert";
import { ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react";
import { User } from "../../types";
import { CompanyLogo } from "../ui/company-logo";
import { RegistrationSuccessDialog } from "./RegistrationSuccessDialog";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";

// Schools list for the dropdown
const SCHOOLS = [
  "Ehub University",
  "Philippine State College of Aeronautics",
  "Technical Education and Skills Development Authority",
  "University of the Philippines",
  "Ateneo de Manila University",
  "De La Salle University",
  "University of Santo Tomas",
  "Far Eastern University",
  "Polytechnic University of the Philippines",
  "Technological University of the Philippines",
  "Mapúa University",
  "Adamson University",
  "University of the East",
  "National University",
  "San Beda University",
  "Other",
];

interface FabricatorSignupFormProps {
  onSignup: (user: User) => void;
  onBackToMain: () => void;
}

export function FabricatorSignupForm({
  onSignup,
  onBackToMain,
}: FabricatorSignupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    school: "",
    phone: "+63 ",
    gcashNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  // Validation regex patterns
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/; // Only gmail.com allowed
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-])[A-Za-z\d@$!%*?&_\-]{8,}$/;
  const phoneRegex = /^\+63 \d{3} \d{3} \d{4}$/; // Format: +63 934 836 1937
  const gcashRegex = /^09\d{9}$/; // Format: 09374638264 (11 digits starting with 09)

  const handleInputChange = (field: string, value: string) => {
    // Format phone number as user types
    if (field === "phone") {
      // Extract only digits from input
      let digits = value.replace(/\D/g, "");

      // Remove leading 63 if present (will be added back with +)
      if (digits.startsWith("63")) {
        digits = digits.slice(2);
      }
      // Remove leading 0 if present
      if (digits.startsWith("0")) {
        digits = digits.slice(1);
      }

      // Limit to 10 digits (the part after +63)
      digits = digits.slice(0, 10);

      // Always format with +63 prefix and spaces: +63 XXX XXX XXXX
      let formatted = "+63 ";
      if (digits.length > 0) formatted += digits.slice(0, 3);
      if (digits.length > 3) formatted += " " + digits.slice(3, 6);
      if (digits.length > 6) formatted += " " + digits.slice(6, 10);

      value = formatted;
    }

    // Format GCash number - only allow digits, max 11, must start with 09
    if (field === "gcashNumber") {
      let cleaned = value.replace(/\D/g, "");
      // Limit to 11 digits
      cleaned = cleaned.slice(0, 11);
      value = cleaned;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!emailRegex.test(formData.email))
      return "Please enter a valid Gmail address (e.g., example@gmail.com)";
    if (!formData.password) return "Password is required";
    if (!passwordRegex.test(formData.password))
      return "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&_-)";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    if (!formData.school) return "School is required";
    if (!formData.phone.trim()) return "Phone number is required";
    if (!phoneRegex.test(formData.phone))
      return "Phone number must be in format: +63 XXX XXX XXXX (e.g., +63 934 836 1937)";
    if (!formData.gcashNumber.trim()) return "GCash number is required";
    if (!gcashRegex.test(formData.gcashNumber))
      return "GCash number must be 11 digits starting with 09 (e.g., 09374638264)";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        school: formData.school,
        phone: formData.phone,
        gcashNumber: formData.gcashNumber,
      });

      if (response.data) {
        const rawUserData = response.data.user || response.data;
        const userData = mapUserDataFromBackend(rawUserData);
        setRegisteredUser(userData);
        setShowSuccessDialog(true);
      } else {
        throw new Error(response.error || "Signup failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    if (registeredUser) {
      onSignup(registeredUser);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    onBackToMain();
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden py-8">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex items-center justify-center mb-4">
              <CompanyLogo size="xl" showText={false} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-6 w-6 text-accent" />
                <CardTitle className="text-2xl">
                  Fabricator Registration
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                Create your fabricator account
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      required
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
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school">School/Institution</Label>
                <Select
                  value={formData.school}
                  onValueChange={(value) => handleInputChange("school", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your school" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOLS.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+63 934 836 1937"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    maxLength={16}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: +63 XXX XXX XXXX
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gcashNumber">GCash Number</Label>
                  <Input
                    id="gcashNumber"
                    type="tel"
                    placeholder="09374638264"
                    value={formData.gcashNumber}
                    onChange={(e) =>
                      handleInputChange("gcashNumber", e.target.value)
                    }
                    maxLength={11}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    11 digits starting with 09
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onBackToMain}
                  className="w-full"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>

            <div className="text-xs text-muted-foreground text-center">
              <p>
                By creating an account, you agree to our terms of service and
                privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <RegistrationSuccessDialog
        isOpen={showSuccessDialog}
        user={registeredUser}
        onClose={handleCloseDialog}
        onContinue={handleContinueToDashboard}
      />
    </>
  );
}
