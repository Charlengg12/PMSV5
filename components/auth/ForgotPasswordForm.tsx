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
import { Alert, AlertDescription } from "../ui/alert";
import {  Mail, CheckCircle } from "lucide-react";
import { CompanyLogo } from "../ui/company-logo";
import { apiService } from "../../utils/apiService";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await apiService.requestPasswordReset(email);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-in-out relative font-[Manrope]">
        <div className="h-full flex items-center justify-center px-4 sm:px-6">
          <div
            className="w-[980px] h-[600px] max-w-[95vw] max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 transition-colors duration-500 ease-in-out"
            data-aos="fade-up"
            data-aos-duration="800"
          >
            <div className="grid h-full lg:grid-cols-2">
              <div
                className="relative hidden lg:flex items-center justify-center overflow-hidden bg-slate-900 bg-cover bg-center"
                style={{ backgroundImage: "url('/Image.png')" }}
                data-aos="fade-right"
                data-aos-duration="900"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-900/90"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_55%)]"></div>
                <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center px-10 text-center text-white">
                  <CompanyLogo size="lg" showText={false} />
                   <div className="flex items-center justify-center">
                                      <CompanyLogo size="lg" showText={true} className="font-[Archivo_Black]" />
                                    </div>
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

              <div className="flex h-full items-center justify-center px-6 py-6 sm:px-10 lg:px-12">
                <Card
                  className="w-full max-w-md border-0 bg-transparent shadow-none transition-colors duration-500 ease-in-out"
                  data-aos="fade-left"
                  data-aos-duration="900"
                >
                <CardHeader
                  className="space-y-2 pb-4 text-center"
                  data-aos="fade-down"
                  data-aos-duration="700"
                >
                  <div className="flex items-center justify-center">
                    <CompanyLogo size="lg" showText={true} className="font-[Archivo_Black]" />
                  </div>
                  <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <CardTitle className="text-2xl font-semibold text-green-600">
                          Reset Link Sent
                        </CardTitle>
                      </div>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        Check your email for your password reset link
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent
                    className="space-y-4"
                    data-aos="fade-up"
                    data-aos-duration="800"
                  >
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        We've sent a reset link to <strong>{email}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The link will expire in 30 minutes for security.
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground text-center">
                      <p>
                        Back to login{" "}
                        <button
                          onClick={onBackToLogin}
                          className="text-amber-600 hover:underline"
                        >
                          here
                        </button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-in-out relative font-[Manrope]">
      <div className="h-full flex items-center justify-center px-4 sm:px-6">
        <div
          className="w-[980px] h-[600px] max-w-[95vw] max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 transition-colors duration-500 ease-in-out"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="grid h-full lg:grid-cols-2">
            <div
              className="relative hidden lg:flex items-center justify-center overflow-hidden bg-slate-900 bg-cover bg-center"
              style={{ backgroundImage: "url('/Image.png')" }}
              data-aos="fade-right"
              data-aos-duration="900"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-900/90"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_55%)]"></div>
              <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center px-10 text-center text-white">
                <CompanyLogo size="lg" showText={false} />
                <div
                  className="text-4xl font-[Archivo_Black] tracking-wide"
                  data-aos="zoom-in"
                  data-aos-duration="800"
                >
                  ELECTRONIK <span className="text-orange-300">HUB</span>
                </div>
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

            <div className="flex h-full items-center justify-center px-6 py-6 sm:px-10 lg:px-12">
              <Card
                className="w-full max-w-md border-0 bg-transparent shadow-none transition-colors duration-500 ease-in-out"
                data-aos="fade-left"
                data-aos-duration="900"
              >
                <CardHeader
                  className="space-y-2 pb-4 text-center"
                  data-aos="fade-down"
                  data-aos-duration="700"
                >
                  <div className="flex items-center justify-center">
                    <CompanyLogo size="lg" showText={true} className="font-[Archivo_Black]" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                      Recover your account
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-500 ease-in-out">
                      Enter your email address and we'll send you a password reset
                      link.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    data-aos="fade-up"
                    data-aos-duration="800"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        className="w-full h-10 text-sm bg-[#102c54] text-white hover:bg-[#0b2444] font-semibold transition-colors duration-500 ease-in-out rounded-lg"
                        disabled={isLoading || !email}
                      >
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                            Sending Reset Email...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Reset Email
                          </>
                        )}
                      </Button>

                    </div>
                  </form>

                  <div className="text-xs text-muted-foreground text-center">
                    <p>
                      Remembered your password?{" "}
                      <button
                        onClick={onBackToLogin}
                        className="text-amber-600 hover:underline"
                      >
                        Back to login
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
