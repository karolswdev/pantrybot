import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Camera, ListChecks, ChefHat } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      label: 'Add Item',
      icon: <Plus className="w-6 h-6" />,
      href: '/inventory',
      action: 'add'
    },
    {
      label: 'Scan Barcode',
      icon: <Camera className="w-6 h-6" />,
      href: '/scan',
      disabled: true
    },
    {
      label: 'Shopping List',
      icon: <ListChecks className="w-6 h-6" />,
      href: '/shopping-list',
      disabled: true
    },
    {
      label: 'Recipe Ideas',
      icon: <ChefHat className="w-6 h-6" />,
      href: '/recipes',
      disabled: true
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-gray-50"
              disabled={action.disabled}
              asChild={!action.disabled}
            >
              {action.disabled ? (
                <div className="flex flex-col items-center justify-center">
                  {action.icon}
                  <span className="text-sm">{action.label}</span>
                </div>
              ) : (
                <Link href={action.href}>
                  <div className="flex flex-col items-center justify-center">
                    {action.icon}
                    <span className="text-sm">{action.label}</span>
                  </div>
                </Link>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}