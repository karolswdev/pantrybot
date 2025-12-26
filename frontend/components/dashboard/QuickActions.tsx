import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Camera, ListChecks, ChefHat, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  disabled?: boolean;
  color: string;
  bgColor: string;
  hoverBg: string;
}

export function QuickActions() {
  const actions: ActionItem[] = [
    {
      label: 'Add Item',
      icon: <Plus className="w-7 h-7" />,
      href: '/inventory',
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      hoverBg: 'hover:bg-primary-200',
    },
    {
      label: 'Scan Barcode',
      icon: <Camera className="w-7 h-7" />,
      href: '/scan',
      disabled: true,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
      hoverBg: 'hover:bg-secondary-200',
    },
    {
      label: 'Shopping List',
      icon: <ListChecks className="w-7 h-7" />,
      href: '/shopping',
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
      hoverBg: 'hover:bg-accent-200',
    },
    {
      label: 'Recipe Ideas',
      icon: <ChefHat className="w-7 h-7" />,
      href: '/recipes',
      disabled: true,
      color: 'text-fresh-600',
      bgColor: 'bg-fresh-100',
      hoverBg: 'hover:bg-fresh-200',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-secondary-100 rounded-lg">
            <Zap className="h-5 w-5 text-secondary-600" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const content = (
              <div className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-transparent transition-all duration-300 stagger-item",
                action.disabled
                  ? "bg-gray-100 cursor-not-allowed opacity-50"
                  : cn(action.bgColor, action.hoverBg, "cursor-pointer hover:border-2 hover:shadow-lg hover:-translate-y-1 active:scale-95")
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "p-3 rounded-xl bg-white shadow-sm",
                  action.color
                )}>
                  {action.icon}
                </div>
                <span className={cn(
                  "font-bold text-sm",
                  action.disabled ? "text-gray-400" : "text-gray-700"
                )}>
                  {action.label}
                </span>
                {action.disabled && (
                  <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
            );

            if (action.disabled) {
              return <div key={action.label}>{content}</div>;
            }

            return (
              <Link key={action.label} href={action.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
