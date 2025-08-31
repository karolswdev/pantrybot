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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InventoryItem } from "./ItemCard";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface WasteItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onConfirm: (quantity: number, reason: string, notes?: string) => void;
}

const wasteReasons = [
  { value: "expired", label: "Expired" },
  { value: "spoiled", label: "Spoiled/Gone bad" },
  { value: "damaged", label: "Damaged/Contaminated" },
  { value: "forgotten", label: "Forgotten/Left too long" },
  { value: "other", label: "Other" },
];

export function WasteItemModal({
  open,
  onOpenChange,
  item,
  onConfirm,
}: WasteItemModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState("expired");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item) {
      setQuantity(String(item.quantity));
      setReason("expired");
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
    
    if (!reason) {
      setError("Please select a reason for waste");
      return;
    }
    
    onConfirm(qty, reason, notes || undefined);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mark Item as Wasted</DialogTitle>
            <DialogDescription>
              Record waste of <strong>{item.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-warning-50 border border-warning-200 rounded-md p-3 mt-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
              <p className="text-sm text-warning-800">
                This action will help track food waste patterns
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity wasted ({item.unit})
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
            </div>
            
            <div className="space-y-2">
              <Label>Reason for waste</Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                {wasteReasons.map((r) => (
                  <div key={r.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="font-normal cursor-pointer">
                      {r.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Found at the back of the fridge"
                rows={3}
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-danger-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Record Waste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}