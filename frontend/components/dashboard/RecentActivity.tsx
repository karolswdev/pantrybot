import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Plus, Utensils, AlertTriangle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const activityConfig = {
  add: {
    icon: Plus,
    color: 'text-primary-600',
    bg: 'bg-primary-100',
    borderColor: 'border-primary-200',
  },
  consume: {
    icon: Utensils,
    color: 'text-secondary-600',
    bg: 'bg-secondary-100',
    borderColor: 'border-secondary-200',
  },
  expire: {
    icon: AlertTriangle,
    color: 'text-danger-600',
    bg: 'bg-danger-100',
    borderColor: 'border-danger-200',
  },
  system: {
    icon: Settings,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
};

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-100 rounded-lg">
              <Activity className="h-5 w-5 text-accent-600" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded-lg" />
                  <div className="h-3 w-1/4 bg-gray-200 rounded-lg" />
                </div>
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
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-100 rounded-lg">
              <Activity className="h-5 w-5 text-accent-600" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-medium">No recent activity yet</p>
            <p className="text-sm text-gray-400">Start adding items to see your activity here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-accent-100 rounded-lg">
            <Activity className="h-5 w-5 text-accent-600" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md stagger-item",
                  config.bg,
                  config.borderColor
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center",
                  config.color
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    {activity.user && (
                      <span className="font-bold">{activity.user} </span>
                    )}
                    {activity.message}
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white/50 px-2 py-1 rounded-full whitespace-nowrap">
                  {activity.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
