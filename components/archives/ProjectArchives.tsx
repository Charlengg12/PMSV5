import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Archive,
  Calendar,
  DollarSign,
  Download,
  Eye,
  FileText,
  GraduationCap,
  User,
  Building,
  Trash2,
  Edit,
} from "lucide-react";
import { Project, User as UserType, Material, WorkLogEntry } from "../../types";
import { ProjectDetails } from "../projects/ProjectDetails";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { CreateProjectForm } from "../projects/CreateProjectForm";

interface ProjectArchivesProps {
  projects: Project[];
  users: UserType[];
  materials: Material[];
  workLogs: WorkLogEntry[];
  currentUser: UserType;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateProject?: (projectData: any) => Promise<any>;
}

export function ProjectArchives({
  projects,
  users,
  materials,
  workLogs,
  currentUser,
  onUpdateProject,
  onDeleteProject,
  onCreateProject,
}: ProjectArchivesProps) {
  const safeText = (value?: string) => value || "";
  const safeNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };
  const getProjectSchool = (project: Project) => {
    const client = users.find(
      (u) => u.role === "client" && u.clientProjectId === project.id
    );
    const name = safeText(client?.school || project.clientName).trim();
    return name || "Unknown";
  };
  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };
  const getAttachments = (project?: Project) =>
    Array.isArray(project?.attachments) ? project!.attachments! : [];
  const getFabricatorIds = (project?: Project) =>
    Array.isArray(project?.fabricatorIds) ? project!.fabricatorIds : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isArchivableProject = (project: Project) => {
    const normalizedStatus = safeText(project.status).toLowerCase().trim();
    const normalizedToken = normalizedStatus.replace(/[^a-z0-9]+/g, "_");
    return (
      normalizedStatus === "completed" ||
      normalizedStatus === "complete" ||
      normalizedToken.includes("ready_for_client_signoff") ||
      safeNumber(project.progress) >= 100
    );
  };

  // Get completed/archivable projects only
  const completedProjects = projects.filter(isArchivableProject);

  // Get unique schools from completed projects
  const schools = Array.from(
    new Set(completedProjects.map(getProjectSchool))
  ).sort();

  // Filter projects based on search and school
  const filteredProjects = completedProjects.filter((project) => {
    const matchesSearch =
      safeText(project.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeText(project.description)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      safeText(project.clientName)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const projectSchool = getProjectSchool(project);
    const matchesSchool =
      selectedSchool === "all" || projectSchool === selectedSchool;

    return matchesSearch && matchesSchool;
  });

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };

  const getProjectMaterials = (projectId: string) => {
    return materials.filter((material) => material.projectId === projectId);
  };

  const getProjectWorkLogs = (projectId: string) => {
    return workLogs.filter((log) => log.projectId === projectId);
  };

  const calculateTotalMaterialCost = (projectId: string) => {
    return getProjectMaterials(projectId).reduce(
      (total, material) => total + safeNumber(material.cost),
      0
    );
  };

  const getFabricatorDocumentation = (project: Project) => {
    const attachments = getAttachments(project);
    const fabricatorIds = getFabricatorIds(project);
    return attachments.filter((att) =>
      fabricatorIds.some((fabId) => att.uploadedBy === fabId)
    );
  };

  const getCostAnalysisDocuments = (project: Project) => {
    const attachments = getAttachments(project);
    return attachments.filter(
      (att) =>
        safeText(att.name).toLowerCase().includes("cost") ||
        safeText(att.name).toLowerCase().includes("analysis") ||
        safeText(att.name).toLowerCase().includes("budget") ||
        att.type?.includes("spreadsheet")
    );
  };

  const canViewFinancials = currentUser.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl">
            <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" />
            Archive
          </h2>
          <p className="text-sm text-muted-foreground">
            Completed projects with documentation and cost analysis
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Badge variant="secondary" className="h-9 px-3 text-sm w-full sm:w-auto text-center">
            {filteredProjects.length} Archived Projects
          </Badge>
          {(currentUser.role === "admin" ||
            currentUser.role === "supervisor") && (
            <Button
              size="sm"
              className="h-9 px-3 w-full sm:w-auto"
              onClick={() => setShowCreateDialog(true)}
            >
              <Archive className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Archives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Projects</Label>
              <Input
                id="search"
                placeholder="Search by name, description, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">Filter by School/Client</Label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school/client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools/Clients</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school} value={school}>
                      {school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Grid */}
      <div className="grid gap-6">
        {filteredProjects.map((project) => {
          const supervisor = users.find((u) => u.id === project.supervisorId);
          const fabricators = users.filter((u) =>
            getFabricatorIds(project).includes(u.id)
          );
          const client = users.find(
            (u) => u.role === "client" && u.clientProjectId === project.id
          );
          const projectSchool = getProjectSchool(project);
          const fabricatorDocs = getFabricatorDocumentation(project);
          const costDocs = getCostAnalysisDocuments(project);
          const materialCost = calculateTotalMaterialCost(project.id);
          const projectBudget = safeNumber(project.budget);
          const projectSpent = safeNumber(project.spent);
          const projectRevenue = safeNumber(project.revenue);

          return (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {safeText(project.name)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {safeText(project.description)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge variant="default" className="bg-green-600">
                      Completed
                    </Badge>
                    <Badge variant="outline">{project.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* Project Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{projectSchool}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Supervisor: {supervisor?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{fabricators.length} Fabricators</span>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  {canViewFinancials && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-medium">
                          ${projectBudget.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="font-medium">
                          ${projectSpent.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Materials
                        </p>
                        <p className="font-medium">
                          ${materialCost.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-medium text-green-600">
                          ${projectRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Documentation Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        {fabricatorDocs.length} Fabricator Documents
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {costDocs.length} Cost Analysis Files
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">
                        {getAttachments(project).length} Total Documents
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 lg:flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full lg:flex-1"
                      onClick={() => handleViewDetails(project)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span className="truncate">Details</span>
                    </Button>
                    {project.documentationUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full lg:flex-1"
                        onClick={() =>
                          window.open(project.documentationUrl, "_blank")
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="truncate">Docs</span>
                      </Button>
                    )}
                    {(currentUser.role === "admin" ||
                      currentUser.role === "supervisor") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full lg:flex-1 text-primary"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          <span className="truncate">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full lg:flex-1 text-destructive hover:text-destructive"
                          onClick={() => {
                            setProjectToDelete(project);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="truncate">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">No Archived Projects Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedSchool !== "all"
                  ? "Try adjusting your search filters."
                  : "No completed projects available in the archives yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>
              Completed project details and documentation
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documentation">Documentation</TabsTrigger>
                  <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Project Description</Label>
                      <p className="text-sm mt-1">
                        {safeText(selectedProject.description)}
                      </p>
                    </div>
                    <div>
                      <Label>Client/School</Label>
                      <p className="text-sm mt-1">
                        {users.find(
                          (u) =>
                            u.role === "client" &&
                            u.clientProjectId === selectedProject.id
                        )?.school || safeText(selectedProject.clientName)}
                      </p>
                    </div>
                    <div>
                      <Label>Project Duration</Label>
                      <p className="text-sm mt-1">
                        {formatDate(selectedProject.startDate)} -{" "}
                        {formatDate(selectedProject.endDate)}
                      </p>
                    </div>
                    <div>
                      <Label>Completion Date</Label>
                      <p className="text-sm mt-1">
                        {formatDate(selectedProject.endDate)}
                      </p>
                    </div>
                  </div>

                  {canViewFinancials && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <Label>Total Budget</Label>
                        <p className="text-lg">
                          ${safeNumber(selectedProject.budget).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label>Amount Spent</Label>
                        <p className="text-lg">
                          ${safeNumber(selectedProject.spent).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label>Material Costs</Label>
                        <p className="text-lg">
                          $
                          {calculateTotalMaterialCost(
                            selectedProject.id
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label>Total Revenue</Label>
                        <p className="text-lg text-green-600">
                          $
                          {safeNumber(selectedProject.revenue).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documentation" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-3">Fabricator Documentation</h4>
                      <div className="grid gap-2">
                        {getFabricatorDocumentation(selectedProject).map(
                          (doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <p className="text-sm">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded by{" "}
                                    {
                                      users.find((u) => u.id === doc.uploadedBy)
                                        ?.name
                                    }{" "}
                                    on {formatDate(doc.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3">All Project Documents</h4>
                      <div className="grid gap-2">
                        {getAttachments(selectedProject).map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4" />
                              <div>
                                <p className="text-sm">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(safeNumber(doc.size) / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB - {formatDate(doc.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {getAttachments(selectedProject).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No documents available.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="costs" className="space-y-4">
                  {canViewFinancials ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-3">Cost Analysis Documents</h4>
                        <div className="grid gap-2">
                          {getCostAnalysisDocuments(selectedProject).map(
                            (doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <div>
                                    <p className="text-sm">{doc.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Created by{" "}
                                      {
                                        users.find(
                                          (u) => u.id === doc.uploadedBy
                                        )?.name
                                      }
                                    </p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3">Budget Breakdown by Fabricator</h4>
                        <div className="space-y-3">
                          {(selectedProject.fabricatorBudgets || []).map(
                            (budget) => {
                              const fabricator = users.find(
                                (u) => u.id === budget.fabricatorId
                              );
                              const allocated = safeNumber(
                                budget.allocatedAmount
                              );
                              const spent = safeNumber(budget.spentAmount);
                              const utilizationRate =
                                allocated > 0 ? (spent / allocated) * 100 : 0;

                              return (
                                <div
                                  key={budget.fabricatorId}
                                  className="p-4 border rounded-lg"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium">
                                        {fabricator?.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {budget.description}
                                      </p>
                                    </div>
                                    <Badge
                                      variant={
                                        utilizationRate > 100
                                          ? "destructive"
                                          : "default"
                                      }
                                    >
                                      {utilizationRate.toFixed(1)}% utilized
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Allocated:
                                      </span>
                                      <span className="ml-2">
                                        $
                                        {safeNumber(
                                          budget.allocatedAmount
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Spent:
                                      </span>
                                      <span className="ml-2">
                                        $
                                        {safeNumber(
                                          budget.spentAmount
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3">Material Costs</h4>
                        <div className="grid gap-2">
                          {getProjectMaterials(selectedProject.id).map(
                            (material) => (
                              <div
                                key={material.id}
                                className="flex justify-between items-center p-3 border rounded-lg"
                              >
                                <div>
                                  <p className="text-sm">{material.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {material.quantity} {material.unit} -{" "}
                                    {material.supplier}
                                  </p>
                                </div>
                                <p className="font-medium">
                                  ${safeNumber(material.cost).toLocaleString()}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg mb-2">
                        Financial Information Restricted
                      </h3>
                      <p className="text-muted-foreground">
                        Cost analysis and budget information is only available
                        to administrators.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-3">Project Supervisor</h4>
                      <div className="p-4 border rounded-lg">
                        {(() => {
                          const supervisor = users.find(
                            (u) => u.id === selectedProject.supervisorId
                          );
                          return supervisor ? (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{supervisor.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {supervisor.school} - {supervisor.secureId}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Supervisor information not available
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3">Fabricators</h4>
                      <div className="grid gap-3">
                        {getFabricatorIds(selectedProject).map(
                          (fabricatorId) => {
                            const fabricator = users.find(
                              (u) => u.id === fabricatorId
                            );
                            const workLogs = getProjectWorkLogs(
                              selectedProject.id
                            ).filter(
                              (log) => log.fabricatorId === fabricatorId
                            );
                            const totalHours = workLogs.reduce(
                              (sum, log) => sum + log.hoursWorked,
                              0
                            );

                            return fabricator ? (
                              <div
                                key={fabricatorId}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {fabricator.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {fabricator.school} -{" "}
                                      {fabricator.secureId}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      {totalHours} hours
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {workLogs.length} work logs
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (using ProjectDetails component) */}
      {showEditDialog && selectedProject && (
        <ProjectDetails
          project={selectedProject}
          users={users}
          currentUser={currentUser}
          onUpdateProject={(updated) => {
            if (onUpdateProject) onUpdateProject(updated);
            setSelectedProject(updated);
          }}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {/* Create Archive Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Archived Project</DialogTitle>
            <DialogDescription>
              Create a new historical project record for the archives.
            </DialogDescription>
          </DialogHeader>
          <CreateProjectForm
            users={users}
            currentUser={currentUser}
            onSubmit={async (data) => {
              if (onCreateProject) {
                // Ensure status is completed for archive
                await onCreateProject({
                  ...data,
                  status: "completed",
                  progress: 100,
                });
                setShowCreateDialog(false);
              }
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Archived Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (projectToDelete && onDeleteProject) {
                  onDeleteProject(projectToDelete.id);
                }
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
