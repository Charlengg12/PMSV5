import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Project, ProjectAssignment, User } from '../../types';

interface ProjectAssignmentsProps {
  currentUser: User;
  projects: Project[];
  users: User[];
  onAcceptAssignment: (assignmentId: string, response?: string) => void;
  onDeclineAssignment: (assignmentId: string, response?: string) => void;
}

export function ProjectAssignments({
  currentUser,
  projects,
  users,
  onAcceptAssignment,
  onDeclineAssignment
}: ProjectAssignmentsProps) {

  // Get pending assignments for current fabricator
  const pendingAssignments = projects
    .filter(project =>
      project.pendingAssignments?.some(assignment =>
        assignment.fabricatorId === currentUser.id && assignment.status === 'pending'
      )
    )
    .flatMap(project =>
      project.pendingAssignments
        ?.filter(assignment =>
          assignment.fabricatorId === currentUser.id && assignment.status === 'pending'
        )
        .map(assignment => ({ ...assignment, project })) || []
    );

  // Get assignment history
  const assignmentHistory = projects
    .filter(project =>
      project.pendingAssignments?.some(assignment =>
        assignment.fabricatorId === currentUser.id && assignment.status !== 'pending'
      )
    )
    .flatMap(project =>
      project.pendingAssignments
        ?.filter(assignment =>
          assignment.fabricatorId === currentUser.id && assignment.status !== 'pending'
        )
        .map(assignment => ({ ...assignment, project })) || []
    );

  const getSupervisorName = (supervisorId: string) => {
    const supervisor = users.find(u => u.id === supervisorId);
    return supervisor?.name || 'Unknown Supervisor';
  };

  const getStatusIcon = (status: ProjectAssignment['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ProjectAssignment['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'accepted':
        return 'default';
      case 'declined':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Project Assignments
        </h2>
        <p className="text-muted-foreground">Review and respond to project assignments from supervisors</p>
      </div>

      {/* Pending Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Pending Assignments
            {pendingAssignments.length > 0 && (
              <Badge variant="secondary">{pendingAssignments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingAssignments.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No pending assignments</h3>
              <p className="text-muted-foreground">
                You're all caught up! No new project assignments to review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-lg mb-1">{assignment.project.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {assignment.project.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Client: {assignment.project.clientName}</span>
                        <span>•</span>
                        <span>Priority: {assignment.project.priority}</span>
                        <span>•</span>
                        <span>
                          {new Date(assignment.project.startDate).toLocaleDateString()} - {' '}
                          {new Date(assignment.project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      ₱{assignment.project.revenue.toLocaleString()} value
                    </Badge>
                  </div>

                  <div className="bg-muted/50 rounded p-3 mb-4 text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>From:</strong>{" "}
                      {getSupervisorName(assignment.assignedBy)}
                    </p>
                    <p>
                      <strong>Assigned:</strong>{" "}
                      {new Date(assignment.assignedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => onAcceptAssignment(assignment.id)}
                      size="sm"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Accept Assignment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onDeclineAssignment(assignment.id)}
                      size="sm"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Decline Assignment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No assignment history</h3>
              <p className="text-muted-foreground">
                Assignment history will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignmentHistory
                .sort((a, b) => new Date(b.respondedAt || b.assignedAt).getTime() - new Date(a.respondedAt || a.assignedAt).getTime())
                .map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{assignment.project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Assigned by {getSupervisorName(assignment.assignedBy)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assignment.status)}
                        <Badge variant={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Assigned:</strong> {new Date(assignment.assignedAt).toLocaleString()}
                      </p>
                      {assignment.respondedAt && (
                        <p>
                          <strong>Responded:</strong> {new Date(assignment.respondedAt).toLocaleString()}
                        </p>
                      )}
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
