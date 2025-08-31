"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem } from "./ItemCard";
import { AlertCircle } from "lucide-react";

interface ConsumeItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onConfirm: (quantity: number, notes?: string) => void;
}

export function ConsumeItemModal({
  open,
  onOpenChange,
  item,
  onConfirm,
}: ConsumeItemModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item) {
      setQuantity(String(item.quantity));
      setNotes("");
      setError("");
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;
    
    const qty = parseFloat(quantity);
    
    // Validation
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }
    
    if (qty > item.quantity) {
      setError(`Quantity cannot exceed available amount (${item.quantity} ${item.unit})`);
      return;
    }
    
    onConfirm(qty, notes || undefined);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Consume Item</DialogTitle>
            <DialogDescription>
              Record consumption of <strong>{item.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity to consume ({item.unit})
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0"
                max={item.quantity}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError("");
                }}
                placeholder={`Max: ${item.quantity} ${item.unit}`}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Available: {item.quantity} {item.unit}
              </p>
              {error && (
                <div className="flex items-center gap-2 text-sm text-danger-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Used for dinner recipe"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Confirm Consumption
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}