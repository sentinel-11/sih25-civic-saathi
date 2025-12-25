import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Technician } from '@shared/schema';
import { User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TechnicianStatusProps {
  technicians: Technician[];
  activities: Array<{
    id: string;
    description: string;
    timestamp: string;
    type: 'completed' | 'assigned' | 'created';
  }>;
}

export function TechnicianStatus({ technicians, activities }: TechnicianStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="text-blue-600" size={16} />;
      case 'assigned':
        return <User className="text-green-600" size={16} />;
      case 'created':
        return <Clock className="text-yellow-600" size={16} />;
      default:
        return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Technician Status */}
      <Card className="admin-card hover-glow">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Technician Status</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tech.name}</p>
                    <p className="text-sm text-gray-500">{tech.specialty}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(tech.status)}>
                  {tech.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="admin-card hover-glow">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
