import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
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
import { ArrowLeft, UserPlus, Eye, EyeOff, Moon, Sun } from "lucide-react";
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
    });
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-in-out relative overflow-hidden py-4 px-4 font-[Manrope]">
        <button
          onClick={toggleDarkMode}
          className="absolute top-6 right-6 z-20 p-2 rounded-lg bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 text-slate-900 dark:text-white transition-all duration-500 ease-in-out"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl floating"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl floating-delayed"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl floating"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-2xl floating-delayed"></div>
        </div>

        <Card
          className="w-full max-w-5xl relative z-10 overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl  animate-fade-in transition-colors duration-500 ease-in-out"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 sm:p-6" data-aos="fade-right" data-aos-duration="900">
              <CardHeader
                className="p-0 text-center space-y-2 pb-4"
                data-aos="fade-down"
                data-aos-duration="700"
              >
                <div className="flex items-center justify-center">
                  <CompanyLogo
                    size="lg"
                    showText={true}
                    className="font-[Archivo_Black]"
                  />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-semibold">
                    Fabricator Registration
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Create your fabricator account
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-2"
                  data-aos="fade-up"
                  data-aos-duration="800"
                >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                </div>

                <div className="grid grid-cols-2 gap-2">
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

                <div className="grid grid-cols-2 gap-2">
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

                <div className="space-y-2">
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
            </div>

            <div
              className="relative hidden lg:block h-full bg-slate-950"
              data-aos="fade-left"
              data-aos-duration="900"
            >
              <img
                src="/Image.png"
                alt="Ehub signup visual"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-900/90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_55%)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center text-white">
                <CompanyLogo size="lg" showText={false} />
                <h2
                  className="mt-4 text-4xl font-[Archivo_Black] tracking-wide"
                  data-aos="zoom-in"
                  data-aos-duration="800"
                >
                  ELECTRONIK <span className="text-orange-300">HUB</span>
                </h2>
                <p
                  className="mt-4 text-lg text-slate-200"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay="100"
                >
                  Creating a Culture of Technological Innovation
                </p>
              </div>
            </div>
          </div>
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
