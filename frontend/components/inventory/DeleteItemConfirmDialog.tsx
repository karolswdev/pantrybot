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
import { Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteItemConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onConfirm: () => void;
}

// Location emojis
const locationEmojis: Record<string, string> = {
  fridge: "🧊",
  freezer: "❄️",
  pantry: "🗄️",
};

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
      <AlertDialogContent className={cn(
        "sm:max-w-[420px]",
        "rounded-3xl border-2 border-gray-100",
        "bg-gradient-to-br from-white via-white to-danger-50/30",
        "shadow-playful-xl backdrop-blur-sm",
        "p-0"
      )}>
        {/* Header with danger gradient */}
        <div className={cn(
          "px-6 pt-6 pb-4",
          "bg-gradient-to-r from-danger-50 to-danger-100/50",
          "border-b border-gray-100"
        )}>
          <AlertDialogHeader className="space-y-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                "bg-danger-500 shadow-lg shadow-danger-500/30",
                "animate-wiggle"
              )}>
                <Trash2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold text-gray-800">
                  Delete Item?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 mt-0.5">
                  This action cannot be undone
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Warning banner */}
          <div className={cn(
            "flex items-start gap-3 p-3 rounded-2xl",
            "bg-danger-50 border border-danger-100"
          )}>
            <AlertTriangle className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-700 font-medium">
              You&apos;re about to permanently delete this item from your inventory.
            </p>
          </div>

          {/* Item details card */}
          <div className={cn(
            "p-4 rounded-2xl",
            "bg-gradient-to-r from-gray-50 to-white",
            "border-2 border-gray-100"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-white shadow-sm border border-gray-100"
              )}>
                <span className="text-2xl">🗑️</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} {item.unit}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {item.category && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl",
                  "bg-white border border-gray-100"
                )}>
                  <span className="text-gray-500">Category:</span>
                  <span className="font-bold text-gray-700">{item.category}</span>
                </div>
              )}
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl",
                "bg-white border border-gray-100"
              )}>
                <span className="text-gray-500">Location:</span>
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  {locationEmojis[item.location]} {item.location}
                </span>
              </div>
            </div>
          </div>

          {/* Suggestion */}
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-xl",
            "bg-primary-50 border border-primary-100"
          )}>
            <span className="text-lg">💡</span>
            <p className="text-sm text-primary-700">
              <span className="font-bold">Tip:</span> If this item went bad, consider using &quot;Mark as Wasted&quot; to track waste patterns instead.
            </p>
          </div>
        </div>

        {/* Footer */}
        <AlertDialogFooter className={cn(
          "px-6 py-4",
          "bg-gray-50 border-t border-gray-100",
          "rounded-b-3xl"
        )}>
          <AlertDialogCancel className={cn(
            "h-12 px-6 rounded-xl border-2 font-bold",
            "hover:bg-gray-100 transition-all"
          )}>
            Keep Item
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              "h-12 px-6 rounded-xl font-bold",
              "bg-danger-500 hover:bg-danger-600 text-white",
              "shadow-lg shadow-danger-500/30",
              "hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            )}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
