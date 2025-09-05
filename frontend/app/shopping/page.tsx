'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CreateListModal from '@/components/shopping/CreateListModal';
import ShoppingListCard from '@/components/shopping/ShoppingListCard';
import { useShoppingLists } from '@/hooks/queries/useShoppingLists';
import { useAuthStore } from '@/stores/auth.store';

export default function ShoppingListPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const activeHouseholdId = useAuthStore((state) => state.currentHouseholdId || state.user?.defaultHouseholdId);
  
  const { data: shoppingLists, isLoading, error } = useShoppingLists(
    activeHouseholdId || ''
  );

  if (!activeHouseholdId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Please select a household to view shopping lists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading shopping lists...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">
              Error loading shopping lists. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="shopping-list-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping Lists</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          data-testid="new-list-button"
        >
          <Plus className="mr-2 h-4 w-4" /> New List
        </Button>
      </div>

      {shoppingLists && shoppingLists.lists.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No shopping lists yet. Create your first list to get started!
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shoppingLists?.lists.map((list) => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </div>
      )}

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        householdId={activeHouseholdId}
      />
    </div>
  );
}