import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { PhilippinePeso, Save, X, Users, AlertCircle } from 'lucide-react';
import { Project, User, FabricatorBudget } from '../../types';

interface FabricatorRevenueManagerProps {
  project: Project;
  users: User[];
  currentUser: User;
  onUpdateProject: (updatedProject: Project) => void;
  onClose?: () => void;
}

export function FabricatorRevenueManager({ 
  project, 
  users, 
  currentUser,
  onUpdateProject,
  onClose 
}: FabricatorRevenueManagerProps) {
  const [revenueAllocations, setRevenueAllocations] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const totalFabricatorAllocation = Number(project.fabricatorAllocation) || 0;

  // Initialize revenue allocations from existing data
  useEffect(() => {
    const initialAllocations: Record<string, string> = {};
    
    project.fabricatorIds.forEach(fabId => {
      const existing = project.fabricatorBudgets?.find(fb => fb.fabricatorId === fabId);
      initialAllocations[fabId] = existing?.allocatedRevenue?.toString() || '0';
    });

    setRevenueAllocations(initialAllocations);
  }, [project]);

  const canManageRevenue = currentUser.role === 'admin' || 
    (currentUser.role === 'supervisor' && project.supervisorId === currentUser.id);

  if (!canManageRevenue) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to manage fabricator revenue for this project.
        </AlertDescription>
      </Alert>
    );
  }

  const getFabricatorName = (fabricatorId: string) => {
    return users.find(u => u.id === fabricatorId)?.name || 'Unknown Fabricator';
  };

  const handleRevenueChange = (fabricatorId: string, value: string) => {
    // Allow only numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const nextAllocations = {
        ...revenueAllocations,
        [fabricatorId]: value,
      };
      const nextTotalAllocated = Object.values(nextAllocations).reduce((sum, val) => {
        return sum + (parseFloat(val) || 0);
      }, 0);

      if (nextTotalAllocated > totalFabricatorAllocation) {
        setError(
          `Total assigned amount (₱${nextTotalAllocated.toLocaleString()}) cannot exceed allocated fabricator budget (₱${totalFabricatorAllocation.toLocaleString()}).`,
        );
        return;
      }

      setRevenueAllocations(nextAllocations);
      setError('');
      setSuccess(false);
    }
  };

  const getTotalAllocated = () => {
    return Object.values(revenueAllocations).reduce((sum, val) => {
      return sum + (parseFloat(val) || 0);
    }, 0);
  };

  const handleSave = () => {
    const totalAllocated = getTotalAllocated();
    
    // Validate that total doesn't exceed allocated fabricator budget
    if (totalAllocated > totalFabricatorAllocation) {
      setError(
        `Total assigned amount (₱${totalAllocated.toLocaleString()}) cannot exceed allocated fabricator budget (₱${totalFabricatorAllocation.toLocaleString()}).`,
      );
      return;
    }

    // Create or update fabricator budgets with revenue allocations
    const updatedBudgets: FabricatorBudget[] = project.fabricatorIds.map(fabId => {
      const existingBudget = project.fabricatorBudgets?.find(fb => fb.fabricatorId === fabId);
      const allocatedRevenue = parseFloat(revenueAllocations[fabId]) || 0;

      return {
        fabricatorId: fabId,
        allocatedAmount: existingBudget?.allocatedAmount || 0,
        spentAmount: existingBudget?.spentAmount || 0,
        allocatedRevenue: allocatedRevenue,
        description: existingBudget?.description || `Revenue allocation for ${getFabricatorName(fabId)}`
      };
    });

    const updatedProject = {
      ...project,
      fabricatorBudgets: updatedBudgets
    };

    onUpdateProject(updatedProject);
    setSuccess(true);
    setError('');

    // Auto-hide success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  const totalAllocated = getTotalAllocated();
  const remainingAllocation = totalFabricatorAllocation - totalAllocated;

  return (
    <Card>
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="flex items-center gap-2">
          <PhilippinePeso className="h-5 w-5 text-accent" />
          Fabricator Revenue Assignment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Assign amounts to each fabricator without exceeding the total allocated fabricator budget
        </p>
      </CardHeader>
      <CardContent className="space-y-6 px-4 pb-6 sm:px-6">
        {/* Project Revenue Overview */}
        <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Allocated Budget (Fabricators)</p>
            <p className="text-xl">
              ₱{totalFabricatorAllocation.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Assigned Amount</p>
            <p className="text-xl text-accent">
              ₱{totalAllocated.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Remaining Allocated Budget</p>
            <p className={`text-xl ${remainingAllocation < 0 ? 'text-destructive' : 'text-green-600'}`}>
              ₱{remainingAllocation.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Fabricator List with Revenue Inputs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="text-lg">Fabricators ({project.fabricatorIds.length})</h3>
          </div>

          {project.fabricatorIds.map((fabricatorId, index) => {
            const fabricator = users.find(u => u.id === fabricatorId);
            const currentRevenue = parseFloat(revenueAllocations[fabricatorId] || '0');
            const percentage =
              totalFabricatorAllocation > 0
                ? ((currentRevenue / totalFabricatorAllocation) * 100).toFixed(1)
                : '0';

            return (
              <div key={fabricatorId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{fabricator?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{fabricator?.secureId}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{percentage}% of total</Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`revenue-${fabricatorId}`}>
                    Assigned Revenue Amount (₱)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">₱</span>
                    <Input
                      id={`revenue-${fabricatorId}`}
                      type="text"
                      value={revenueAllocations[fabricatorId] || ''}
                      onChange={(e) => handleRevenueChange(fabricatorId, e.target.value)}
                      placeholder="0.00"
                      className="text-lg"
                    />
                  </div>
                  {currentRevenue > 0 && (
                    <p className="text-xs text-muted-foreground">
                      This fabricator will receive ₱{currentRevenue.toLocaleString()} ({percentage}% of allocated fabricator budget)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-600 text-green-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Revenue allocations saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4 sm:flex-row">
          <Button onClick={handleSave} className="w-full sm:flex-1 whitespace-normal text-center">
            <Save className="h-4 w-4 mr-2" />
            Save Revenue Allocations
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={project.fabricatorIds.length === 0}
            onClick={() => {
              if (project.fabricatorIds.length === 0) return;
              const equalShare = (totalFabricatorAllocation / project.fabricatorIds.length).toFixed(2);
              const newAllocations: Record<string, string> = {};
              project.fabricatorIds.forEach(fabId => {
                newAllocations[fabId] = equalShare;
              });
              setRevenueAllocations(newAllocations);
            }}
          >
            Split Equally
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              const newAllocations: Record<string, string> = {};
              project.fabricatorIds.forEach(fabId => {
                newAllocations[fabId] = '0';
              });
              setRevenueAllocations(newAllocations);
            }}
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
