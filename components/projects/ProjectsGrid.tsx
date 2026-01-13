import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  Calendar, DollarSign, Users, Building, FileText, Link, Paperclip, 
  Plus, UserPlus, CheckCircle, Clock, XCircle, MessageSquare, Eye, 
  TrendingUp, AlertCircle, Wallet 
} from 'lucide-react';
import { Project, User } from '../../types';
import { CreateProjectForm } from './CreateProjectForm';
import { ProjectDetails } from './ProjectDetails';
import { emailService } from '../../utils/emailService';
import { ClientCreationDialog } from '../client/ClientCreationDialog';

interface ProjectsGridProps {
  projects: Project[];
  users: User[];
  currentUser: User;
  onCreateProject?: (project: Omit<Project, 'id'>) => void | Promise<void> | Promise<Project>;
  onAssignFabricator?: (projectId: string, fabricatorId: string, message?: string) => void;
  onUpdateProject?: (project: Project) => void;
  onAcceptAssignment?: (assignmentId: string, response?: string, projectId?: string) => void;
  onDeclineAssignment?: (assignmentId: string, response?: string, projectId?: string) => void;
  onCreateUser?: (user: User) => void;
  onBroadcastFabricators?: (projectId: string, message?: string) => void;
}

export function ProjectsGrid({
  projects = [],
  users = [],
  currentUser,
  onCreateProject,
  onAssignFabricator,
  onUpdateProject,
  onAcceptAssignment,
  onDeclineAssignment,
  onCreateUser,
  onBroadcastFabricators
}: ProjectsGridProps) {
  // Move all hooks to the top - this is required by React Hooks rules
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFabricatorId, setSelectedFabricatorId] = useState('');
  const [assignMessage, setAssignMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [clientDialogProject, setClientDialogProject] = useState<Project | null>(null);
  // Track locally assigned clients to avoid relying solely on parent refresh
  const [localClientAssignedProjectIds, setLocalClientAssignedProjectIds] = useState<Set<string>>(new Set());
  // For fabricator assignment responses
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [assignmentResponse, setAssignmentResponse] = useState('');

  if (!currentUser) return null; // Safety check

  const getFilteredProjects = () => {
    // First filter by role-based access
    let roleFilteredProjects;
    if (currentUser.role === 'admin') {
      roleFilteredProjects = projects;
    } else if (currentUser.role === 'supervisor') {
      roleFilteredProjects = projects.filter(p =>
        p.supervisorId === currentUser.id ||
        (p.pendingSupervisors && p.pendingSupervisors.includes(currentUser.id))
      );
    } else if (currentUser.role === 'fabricator') {
      // For fabricators, show both assigned projects and pending assignments
      roleFilteredProjects = projects.filter(p =>
        p.fabricatorIds.includes(currentUser.id) ||
        p.pendingAssignments?.some(assignment =>
          assignment.fabricatorId === currentUser.id && assignment.status === 'pending'
        )
      );
    } else {
      roleFilteredProjects = projects.filter(p => p.fabricatorIds.includes(currentUser.id));
    }

    // Then filter out completed projects (they should only appear in archives)
    return roleFilteredProjects.filter(p => p.status !== 'completed');
  };

  const filteredProjects = getFilteredProjects();
  // Determine if a client is already assigned to a project
  const isClientAssigned = (project: Project) => {
    if (localClientAssignedProjectIds.has(project.id)) return true;
    if (project.clientName && project.clientName.trim().length > 0) return true;
    // Fallback: check if there is a client user linked to this project
    return users.some(u => u.role === 'client' && u.clientProjectId === project.id);
  };

  // Get available fabricators for assignment (exclude already assigned ones)
  const getAvailableFabricators = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    return users.filter(u =>
      u.role === 'fabricator' &&
      !project.fabricatorIds.includes(u.id) &&
      !project.pendingAssignments?.some(pa => pa.fabricatorId === u.id && pa.status === 'pending')
    );
  };

  const handleAssignFabricator = () => {
    if (onAssignFabricator && selectedProjectId && selectedFabricatorId) {
      onAssignFabricator(selectedProjectId, selectedFabricatorId, assignMessage || undefined);
      setShowAssignForm(false);
      setSelectedProjectId('');
      setSelectedFabricatorId('');
      setAssignMessage('');
    }
  };

  const canCreateProject = (currentUser.role === 'admin' || currentUser.role === 'supervisor');

  const getStatusColor = (status: string) => {
    switch (status) {
      case '0_Created':
        return 'outline';
      case '1_Assigned_to_FAB':
        return 'secondary';
      case '2_Ready_for_Supervisor_Review':
        return 'destructive';
      case '3_Ready_for_Admin_Review':
        return 'destructive';
      case '4_Ready_for_Client_Signoff':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSupervisorName = (supervisorId: string) => {
    const supervisor = users.find(u => u.id === supervisorId);
    return supervisor?.name || 'Unknown Supervisor';
  };

  const getFabricatorNames = (fabricatorIds: string[]) => {
    return fabricatorIds
      .map(id => users.find(u => u.id === id)?.name || 'Unknown')
      .join(', ');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFabricatorBudget = (project: Project, fabricatorId: string) => {
    return project.fabricatorBudgets?.find(fb => fb.fabricatorId === fabricatorId);
  };

  const handleCreateProject = async (project: Omit<Project, 'id'>) => {
    let result;
    if (onCreateProject) {
      result = await onCreateProject(project);
    }
    return result;
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    if (onUpdateProject) {
      onUpdateProject(updatedProject);
      // Send email notification about project update
      emailService.sendProjectUpdate(updatedProject, users, 'progress_update', currentUser);
    }
  };

  const handleArchiveAllCompleted = () => {
    if (!onUpdateProject) return;
    const archivable = projects.filter(p =>
      p.status === 'completed' ||
      p.status === '4_Ready_for_Client_Signoff' ||
      p.progress >= 100
    );
    archivable.forEach(p => {
      const updated: Project = { ...p, status: 'completed' };
      onUpdateProject(updated);
    });
  };

  const getArchivableProjects = () => {
     return projects.filter(p =>
      p.status === 'completed' ||
      p.status === '4_Ready_for_Client_Signoff' ||
      p.progress >= 100
    );
  }

  const handleTransition = (project: Project, nextStatus: Project['status']) => {
    if (!onUpdateProject) return;
    const updatedProject = { ...project, status: nextStatus };
    onUpdateProject(updatedProject);
    emailService.sendProjectUpdate(updatedProject, users, 'status_change', currentUser);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your projects</p>
        </div>
        <div className="flex gap-2">
          {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
            <Button
              variant="outline"
              onClick={handleArchiveAllCompleted}
              disabled={getArchivableProjects().length === 0}
              title={getArchivableProjects().length === 0 ? 'No projects ready to archive' : ''}
            >
              Archive Completed ({getArchivableProjects().length})
            </Button>
          )}
          {canCreateProject && (
            <Button onClick={() => setShowCreateForm(true)} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          // HELPER: Cast to any to access snake_case fields that might come from PHP backend
          // This ensures we don't display $0.00 just because of camelCase/snake_case mismatch
          const p = project as any;
          const fabAlloc = Number(p.fabricator_allocation || p.fabricatorAllocation || 0);
          const matAlloc = Number(p.materials_allocation || p.materialsAllocation || 0);
          const supAlloc = Number(p.supervisor_allocation || p.supervisorAllocation || 0);
          
          return (
            <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getStatusColor(project.status)} className="text-xs">
                      {project.status}
                    </Badge>
                    <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    <span className="truncate">
                      Client: {project.clientName || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString()} - {' '}
                      {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* --- Role-based financial information --- */}
                  
                  {/* 1. Fabricator View */}
                  {currentUser.role === 'fabricator' && (
                    <div className="bg-secondary/20 p-2 rounded mt-2 border border-secondary/30">
                      {(() => {
                        const fabricatorBudget = getFabricatorBudget(project, currentUser.id);
                        if (fabricatorBudget) {
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center font-medium">
                                  <span>My Budget:</span>
                                  <span>₱{fabricatorBudget.allocatedAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-muted-foreground">
                                  <span>Spent:</span>
                                  <span>₱{fabricatorBudget.spentAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> Labor Pool:
                              </span>
                              <span className="font-medium">₱{fabAlloc.toLocaleString()}</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* 2. Supervisor View */}
                  {currentUser.role === 'supervisor' && (
                    <div className="bg-muted/40 p-3 rounded-md text-xs space-y-2 mt-2 border">
                      <div className="flex justify-between items-center font-bold text-primary border-b pb-2 mb-1 border-dashed">
                         <span className="flex items-center gap-1"><Wallet className="h-3 w-3"/> Budget Limit:</span>
                         <span>₱{Number(project.budget).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Materials:</span>
                          <span>₱{matAlloc.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Labor:</span>
                          <span>₱{fabAlloc.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fees:</span>
                          <span>₱{supAlloc.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-medium">
                        <span>Total Spent:</span>
                        <span className={`${Number(project.spent) > Number(project.budget) ? 'text-destructive' : 'text-orange-600'}`}>
                          ₱{Number(project.spent).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. Admin View: Profit & Loss */}
                  {currentUser.role === 'admin' && (
                    <div className="bg-card border shadow-sm p-3 rounded-md text-xs space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                           <TrendingUp className="h-3 w-3" /> Revenue:
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          ₱{Number(project.revenue).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Op. Cost (Budget):</span>
                        <span>- ₱{Number(project.budget).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-dashed my-1"></div>
                      <div className="flex justify-between items-center font-bold text-sm">
                         <span>Net Profit:</span>
                         <span className={(Number(project.revenue) - Number(project.budget)) >= 0 ? "text-green-600" : "text-destructive"}>
                           ₱{(Number(project.revenue) - Number(project.budget)).toLocaleString()}
                         </span>
                      </div>
                      
                      {/* Alerts */}
                      {Number(project.spent) > Number(project.budget) && (
                         <div className="flex items-center gap-1 text-destructive mt-1 justify-end font-medium">
                            <AlertCircle className="h-3 w-3" />
                            <span>Over Budget</span>
                         </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate text-muted-foreground">
                        Supervisor: <span className="text-foreground">{getSupervisorName(project.supervisorId)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate text-muted-foreground">
                        Team: <span className="text-foreground">{getFabricatorNames(project.fabricatorIds)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Documentation Link */}
                  {project.documentationUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <Link className="h-3 w-3" />
                      <a
                        href={project.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        Documentation
                      </a>
                    </div>
                  )}

                  {/* Attachments */}
                  {project.attachments && project.attachments.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>Attachments ({project.attachments.length})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- Action Buttons & Banners (Pending Logic) --- */}
                {/* Pending Supervisor Assignment Banner */}
                {currentUser.role === 'supervisor' && project.pendingSupervisors?.includes(currentUser.id) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        Pending Project Assignment
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onAcceptAssignment && onAcceptAssignment('', 'accepted', project.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => onDeclineAssignment && onDeclineAssignment('', 'declined', project.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

                {/* Pending Assignment Banner for Fabricators */}
                {currentUser.role === 'fabricator' && project.pendingAssignments?.some(
                  assignment => assignment.fabricatorId === currentUser.id && assignment.status === 'pending'
                ) && !project.fabricatorIds.includes(currentUser.id) && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-3 space-y-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="font-semibold text-orange-900 dark:text-orange-100 text-sm">
                          New Assignment
                        </span>
                      </div>
                      {project.pendingAssignments
                        .filter(a => a.fabricatorId === currentUser.id && a.status === 'pending')
                        .map(assignment => (
                           <div key={assignment.id} className="space-y-2">
                              {/* Simple accept/decline logic here (simplified for brevity) */}
                              <Button 
                                size="sm" 
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setSelectedAssignment(`accept-${assignment.id}`)}
                              >
                                Review & Accept
                              </Button>
                           </div>
                        ))}
                    </div>
                  )}

                <div className="grid grid-cols-2 lg:flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full lg:flex-1"
                    onClick={() => handleViewDetails(project)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="truncate">Details</span>
                  </Button>
                  
                  {/* Supervisor/Admin Actions */}
                  {currentUser.role === 'supervisor' && project.supervisorId === currentUser.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full lg:flex-1 text-accent"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowAssignForm(true);
                      }}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      <span className="truncate">Assign</span>
                    </Button>
                  )}

                  {/* State Transitions */}
                  {currentUser.role === 'admin' && project.status === '0_Created' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full lg:flex-1 bg-primary"
                      onClick={() => handleTransition(project, '1_Assigned_to_FAB')}
                    >
                      Assign Now
                    </Button>
                  )}
                  
                  {currentUser.role === 'fabricator' && project.status === '1_Assigned_to_FAB' && (
                     <Button
                       variant="default"
                       size="sm"
                       className="w-full lg:flex-1"
                       onClick={() => handleTransition(project, '2_Ready_for_Supervisor_Review')}
                     >
                       Submit
                     </Button>
                  )}

                  {currentUser.role === 'supervisor' && project.status === '2_Ready_for_Supervisor_Review' && (
                     <Button
                       variant="default"
                       size="sm"
                       className="w-full lg:flex-1 bg-green-600 hover:bg-green-700"
                       onClick={() => handleTransition(project, '3_Ready_for_Admin_Review')}
                     >
                       Approve
                     </Button>
                  )}

                  {currentUser.role === 'admin' && project.status === '3_Ready_for_Admin_Review' && (
                     <Button
                       variant="default"
                       size="sm"
                       className="w-full lg:flex-1 bg-green-600 hover:bg-green-700"
                       onClick={() => handleTransition(project, '4_Ready_for_Client_Signoff')}
                     >
                       Approve
                     </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* --- Modals --- */}
      {showCreateForm && (
        <CreateProjectForm
          currentUser={currentUser}
          users={users}
          onCreateProject={async (project) => {
            await handleCreateProject(project);
          }}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {showAssignForm && (
        <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Fabricator</DialogTitle>
              <DialogDescription>
                Select a fabricator to assign to this project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fabricatorId">Select Fabricator</Label>
                <Select value={selectedFabricatorId} onValueChange={setSelectedFabricatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a fabricator" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableFabricators(selectedProjectId).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.secureId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignMessage">Message</Label>
                <Textarea
                  id="assignMessage"
                  value={assignMessage}
                  onChange={(e) => setAssignMessage(e.target.value)}
                  placeholder="Instructions..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAssignForm(false)}>Cancel</Button>
                <Button onClick={handleAssignFabricator} disabled={!selectedFabricatorId}>Assign</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showProjectDetails && selectedProject && (
        <ProjectDetails
          project={selectedProject}
          users={users}
          currentUser={currentUser}
          onUpdateProject={handleUpdateProject}
          onClose={() => setShowProjectDetails(false)}
        />
      )}

      {showClientDialog && clientDialogProject && (
        <ClientCreationDialog
          open={showClientDialog}
          onClose={() => {
            setShowClientDialog(false);
            setClientDialogProject(null);
          }}
          project={clientDialogProject}
          onClientCreated={(client) => {
            onCreateUser?.(client);
            setLocalClientAssignedProjectIds(prev => new Set(prev).add(clientDialogProject.id));
            setShowClientDialog(false);
            setClientDialogProject(null);
          }}
        />
      )}
    </div>
  );
}