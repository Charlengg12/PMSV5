import { useEffect, useState } from "react";
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
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { CompanyLogo } from "../ui/company-logo";
import { apiService } from "../../utils/apiService";

interface ResetPasswordFormProps {
  token: string | null;
  onBackToLogin: () => void;
}

export function ResetPasswordForm({
  token,
  onBackToLogin,
}: ResetPasswordFormProps) {
  const resetTokenStorageKey = "ehub_reset_token";
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-])[A-Za-z\d@$!%*?&_\-]{8,}$/;
  const [localToken, setLocalToken] = useState<string | null>(() => {
    if (token) return token;
    if (typeof window === "undefined") return null;
    const fromSearch = new URLSearchParams(window.location.search).get("token");
    if (fromSearch) return fromSearch;
    const hash = window.location.hash.slice(1);
    if (hash) {
      const queryIndex = hash.indexOf("?");
      if (queryIndex !== -1) {
        const params = new URLSearchParams(hash.slice(queryIndex + 1));
        const fromHash = params.get("token");
        if (fromHash) return fromHash;
      }
    }
    try {
      return sessionStorage.getItem(resetTokenStorageKey);
    } catch {
      return null;
    }
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  useEffect(() => {
    const getTokenFromLocation = (): string | null => {
      if (typeof window === "undefined") return null;
      const fromSearch = new URLSearchParams(window.location.search).get("token");
      if (fromSearch) return fromSearch;
      const hash = window.location.hash.slice(1);
      if (!hash) return null;
      const queryIndex = hash.indexOf("?");
      if (queryIndex === -1) return null;
      const params = new URLSearchParams(hash.slice(queryIndex + 1));
      return params.get("token");
    };

    if (token) {
      setLocalToken(token);
      return;
    }
    try {
      const fromLocation = getTokenFromLocation();
      if (fromLocation) {
        sessionStorage.setItem(resetTokenStorageKey, fromLocation);
        setLocalToken(fromLocation);
        return;
      }
      const stored = sessionStorage.getItem(resetTokenStorageKey);
      if (stored) {
        setLocalToken(stored);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    const checkToken = async () => {
      if (!localToken) {
        if (!isMounted) return;
        const missing = "Reset token is missing. Please request a new link.";
        setTokenError(missing);
        setIsTokenChecked(true);
        return;
      }

      try {
        await apiService.resetPasswordStatus(localToken);
        if (!isMounted) return;
        setTokenError("");
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Reset token already used or expired";
        setTokenError(message);
        setError(message);
      } finally {
        if (!isMounted) return;
        setIsTokenChecked(true);
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [localToken]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error && error !== tokenError) {
      setError("");
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (error && error !== tokenError) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tokenError) {
      setError(tokenError);
      return;
    }

    if (!isTokenChecked) {
      setError("Validating reset link. Please try again.");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&_-)",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      if (!localToken) {
        setError("Reset token is missing. Please request a new link.");
        return;
      }
      await apiService.resetPassword(localToken, password);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-auto sm:w-full max-w-md relative z-10 shadow-2xl border-0 mx-4 sm:mx-0 p-6">
          <CardHeader className="text-center space-y-4 pb-8 p-0 mb-6">
            <div className="flex items-center justify-center mb-4">
              <CompanyLogo size="xl" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle className="text-2xl text-green-600">
                  Password Updated
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                Your password has been changed successfully
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <Button
              type="button"
              onClick={onBackToLogin}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-auto sm:w-full max-w-md relative z-10 shadow-2xl border-0 mx-4 sm:mx-0 p-6">
        <CardHeader className="text-center space-y-4 pb-8 p-0 mb-6">
          <div className="flex items-center justify-center mb-4">
            <CompanyLogo size="xl" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Set New Password</CardTitle>
            </div>
            <CardDescription className="text-base">
              Enter a new password for your account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-muted-foreground bg-transparent hover:bg-[var(--accent)] hover:[&>svg]:text-[var(--accent-foreground)] rounded-md transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-muted-foreground bg-transparent hover:bg-[var(--accent)] hover:[&>svg]:text-[var(--accent-foreground)] rounded-md transition-colors"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBackToLogin}
                className="w-full"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
