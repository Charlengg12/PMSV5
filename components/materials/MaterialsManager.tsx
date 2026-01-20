import { useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Package,
  Plus,
  Search,
  PhilippinePeso,
  CircleHelp,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Material, User, Project } from "../../types";
import Swal from "sweetalert2";

interface MaterialsManagerProps {
  currentUser: User;
  projects: Project[];
  materials: Material[];
  onAddMaterial: (
    material: Omit<Material, "id" | "addedAt">,
  ) => Promise<void> | void;
  onUpdateMaterial: (
    id: string,
    material: Partial<Material>,
  ) => Promise<void> | void;
  onDeleteMaterial: (id: string) => Promise<void> | void;
}

const peso = "\u20B1";
type SortOption = "recent" | "name" | "quantity" | "unit-cost" | "total-value";

const swalCustomClasses = {
  container: "swal-container",
  popup: "swal-popup !max-w-md",
  title: "swal-title",
  htmlContainer: "swal-content",
  confirmButton: "swal-confirm-button",
  cancelButton: "swal-cancel-button",
};

export function MaterialsManager({
  currentUser,
  projects,
  materials,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
}: MaterialsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [selectedProject, setSelectedProject] = useState("");
  const [statusFilter, setStatusFilter] = useState<Material["status"] | "all">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    unit: "",
    cost: "",
    supplier: "",
    status: "ordered" as Material["status"],
    projectId: "",
    category: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    unit: "",
    cost: "",
    supplier: "",
    status: "ordered" as Material["status"],
    projectId: "",
    category: "",
  });

  const fabricatorProjects = projects.filter(
    (p) =>
      p.fabricatorIds.includes(currentUser.id) &&
      p.status !== "pending-assignment",
  );

  const lowStockLimit = Math.max(0, lowStockThreshold);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const isGeneralInventory = (projectId?: string) => {
    if (!projectId) return true;
    if (typeof projectId !== "string") return false;
    const normalized = projectId.trim().toLowerCase();
    return normalized === "general" || normalized === "none";
  };

  const filteredMaterials = materials.filter((m) => {
    const isGeneral = isGeneralInventory(m.projectId);
    const matchesOwner =
      m.addedBy === currentUser.id || isGeneral || !m.addedBy;
    const matchesProject =
      selectedProject === "" ||
      selectedProject === "all" ||
      m.projectId === selectedProject ||
      (selectedProject === "general" && isGeneral);
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "uncategorized"
        ? !m.category
        : m.category === categoryFilter);
    const matchesSupplier =
      supplierFilter === "all" ||
      (supplierFilter === "unspecified"
        ? !m.supplier
        : m.supplier === supplierFilter);
    const matchesSearch =
      normalizedSearch === "" ||
      m.name.toLowerCase().includes(normalizedSearch) ||
      (m.description?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (m.category?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (m.supplier?.toLowerCase().includes(normalizedSearch) ?? false);
    const matchesLowStock = !lowStockOnly || m.quantity <= lowStockLimit;

    return (
      matchesOwner &&
      matchesProject &&
      matchesStatus &&
      matchesCategory &&
      matchesSupplier &&
      matchesSearch &&
      matchesLowStock
    );
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "quantity":
        return b.quantity - a.quantity;
      case "unit-cost":
        return b.cost - a.cost;
      case "total-value":
        return b.cost * b.quantity - a.cost * a.quantity;
      case "recent":
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  const materialCategories = [
    "Raw Materials",
    "Structural Materials",
    "Consumables",
    "Tools & Equipment",
    "Safety",
    "Electrical",
    "Finishing Materials",
    "Hardware",
    "Other",
  ];

  const units = [
    "pieces",
    "kg",
    "lbs",
    "meters",
    "feet",
    "inches",
    "liters",
    "gallons",
    "sets",
    "rolls",
    "sheets",
    "tubes",
    "boxes",
    "bags",
    "cans",
  ];

  const availableCategories = Array.from(
    new Set([
      ...materialCategories,
      ...materials
        .map((m) => m.category)
        .filter((c): c is string => Boolean(c)),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  const availableSuppliers = Array.from(
    new Set(
      materials.map((m) => m.supplier).filter((s): s is string => Boolean(s)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const lowStockCount = filteredMaterials.filter(
    (m) => m.quantity <= lowStockLimit,
  ).length;
  const supplierCount = new Set(
    filteredMaterials.map((m) => m.supplier).filter(Boolean),
  ).size;
  const categoryCount = new Set(
    filteredMaterials.map((m) => m.category).filter(Boolean),
  ).size;

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateMaterialForm = async (
    data: typeof formData,
    isEdit = false,
  ): Promise<boolean> => {
    const prefix = isEdit ? "edit-" : "";

    if (!data.name.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Material name is required",
        customClass: swalCustomClasses,
      });
      document.getElementById(`${prefix}name`)?.focus();
      return false;
    }

    if (data.name.trim().length > 50) {
      await Swal.fire({
        icon: "error",
        title: "Too Long",
        text: "Material name must be 50 characters or less",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (data.description && data.description.trim().length > 100) {
      await Swal.fire({
        icon: "error",
        title: "Too Long",
        text: "Description must be 100 characters or less",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!data.quantity.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Quantity is required",
        customClass: swalCustomClasses,
      });
      return false;
    }

    const qty = parseFloat(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Quantity",
        text: "Quantity must be a positive number",
        customClass: swalCustomClasses,
      });
      return false;
    }
    if (qty > 500000) {
      await Swal.fire({
        icon: "error",
        title: "Quantity Too High",
        text: "Maximum allowed quantity is 500,000",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!data.unit.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Unit is required",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!data.cost.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Cost per unit is required",
        customClass: swalCustomClasses,
      });
      return false;
    }

    const cost = parseFloat(data.cost);
    if (isNaN(cost) || cost <= 0) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Cost",
        text: "Cost must be a positive number",
        customClass: swalCustomClasses,
      });
      return false;
    }
    if (cost > 500000) {
      await Swal.fire({
        icon: "error",
        title: "Cost Too High",
        text: "Maximum allowed cost per unit is ₱500,000",
        customClass: swalCustomClasses,
      });
      return false;
    }

    return true;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (
    field: keyof typeof editFormData,
    value: string,
  ) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all inputs except assign to project have no value
    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.quantity.trim() ||
      !formData.unit.trim() ||
      !formData.cost.trim() ||
      !formData.supplier.trim() ||
      !formData.category.trim()
    ) {
      await Swal.fire({
        icon: "error",
        title: "Missing Input Fields",
        text: "Please fill in the required fields.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (!(await validateMaterialForm(formData))) return;

    // if name description category quantity unit cost supplier has no value return the sweet alert

    const result = await Swal.fire({
      icon: "question",
      title: "Confirm Submission",
      text: `Add new material: "${formData.name.trim()}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Add",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Creating material...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    setIsSubmitting(true);

    const newMaterial: Omit<Material, "id" | "addedAt"> = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit.trim(),
      cost: parseFloat(formData.cost),
      supplier: formData.supplier?.trim() || undefined,
      status: formData.status,
      projectId:
        formData.projectId && formData.projectId !== "none"
          ? formData.projectId
          : undefined,
      addedBy: currentUser.id,
      category: formData.category?.trim() || undefined,
    };

    setTimeout(async () => {
      try {
        await onAddMaterial(newMaterial);

        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Material has been successfully added.",
          timer: 1800,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });

        setFormData({
          name: "",
          description: "",
          quantity: "",
          unit: "",
          cost: "",
          supplier: "",
          status: "ordered",
          projectId: "",
          category: "",
        });
        setShowAddForm(false);
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to add material. Please try again.",
          customClass: swalCustomClasses,
        });
      } finally {
        setIsSubmitting(false);
        Swal.close();
      }
    }, 2000);
  };

  const handleEditClick = (material: Material) => {
    setEditingMaterial(material);
    setEditFormData({
      name: material.name,
      description: material.description || "",
      quantity: material.quantity.toString(),
      unit: material.unit,
      cost: material.cost.toString(),
      supplier: material.supplier || "",
      status: material.status,
      projectId: material.projectId || "none",
      category: material.category || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    // Check if all inputs except assign to project have no value
    if (
      !editFormData.name.trim() ||
      !editFormData.description.trim() ||
      !editFormData.quantity.trim() ||
      !editFormData.unit.trim() ||
      !editFormData.cost.trim() ||
      !editFormData.supplier.trim() ||
      !editFormData.category.trim()
    ) {
      await Swal.fire({
        icon: "error",
        title: "Missing Input Fields",
        text: "Please fill in the required fields.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (!(await validateMaterialForm(editFormData, true))) return;

    const result = await Swal.fire({
      icon: "question",
      title: "Save Changes?",
      text: `Update material: "${editFormData.name.trim()}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Updating material...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    const updatedData: Partial<Material> = {
      name: editFormData.name.trim(),
      description: editFormData.description?.trim() || undefined,
      quantity: parseFloat(editFormData.quantity),
      unit: editFormData.unit.trim(),
      cost: parseFloat(editFormData.cost),
      supplier: editFormData.supplier?.trim() || undefined,
      status: editFormData.status,
      projectId:
        editFormData.projectId && editFormData.projectId !== "none"
          ? editFormData.projectId
          : undefined,
      category: editFormData.category?.trim() || undefined,
    };

    setTimeout(async () => {
      try {
        await onUpdateMaterial(editingMaterial.id, updatedData);

        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Material has been successfully updated.",
          timer: 1800,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });

        setEditingMaterial(null);
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update material. Please try again.",
          customClass: swalCustomClasses,
        });
      } finally {
        Swal.close();
      }
    }, 2000);
  };

  const handleDeleteClick = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Deleting...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    setTimeout(async () => {
      try {
        await onDeleteMaterial(id);

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Material has been successfully removed.",
          timer: 1800,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete material.",
          customClass: swalCustomClasses,
        });
      } finally {
        Swal.close();
      }
    }, 2000);
  };

  const getStatusIcon = (status: Material["status"]) => {
    switch (status) {
      case "ordered":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-use":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "depleted":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Material["status"]) => {
    switch (status) {
      case "ordered":
        return "secondary";
      case "delivered":
        return "default";
      case "in-use":
        return "secondary";
      case "depleted":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getProjectName = (projectId?: string) => {
    if (isGeneralInventory(projectId)) return "General Inventory";
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getTotalValue = () => {
    return filteredMaterials.reduce(
      (total, m) => total + m.cost * m.quantity,
      0,
    );
  };

  const formatCompactAmount = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    const absValue = Math.abs(value);
    const formatScaled = (denominator: number, suffix: string) => {
      const scaled = Math.trunc((value / denominator) * 10) / 10;
      const formatted = scaled.toFixed(1).replace(/\.0$/, "");
      return `${formatted} ${suffix}`;
    };
    if (absValue >= 1_000_000_000_000)
      return formatScaled(1_000_000_000_000, "T");
    if (absValue >= 1_000_000_000) return formatScaled(1_000_000_000, "B");
    if (absValue >= 1_000_000) return formatScaled(1_000_000, "M");
    return Math.trunc(value).toLocaleString();
  };

  const formatCurrency = (value: number, compact = false) => {
    if (!Number.isFinite(value)) return `${peso}0`;
    if (compact && Math.abs(value) >= 1_000_000) {
      return `${peso}${formatCompactAmount(value)}`;
    }
    return `${peso}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* ADD FORM */}
      {showAddForm &&
        createPortal(
          <div className="fixed inset-0 z-50 h-screen w-screen flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="modal bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] overflow-y-auto mx-4">
              <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Add New Material</h2>
                  <p className="text-sm text-muted-foreground">
                    Fill out the form to add materials to inventory.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Material Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter material name"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleInputChange("category", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Optional material description"
                    maxLength={100}
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange("quantity", e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      step="any"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(v) => handleInputChange("unit", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost per Unit ({peso}) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={formData.cost}
                      onChange={(e) =>
                        handleInputChange("cost", e.target.value)
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) =>
                        handleInputChange("supplier", e.target.value)
                      }
                      placeholder="Enter supplier name"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => handleInputChange("status", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordered">Ordered</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="in-use">In Use</SelectItem>
                        <SelectItem value="depleted">Depleted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Assign to Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) => handleInputChange("projectId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="General inventory (no project)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General Inventory</SelectItem>
                      {fabricatorProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Material
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* EDIT FORM */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="modal bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Edit Material</h2>
                <p className="text-sm text-muted-foreground">
                  Update the details of this material.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingMaterial(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Material Name *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) =>
                      handleEditInputChange("name", e.target.value)
                    }
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(v) => handleEditInputChange("category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    handleEditInputChange("description", e.target.value)
                  }
                  maxLength={100}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editFormData.quantity}
                    onChange={(e) =>
                      handleEditInputChange("quantity", e.target.value)
                    }
                    min="0"
                    step="any"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit *</Label>
                  <Select
                    value={editFormData.unit}
                    onValueChange={(v) => handleEditInputChange("unit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Cost per Unit ({peso}) *</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    value={editFormData.cost}
                    onChange={(e) =>
                      handleEditInputChange("cost", e.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier">Supplier</Label>
                  <Input
                    id="edit-supplier"
                    value={editFormData.supplier}
                    onChange={(e) =>
                      handleEditInputChange("supplier", e.target.value)
                    }
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(v: Material["status"]) =>
                      handleEditInputChange("status", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
                      <SelectItem value="depleted">Depleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-projectId">Assign to Project</Label>
                <Select
                  value={editFormData.projectId}
                  onValueChange={(v) => handleEditInputChange("projectId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="General inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General Inventory</SelectItem>
                    {fabricatorProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMaterial(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6" />
            Materials Management
          </h2>
          <p className="text-muted-foreground">
            Manage materials and inventory for your projects
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Items</span>
            </div>
            <p className="text-2xl mb-6">{filteredMaterials.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Value</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Sum of unit cost × quantity for filtered items
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl mb-6">
              {formatCurrency(getTotalValue(), true)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">In Use</span>
            </div>
            <p className="text-2xl mb-6">
              {filteredMaterials.filter((m) => m.status === "in-use").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Depleted</span>
            </div>
            <p className="text-2xl mb-6">
              {filteredMaterials.filter((m) => m.status === "depleted").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">Low Stock: {lowStockCount}</Badge>
        <Badge variant="outline">Suppliers: {supplierCount}</Badge>
        <Badge variant="outline">Categories: {categoryCount}</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 px-5 pb-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label>Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project Filter</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="general">General Inventory</SelectItem>
                  {fabricatorProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="depleted">Depleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {availableCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier Filter</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                  {availableSuppliers.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="quantity">
                    Quantity (High to Low)
                  </SelectItem>
                  <SelectItem value="unit-cost">Unit Cost</SelectItem>
                  <SelectItem value="total-value">Total Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 items-end">
            <div className="space-y-2 w-full md:w-auto">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) =>
                  setLowStockThreshold(Number(e.target.value) || 0)
                }
                className="w-full md:w-[150px]"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <Switch
                id="low-stock-only"
                checked={lowStockOnly}
                onCheckedChange={setLowStockOnly}
              />
              <Label htmlFor="low-stock-only">Low Stock Only</Label>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedProject("all");
                setStatusFilter("all");
                setCategoryFilter("all");
                setSupplierFilter("all");
                setSearchTerm("");
                setSortBy("recent");
                setLowStockOnly(false);
                setLowStockThreshold(5);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materials Inventory
            <Badge variant="outline">{filteredMaterials.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 mb-5">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No materials found</h3>
              <p className="text-muted-foreground">
                Start adding materials to track your inventory.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMaterials.map((material) => {
                const isLowStock = material.quantity <= lowStockLimit;

                return (
                  <div
                    key={material.id}
                    className={`border rounded-lg p-4 relative ${
                      isLowStock ? "border-orange-200 bg-orange-50/40" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3 pr-20">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(material.status)}
                        <div>
                          <h4 className="font-medium">{material.name}</h4>
                          {material.description && (
                            <p className="text-sm text-muted-foreground">
                              {material.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(material.status)}>
                          {material.status}
                        </Badge>
                        {material.category && (
                          <Badge variant="outline">{material.category}</Badge>
                        )}
                        {isLowStock && (
                          <Badge
                            variant="outline"
                            className="border-orange-200 text-orange-700"
                          >
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEditClick(material)}
                        title="Edit Material"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClick(material.id)}
                        title="Delete Material"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 text-sm mt-4">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p>
                          {material.quantity} {material.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unit Cost</p>
                        <p>
                          <span className="text-lg">
                            {formatCurrency(material.cost)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Value</p>
                        <p>
                          {formatCurrency(material.cost * material.quantity)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Project</p>
                        <p>{getProjectName(material.projectId)}</p>
                      </div>
                    </div>

                    {material.supplier && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Supplier: {material.supplier}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      Added on {new Date(material.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
