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
  QrCode,
} from "lucide-react";
import { User } from "../../types";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";

interface FabricatorSettingsPageProps {
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

const MIN_LOADING_TIME = 1800;

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

export function FabricatorSettingsPage({
  currentUser,
  onUpdateCurrentUser,
}: FabricatorSettingsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gcashQrUrl, setGcashQrUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState({
    phone: "",
    gcashNumber: "",
  });

  const [formData, setFormData] = useState({
    name: currentUser.name || "",
    phone: currentUser.phone || "",
    gcashNumber: currentUser.gcashNumber || "",
  });

  const phoneRegex = /^(\+639|09)\d{9}$/;
  const gcashRegex = /^09\d{9}$/;

  // Refresh user data (including latest QR)
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const res = await apiService.getMe();
        if (res.data?.user) {
          const freshUser = {
            ...mapUserDataFromBackend(res.data.user),
            id: res.data.user.id ?? currentUser.id,
          };
          onUpdateCurrentUser(freshUser);
          setGcashQrUrl(freshUser.gcashQrUrl || null);
        }
      } catch (err) {
        console.error("Failed to refresh user:", err);
        setGcashQrUrl(currentUser.gcashQrUrl || null);
      }
    };

    fetchFreshData();

    setFormData({
      name: currentUser.name || "",
      phone: currentUser.phone || "",
      gcashNumber: currentUser.gcashNumber || "",
    });
    setErrors({ phone: "", gcashNumber: "" });
    setIsEditing(false);
  }, [currentUser.id]);

  const validateForm = () => {
    const newErrors = { phone: "", gcashNumber: "" };
    let isValid = true;

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Format: +639XXXXXXXXX or 09XXXXXXXXX";
      isValid = false;
    }

    if (formData.gcashNumber && !gcashRegex.test(formData.gcashNumber)) {
      newErrors.gcashNumber = "Format: 09XXXXXXXXX (11 digits)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "phone" || name === "gcashNumber") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const showLoading = () =>
    Swal.fire({
      title: "Saving...",
      text: "Updating your fabricator profile",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

  const handleEdit = () => {
    setFormData({
      name: currentUser.name || "",
      phone: currentUser.phone || "",
      gcashNumber: currentUser.gcashNumber || "",
    });
    setErrors({ phone: "", gcashNumber: "" });
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (!validateForm()) return;

    const trimmedName = formData.name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Name",
        text: "Name must be 3–100 characters long.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (!trimmedName) {
      await Swal.fire({
        icon: "error",
        title: "Name Required",
        text: "Please enter your full name.",
        customClass: swalCustomClasses,
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Save Changes?",
      html: `Update profile to:<br/><strong>${trimmedName}</strong>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirm.isConfirmed) return;

    const loadingSwal = showLoading();
    const startTime = Date.now();
    setIsSaving(true);

    try {
      const response = await apiService.updateUser(currentUser.id, {
        name: trimmedName,
        phone: formData.phone.trim() || null,
        gcashNumber: formData.gcashNumber.trim() || null,
      });

      if (response.error) throw new Error(response.error);

      const updatedUser = response.data?.user
        ? {
            ...mapUserDataFromBackend(response.data.user),
            id: response.data.user.id ?? currentUser.id,
          }
        : {
            ...currentUser,
            name: trimmedName,
            phone: formData.phone.trim() || undefined,
            gcashNumber: formData.gcashNumber.trim() || undefined,
          };

      onUpdateCurrentUser(updatedUser);
      setIsEditing(false);
      setErrors({ phone: "", gcashNumber: "" });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      await Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your fabricator profile has been saved.",
        timer: 1600,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      await Swal.fire({
        icon: "error",
        title: "Update Failed",
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
        title: "Invalid File",
        text: "Please upload JPG, PNG, or GIF only.",
        customClass: swalCustomClasses,
      });
      event.target.value = "";
      return;
    }

    const loading = Swal.fire({
      title: "Uploading QR...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    try {
      const res = await apiService.uploadGcashQr(file);
      if (res.error) throw new Error(res.error);

      const qrUrl = res.data?.gcash_qr_url;
      if (!qrUrl) throw new Error("No QR URL returned");

      setGcashQrUrl(qrUrl);
      onUpdateCurrentUser({ ...currentUser, gcashQrUrl: qrUrl });

      await Swal.fire({
        icon: "success",
        title: "QR Uploaded",
        text: "Your GCash QR is now saved.",
        timer: 1500,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err.message || "Failed to upload QR code.",
        customClass: swalCustomClasses,
      });
    } finally {
      loading.close();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveQr = async () => {
    const confirm = await Swal.fire({
      title: "Remove GCash QR?",
      text: "This will delete your payment QR from the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Remove",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirm.isConfirmed) return;

    const loading = Swal.fire({
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
        title: "QR Removed",
        text: "Your GCash QR has been removed.",
        timer: 1400,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not remove QR code.",
        customClass: swalCustomClasses,
      });
    } finally {
      loading.close();
    }
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-white dark:from-amber-950 dark:to-slate-900 pb-6 pt-8 px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-4 border-amber-500 shadow-xl">
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700">
                  {currentUser.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                    {currentUser.name}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 flex items-center gap-1"
                  >
                    <UserIcon className="h-4 w-4" />
                    Fabricator
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1.5 font-medium flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active Fabricator
                </p>
              </div>
            </div>

            {!isEditing && (
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
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
                  Fabricator Profile
                </h3>

                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload GCash QR
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
                <InfoItem label="Full Name" value={currentUser.name} />
                <InfoItem label="Phone" value={currentUser.phone} />
                <InfoItem label="GCash Number" value={currentUser.gcashNumber} />
                <InfoItem
                  label="Employee ID"
                  value={currentUser.employeeNumber || currentUser.secureId || currentUser.id}
                  icon={IdCard}
                />
                <InfoItem label="Secure ID" value={currentUser.secureId || "N/A"} icon={QrCode} />
                <InfoItem label="Email" value={currentUser.email} icon={Mail} />
              </div>

              {/* GCash QR Section – bigger & more prominent for fabricators */}
              <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-slate-50 flex items-center gap-2">
                      <QrCode className="h-6 w-6 text-amber-600" />
                      GCash QR for Payments
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Upload your personal GCash QR code so supervisors and clients can easily transfer your project payments.
                    </p>
                  </div>

                  {gcashQrUrl && isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveQr}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      Remove QR
                    </Button>
                  )}
                </div>

                {gcashQrUrl ? (
                  <div className="flex justify-center sm:justify-start">
                    <img
                      src={gcashQrUrl}
                      alt="Your GCash QR Code"
                      className="h-64 w-64 rounded-2xl border-4 border-amber-300 dark:border-amber-700 shadow-xl object-contain bg-white dark:bg-slate-950 transition-all hover:scale-105 hover:shadow-2xl"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder-qr.png";
                        e.currentTarget.alt = "Failed to load QR code";
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-600">
                    <p className="text-xl font-medium text-amber-700 dark:text-amber-300 mb-3">
                      No GCash QR Uploaded Yet
                    </p>
                    <p className="text-base text-amber-600 dark:text-amber-400 mb-6 max-w-md mx-auto">
                      Add your QR code now to receive payments faster and more conveniently.
                    </p>

                    {isEditing && (
                      <Button
                        variant="outline"
                        className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 text-base py-6 px-8"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud className="h-5 w-5" />
                        Upload Your GCash QR Now
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50 flex items-center gap-2">
                <Edit className="h-6 w-6 text-amber-600" />
                Edit Fabricator Profile
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="rounded-full hover:bg-amber-50 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  maxLength={100}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Dela Cruz"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  maxLength={13}
                  placeholder="+639XXXXXXXXX or 09XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>

              {/* GCash Number */}
              <div className="space-y-2">
                <Label htmlFor="gcashNumber">GCash Number</Label>
                <Input
                  id="gcashNumber"
                  name="gcashNumber"
                  maxLength={11}
                  placeholder="09XXXXXXXXX"
                  value={formData.gcashNumber}
                  onChange={handleChange}
                  className={errors.gcashNumber ? "border-red-500" : ""}
                />
                {errors.gcashNumber && <p className="text-sm text-red-600 mt-1">{errors.gcashNumber}</p>}
              </div>

              {/* QR Section in Modal */}
              <div className="pt-6 border-t dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-slate-100 text-lg flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-amber-600" />
                      GCash QR Code
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                      Upload your QR for receiving project payments
                    </p>
                  </div>
                  <div className="flex gap-3 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload
                    </Button>
                    {gcashQrUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveQr}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {gcashQrUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={gcashQrUrl}
                      alt="Your GCash QR"
                      className="h-60 w-60 rounded-2xl border-4 border-amber-300 dark:border-amber-700 shadow-xl object-contain bg-white dark:bg-slate-950"
                      onError={(e) => (e.currentTarget.src = "/images/placeholder-qr.png")}
                    />
                  </div>
                ) : (
                  <div className="text-center py-10 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-600">
                    <p className="text-lg font-medium text-amber-700 dark:text-amber-300">
                      No QR Code Uploaded Yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-b-2xl">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
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
