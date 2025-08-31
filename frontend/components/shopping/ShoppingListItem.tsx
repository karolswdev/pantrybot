import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ShoppingListItemProps {
  item: {
    id: string;
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
    isCompleted: boolean;
  };
  onToggle: () => void;
  'data-testid'?: string;
}

export function ShoppingListItem({ item, onToggle, ...props }: ShoppingListItemProps) {
  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border ${
        item.isCompleted ? 'bg-muted/50 opacity-75' : 'bg-background hover:bg-muted/20'
      } transition-colors`}
      {...props}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          checked={item.isCompleted}
          onCheckedChange={onToggle}
          aria-label={`Mark ${item.name} as ${item.isCompleted ? 'not bought' : 'bought'}`}
          data-testid={`checkbox-${item.id}`}
        />
        <div className="flex-1">
          <span className={item.isCompleted ? 'line-through text-muted-foreground' : ''}>
            {item.name}
          </span>
          {item.quantity && item.unit && (
            <span className="text-sm text-muted-foreground ml-2">
              ({item.quantity} {item.unit})
            </span>
          )}
        </div>
      </div>
      {item.category && (
        <Badge variant="outline" className="ml-2">
          {item.category}
        </Badge>
      )}
    </div>
  );
}