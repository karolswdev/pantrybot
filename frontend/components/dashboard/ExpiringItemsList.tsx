import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

export function ExpiringItemsList({ items, loading }: ExpiringItemsListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expiring Soon</CardTitle>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expiring Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No items expiring soon!</p>
            <p className="text-sm">Great job managing your inventory.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getExpirationClass = (daysUntil?: number) => {
    if (daysUntil === undefined) return '';
    if (daysUntil <= 0) return 'border-red-500 bg-red-50';
    if (daysUntil <= 1) return 'border-orange-500 bg-orange-50';
    if (daysUntil <= 3) return 'border-yellow-500 bg-yellow-50';
    return '';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expiring Soon</CardTitle>
        <Link href="/inventory" className="text-sm text-blue-600 hover:text-blue-800">
          View All &gt;
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={`/inventory/${item.location}`}
              className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${getExpirationClass(item.daysUntilExpiration)}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-gray-500 capitalize">{item.location}</span>
                <span className="text-sm font-medium text-gray-700">{item.expiresIn}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}