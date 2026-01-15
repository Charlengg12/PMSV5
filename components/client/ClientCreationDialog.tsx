import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { UserPlus, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';
import { User, Project } from '../../types';
import { apiService } from '../../utils/apiService';
import Swal from 'sweetalert2';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isAssigned = !!(project.clientName && project.clientName.trim().length > 0);

  if (!open) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Client name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.phone && !/^(\+639|09)\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Philippine phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAssigned) {
      Swal.fire({
        icon: 'warning',
        title: 'Client Already Assigned',
        text: `This project already has a client (${project.clientName}).`,
        confirmButtonText: 'OK',
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-content',
          confirmButton: 'swal-confirm-button',
          cancelButton: 'swal-cancel-button',
          icon: 'swal-icon',
        },
      });
      return;
    }

    if (!validateForm()) return;

    const result = await Swal.fire({
      title: 'Create client account?',
      text: `This will create a new client account for ${formData.name} and assign them to ${project.name}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-content',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
        icon: 'swal-icon',
      },
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Creating client account...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-content',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
        icon: 'swal-icon',
      },
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setIsLoading(true);

    try {
      const response = await apiService.createClient({
        ...formData,
        projectId: project.id,
        projectName: project.name,
      });

      if (response.data) {
const newClient = response.data.user || response.data;        setCreatedClient(newClient);
        onClientCreated(newClient);

        Swal.close();

        await Swal.fire({
          title: 'Success!',
          text: `Client account for ${newClient.name} has been created.`,
          icon: 'success',
          timer: 2200,
          showConfirmButton: false,
          customClass: {
            container: 'swal-container',
            popup: 'swal-popup',
            title: 'swal-title',
            htmlContainer: 'swal-content',
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button',
            icon: 'swal-icon',
          },
        });
      } else {
        throw new Error(response.error || 'Failed to create client');
      }
    } catch (err: any) {
      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.message || 'Something went wrong while creating the client account.',
        confirmButtonText: 'OK',
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-content',
          confirmButton: 'swal-confirm-button',
          cancelButton: 'swal-cancel-button',
          icon: 'swal-icon',
        },
      });

      setErrors({ submit: err.message || 'Failed to create client account' });
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
    setFormData({ name: '', email: '', phone: '', password: '' });
    setErrors({});
    setCreatedClient(null);
    setShowPassword(false);
    onClose();
  };

  // ────────────────────────────────────────────────
  //  Main modal structure using div + overlay
  // ────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose} // close on backdrop click
    >
      <div
        className="relative w-full max-w-md mx-4 bg-background rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {createdClient ? (
          // Success view
          <>
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">Client Account Created!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Successfully created for <strong>{project.name}</strong>
                </p>
              </div>

              <div className="space-y-5">
                <Alert>
                  <AlertDescription>
                    Login credentials sent to <strong>{createdClient.email}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm font-medium">Client Login Credentials</p>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-2.5 bg-background rounded border">
                      <div>
                        <p className="text-xs text-muted-foreground">Client ID</p>
                        <p className="font-mono text-sm">{createdClient.secureId}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(createdClient.secureId, 'secureId')}
                      >
                        {copiedField === 'secureId' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-background rounded border">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm">{createdClient.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(createdClient.email, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-background rounded border">
                      <div>
                        <p className="text-xs text-muted-foreground">Password</p>
                        <p className="font-mono text-sm">••••••••</p>
                      </div>
                      <span className="text-xs text-muted-foreground">As set</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  <strong>Access Level:</strong> View only — project docs & progress
                </div>

                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Form view
          <>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Create Client Account</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <span className="sr-only">Close</span>
                  ×
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Create client access for <strong>{project.name}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {isAssigned && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Client already assigned: {project.clientName}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                  disabled={isAssigned || isLoading}
                />
                {errors.name && <p className="text-sm text-destructive pt-1">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={isAssigned || isLoading}
                />
                {errors.email && <p className="text-sm text-destructive pt-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+639123456789 / 09123456789"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-destructive' : ''}
                  disabled={isAssigned || isLoading}
                />
                {errors.phone && <p className="text-sm text-destructive pt-1">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'border-destructive' : ''}
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
                  <p className="text-sm text-destructive pt-1">{errors.password}</p>
                )}
              </div>

              {errors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground bg-muted/40 p-3 rounded border">
                Client will receive login credentials via email and can view project progress & documents only.
              </div>

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
          </>
        )}
      </div>
    </div>
  );
}