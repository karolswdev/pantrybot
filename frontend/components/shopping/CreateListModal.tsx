'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateShoppingList } from '@/hooks/mutations/useCreateShoppingList';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
}

export default function CreateListModal({
  isOpen,
  onClose,
  householdId,
}: CreateListModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  const createList = useCreateShoppingList(householdId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter a name for the shopping list');
      return;
    }

    try {
      await createList.mutateAsync({
        name: name.trim(),
        notes: notes.trim(),
      });
      
      // Reset form and close modal
      setName('');
      setNotes('');
      setError('');
      onClose();
    } catch (error) {
      setError('Failed to create shopping list. Please try again.');
    }
  };

  const handleClose = () => {
    setName('');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="create-list-modal">
        <DialogHeader>
          <DialogTitle>Create New Shopping List</DialogTitle>
          <DialogDescription>
            Create a new shopping list for your household. You can add items after creating the list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="text-sm text-red-500 mb-2">{error}</div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Weekly Groceries"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="list-name-input"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., For the party on Saturday"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="list-notes-input"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createList.isPending}
              data-testid="create-list-button"
            >
              {createList.isPending ? 'Creating...' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}