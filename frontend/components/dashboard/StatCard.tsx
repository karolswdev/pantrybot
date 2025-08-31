import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  alert?: string;
  className?: string;
  icon?: ReactNode;
}

export function StatCard({ title, value, trend, alert, className, icon }: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <span className={cn(
              "text-sm font-medium",
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        {alert && (
          <p className="text-sm text-orange-600 mt-1">⚠️ {alert}</p>
        )}
      </CardContent>
    </Card>
  );
}