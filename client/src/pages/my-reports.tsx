import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaintenanceIssue, User, Technician } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { 
  MapPin, 
  Calendar, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Clock, 
  TrendingUp,
  BarChart3,
  FileText
} from 'lucide-react';

export default function MyReportsPage() {
  const { user } = useAuth();
  
  const { data: allIssues, isLoading, isError } = useQuery<(MaintenanceIssue & { reporter: User })[]>({
    queryKey: ['/api/issues'],
  });

  const myIssues = useMemo(() => {
    const list = allIssues || [];
    return list.filter((i: any) => {
      if (!user?.id) return false;
      if (typeof i.reporterId !== 'undefined') return i.reporterId === user.id;
      return i.reporter?.id === user.id;
    });
  }, [allIssues, user?.id]);

  const { data: technicians } = useQuery<Technician[]>({
    queryKey: ['/api/technicians'],
  });

  if (!user) {
    return (
      <div className="container-centered section-spacing">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="heading-primary">Access Denied</h1>
          <p className="text-muted mt-3">Please log in to view your reports.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-centered section-spacing">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="heading-primary">My Reports</h1>
          <p className="text-muted mt-3">Unable to load your reports right now.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-centered section-spacing">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'open':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalReports = myIssues?.length || 0;
  const resolvedReports = myIssues?.filter(issue => issue.status === 'resolved').length || 0;
  const inProgressReports = myIssues?.filter(issue => issue.status === 'in_progress').length || 0;
  const avgProgress = totalReports > 0 
    ? Math.round((myIssues?.reduce((sum, issue) => sum + issue.progress, 0) || 0) / totalReports)
    : 0;

  const memberSince = user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : null;

  return (
    <div className="container-centered section-spacing">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-primary flex items-center space-x-3">
            <FileText className="text-gray-700" size={32} />
            <span>My Reports</span>
          </h1>
          <p className="text-muted mt-3">Track your maintenance requests and their progress</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReports}</div>
              <p className="text-xs text-muted-foreground">
                All time submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedReports}</div>
              <p className="text-xs text-muted-foreground">
                {totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressReports}</div>
              <p className="text-xs text-muted-foreground">
                Active issues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgProgress}%</div>
              <p className="text-xs text-muted-foreground">
                Average completion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Credibility Score */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon size={20} />
              <span>Your Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Credibility Score</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="text-2xl font-bold text-emerald-600">
                    {user.credibilityScore}/10
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {user.credibilityScore >= 8 ? 'Excellent' : 
                     user.credibilityScore >= 6 ? 'Good' : 
                     user.credibilityScore >= 4 ? 'Fair' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium">
                  {memberSince ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-6">
          {myIssues?.map((issue) => {
            const assignedTech = technicians?.find(t => t.id === issue.assignedTechnicianId);
            
            return (
              <Card key={issue.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{issue.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {issue.location && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPin size={14} />
                            <span>{issue.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>
                          Reported {formatDistanceToNow(new Date(issue.createdAt!), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Progress</div>
                      <div className="text-xl font-bold">{issue.progress}%</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-4">{issue.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-gray-700 to-gray-800 rounded-full transition-all duration-500"
                        style={{ width: `${issue.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Technician Info */}
                  {assignedTech && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Assigned Technician</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <UserIcon size={16} className="text-gray-600" />
                          <div>
                            <p className="font-medium">{assignedTech.name}</p>
                            <p className="text-gray-600">{assignedTech.specialty}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Phone size={16} className="text-gray-600" />
                          <div>
                            <p className="font-medium">Contact</p>
                            <p className="text-gray-600">{assignedTech.phone}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Mail size={16} className="text-gray-600" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-gray-600">{assignedTech.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            assignedTech.status === 'available' ? 'bg-green-500' : 
                            assignedTech.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm capitalize font-medium">
                            {assignedTech.status}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Message
                          </Button>
                          <Button size="sm" className="bg-gray-800 hover:bg-gray-900">
                            Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {issue.imageUrls && issue.imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {issue.imageUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Issue image ${idx + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {!myIssues?.length && (
            <div className="min-h-[40vh] flex items-center justify-center text-center">
              <h3 className="text-xl font-semibold text-gray-800">Haven't reported any issues yet</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}