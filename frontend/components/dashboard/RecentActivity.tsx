import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ActivityItem {
  id: string;
  type: 'add' | 'consume' | 'expire' | 'system';
  message: string;
  timestamp: string;
  user?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                  <div className="h-4 w-64 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'add': return 'bg-green-500';
      case 'consume': return 'bg-blue-500';
      case 'expire': return 'bg-red-500';
      case 'system': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`} />
                <span className="text-sm text-gray-700">
                  {activity.user && <span className="font-medium">{activity.user}</span>}
                  {activity.user && ' '}
                  {activity.message}
                </span>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{activity.timestamp}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}