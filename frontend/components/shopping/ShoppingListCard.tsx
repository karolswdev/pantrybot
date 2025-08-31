'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ShoppingList {
  id: string;
  name: string;
  itemCount: number;
  completedCount: number;
  createdAt: string;
  createdBy: string;
  lastUpdated: string;
}

interface ShoppingListCardProps {
  list: ShoppingList;
}

export default function ShoppingListCard({ list }: ShoppingListCardProps) {
  const completionPercentage = 
    list.itemCount > 0 ? Math.round((list.completedCount / list.itemCount) * 100) : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`shopping-list-${list.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{list.name}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Link href={`/shopping/${list.id}`}>
          <div className="space-y-3 cursor-pointer">
            <div className="text-sm text-muted-foreground">
              {list.itemCount} items · ${Math.round(list.itemCount * 7)} estimated
            </div>
            
            {list.itemCount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Created by {list.createdBy}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}