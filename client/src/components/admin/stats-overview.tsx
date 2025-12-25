import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    total: number;
    high: number;
    inProgress: number;
    completed: number;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      title: 'Total Issues',
      value: stats.total,
      icon: ClipboardList,
      color: 'bg-blue-100 text-blue-600',
      trend: '+12%',
      trendUp: true,
      description: 'from last month',
    },
    {
      title: 'High Severity',
      value: stats.high,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      trend: '-3%',
      trendUp: false,
      description: 'from last week',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
      trend: '',
      trendUp: null,
      description: 'Active work orders',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      trend: '+8%',
      trendUp: true,
      description: 'completion rate',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trendUp === true ? TrendingUp : 
                         stat.trendUp === false ? TrendingDown : null;
        
        return (
          <Card key={index} className="admin-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              
              {stat.trend && (
                <div className={`mt-4 text-sm flex items-center ${
                  stat.trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {TrendIcon && <TrendIcon className="mr-1" size={16} />}
                  {stat.trend} {stat.description}
                </div>
              )}
              
              {!stat.trend && (
                <div className="mt-4 text-sm text-gray-600 flex items-center">
                  <Clock className="mr-1" size={16} />
                  {stat.description}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
