'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Share2, Edit2, Trash2 } from 'lucide-react';
import { useShoppingListItems } from '@/hooks/queries/useShoppingListItems';
import { useShoppingListDetails } from '@/hooks/queries/useShoppingListDetails';
import { useAddShoppingListItem } from '@/hooks/mutations/useAddShoppingListItem';
import { useUpdateShoppingListItem } from '@/hooks/mutations/useUpdateShoppingListItem';
import { useShoppingListRealtime } from '@/hooks/useShoppingListRealtime';
import { ShoppingListItem } from '@/components/shopping/ShoppingListItem';

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.listId as string;
  const [newItemName, setNewItemName] = useState('');

  // Query hooks
  const { data: listDetails, isLoading: listLoading } = useShoppingListDetails(listId);
  const { data: items = [], isLoading: itemsLoading } = useShoppingListItems(listId);
  
  // Enable real-time synchronization
  useShoppingListRealtime(listId);
  
  // Mutation hooks
  const addItemMutation = useAddShoppingListItem(listId);
  const updateItemMutation = useUpdateShoppingListItem(listId);

  // Separate items into "To Buy" and "Bought" sections
  const toBuyItems = items.filter(item => !item.isCompleted);
  const boughtItems = items.filter(item => item.isCompleted);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      await addItemMutation.mutateAsync({ 
        name: newItemName.trim(),
        quantity: 1
      });
      setNewItemName('');
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    try {
      await updateItemMutation.mutateAsync({ 
        itemId, 
        isCompleted: !isCompleted 
      });
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  if (listLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading shopping list...</div>
      </div>
    );
  }

  if (!listDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Shopping list not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/shopping')}
            aria-label="Back to shopping lists"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{listDetails.name}</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} items · ${listDetails?.estimatedTotal || Math.round(items.length * 5)} estimated
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Share list">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Edit list">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Delete list">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* To Buy Section */}
      <Card className="mb-6" data-testid="to-buy-section">
        <CardHeader>
          <CardTitle>To Buy ({toBuyItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {toBuyItems.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={() => handleToggleItem(item.id, item.isCompleted)}
                data-testid={`item-${item.id}`}
              />
            ))}
            {toBuyItems.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No items to buy yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bought Section */}
      <Card className="mb-6" data-testid="bought-section">
        <CardHeader>
          <CardTitle>Bought ({boughtItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {boughtItems.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={() => handleToggleItem(item.id, item.isCompleted)}
                data-testid={`item-${item.id}`}
              />
            ))}
            {boughtItems.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No items bought yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Item Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAddItem} className="flex gap-2">
            <Input
              type="text"
              placeholder="Add item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1"
              data-testid="add-item-input"
            />
            <Button type="submit" data-testid="add-item-button">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}