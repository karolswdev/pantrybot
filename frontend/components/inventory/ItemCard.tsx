"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreVertical, Package, Calendar, AlertTriangle } from "lucide-react";

export type ExpirationStatus = "expired" | "critical" | "warning" | "fresh" | "no-date";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: "fridge" | "freezer" | "pantry";
  category?: string;
  expirationDate?: string;
  bestBeforeDate?: string;
  imageUrl?: string;
  notes?: string;
}

interface ItemCardProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
  onConsume?: (item: InventoryItem) => void;
  onWaste?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  viewMode?: "grid" | "list";
}

function getExpirationStatus(item: InventoryItem): {
  status: ExpirationStatus;
  daysUntil: number | null;
  displayText: string;
} {
  const dateToCheck = item.expirationDate || item.bestBeforeDate;
  
  if (!dateToCheck) {
    return { status: "no-date", daysUntil: null, displayText: "No expiry date" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(dateToCheck);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { 
      status: "expired", 
      daysUntil: diffDays, 
      displayText: `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago` 
    };
  } else if (diffDays === 0) {
    return { status: "critical", daysUntil: 0, displayText: "Expires today" };
  } else if (diffDays === 1) {
    return { status: "critical", daysUntil: 1, displayText: "Tomorrow" };
  } else if (diffDays <= 3) {
    return { status: "warning", daysUntil: diffDays, displayText: `In ${diffDays} days` };
  } else {
    return { status: "fresh", daysUntil: diffDays, displayText: `In ${diffDays} days` };
  }
}

function getStatusColors(status: ExpirationStatus) {
  switch (status) {
    case "expired":
      return {
        border: "border-danger-500",
        bg: "bg-danger-50",
        text: "text-danger-600",
        icon: "text-danger-500"
      };
    case "critical":
      return {
        border: "border-danger-400",
        bg: "bg-danger-50",
        text: "text-danger-600",
        icon: "text-danger-500"
      };
    case "warning":
      return {
        border: "border-warning-400",
        bg: "bg-warning-50",
        text: "text-warning-600",
        icon: "text-warning-500"
      };
    case "fresh":
      return {
        border: "border-gray-200",
        bg: "bg-gray-50",
        text: "text-gray-600",
        icon: "text-gray-400"
      };
    case "no-date":
      return {
        border: "border-gray-200",
        bg: "bg-gray-50",
        text: "text-gray-500",
        icon: "text-gray-400"
      };
  }
}

export function ItemCard({ 
  item, 
  onEdit, 
  onConsume, 
  onWaste, 
  onDelete,
  viewMode = "grid" 
}: ItemCardProps) {
  const [showActions, setShowActions] = useState(false);
  const expiration = getExpirationStatus(item);
  const colors = getStatusColors(expiration.status);

  // Grid view
  if (viewMode === "grid") {
    return (
      <Card 
        data-testid="item-card"
        className={cn("relative transition-all hover:shadow-md", colors.border)}>
        <CardContent className="p-4">
          {/* Action menu button */}
          <button
            onClick={() => setShowActions(!showActions)}
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>

          {/* Item icon/emoji or image */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              {item.imageUrl ? (
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-lg" 
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Item name */}
          <h3 className="font-semibold text-gray-900 text-center mb-1 line-clamp-2">
            {item.name}
          </h3>

          {/* Quantity */}
          <p className="text-sm text-gray-600 text-center mb-3">
            {item.quantity} {item.unit}
          </p>

          {/* Expiration status */}
          <div className={cn("rounded-md px-2 py-1 text-xs text-center font-medium", colors.bg, colors.text)}>
            {expiration.status === "critical" || expiration.status === "expired" ? (
              <span className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiration.displayText}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                {expiration.displayText}
              </span>
            )}
          </div>
        </CardContent>

        {/* Action buttons */}
        <CardFooter className="p-3 pt-0 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConsume?.(item)}
            className="text-xs"
          >
            Use
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(item)}
            className="text-xs"
          >
            Edit
          </Button>
        </CardFooter>

        {/* Dropdown action menu (shown on click) */}
        {showActions && (
          <div className="absolute top-8 right-2 z-10 bg-white rounded-md shadow-lg border border-gray-200 py-1">
            <button
              onClick={() => {
                onWaste?.(item);
                setShowActions(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Mark as Wasted
            </button>
            <button
              onClick={() => {
                onDelete?.(item);
                setShowActions(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
            >
              Delete
            </button>
          </div>
        )}
      </Card>
    );
  }

  // List view
  return (
    <div 
      data-testid="item-card"
      className={cn(
        "flex items-center justify-between p-4 bg-white rounded-lg border transition-all hover:shadow-sm",
        colors.border
      )}>
      <div className="flex items-center gap-4 flex-1">
        {/* Item icon */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          {item.imageUrl ? (
            <Image 
              src={item.imageUrl} 
              alt={item.name}
              width={48}
              height={48} 
              className="w-full h-full object-cover rounded-lg" 
            />
          ) : (
            <Package className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
          <p className="text-sm text-gray-600">
            {item.quantity} {item.unit} {item.category && `• ${item.category}`}
          </p>
        </div>

        {/* Expiration status */}
        <div className={cn("rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap", colors.bg, colors.text)}>
          {expiration.displayText}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        <Button size="sm" variant="outline" onClick={() => onConsume?.(item)}>
          Use
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit?.(item)}>
          Edit
        </Button>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 rounded hover:bg-gray-100 transition-colors relative"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
          
          {showActions && (
            <div className="absolute top-8 right-0 z-10 bg-white rounded-md shadow-lg border border-gray-200 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWaste?.(item);
                  setShowActions(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                Mark as Wasted
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item);
                  setShowActions(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 whitespace-nowrap"
              >
                Delete
              </button>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}