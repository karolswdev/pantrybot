import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ExpiringItem {
  id: string;
  name: string;
  emoji: string;
  location: 'fridge' | 'freezer' | 'pantry';
  expiresIn: string;
  daysUntilExpiration?: number;
}

interface ExpiringItemsListProps {
  items: ExpiringItem[];
  loading?: boolean;
}

const locationEmojis: Record<string, string> = {
  fridge: '🧊',
  freezer: '❄️',
  pantry: '🏠',
};

export function ExpiringItemsList({ items, loading }: ExpiringItemsListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning-500" />
            Expiring Soon
          </CardTitle>
          <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded-lg" />
                    <div className="h-3 w-20 bg-gray-200 rounded-lg" />
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-primary-200 bg-gradient-to-br from-primary-50/50 to-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" />
            Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <div className="text-6xl mb-4 animate-bounce-in">🎉</div>
            <p className="text-xl font-bold text-gray-800 mb-2">All Fresh!</p>
            <p className="text-gray-500">No items expiring soon. Great job managing your inventory!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getExpirationStyle = (daysUntil?: number) => {
    if (daysUntil === undefined) return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600' };
    if (daysUntil <= 0) return { bg: 'bg-danger-50', border: 'border-danger-300', badge: 'bg-danger-500 text-white' };
    if (daysUntil <= 1) return { bg: 'bg-warning-50', border: 'border-warning-300', badge: 'bg-warning-500 text-white' };
    if (daysUntil <= 3) return { bg: 'bg-expiring-50', border: 'border-expiring-400', badge: 'bg-expiring-400 text-white' };
    return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-200 text-gray-600' };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-warning-100 rounded-lg">
            <Clock className="h-5 w-5 text-warning-600" />
          </div>
          Expiring Soon
        </CardTitle>
        <Link
          href="/inventory"
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => {
            const style = getExpirationStyle(item.daysUntilExpiration);
            return (
              <Link
                key={item.id}
                href={`/inventory/${item.location}`}
                className={cn(
                  "flex items-center justify-between p-4 border-2 rounded-2xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 stagger-item",
                  style.bg,
                  style.border
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                    {item.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span>{locationEmojis[item.location]}</span>
                      <span className="capitalize">{item.location}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-bold",
                    style.badge
                  )}>
                    {item.expiresIn}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>

        {items.length > 5 && (
          <div className="mt-4 text-center">
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <AlertCircle className="h-4 w-4" />
              +{items.length - 5} more items expiring soon
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
