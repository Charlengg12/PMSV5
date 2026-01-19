import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "../ui/alert";
import { Separator } from "../ui/separator";
import { Shield, UserPlus, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { User } from "../../types";
import { CompanyLogo } from "../ui/company-logo";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";

interface LoginFormProps {
  onLogin: (user: User) => void;
  onShowSignup: () => void;
  onShowForgotPassword: () => void;
}

export function LoginForm({
  onLogin,
  onShowSignup,
  onShowForgotPassword,
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // Clear error when typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await apiService.login(
        formData.identifier,
        formData.password
      );

      if (response.data?.user) {
        if (response.data.token) {
          apiService.setToken(response.data.token);
        }

        const userData = mapUserDataFromBackend(response.data.user);

        setShowLoginAnimation(true);
        setTimeout(() => {
          setShowLoginAnimation(false);
          onLogin(userData);
        }, 1800); // slightly shorter feel
        return;
      }

      throw new Error("No user data returned from API");
    } catch (err) {
      // ──────────────── Demo fallback ────────────────
      let demoUser: User | null = null;
      const identifierLower = formData.identifier.toLowerCase();
      const password = formData.password;

      if (identifierLower === "admin" && password === "password123") {
        demoUser = {
          id: "admin-1",
          name: "Demo Administrator",
          email: "admin@ehub.com",
          role: "admin" as const,
          school: "Ehub University",
          phone: "+63 123 456 7890",
          gcashNumber: "09123456789",
          secureId: "ADM001",
          employeeNumber: "EMP001",
          isActive: true,
          createdAt: new Date().toISOString(),
          department: "Administration",
        };
      } else if (identifierLower === "supervisor" && password === "password123") {
        demoUser = {
          id: "supervisor-1",
          name: "Demo Supervisor",
          email: "supervisor@ehub.com",
          role: "supervisor" as const,
          school: "Ehub University",
          phone: "+63 987 654 3210",
          gcashNumber: "09987654321",
          secureId: "SUP001",
          employeeNumber: "EMP101",
          isActive: true,
          createdAt: new Date().toISOString(),
          department: "Demo Department",
        };
      }

      if (demoUser) {
        setShowLoginAnimation(true);
        setTimeout(() => {
          setShowLoginAnimation(false);
          onLogin(demoUser);
        }, 1800);
        return;
      }

      setError(
        err instanceof Error ? err.message : "Invalid credentials or server error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#103055] dark:bg-slate-950 relative overflow-hidden transition-colors duration-300 px-4 sm:px-6">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 z-20 p-2 rounded-lg bg-white/10 dark:bg-white/20 hover:bg-white/20 dark:hover:bg-white/30 text-white transition-all duration-300"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-0 bg-white dark:bg-slate-900 dark:border dark:border-slate-700 backdrop-blur-sm transition-colors duration-300 p-4 sm:p-6 my-6 sm:my-0">
        <CardHeader className="p-0 text-center space-y-3 pb-6">
          <div className="flex items-center justify-center mb-4">
            <CompanyLogo size="xl" showText={true} className="font-[Archivo_Black]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-[Archivo_Black] dark:text-white w-auto max-w-none whitespace-normal overflow-visible text-center leading-snug">
                Ehub Project Management
              </CardTitle>
            </div>
            <CardDescription className="text-base dark:text-slate-400 text-center">
              Enter your credentials to access the system
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="dark:text-slate-200">
                Employee ID / Secure ID / Email
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your ID or email"
                value={formData.identifier}
                onChange={(e) => handleInputChange("identifier", e.target.value)}
                required
                disabled={isLoading || showLoginAnimation}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              />
              <p className="text-xs text-muted-foreground dark:text-slate-500">
                Use your Employee ID, Secure ID, or email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-slate-200">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  disabled={isLoading || showLoginAnimation}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || showLoginAnimation}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="dark:border-red-900/50 dark:bg-red-950/20">
                <AlertDescription className="dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base bg-accent hover:bg-accent/90 dark:bg-accent dark:hover:bg-accent/80 font-[Archivo_Black] dark:text-white transition-colors duration-300"
              disabled={isLoading || showLoginAnimation}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={onShowForgotPassword}
              className="text-sm text-primary hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
              disabled={isLoading || showLoginAnimation}
            >
              Forgot your password?
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="dark:bg-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background dark:bg-slate-900 px-2 text-muted-foreground dark:text-slate-500">
                New Fabricator?
              </span>
            </div>
          </div>

          <Button
            onClick={onShowSignup}
            variant="outline"
            className="w-full h-11 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors duration-300"
            disabled={isLoading || showLoginAnimation}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up as Fabricator
          </Button>
        </CardContent>
      </Card>

      {/* ──── Login Success Overlay ───── */}
      {showLoginAnimation && (
        <div className="fixed inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary dark:bg-blue-600 animate-spin"></div>
            <div className="w-16 h-16 rounded-xl bg-accent dark:bg-orange-600 animate-spin [animation-delay:150ms]"></div>
            <div className="w-16 h-16 rounded-xl bg-primary dark:bg-blue-600 animate-spin [animation-delay:300ms]"></div>
          </div>

          <div className="text-xl font-semibold text-primary dark:text-blue-400 tracking-wide">
            Logging you in...
          </div>

          <div className="mt-4 text-sm text-muted-foreground dark:text-slate-400">
            Please wait a moment
          </div>
        </div>
      )}
    </div>
  );
}
