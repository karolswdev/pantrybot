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
import { AlertCircle, Utensils, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <DialogContent className={cn(
        "sm:max-w-[425px]",
        "rounded-3xl border-2 border-gray-100",
        "bg-gradient-to-br from-white via-white to-primary-50/30",
        "shadow-playful-xl backdrop-blur-sm",
        "p-0"
      )}>
        <form onSubmit={handleSubmit}>
          {/* Header with gradient and playful icon */}
          <div className={cn(
            "px-6 pt-6 pb-4",
            "bg-gradient-to-r from-primary-50 to-fresh-50",
            "border-b border-gray-100"
          )}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  "bg-primary-500 shadow-lg shadow-primary-500/30"
                )}>
                  <Utensils className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-800">
                    Use Item
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-0.5">
                    Record usage of <span className="font-bold text-primary-600">{item.name}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Item preview card */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-2xl",
              "bg-gradient-to-r from-gray-50 to-white",
              "border-2 border-gray-100"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-white shadow-sm border border-gray-100"
              )}>
                <span className="text-2xl">🍽️</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">
                  Available: <span className="font-bold text-primary-600">{item.quantity} {item.unit}</span>
                </p>
              </div>
            </div>

            {/* Quantity input */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-bold text-gray-700">
                How much did you use? ({item.unit})
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
                className={cn(
                  "h-12 rounded-xl border-2 font-medium text-lg",
                  "focus:border-primary-400 focus:ring-primary-200",
                  error && "border-danger-300 focus:border-danger-400"
                )}
              />
              {error && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl",
                  "bg-danger-50 border border-danger-200"
                )}>
                  <AlertCircle className="h-4 w-4 text-danger-500 flex-shrink-0" />
                  <span className="text-sm text-danger-600 font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* Notes input */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-bold text-gray-700">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Used for dinner recipe"
                rows={3}
                className={cn(
                  "rounded-xl border-2 font-medium resize-none",
                  "focus:border-primary-400 focus:ring-primary-200",
                  "placeholder:text-gray-400"
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className={cn(
            "px-6 py-4",
            "bg-gray-50 border-t border-gray-100",
            "rounded-b-3xl"
          )}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cn(
                "h-12 px-6 rounded-xl border-2 font-bold",
                "hover:bg-gray-100 transition-all"
              )}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                "h-12 px-6 rounded-xl font-bold",
                "bg-primary-500 hover:bg-primary-600 text-white",
                "shadow-lg shadow-primary-500/30",
                "hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              )}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Confirm Usage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
