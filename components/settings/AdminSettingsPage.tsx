import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import {
  IdCard,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  UploadCloud,
  User as UserIcon,
} from "lucide-react";
import { User } from "../../types";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";

interface AdminSettingsPageProps {
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
}

const swalCustomClasses = {
  container: "swal-container",
  popup: "swal-popup",
  title: "swal-title",
  htmlContainer: "swal-content",
  confirmButton: "swal-confirm-button",
  cancelButton: "swal-cancel-button",
};

const MIN_LOADING_TIME = 2000;

const getDisplayRole = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return "System Administrator";
    case "supervisor":
      return "Supervisor";
    case "fabricator":
      return "Fabricator";
    case "client":
      return "Client";
    default:
      return "User";
  }
};

const getNameParts = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "System",
    lastName: parts.slice(1).join(" ") || "Administrator",
  };
};

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: any;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-slate-400">
        {label}
      </p>
      <div className="flex items-center gap-2 text-sm font-medium dark:text-slate-200">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground dark:text-slate-400" />}
        <span>{value || "—"}</span>
      </div>
    </div>
  );
}

export function AdminSettingsPage({
  currentUser,
  onUpdateCurrentUser,
}: AdminSettingsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gcashQrUrl, setGcashQrUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
    gcashNumber: "",
  });

  const { firstName, lastName } = getNameParts(currentUser.name);
  const displayRole = getDisplayRole(currentUser.role);

  const employeeId =
    currentUser.employeeNumber || currentUser.secureId || currentUser.id;
  const secureId = currentUser.secureId || "N/A";

  const [formData, setFormData] = useState({
    firstName,
    lastName,
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    department: currentUser.school || "",
    gcashNumber: currentUser.gcashNumber || "",
  });

  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  const phoneRegex = /^(\+639|09)\d{9}$/;
  const gcashRegex = /^09\d{9}$/;

  // Fetch fresh user data (including latest gcash_qr_url)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiService.getMe();
        if (response.data?.user) {
          const freshUser = mapUserDataFromBackend(response.data.user);
          onUpdateCurrentUser(freshUser);
          setGcashQrUrl(freshUser.gcashQrUrl || null);
        }
      } catch (err) {
        console.error("Failed to fetch fresh user data:", err);
        setGcashQrUrl(currentUser.gcashQrUrl || null);
      }
    };

    fetchUserData();

    setFormData({
      firstName,
      lastName,
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      department: currentUser.school || "",
      gcashNumber: currentUser.gcashNumber || "",
    });
    setErrors({ email: "", phone: "", gcashNumber: "" });
    setIsEditing(false);
  }, [currentUser.id]);

  const validateForm = () => {
    const newErrors = { email: "", phone: "", gcashNumber: "" };
    let isValid = true;

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Format: +639XXXXXXXXX or 09XXXXXXXXX";
      isValid = false;
    }

    if (formData.gcashNumber && !gcashRegex.test(formData.gcashNumber)) {
      newErrors.gcashNumber = "Format: 09XXXXXXXXX (11 digits starting with 09)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[+]?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, phone: value }));
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleGcashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, gcashNumber: value }));
      setErrors((prev) => ({ ...prev, gcashNumber: "" }));
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const showLoading = () =>
    Swal.fire({
      title: "Saving...",
      text: "Updating your profile details",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

  const handleEdit = () => {
    setFormData({
      firstName,
      lastName,
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      department: currentUser.school || "",
      gcashNumber: currentUser.gcashNumber || "",
    });
    setErrors({ email: "", phone: "", gcashNumber: "" });
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (!validateForm()) return;

    const trimmedFirst = formData.firstName.trim();
    const trimmedLast = formData.lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const trimmedEmail = formData.email.trim();

    if (trimmedFirst.length > 50 || trimmedLast.length > 50) {
      await Swal.fire({
        icon: "error",
        title: "Content Exceeds Limit",
        text: "First name and last name cannot exceed 50 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (!fullName || !trimmedEmail || !formData.phone.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Please fill in all required fields.",
        customClass: swalCustomClasses,
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Save changes?",
      html: `Update profile to:<br/><strong>${fullName}</strong><br/>Email: <strong>${trimmedEmail}</strong>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirmResult.isConfirmed) return;

    const loadingSwal = showLoading();
    const startTime = Date.now();
    setIsSaving(true);

    try {
      const response = await apiService.updateUser(currentUser.id, {
        name: fullName,
        email: trimmedEmail,
        phone: formData.phone.trim(),
        school: formData.department.trim(),
        gcashNumber: formData.gcashNumber.trim(),
      });

      if (response.error) throw new Error(response.error);

      const updatedUser = response.data?.user
        ? mapUserDataFromBackend(response.data.user)
        : {
            ...currentUser,
            name: fullName,
            email: trimmedEmail,
            phone: formData.phone.trim() || undefined,
            school: formData.department.trim() || "",
            gcashNumber: formData.gcashNumber.trim() || undefined,
          };

      onUpdateCurrentUser(updatedUser);
      setIsEditing(false);
      setErrors({ email: "", phone: "", gcashNumber: "" });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      await Swal.fire({
        icon: "success",
        title: "Profile updated",
        text: "Your changes have been saved successfully.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.message || "Something went wrong. Please try again.",
        customClass: swalCustomClasses,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid file",
        text: "Please upload an image file (JPG, PNG, GIF).",
        customClass: swalCustomClasses,
      });
      event.target.value = "";
      return;
    }

    const loadingSwal = Swal.fire({
      title: "Uploading...",
      text: "Saving your GCash QR code",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    try {
      const response = await apiService.uploadGcashQr(file);

      if (response.error) throw new Error(response.error);

      const qrUrl = response.data?.gcash_qr_url;
      if (!qrUrl) throw new Error("No QR URL returned from server");

      setGcashQrUrl(qrUrl);
      onUpdateCurrentUser({ ...currentUser, gcashQrUrl: qrUrl });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "GCash QR code uploaded successfully.",
        timer: 1500,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: err.message || "Something went wrong. Please try again.",
        customClass: swalCustomClasses,
      });
    } finally {
      loadingSwal.close();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveQr = async () => {
    const confirm = await Swal.fire({
      title: "Remove QR Code?",
      text: "This will delete your GCash QR from the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirm.isConfirmed) return;

    const loadingSwal = Swal.fire({
      title: "Removing...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    try {
      await apiService.updateUser(currentUser.id, { gcash_qr_url: null });

      setGcashQrUrl(null);
      onUpdateCurrentUser({ ...currentUser, gcashQrUrl: null });

      await Swal.fire({
        icon: "success",
        title: "Removed",
        text: "GCash QR code has been removed.",
        timer: 1500,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Failed to remove",
        text: "Something went wrong. Please try again.",
        customClass: swalCustomClasses,
      });
    } finally {
      loadingSwal.close();
    }
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 pb-6 pt-8 px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-4 border-[#e1862d] shadow-xl">
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-700">
                  {firstName[0]}
                  {lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                    {currentUser.name}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 flex items-center gap-1"
                  >
                    <UserIcon className="h-4 w-4" />
                    {displayRole}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1.5 font-medium flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active account
                </p>
              </div>
            </div>

            {!isEditing && (
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-8 px-6 md:px-8 pb-10">
          <div className="space-y-10">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
                  Personal Information
                </h3>

                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload QR
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleQrUpload}
              />

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="First Name" value={firstName} />
                <InfoItem label="Last Name" value={lastName} />
                <InfoItem label="Email" value={currentUser.email} />
                <InfoItem label="Phone" value={currentUser.phone} />
                <InfoItem label="GCash Number" value={currentUser.gcashNumber} />
                <InfoItem label="Employee ID" value={employeeId} icon={IdCard} />
                <InfoItem label="Secure ID" value={secureId} />
                <InfoItem label="Department" value={currentUser.school} />
              </div>

              {/* GCash QR Display Section */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                      GCash QR Code
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Upload your QR code for easy payment sharing.
                    </p>
                  </div>
                  {gcashQrUrl && isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveQr}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove QR
                    </Button>
                  )}
                </div>

                {gcashQrUrl ? (
                  <div className="flex justify-center sm:justify-start">
                    <img
                      src={gcashQrUrl}
                      alt="GCash QR code"
                      className="h-48 w-48 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 object-contain shadow-sm transition-all hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        console.error("Failed to load QR image:", gcashQrUrl);
                        e.currentTarget.src = "/images/placeholder-qr.png";
                        e.currentTarget.alt = "Failed to load QR code";
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 dark:bg-slate-900 rounded-lg border border-dashed border-gray-300 dark:border-slate-600">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      No QR code uploaded yet.
                    </p>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud className="h-4 w-4" />
                        Upload Now
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="modal bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Edit Profile</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="rounded-full hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Form fields */}
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    maxLength={20}
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    maxLength={20}
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    maxLength={30}
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    maxLength={13}
                    placeholder="+639XXXXXXXXX or 09XXXXXXXXX"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gcash-number">GCash Number</Label>
                  <Input
                    id="gcash-number"
                    maxLength={11}
                    placeholder="09XXXXXXXXX"
                    value={formData.gcashNumber}
                    onChange={handleGcashChange}
                    className={errors.gcashNumber ? "border-red-500" : ""}
                  />
                  {errors.gcashNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.gcashNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department / School</Label>
                  <Input
                    id="department"
                    maxLength={20}
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                  />
                </div>
              </div>

              {/* QR in Modal */}
              <div className="pt-6 border-t dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-slate-50">
                      GCash QR Code
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Upload or update your payment QR code
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload QR
                    </Button>
                    {gcashQrUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveQr}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {gcashQrUrl ? (
                  <div className="flex justify-center sm:justify-start">
                    <img
                      src={gcashQrUrl}
                      alt="GCash QR code"
                      className="h-48 w-48 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 object-contain shadow-sm transition-all hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        console.error("Failed to load QR:", gcashQrUrl);
                        e.currentTarget.src = "/images/placeholder-qr.png";
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-slate-900 rounded-lg border border-dashed border-gray-300 dark:border-slate-600">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      No QR code uploaded yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-b-2xl">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}