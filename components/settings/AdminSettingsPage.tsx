import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { IdCard, Mail, Phone } from "lucide-react";
import { User } from "../../types";
import { apiService } from "../../utils/apiService";
import { mapUserDataFromBackend } from "../../utils/userDataMapper";

interface AdminSettingsPageProps {
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
}

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
  const firstName = parts[0] || "System";
  const lastName = parts.slice(1).join(" ") || "Administrator";
  return { firstName, lastName };
};

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AdminSettingsPage({
  currentUser,
  onUpdateCurrentUser,
}: AdminSettingsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { firstName, lastName } = getNameParts(currentUser.name);
  const displayRole = getDisplayRole(currentUser.role);
  const employeeId =
    currentUser.employeeNumber || currentUser.secureId || currentUser.id;
  const phone = currentUser.phone || "N/A";
  const email = currentUser.email || "N/A";
  const department = currentUser.school || "N/A";
  const secureId = currentUser.secureId || "N/A";
  const gcashNumber = currentUser.gcashNumber || "N/A";
  const clientProject = currentUser.clientProjectId || "N/A";
  const [formData, setFormData] = useState({
    firstName,
    lastName,
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    department: currentUser.school || "",
    gcashNumber: currentUser.gcashNumber || "",
  });

  useEffect(() => {
    setFormData({
      firstName,
      lastName,
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      department: currentUser.school || "",
      gcashNumber: currentUser.gcashNumber || "",
    });
    setIsEditing(false);
  }, [
    currentUser.id,
    currentUser.name,
    currentUser.email,
    currentUser.phone,
    currentUser.school,
    currentUser.gcashNumber,
  ]);

  const handleEdit = () => {
    setFormData({
      firstName,
      lastName,
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      department: currentUser.school || "",
      gcashNumber: currentUser.gcashNumber || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      firstName,
      lastName,
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      department: currentUser.school || "",
      gcashNumber: currentUser.gcashNumber || "",
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedFirst = formData.firstName.trim();
    const trimmedLast = formData.lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const trimmedEmail = formData.email.trim();

    if (!fullName || !trimmedEmail) {
      await Swal.fire({
        icon: "error",
        title: "Missing required fields",
        text: "Name and email are required.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiService.updateUser(currentUser.id, {
        name: fullName,
        email: trimmedEmail,
        phone: formData.phone.trim(),
        school: formData.department.trim(),
        gcashNumber: formData.gcashNumber.trim(),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const updatedUser =
        response.data?.user
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

      await Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Your details have been updated.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.message || "Unable to update your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border bg-card shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold">
                  {firstName.charAt(0)}
                  {lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentUser.name}
                  </h2>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{displayRole}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    ID: {employeeId}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {phone}
                  </span>
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="details" className="w-full">
          <div className="border-b border-border px-6 pt-3">
            <TabsList className="w-full flex-wrap justify-start gap-4 rounded-none bg-transparent p-0 pb-2">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Attachments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details">
            <div className="space-y-4 px-6 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground">
                  Personal Information
                </h3>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={handleEdit}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        value={formData.firstName}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            firstName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        value={formData.lastName}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            lastName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <InfoItem label="Role" value={displayRole} />
                    <InfoItem label="Status" value="Active" />
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Id</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <InfoItem label="Employee #" value={employeeId} />
                    <InfoItem label="Secure ID" value={secureId} />
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            department: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <InfoItem label="User ID" value={currentUser.id} />
                    <div className="space-y-2">
                      <Label htmlFor="gcash-number">GCash Number</Label>
                      <Input
                        id="gcash-number"
                        value={formData.gcashNumber}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            gcashNumber: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <InfoItem label="Client Project" value={clientProject} />
                  </>
                ) : (
                  <>
                    <InfoItem label="First Name" value={firstName} />
                    <InfoItem label="Last Name" value={lastName} />
                    <InfoItem label="Role" value={displayRole} />
                    <InfoItem label="Status" value="Active" />
                    <InfoItem label="Email Id" value={email} />
                    <InfoItem label="Phone Number" value={phone} />
                    <InfoItem label="Employee #" value={employeeId} />
                    <InfoItem label="Secure ID" value={secureId} />
                    <InfoItem label="Department" value={department} />
                    <InfoItem label="User ID" value={currentUser.id} />
                    <InfoItem label="GCash Number" value={gcashNumber} />
                    <InfoItem label="Client Project" value={clientProject} />
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attachments">
            <div className="px-6 py-10 text-sm text-muted-foreground">
              Attachments will appear here.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
