import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Calendar,
  Edit,
  FileText,
  Plus,
  TrendingUp,
  Package,
  Trash2,
  X
} from 'lucide-react';
import { ProjectFileUpload } from '../projects/ProjectFileUpload';
import {
  Project,
  User,
  WorkLogEntry,
  Material,
  ProjectAttachment,
} from '../../types';
import Swal from 'sweetalert2';

interface WorkLogManagerProps {
  currentUser: User;
  projects: Project[];
  workLogs: WorkLogEntry[];
  materials: Material[];
  onAddWorkLog: (workLog: Omit<WorkLogEntry, 'id' | 'createdAt'>) => void;
  onUpdateWorkLog?: (id: string, workLog: Partial<WorkLogEntry>) => void;
  onDeleteWorkLog?: (id: string) => void;
  onUpdateProject?: (project: Project) => void;
}

export function WorkLogManager({
  currentUser,
  projects,
  workLogs,
  materials,
  onAddWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  onUpdateProject
}: WorkLogManagerProps) {
  const [selectedProject, setSelectedProject] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLogEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    date: '',
    description: '',
    progressPercentage: '',
    hoursWorked: '',
    materialsUsed: [] as string[]
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    progressPercentage: '',
    hoursWorked: '0',
    materialsUsed: [] as string[]
  });

  // Filter projects for current fabricator
  const fabricatorProjects = projects.filter(p =>
    p.fabricatorIds.includes(currentUser.id) && p.status !== 'pending-assignment'
  );

  // Filter work logs for selected project and current user
  const filteredWorkLogs = selectedProject
    ? workLogs.filter(wl => wl.projectId === selectedProject && wl.fabricatorId === currentUser.id)
    : workLogs.filter(wl => wl.fabricatorId === currentUser.id);

  // Get available materials for selected project
  const projectMaterials = selectedProject
    ? materials.filter(m => m.projectId === selectedProject || !m.projectId)
    : materials;

  const clampNumber = (value: string, min: number, max?: number) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return null;
    if (typeof max === 'number') {
      return Math.min(max, Math.max(min, parsed));
    }
    return Math.max(min, parsed);
  };

  const buildMaterialOptions = (projectId: string, selected: string[]) => {
    const base = materials
      .filter(m => m.projectId === projectId || !m.projectId)
      .map(material => ({ id: material.id, name: material.name }));
    const existingNames = new Set(base.map((item) => item.name));
    let customIndex = 0;

    selected.forEach((name) => {
      if (!existingNames.has(name)) {
        base.push({ id: `custom-${customIndex}`, name });
        existingNames.add(name);
        customIndex += 1;
      }
    });

    return base;
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialToggle = (materialName: string) => {
    setFormData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.includes(materialName)
        ? prev.materialsUsed.filter(m => m !== materialName)
        : [...prev.materialsUsed, materialName]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if progress contribution is no value return 

    if (!selectedProject) {
      Swal.fire({
        icon: 'warning',
        title: 'Project Required',
        text: 'Please select a project first',
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

    const progressValue = clampNumber(formData.progressPercentage, 0, 100);
    const hoursValue = clampNumber(formData.hoursWorked, 0);

    //get all the input name values
    const { date, description, materialsUsed } = formData;

    // if description is > 100 return sweet alert
    if (description.length > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Description Too Long',
        text: 'Description must be less than 100 characters.',
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

    // if hours work > 500 and progress is not 100 return sweet alert
    if (hoursValue > 500 || progressValue !== 100) {
      Swal.fire({
      icon: 'error',
        title: 'Hours Worked Too High',
        text: 'Hours Worked cannot be greater than 500.',
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
    
    if (!date || !description || materialsUsed.length === 0) {
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
        },
      });
      return;
    }

    if (progressValue === null || hoursValue === null) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please enter valid values for progress (0-100) and hours (positive number).',
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

    // First confirmation before submission
    const confirmResult = await Swal.fire({
      title: 'Confirm Add Work Log',
      text: `Are you sure you want to add this work log for project "${getProjectName(selectedProject)}"?`,
      icon: 'question',
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
        },
    });

    if (!confirmResult.isConfirmed) {
      return; // user cancelled
    }

    // Show loading for 2 seconds
    Swal.fire({
      title: 'Adding Work Log...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 2000,
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
    });

    const newWorkLog: Omit<WorkLogEntry, 'id' | 'createdAt'> = {
      projectId: selectedProject,
      fabricatorId: currentUser.id,
      date: formData.date,
      description: formData.description,
      progressPercentage: progressValue,
      hoursWorked: hoursValue,
      materials: formData.materialsUsed.length > 0 ? formData.materialsUsed : undefined
    };

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      onAddWorkLog(newWorkLog);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        progressPercentage: '',
        hoursWorked: '0',
        materialsUsed: []
      });
      setShowAddForm(false);

      Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: 'Work log has been added successfully.',
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
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add work log',
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


  const openEditLog = (log: WorkLogEntry) => {
    setEditingLog(log);
    setEditFormData({
      date: log.date,
      description: log.description,
      progressPercentage: String(log.progressPercentage ?? ''),
      hoursWorked: String(log.hoursWorked ?? ''),
      materialsUsed: Array.isArray(log.materials) ? [...log.materials] : []
    });
  };

  const handleEditInputChange = (field: string, value: string | string[]) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditMaterialToggle = (materialName: string) => {
    setEditFormData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.includes(materialName)
        ? prev.materialsUsed.filter(m => m !== materialName)
        : [...prev.materialsUsed, materialName]
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog || !onUpdateWorkLog) return;

    const progressValue = clampNumber(editFormData.progressPercentage, 0, 100);
    const hoursValue = clampNumber(editFormData.hoursWorked, 0);
    // get all the input name value
    const { date, description, progressPercentage, hoursWorked, materialsUsed } = editFormData;

    // if hourswork is > 500 show error
    if (hoursValue > 500) {
      Swal.fire({
        icon: 'error',
        title: 'Hours Worked Too High',
        text: 'Hours Worked cannot be greater than 500.',
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

    if (!date || !description || !progressPercentage || !hoursWorked || materialsUsed.length === 0 ) {
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
        },
      });
      return;
    }

    if (progressValue === null || hoursValue === null) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please enter valid values for progress (0-100) and hours (positive number).',
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

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Save Changes?',
      text: 'Update this work log entry?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0f172a',
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

    // Show loading
    Swal.fire({
      title: 'Updating...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 2000,
      timerProgressBar: true,
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
    });

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onUpdateWorkLog(editingLog.id, {
        date: editFormData.date,
        description: editFormData.description,
        progressPercentage: progressValue,
        hoursWorked: hoursValue,
        materials: editFormData.materialsUsed
      });
      
      setEditingLog(null);

      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Work log has been updated successfully.',
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
        text: 'Failed to update work log',
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

  const handleDeleteLog = async (log: WorkLogEntry) => {
    if (!onDeleteWorkLog) return;
    
    const formattedDate = new Date(log.date).toLocaleDateString();

    const result = await Swal.fire({
      title: 'Delete Work Log?',
      text: `Are you sure you want to delete the work log from ${formattedDate}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
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

    // Show loading
    Swal.fire({
      title: 'Deleting...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 2000,
      customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
    });

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onDeleteWorkLog(log.id);

      Swal.fire({
        title: 'Deleted!',
        text: 'The work log has been removed.',
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
        text: 'Failed to delete work log',
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

  const getProjectProgress = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.progress || 0;
  };

  const getSelectedProject = () => projects.find(p => p.id === selectedProject);
  const hasDocumentation = () => {
    const proj = getSelectedProject();
    if (!proj) return false;
    const hasFiles = Array.isArray(proj.attachments) && proj.attachments.length > 0;
    const hasLink = !!proj.documentationUrl && proj.documentationUrl.trim().length > 0;
    return hasFiles || hasLink;
  };
  
  const canSubmitForReview = () => {
    const proj = getSelectedProject();
    if (!proj) return false;

    // Check all conditions explicitly
    // Allow submission if status is one where fabricator is actively working
    const validStatuses = ['1_Assigned_to_FAB', 'in-progress', 'planning'];
    const hasStatus = validStatuses.includes(proj.status);

    // Exclude statuses where already in review or completed
    const invalidStatuses = [
      '2_Ready_for_Supervisor_Review',
      '3_Ready_for_Admin_Review',
      '4_Ready_for_Client_Signoff',
      'completed',
      'on-hold'
    ];
    const hasInvalidStatus = invalidStatuses.includes(proj.status);

    const hasDocs = hasDocumentation();
    const hasProgress = proj.progress >= 100;

    // Debug logging (can be removed later)
    console.log('Submit button check:', {
      projectId: proj.id,
      status: proj.status,
      statusMatch: hasStatus && !hasInvalidStatus,
      progress: proj.progress,
      hasProgress: hasProgress,
      hasDocs: hasDocs,
      attachments: proj.attachments?.length || 0,
      docUrl: proj.documentationUrl,
      canSubmit: hasStatus && !hasInvalidStatus && hasDocs && hasProgress
    });

    return hasStatus && !hasInvalidStatus && hasDocs && hasProgress;
  };
  
  const canManageDocumentation = () => {
    const proj = getSelectedProject();
    if (!proj) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') return true;
    if (currentUser.role === 'fabricator') {
      return proj.fabricatorIds.includes(currentUser.id);
    }
    return false;
  };
  
  const handleProjectFilesUploaded = (newAttachments: ProjectAttachment[]) => {
    const proj = getSelectedProject();
    if (!proj || !onUpdateProject) return;
    const updatedAttachments = [...(proj.attachments || []), ...newAttachments];
    onUpdateProject({ ...proj, attachments: updatedAttachments });
  };
  
  const submitForSupervisorReview = () => {
    const proj = getSelectedProject();
    if (!proj || !onUpdateProject) return;
    const updated: Project = { ...proj, status: '2_Ready_for_Supervisor_Review' };
    onUpdateProject(updated);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const editMaterialOptions = editingLog
    ? buildMaterialOptions(editingLog.projectId, editFormData.materialsUsed)
    : [];

  return (
    <div className="space-y-6">
      {/* ================================================================
        ADD WORK LOG FORM (Normal Div instead of Dialog)
        ================================================================
      */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Add Work Log Entry</h2>
                {selectedProject && (
                  <p className="text-sm text-muted-foreground">
                    Project: {getProjectName(selectedProject)}
                  </p>
                )}
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress Contribution (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="5"
                  value={formData.progressPercentage}
                  onChange={(e) => handleInputChange('progressPercentage', e.target.value)}
                  
                />
                <p className="text-sm text-muted-foreground">
                  How much of the project does this work session complete?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Hours Worked</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="4.5"
                  value={formData.hoursWorked ?? ''}
                  onChange={(e) => handleInputChange('hoursWorked', e.target.value)}
                  
                />
                <p className="text-xs text-muted-foreground">
                  How many hours did you spend on this session?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Work Description</Label>
                <Textarea
                  minLength={1}
                  maxLength={100}
                  id="description"
                  placeholder="Describe the work performed, challenges faced, and achievements..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  
                />
              </div>

              <div className="space-y-2">
                <Label>Materials Used (Optional)</Label>
                {projectMaterials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No materials available for this project.
                  </p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-3">
                    {projectMaterials.map(material => (
                      <div key={material.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`material-${material.id}`}
                          checked={formData.materialsUsed.includes(material.name)}
                          onChange={() => handleMaterialToggle(material.name)}
                          className="rounded"
                        />
                        <Label
                          htmlFor={`material-${material.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {material.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : <><Plus className="h-4 w-4 mr-2" /> Add Work Log</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
        EDIT WORK LOG FORM (Normal Div instead of Dialog)
        ================================================================
      */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Edit Work Log Entry</h2>
                <p className="text-sm text-muted-foreground">
                  Project: {getProjectName(editingLog.projectId)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingLog(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => handleEditInputChange('date', e.target.value)}
                    
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-progress">Progress Contribution (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="5"
                  value={editFormData.progressPercentage}
                  onChange={(e) =>
                    handleEditInputChange('progressPercentage', e.target.value)
                  }
                  
                />
                <p className="text-sm text-muted-foreground">
                  How much of the project does this work session complete?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-hours">Hours Worked</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="4.5"
                  value={editFormData.hoursWorked}
                  onChange={(e) =>
                    handleEditInputChange('hoursWorked', e.target.value)
                  }
                  
                />
                <p className="text-xs text-muted-foreground">
                  How many hours did you spend on this session?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Work Description</Label>
                <Textarea
                  minLength={1}
                  maxLength={100}
                  id="edit-description"
                  placeholder="Describe the work performed, challenges faced, and achievements..."
                  value={editFormData.description}
                  onChange={(e) =>
                    handleEditInputChange('description', e.target.value)
                  }
                  rows={4}
                  
                />
              </div>

              <div className="space-y-2">
                <Label>Materials Used (Optional)</Label>
                {editMaterialOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No materials available for this project.
                  </p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-3">
                    {editMaterialOptions.map(material => (
                      <div key={material.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-material-${material.id}`}
                          checked={editFormData.materialsUsed.includes(material.name)}
                          onChange={() => handleEditMaterialToggle(material.name)}
                          className="rounded"
                        />
                        <Label
                          htmlFor={`edit-material-${material.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {material.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditingLog(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6" />
            Work Log & Progress Reports
          </h2>
          <p className="text-muted-foreground">Track your daily work progress and material usage</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={!selectedProject}>
          <Plus className="h-4 w-4 mr-2" />
          Add Work Log
        </Button>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Project
          </CardTitle>
        </CardHeader>
        <CardContent className='pb-5 px-5'>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project to log work for" />
            </SelectTrigger>
            <SelectContent>
              {fabricatorProjects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{project.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {project.progress}% Complete
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {selectedProject && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Project Progress</span>
              </div>
              <p className="text-2xl">{getProjectProgress(selectedProject)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Work Entries</span>
              </div>
              <p className="text-2xl">{filteredWorkLogs.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Documentation</span>
              </div>
              <p className="text-2xl">{hasDocumentation() ? 'Ready' : 'Missing'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit for Supervisor Review */}
      {selectedProject && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Upload files in the Project Details &gt; Files or add a documentation link.</div>
                {(() => {
                  const proj = getSelectedProject();
                  if (!proj) return null;
                  const missingRequirements = [];
                  if (!hasDocumentation()) missingRequirements.push('documentation');
                  if (proj.progress < 100) missingRequirements.push('100% progress');
                  if (proj.status !== '1_Assigned_to_FAB') missingRequirements.push('correct status');

                  return (
                    <div className="text-xs space-y-1">
                      <div>
                        Progress: <strong>{proj.progress}%</strong> {proj.progress < 100 && '(Must be 100% to submit)'}
                      </div>
                      <div>
                        Status: <strong>{proj.status}</strong> {
                          !['1_Assigned_to_FAB', 'in-progress', 'planning'].includes(proj.status) &&
                          !['2_Ready_for_Supervisor_Review', '3_Ready_for_Admin_Review', '4_Ready_for_Client_Signoff', 'completed', 'on-hold'].includes(proj.status) &&
                          '(Status must allow submission)'
                        }
                      </div>
                      <div>
                        Documentation: <strong>{hasDocumentation() ? 'Ready' : 'Missing'}</strong>
                        {!hasDocumentation() && (
                          <span className="ml-1">({proj.attachments?.length || 0} files, {proj.documentationUrl ? 'has link' : 'no link'})</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <Button
                onClick={submitForSupervisorReview}
                disabled={!canSubmitForReview()}
                className={canSubmitForReview() ? 'bg-green-600 hover:bg-green-700' : ''}
                title={
                  (() => {
                    const proj = getSelectedProject();
                    if (!proj) return 'Select a project first';
                    const validStatuses = ['1_Assigned_to_FAB', 'in-progress', 'planning'];
                    const invalidStatuses = ['2_Ready_for_Supervisor_Review', '3_Ready_for_Admin_Review', '4_Ready_for_Client_Signoff', 'completed', 'on-hold'];
                    if (!validStatuses.includes(proj.status) || invalidStatuses.includes(proj.status)) {
                      return `Status must allow submission (currently: ${proj.status})`;
                    }
                    if (!hasDocumentation()) return 'Add documentation (files or link) before submitting';
                    if (proj.progress < 100) return `Progress must be 100% (currently: ${proj.progress}%)`;
                    return 'Click to submit for supervisor review';
                  })()
                }
              >
                Submit for Supervisor Review
              </Button>
            </div>
          </CardContent>
      </Card>
    )}

      {selectedProject && canManageDocumentation() && onUpdateProject && (
        <ProjectFileUpload
          projectId={selectedProject}
          currentUserId={currentUser.id}
          onFilesUploaded={handleProjectFilesUploaded}
        />
      )}

      {/* Work Log History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Work Log History
            {selectedProject && (
              <Badge variant="outline">
                {getProjectName(selectedProject)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='px-5 mb-10'>
          {filteredWorkLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No work logs found</h3>
              <p className="text-muted-foreground">
                {selectedProject
                  ? 'Start logging your work progress for this project.'
                  : 'Select a project to view your work logs.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkLogs
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.date).toLocaleDateString()}
                        </div>

                        <Badge variant="outline">
                          +{log.progressPercentage}% progress
                        </Badge>

                        <Badge variant="secondary">
                          {log.hoursWorked} hours
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!selectedProject && (
                          <Badge variant="outline">
                            {getProjectName(log.projectId)}
                          </Badge>
                        )}
                        {onUpdateWorkLog && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditLog(log)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        )}
                        {onDeleteWorkLog && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLog(log)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm mb-3">{log.description}</p>

                    {log.materials && log.materials.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground mb-1">Materials Used:</p>
                        <div className="flex flex-wrap gap-1">
                          {log.materials.map((material, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Logged on {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}