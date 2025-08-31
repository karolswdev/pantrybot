"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InventoryItem } from "./ItemCard";
import { Trash2 } from "lucide-react";

interface DeleteItemConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onConfirm: () => void;
}

export function DeleteItemConfirmDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
}: DeleteItemConfirmDialogProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-danger-50 rounded-full">
              <Trash2 className="h-5 w-5 text-danger-600" />
            </div>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete <strong>{item.name}</strong>? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-gray-50 rounded-md p-3 my-4">
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-600">Item:</span> <strong>{item.name}</strong></p>
            <p><span className="text-gray-600">Quantity:</span> {item.quantity} {item.unit}</p>
            {item.category && (
              <p><span className="text-gray-600">Category:</span> {item.category}</p>
            )}
            <p><span className="text-gray-600">Location:</span> {item.location}</p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-danger-600 hover:bg-danger-700 text-white"
          >
            Delete Item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}