import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

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
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-white border-gray-100',
  primary: 'bg-gradient-to-br from-primary-50 to-primary-100/50 border-primary-200',
  secondary: 'bg-gradient-to-br from-secondary-50 to-secondary-100/50 border-secondary-200',
  accent: 'bg-gradient-to-br from-accent-50 to-accent-100/50 border-accent-200',
  warning: 'bg-gradient-to-br from-warning-50 to-warning-100/50 border-warning-200',
  danger: 'bg-gradient-to-br from-danger-50 to-danger-100/50 border-danger-200',
};

const iconVariantStyles = {
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-200/50 text-primary-600',
  secondary: 'bg-secondary-200/50 text-secondary-600',
  accent: 'bg-accent-200/50 text-accent-600',
  warning: 'bg-warning-200/50 text-warning-600',
  danger: 'bg-danger-200/50 text-danger-600',
};

export function StatCard({
  title,
  value,
  trend,
  alert,
  className,
  icon,
  variant = 'default'
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
        {icon && (
          <div className={cn(
            "p-2 rounded-xl transition-transform group-hover:scale-110",
            iconVariantStyles[variant]
          )}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
        {trend && (
          <span className={cn(
            "flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full mb-1",
            trend.direction === 'up'
              ? 'text-primary-700 bg-primary-100'
              : 'text-danger-700 bg-danger-100'
          )}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      {alert && (
        <div className="flex items-center gap-2 mt-3 text-sm font-semibold text-warning-700 bg-warning-100 px-3 py-1.5 rounded-xl animate-pulse-soft">
          <AlertTriangle className="h-4 w-4" />
          {alert}
        </div>
      )}
    </div>
  );
}
