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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
// import { Separator } from '../ui/separator';
import { 
  Package, 
  Plus, 
  Search,
  // Filter,
  PhilippinePeso,
  CircleHelp,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  // Edit,
  // Trash2
} from 'lucide-react';
import { Material, User, Project } from '../../types';

interface MaterialsManagerProps {
  currentUser: User;
  projects: Project[];
  materials: Material[];
  onAddMaterial: (material: Omit<Material, 'id' | 'addedAt'>) => void;
  _onUpdateMaterial?: (id: string, material: Partial<Material>) => void;
  _onDeleteMaterial?: (id: string) => void;
  onDeleteMaterial?: (id: string) => void;
}

const peso = "\u20B1";
type SortOption = 'recent' | 'name' | 'quantity' | 'unit-cost' | 'total-value';

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
  _onUpdateMaterial,
  _onDeleteMaterial
}: MaterialsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [statusFilter, setStatusFilter] = useState<Material['status'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Filter projects for current fabricator
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

  // Filter materials
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
    'Raw Materials',
    'Structural Materials',
    'Consumables',
    'Tools & Equipment',
    'Safety',
    'Electrical',
    'Finishing Materials',
    'Hardware',
    'Other'
  ];

  const units = [
    'pieces', 'kg', 'lbs', 'meters', 'feet', 'inches', 'liters', 'gallons',
    'sets', 'rolls', 'sheets', 'tubes', 'boxes', 'bags', 'cans'
  ];

  const availableCategories = Array.from(new Set([
    ...materialCategories,
    ...materials
      .map((material) => material.category)
      .filter((category): category is string => Boolean(category)),
  ])).sort((a, b) => a.localeCompare(b));

  const availableSuppliers = Array.from(new Set(
    materials
      .map((material) => material.supplier)
      .filter((supplier): supplier is string => Boolean(supplier))
  )).sort((a, b) => a.localeCompare(b));

  const lowStockCount = filteredMaterials.filter((material) => material.quantity <= lowStockLimit).length;
  const supplierCount = new Set(
    filteredMaterials
      .map((material) => material.supplier)
      .filter((supplier): supplier is string => Boolean(supplier))
  ).size;
  const categoryCount = new Set(
    filteredMaterials
      .map((material) => material.category)
      .filter((category): category is string => Boolean(category))
  ).size;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMaterial: Omit<Material, 'id' | 'addedAt'> = {
      name: formData.name,
      description: formData.description || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      cost: parseFloat(formData.cost),
      supplier: formData.supplier || undefined,
      status: formData.status,
      projectId: (formData.projectId && formData.projectId !== 'none') ? formData.projectId : undefined,
      addedBy: currentUser.id,
      category: formData.category || undefined
    };

    onAddMaterial(newMaterial);

    // Reset form
    setFormData({
      name: '',
      description: '',
      quantity: '',
      unit: '',
      cost: '',
      supplier: '',
      status: 'ordered',
      projectId: 'none',
      category: ''
    });
    setShowAddForm(false);
  };

  const getStatusIcon = (status: Material['status']) => {
    switch (status) {
      case 'ordered':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-use':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'depleted':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Material['status']) => {
    switch (status) {
      case 'ordered':
        return 'secondary';
      case 'delivered':
        return 'default';
      case 'in-use':
        return 'secondary';
      case 'depleted':
        return 'destructive';
      default:
        return 'outline';
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
      {/* Header */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materials Management
            </h2>
            <p className="text-muted-foreground">Manage materials and inventory for your projects</p>
          </div>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Material</DialogTitle>
            <DialogDescription>Fill out the form to add materials to inventory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Material Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter material name"
                  required
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
                      <SelectItem key={category} value={category}>
                        {category}
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
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="0"
                  required
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
                      <SelectItem key={unit} value={unit}>
                        {unit}
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
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: Material['status']) => handleInputChange('status', value)}>
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
              <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="General inventory (no project)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Inventory</SelectItem>
                  {fabricatorProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Items</span>
            </div>
            <p className="text-2xl">{filteredMaterials.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Value</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Total value info"
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Sum of unit cost times quantity for the filtered items.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl">{formatCurrency(getTotalValue(), true)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">In Use</span>
            </div>
            <p className="text-2xl">{filteredMaterials.filter(m => m.status === 'in-use').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Depleted</span>
            </div>
            <p className="text-2xl">{filteredMaterials.filter(m => m.status === 'depleted').length}</p>
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label>Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, category, supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Matches name, category, supplier, or description.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Project Filter</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="general">General Inventory</SelectItem>
                  {fabricatorProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={(value: Material['status'] | 'all') => setStatusFilter(value)}>
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
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
                  {availableSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Sort By</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Sort info"
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Changes the order of the materials list.</TooltipContent>
                </Tooltip>
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="quantity">Quantity (High to Low)</SelectItem>
                  <SelectItem value="unit-cost">Unit Cost (High to Low)</SelectItem>
                  <SelectItem value="total-value">Total Value (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Low stock threshold info"
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Items at or below this quantity are marked low stock.</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                step="0.01"
                value={lowStockThreshold}
                onChange={(e) => {
                  const nextValue = Number(e.target.value);
                  setLowStockThreshold(Number.isNaN(nextValue) ? 0 : nextValue);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Applied after filters; defaults to 5.
              </p>
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  id="low-stock-only"
                  checked={lowStockOnly}
                  onCheckedChange={setLowStockOnly}
                />
                <div className="flex items-center gap-1">
                  <Label htmlFor="low-stock-only">Low Stock Only</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Low stock only info"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Shows only items under the low stock threshold.</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="flex items-end">
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
        <CardContent>
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
                  className={`border rounded-lg p-4 ${isLowStock ? 'border-orange-200 bg-orange-50/40' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
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

                  <div className="grid gap-4 md:grid-cols-4 text-sm">
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

                  <div className="text-xs text-muted-foreground mt-2">
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
