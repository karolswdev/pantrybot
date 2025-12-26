"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreVertical, Calendar, AlertTriangle, Sparkles, Utensils, Trash2, Pencil } from "lucide-react";

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

// Food emoji mapping based on category and common food names
function getFoodEmoji(item: InventoryItem): string {
  const name = item.name.toLowerCase();
  const category = item.category?.toLowerCase() || "";

  // Check specific food names first
  if (name.includes("milk")) return "🥛";
  if (name.includes("cheese")) return "🧀";
  if (name.includes("yogurt")) return "🥣";
  if (name.includes("butter")) return "🧈";
  if (name.includes("egg")) return "🥚";
  if (name.includes("bread")) return "🍞";
  if (name.includes("apple")) return "🍎";
  if (name.includes("banana")) return "🍌";
  if (name.includes("orange")) return "🍊";
  if (name.includes("grape")) return "🍇";
  if (name.includes("strawberry") || name.includes("berry")) return "🍓";
  if (name.includes("lemon")) return "🍋";
  if (name.includes("watermelon") || name.includes("melon")) return "🍉";
  if (name.includes("peach")) return "🍑";
  if (name.includes("cherry")) return "🍒";
  if (name.includes("avocado")) return "🥑";
  if (name.includes("tomato")) return "🍅";
  if (name.includes("carrot")) return "🥕";
  if (name.includes("corn")) return "🌽";
  if (name.includes("broccoli")) return "🥦";
  if (name.includes("cucumber")) return "🥒";
  if (name.includes("lettuce") || name.includes("salad")) return "🥬";
  if (name.includes("potato")) return "🥔";
  if (name.includes("onion")) return "🧅";
  if (name.includes("garlic")) return "🧄";
  if (name.includes("pepper")) return "🌶️";
  if (name.includes("mushroom")) return "🍄";
  if (name.includes("chicken")) return "🍗";
  if (name.includes("beef") || name.includes("steak")) return "🥩";
  if (name.includes("bacon")) return "🥓";
  if (name.includes("fish") || name.includes("salmon") || name.includes("tuna")) return "🐟";
  if (name.includes("shrimp") || name.includes("prawn")) return "🦐";
  if (name.includes("pizza")) return "🍕";
  if (name.includes("burger")) return "🍔";
  if (name.includes("hot dog") || name.includes("sausage")) return "🌭";
  if (name.includes("sandwich")) return "🥪";
  if (name.includes("taco")) return "🌮";
  if (name.includes("pasta") || name.includes("spaghetti") || name.includes("noodle")) return "🍝";
  if (name.includes("rice")) return "🍚";
  if (name.includes("soup")) return "🍲";
  if (name.includes("ice cream")) return "🍨";
  if (name.includes("cake")) return "🍰";
  if (name.includes("cookie")) return "🍪";
  if (name.includes("chocolate")) return "🍫";
  if (name.includes("candy")) return "🍬";
  if (name.includes("honey")) return "🍯";
  if (name.includes("coffee")) return "☕";
  if (name.includes("tea")) return "🍵";
  if (name.includes("juice")) return "🧃";
  if (name.includes("water")) return "💧";
  if (name.includes("wine")) return "🍷";
  if (name.includes("beer")) return "🍺";

  // Category-based fallbacks
  if (category.includes("dairy")) return "🥛";
  if (category.includes("produce") || category.includes("vegetable")) return "🥬";
  if (category.includes("fruit")) return "🍎";
  if (category.includes("meat")) return "🥩";
  if (category.includes("seafood")) return "🐟";
  if (category.includes("bakery")) return "🥖";
  if (category.includes("frozen")) return "🧊";
  if (category.includes("beverage") || category.includes("drink")) return "🥤";
  if (category.includes("snack")) return "🍿";
  if (category.includes("condiment") || category.includes("sauce")) return "🧂";
  if (category.includes("grain") || category.includes("cereal")) return "🌾";
  if (category.includes("dessert")) return "🍰";
  if (category.includes("prepared")) return "🍱";

  // Default emoji
  return "🍴";
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
    return { status: "critical", daysUntil: 0, displayText: "Expires today!" };
  } else if (diffDays === 1) {
    return { status: "critical", daysUntil: 1, displayText: "Tomorrow!" };
  } else if (diffDays <= 3) {
    return { status: "warning", daysUntil: diffDays, displayText: `${diffDays} days left` };
  } else {
    return { status: "fresh", daysUntil: diffDays, displayText: `${diffDays} days left` };
  }
}

function getStatusStyles(status: ExpirationStatus) {
  switch (status) {
    case "expired":
      return {
        card: "border-danger-300 bg-gradient-to-br from-danger-50 to-white",
        badge: "bg-danger-500 text-white",
        badgeIcon: "text-white",
        shadow: "shadow-danger-500/20",
      };
    case "critical":
      return {
        card: "border-danger-300 bg-gradient-to-br from-danger-50 to-white",
        badge: "bg-danger-500 text-white animate-pulse-soft",
        badgeIcon: "text-white",
        shadow: "shadow-danger-500/20",
      };
    case "warning":
      return {
        card: "border-warning-300 bg-gradient-to-br from-warning-50 to-white",
        badge: "bg-warning-500 text-white",
        badgeIcon: "text-white",
        shadow: "shadow-warning-500/20",
      };
    case "fresh":
      return {
        card: "border-primary-200 bg-gradient-to-br from-primary-50 to-white",
        badge: "bg-primary-500 text-white",
        badgeIcon: "text-white",
        shadow: "shadow-primary-500/20",
      };
    case "no-date":
      return {
        card: "border-gray-200 bg-gradient-to-br from-gray-50 to-white",
        badge: "bg-gray-400 text-white",
        badgeIcon: "text-white",
        shadow: "shadow-gray-500/10",
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
  const styles = getStatusStyles(expiration.status);
  const emoji = getFoodEmoji(item);

  // Grid view
  if (viewMode === "grid") {
    return (
      <Card
        data-testid="item-card"
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-playful-lg",
          "animate-scale-in cursor-pointer group",
          styles.card,
          `shadow-lg ${styles.shadow}`
        )}
      >
        <CardContent className="p-4 pt-5">
          {/* Action menu button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-xl transition-all duration-200",
              "hover:bg-gray-100 hover:scale-110",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>

          {/* Food emoji with playful background */}
          <div className="flex justify-center mb-3">
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br from-white to-gray-50",
              "border-2 border-gray-100",
              "shadow-inner transition-transform duration-300",
              "group-hover:scale-105 group-hover:rotate-2"
            )}>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-xl"
                />
              ) : (
                <span className="text-4xl" role="img" aria-label={item.name}>
                  {emoji}
                </span>
              )}
            </div>
          </div>

          {/* Item name */}
          <h3 className="font-bold text-gray-800 text-center mb-1 line-clamp-2 text-sm">
            {item.name}
          </h3>

          {/* Quantity with playful styling */}
          <p className="text-sm text-gray-500 text-center mb-3 font-medium">
            {item.quantity} {item.unit}
          </p>

          {/* Expiration badge - colorful and rounded */}
          <div className={cn(
            "rounded-xl px-3 py-1.5 text-xs text-center font-bold",
            "flex items-center justify-center gap-1.5",
            "shadow-sm",
            styles.badge
          )}>
            {expiration.status === "critical" || expiration.status === "expired" ? (
              <AlertTriangle className={cn("h-3.5 w-3.5", styles.badgeIcon)} />
            ) : expiration.status === "fresh" ? (
              <Sparkles className={cn("h-3.5 w-3.5", styles.badgeIcon)} />
            ) : (
              <Calendar className={cn("h-3.5 w-3.5", styles.badgeIcon)} />
            )}
            {expiration.displayText}
          </div>
        </CardContent>

        {/* Action buttons with playful styling */}
        <CardFooter className="p-3 pt-0 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConsume?.(item);
            }}
            className={cn(
              "text-xs font-bold rounded-xl h-9",
              "bg-primary-500 hover:bg-primary-600 text-white",
              "shadow-md hover:shadow-lg transition-all duration-200",
              "hover:-translate-y-0.5"
            )}
          >
            <Utensils className="h-3.5 w-3.5 mr-1" />
            Use
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(item);
            }}
            className={cn(
              "text-xs font-bold rounded-xl h-9",
              "border-2 border-gray-200 hover:border-secondary-300",
              "hover:bg-secondary-50 hover:text-secondary-700",
              "transition-all duration-200 hover:-translate-y-0.5"
            )}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </CardFooter>

        {/* Dropdown action menu */}
        {showActions && (
          <div
            className={cn(
              "absolute top-10 right-2 z-20",
              "bg-white rounded-2xl shadow-playful-lg",
              "border-2 border-gray-100 py-2 min-w-[160px]",
              "animate-scale-in"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWaste?.(item);
                setShowActions(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm font-medium",
                "text-warning-700 hover:bg-warning-50",
                "flex items-center gap-2 transition-colors"
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              Mark as Wasted
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(item);
                setShowActions(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm font-medium",
                "text-danger-600 hover:bg-danger-50",
                "flex items-center gap-2 transition-colors"
              )}
            >
              <Trash2 className="h-4 w-4" />
              Delete Item
            </button>
          </div>
        )}

        {/* Click outside to close menu */}
        {showActions && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowActions(false)}
          />
        )}
      </Card>
    );
  }

  // List view
  return (
    <div
      data-testid="item-card"
      className={cn(
        "flex items-center justify-between p-4",
        "bg-white rounded-2xl border-2 transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-playful-lg",
        "animate-slide-up group",
        styles.card,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Food emoji */}
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
          "bg-gradient-to-br from-white to-gray-50",
          "border-2 border-gray-100 shadow-inner",
          "transition-transform duration-300 group-hover:scale-105"
        )}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded-lg"
            />
          ) : (
            <span className="text-2xl" role="img" aria-label={item.name}>
              {emoji}
            </span>
          )}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
          <p className="text-sm text-gray-500 font-medium">
            {item.quantity} {item.unit}
            {item.category && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {item.category}
              </span>
            )}
          </p>
        </div>

        {/* Expiration badge */}
        <div className={cn(
          "rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap",
          "flex items-center gap-2 shadow-sm",
          styles.badge
        )}>
          {expiration.status === "critical" || expiration.status === "expired" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : expiration.status === "fresh" ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          {expiration.displayText}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        <Button
          size="sm"
          onClick={() => onConsume?.(item)}
          className={cn(
            "font-bold rounded-xl",
            "bg-primary-500 hover:bg-primary-600 text-white",
            "shadow-md hover:shadow-lg transition-all duration-200"
          )}
        >
          <Utensils className="h-4 w-4 mr-1" />
          Use
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit?.(item)}
          className={cn(
            "font-bold rounded-xl border-2",
            "hover:border-secondary-300 hover:bg-secondary-50"
          )}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className={cn(
              "p-2 rounded-xl transition-all duration-200",
              "hover:bg-gray-100 hover:scale-110"
            )}
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className={cn(
                "absolute top-10 right-0 z-20",
                "bg-white rounded-2xl shadow-playful-lg",
                "border-2 border-gray-100 py-2 min-w-[160px]",
                "animate-scale-in"
              )}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWaste?.(item);
                    setShowActions(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm font-medium",
                    "text-warning-700 hover:bg-warning-50",
                    "flex items-center gap-2 transition-colors"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Mark as Wasted
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(item);
                    setShowActions(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm font-medium",
                    "text-danger-600 hover:bg-danger-50",
                    "flex items-center gap-2 transition-colors"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Item
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
