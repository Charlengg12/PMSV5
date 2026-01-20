import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
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
  X
} from 'lucide-react';
import { Material, User, Project } from '../../types';
import Swal from 'sweetalert2';

interface MaterialsManagerProps {
  currentUser: User;
  projects: Project[];
  materials: Material[];
  onAddMaterial: (material: Omit<Material, 'id' | 'addedAt'>) => Promise<void> | void;
  onUpdateMaterial: (id: string, material: Partial<Material>) => Promise<void> | void;
  onDeleteMaterial: (id: string) => Promise<void> | void;
}

const peso = "\u20B1";
type SortOption = 'recent' | 'name' | 'quantity' | 'unit-cost' | 'total-value';

// --- Helper Functions ---
const formatCompactAmount = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const absValue = Math.abs(value);
  const formatScaled = (denominator: number, suffix: string) => {
    const scaled = Math.trunc((value / denominator) * 10) / 10;
    const formatted = scaled.toFixed(1).replace(/\.0$/, "");
    return `${formatted} ${suffix}`;
  };
  if (absValue >= 1_000_000_000_000) return formatScaled(1_000_000_000_000, "T");
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

export function MaterialsManager({ 
  currentUser, 
  projects, 
  materials,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial
}: MaterialsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [selectedProject, setSelectedProject] = useState('');
  const [statusFilter, setStatusFilter] = useState<Material['status'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    cost: '',
    supplier: '',
    status: 'ordered' as Material['status'],
    projectId: '',
    category: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    cost: '',
    supplier: '',
    status: 'ordered' as Material['status'],
    projectId: '',
    category: ''
  });

  const fabricatorProjects = projects.filter(p => 
    p.fabricatorIds.includes(currentUser.id) && p.status !== 'pending-assignment'
  );

  const lowStockLimit = Math.max(0, lowStockThreshold);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const isGeneralInventory = (projectId?: string) => {
    if (!projectId) return true;
    if (typeof projectId !== 'string') return false;
    const normalized = projectId.trim().toLowerCase();
    return normalized === 'general' || normalized === 'none';
  };

  const filteredMaterials = materials.filter((m) => {
    const isGeneral = isGeneralInventory(m.projectId);
    const matchesOwner = m.addedBy === currentUser.id || isGeneral || !m.addedBy;
    const matchesProject =
      selectedProject === '' ||
      selectedProject === 'all' ||
      m.projectId === selectedProject ||
      (selectedProject === 'general' && isGeneral);
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'uncategorized' ? !m.category : m.category === categoryFilter);
    const matchesSupplier =
      supplierFilter === 'all' ||
      (supplierFilter === 'unspecified' ? !m.supplier : m.supplier === supplierFilter);
    const matchesSearch =
      normalizedSearch === '' ||
      m.name.toLowerCase().includes(normalizedSearch) ||
      m.description?.toLowerCase().includes(normalizedSearch) ||
      m.category?.toLowerCase().includes(normalizedSearch) ||
      m.supplier?.toLowerCase().includes(normalizedSearch);
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
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quantity':
        return b.quantity - a.quantity;
      case 'unit-cost':
        return b.cost - a.cost;
      case 'total-value':
        return (b.cost * b.quantity) - (a.cost * a.quantity);
      case 'recent':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  const materialCategories = [
    'Raw Materials', 'Structural Materials', 'Consumables', 'Tools & Equipment',
    'Safety', 'Electrical', 'Finishing Materials', 'Hardware', 'Other'
  ];

  const units = [
    'pieces', 'kg', 'lbs', 'meters', 'feet', 'inches', 'liters', 'gallons',
    'sets', 'rolls', 'sheets', 'tubes', 'boxes', 'bags', 'cans'
  ];

  const availableCategories = Array.from(new Set([
    ...materialCategories,
    ...materials.map((material) => material.category).filter((category): category is string => Boolean(category)),
  ])).sort((a, b) => a.localeCompare(b));

  const availableSuppliers = Array.from(new Set(
    materials.map((material) => material.supplier).filter((supplier): supplier is string => Boolean(supplier))
  )).sort((a, b) => a.localeCompare(b));

  const lowStockCount = filteredMaterials.filter((material) => material.quantity <= lowStockLimit).length;
  const supplierCount = new Set(filteredMaterials.map((m) => m.supplier).filter(Boolean)).size;
  const categoryCount = new Set(filteredMaterials.map((m) => m.category).filter(Boolean)).size;

  // --- HANDLERS ---
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddMaterial) return;

    // ================= VALIDATIONS =================
    if (formData.name.length > 50 || formData.description?.length > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Name or Description Too Long',
        text: 'Name and description must be less than 50 and 100 characters respectively.',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });
      return;
    }

    if (parseFloat(formData.quantity) > 500000 || parseFloat(formData.cost) > 500000) {
      Swal.fire({
        icon: 'error',
        title: 'Quantity or Cost Too High',
        text: 'Quantity and cost per unit must be less than 500,000.',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });
      return;
    }

    if (!formData.name || !formData.quantity || !formData.cost || !formData.unit || !formData.supplier) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill up the missing fields.',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });
      return;
    }

    // ================= CONFIRMATION =================
    const result = await Swal.fire({
      icon: 'question',
      title: 'Confirm Submission',
      text: 'Are you sure you want to add this material?',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
    });

    if (!result.isConfirmed) return;

    // ================= LOADING (2 SECONDS) =================
    Swal.fire({
      title: 'Submitting...',
      text: 'Please wait',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // ================= SUBMIT =================
    setIsSubmitting(true);

    const newMaterial: Omit<Material, 'id' | 'addedAt'> = {
      name: formData.name,
      description: formData.description || undefined,
      quantity: parseFloat(formData.quantity) || 0,
      unit: formData.unit,
      cost: parseFloat(formData.cost) || 0,
      supplier: formData.supplier || undefined,
      status: formData.status,
      projectId:
        formData.projectId && formData.projectId !== 'none'
          ? formData.projectId
          : undefined,
      addedBy: currentUser.id,
      category: formData.category || undefined,
    };

    try {
      await onAddMaterial(newMaterial);

      setFormData({
        name: '',
        description: '',
        quantity: '',
        unit: '',
        cost: '',
        supplier: '',
        status: 'ordered',
        projectId: 'none',
        category: '',
      });

      setShowAddForm(false);

      Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: 'Material added to inventory.',
        timer: 1500,
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add material',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleEditClick = (material: Material) => {
    setEditingMaterial(material);
    setEditFormData({
      name: material.name,
      description: material.description || '',
      quantity: material.quantity.toString(),
      unit: material.unit,
      cost: material.cost.toString(),
      supplier: material.supplier || '',
      status: material.status,
      projectId: material.projectId || 'none',
      category: material.category || ''
    });
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    if (!onUpdateMaterial) {
      Swal.fire({
        icon: 'error',
        title: 'System Error',
        text: 'Update function not connected.',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
      return;
    }

    // ================= VALIDATIONS =================
    if (formData.name.length > 50 || formData.description?.length > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Name or Description Too Long',
        text: 'Name and description must be less than 50 and 100 characters respectively.',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
      return;
    }

    if (parseFloat(formData.quantity) > 500000 || parseFloat(formData.cost) > 500000) {
      Swal.fire({
        icon: 'error',
        title: 'Quantity or Cost Too High',
        text: 'Quantity and cost per unit must be less than 500,000.',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
      return;
    }

    // ================= CONFIRM =================
    const result = await Swal.fire({
      icon: 'question',
      title: 'Save Changes?',
      text: `Update details for "${editFormData.name}"?`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
    });

    if (!result.isConfirmed) return;

    // ================= LOADING (2 SECONDS) =================
    Swal.fire({
      title: 'Updating...',
      text: 'Please wait',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // ================= SUBMIT =================
    const updatedData: Partial<Material> = {
      name: editFormData.name,
      description: editFormData.description || undefined,
      quantity: parseFloat(editFormData.quantity) || 0,
      unit: editFormData.unit,
      cost: parseFloat(editFormData.cost) || 0,
      supplier: editFormData.supplier || undefined,
      status: editFormData.status,
      projectId:
        editFormData.projectId && editFormData.projectId !== 'none'
          ? editFormData.projectId
          : undefined,
      category: editFormData.category || undefined,
    };

    try {
      await onUpdateMaterial(editingMaterial.id, updatedData);

      setEditingMaterial(null);

      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Material details have been saved.',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update material',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
    }
  };


  const handleDeleteClick = async (id: string) => {
    if (!onDeleteMaterial) return;

    // ================= CONFIRMATION =================
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
    });

    if (!result.isConfirmed) return;

    // ================= LOADING (2 SECONDS) =================
    Swal.fire({
      title: 'Deleting...',
      text: 'Please wait',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
    });

    // Wait 2 seconds before actual delete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ================= DELETE =================
    try {
      await onDeleteMaterial(id);

      Swal.fire({
        title: 'Deleted!',
        text: 'The material has been removed.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete material',
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
    }
  };


  // --- UI HELPERS ---
  const getStatusIcon = (status: Material['status']) => {
    switch (status) {
      case 'ordered': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-use': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'depleted': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Material['status']) => {
    switch (status) {
      case 'ordered': return 'secondary';
      case 'delivered': return 'default';
      case 'in-use': return 'secondary';
      case 'depleted': return 'destructive';
      default: return 'outline';
    }
  };

  const getProjectName = (projectId?: string) => {
    if (isGeneralInventory(projectId)) return 'General Inventory';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getTotalValue = () => {
    return filteredMaterials.reduce((total, m) => total + (m.cost * m.quantity), 0);
  };

  return (
    <div className="space-y-6">
      {/* ================================================================
        ADD MATERIAL FORM (Normal Div instead of Dialog)
        ================================================================
      */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Add New Material</h2>
                <p className="text-sm text-muted-foreground">Fill out the form to add materials to inventory.</p>
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
                    minLength={1}
                    maxLength={50}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter material name"
                    
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  minLength={1}
                  maxLength={100}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional material description"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    minLength={1}
                    maxLength={6}
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost per Unit ({peso}) *</Label>
                  <Input
                    id="cost"
                    type="number"
                    minLength={1}
                    maxLength={6}
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    minLength={1}
                    maxLength={50}
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value: Material['status']) => handleInputChange('status', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="General inventory (no project)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General Inventory</SelectItem>
                    {fabricatorProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : <><Plus className="h-4 w-4 mr-2" /> Add Material</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
        EDIT MATERIAL FORM (Normal Div instead of Dialog)
        ================================================================
      */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Edit Material</h2>
                <p className="text-sm text-muted-foreground">Update the details of this material.</p>
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
                    minLength={1}
                    maxLength={50}
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editFormData.category} onValueChange={(value) => handleEditInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  minLength={1}
                  maxLength={100}
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    minLength={1}
                    maxLength={6}
                    value={editFormData.quantity}
                    onChange={(e) => handleEditInputChange('quantity', e.target.value)}
                    
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit *</Label>
                  <Select value={editFormData.unit} onValueChange={(value) => handleEditInputChange('unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Cost per Unit ({peso}) *</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    minLength={1}
                    maxLength={6}
                    value={editFormData.cost}
                    onChange={(e) => handleEditInputChange('cost', e.target.value)}
                    
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier">Supplier</Label>
                  <Input
                    minLength={1}
                    maxLength={50}
                    id="edit-supplier"
                    value={editFormData.supplier}
                    onChange={(e) => handleEditInputChange('supplier', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select value={editFormData.status} onValueChange={(value: Material['status']) => handleEditInputChange('status', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={editFormData.projectId} onValueChange={(value) => handleEditInputChange('projectId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="General inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General Inventory</SelectItem>
                    {fabricatorProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6" />
            Materials Management
          </h2>
          <p className="text-muted-foreground">Manage materials and inventory for your projects</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Items */}
        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Items</span>
            </div>
            <p className="text-2xl mb-6">{filteredMaterials.length}</p>
          </CardContent>
        </Card>
        
        {/* Total Value */}
        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Value</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Sum of unit cost times quantity for the filtered items.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl mb-6">{formatCurrency(getTotalValue(), true)}</p>
          </CardContent>
        </Card>

        {/* In Use */}
        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">In Use</span>
            </div>
            <p className="text-2xl mb-6">{filteredMaterials.filter(m => m.status === 'in-use').length}</p>
          </CardContent>
        </Card>

        {/* Depleted */}
        <Card>
          <CardContent className="pt-6 pl-5">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Depleted</span>
            </div>
            <p className="text-2xl mb-6">{filteredMaterials.filter(m => m.status === 'depleted').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">Low Stock : {lowStockCount}</Badge>
        <Badge variant="outline">Suppliers: {supplierCount}</Badge>
        <Badge variant="outline">Categories: {categoryCount}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Totals and badges update based on the filters below.
      </p>

      {/* Filters Section */}
      <Card>
        <CardContent className="pt-6 px-5 pb-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
             {/* Search */}
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

            {/* Project Filter */}
            <div className="space-y-2">
              <Label>Project Filter</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="All Projects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="general">General Inventory</SelectItem>
                  {fabricatorProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="depleted">Depleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div className="space-y-2">
              <Label>Supplier Filter</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger><SelectValue placeholder="All Suppliers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                  {availableSuppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="quantity">Quantity (High to Low)</SelectItem>
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
                onChange={(e) => setLowStockThreshold(Number(e.target.value) || 0)}
                className="w-full md:w-[150px]"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <Switch id="low-stock-only" checked={lowStockOnly} onCheckedChange={setLowStockOnly} />
              <Label htmlFor="low-stock-only">Low Stock Only</Label>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedProject('all');
                setStatusFilter('all');
                setCategoryFilter('all');
                setSupplierFilter('all');
                setSearchTerm('');
                setSortBy('recent');
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
        <CardContent className='px-5 mb-5'>
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
                  className={`border rounded-lg p-4 relative ${isLowStock ? 'border-orange-200 bg-orange-50/40' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3 pr-20">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(material.status)}
                      <div>
                        <h4 className="font-medium">{material.name}</h4>
                        {material.description && (
                          <p className="text-sm text-muted-foreground">{material.description}</p>
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
                        <Badge variant="outline" className="border-orange-200 text-orange-700">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
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
                      <p>{material.quantity} {material.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit Cost</p>
                      <p><span className="text-lg">{formatCurrency(material.cost)}</span></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Value</p>
                      <p>{formatCurrency(material.cost * material.quantity)}</p>
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