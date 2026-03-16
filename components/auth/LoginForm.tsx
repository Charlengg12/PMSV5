import React, { useEffect, useState } from "react";
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
import {
  Shield,
  UserPlus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Moon,
  Sun,
} from "lucide-react";
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
    setError("");
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
        }, 1800);
        return;
      }

      throw new Error("No user data returned from API");
    } catch (err) {
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
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-in-out relative font-[Manrope]">
      <button
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 z-20 p-2 rounded-lg bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 text-slate-900 dark:text-white transition-all duration-500 ease-in-out"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="h-full flex items-center justify-center px-4 sm:px-6">
        <div className="w-[980px] h-[600px] max-w-[95vw] max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 transition-colors duration-500 ease-in-out">
          <div className="grid h-full lg:grid-cols-2">
            <div
              className="relative hidden lg:flex items-center justify-center overflow-hidden bg-slate-900 bg-cover bg-center"
              style={{ backgroundImage: "url('/Image.png')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-900/90"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_55%)]"></div>
              <div className="relative z-10 max-w-md px-10 text-white">
                <img
                  src="/logo.png"
                  alt="Ehub logo"
                  className="h-16 w-16 mb-6 rounded-2xl bg-white/10 p-2 shadow-xl"
                />
                <div className="text-4xl font-[Archivo_Black] tracking-wide">
                  ELECTRONIK <span className="text-orange-300">HUB</span>
                </div>
                <p className="mt-4 text-lg text-slate-200">
                  Creating a Culture of Technological Innovation
                </p>
              </div>
            </div>

            <div className="flex h-full items-center justify-center px-6 py-6 sm:px-10 lg:px-12">
              <Card className="w-full max-w-md border-0 bg-transparent shadow-none transition-colors duration-500 ease-in-out">
                <CardHeader className="space-y-2 pb-4 text-center">
                  <div className="flex items-center justify-center">
                    <CompanyLogo size="lg" showText={true} className="font-[Archivo_Black]" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                      Welcome Back!
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400 font-normal transition-colors duration-500 ease-in-out">
                      Let's build something amazing
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="identifier" className="text-slate-700 dark:text-slate-200 text-[11px] font-semibold uppercase tracking-wide transition-colors duration-500 ease-in-out">
                        Employee ID / Secure ID / Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors duration-500 ease-in-out" />
                        <Input
                          id="identifier"
                          type="text"
                          placeholder="Enter your ID or email"
                          value={formData.identifier}
                          onChange={(e) => handleInputChange("identifier", e.target.value)}
                          required
                          disabled={isLoading || showLoginAnimation}
                          className="h-10 pl-10 border-slate-200 dark:border-slate-700 bg-white  text-slate-00 dark:text-white placeholder:text-slate-400 focus-visible:ring-2  dark:focus-visible:ring-white/60 transition-colors duration-500 ease-in-out font-[Manrope]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out">
                        Use your Employee ID, Secure ID, or email address
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 text-[11px] font-semibold uppercase tracking-wide transition-colors duration-500 ease-in-out">
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={onShowForgotPassword}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-500 ease-in-out font-[Manrope]"
                          disabled={isLoading || showLoginAnimation}
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors duration-500 ease-in-out" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                          disabled={isLoading || showLoginAnimation}
                          className="h-10 pl-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2  dark:focus-visible:ring-white/60 transition-colors duration-500 ease-in-out"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-500 ease-in-out"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading || showLoginAnimation}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-10 text-sm bg-[#102c54] text-white hover:bg-[#0b2444] font-semibold transition-colors duration-500 ease-in-out rounded-lg"
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

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="dark:bg-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out">
                        New Fabricator?
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={onShowSignup}
                    variant="outline"
                    className="w-full h-10 text-sm border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-500 ease-in-out"
                    disabled={isLoading || showLoginAnimation}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up as Fabricator
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {showLoginAnimation && (
        <div className="fixed inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary animate-spin"></div>
            <div className="w-16 h-16 rounded-xl bg-accent animate-spin [animation-delay:150ms]"></div>
            <div className="w-16 h-16 rounded-xl bg-primary animate-spin [animation-delay:300ms]"></div>
          </div>

          <div className="text-xl font-semibold text-primary tracking-wide">
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
