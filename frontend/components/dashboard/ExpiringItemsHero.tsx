'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, Utensils, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ConsumeItemModal } from '@/components/inventory/ConsumeItemModal';
import { WasteItemModal } from '@/components/inventory/WasteItemModal';
import { useConsumeItem, useWasteItem } from '@/hooks/mutations/useInventoryMutations';
import { InventoryItem } from '@/components/inventory/ItemCard';

export interface ExpiringItem {
  id: string;
  name: string;
  emoji: string;
  location: 'fridge' | 'freezer' | 'pantry';
  expiresIn: string;
  daysUntilExpiration?: number;
  quantity?: number;
  unit?: string;
}

interface ExpiringItemsHeroProps {
  items: ExpiringItem[];
  loading?: boolean;
}

const locationLabels: Record<string, { label: string; emoji: string }> = {
  fridge: { label: 'Fridge', emoji: '🧊' },
  freezer: { label: 'Freezer', emoji: '❄️' },
  pantry: { label: 'Pantry', emoji: '🗄️' },
};

export function ExpiringItemsHero({ items, loading }: ExpiringItemsHeroProps) {
  const [consumingItem, setConsumingItem] = useState<InventoryItem | null>(null);
  const [wastingItem, setWastingItem] = useState<InventoryItem | null>(null);

  const consumeItem = useConsumeItem();
  const wasteItem = useWasteItem();

  const handleConsume = async (quantity: number, notes?: string) => {
    if (!consumingItem) return;
    await consumeItem.mutateAsync({
      itemId: consumingItem.id,
      quantity,
      notes,
    });
    setConsumingItem(null);
  };

  const handleWaste = async (quantity: number, reason: string, notes?: string) => {
    if (!wastingItem) return;
    await wasteItem.mutateAsync({
      itemId: wastingItem.id,
      quantity,
      reason,
      notes,
    });
    setWastingItem(null);
  };

  // Convert ExpiringItem to InventoryItem format for modals
  const toInventoryItem = (item: ExpiringItem): InventoryItem => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity || 1,
    unit: item.unit || 'item',
    location: item.location,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 animate-pulse" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce-in">
                <span className="text-5xl">✨</span>
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg animate-float">
                <span className="text-2xl">🎉</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">All Fresh!</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              Nothing expiring soon. Your kitchen game is strong!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate critical items (today/tomorrow) from others
  const criticalItems = items.filter(item => (item.daysUntilExpiration ?? 99) <= 1);
  const warningItems = items.filter(item => {
    const days = item.daysUntilExpiration ?? 99;
    return days > 1 && days <= 7;
  });

  const getUrgencyStyle = (daysUntil?: number) => {
    if (daysUntil === undefined) return 'default';
    if (daysUntil <= 0) return 'critical';
    if (daysUntil <= 1) return 'urgent';
    if (daysUntil <= 3) return 'warning';
    return 'default';
  };

  const urgencyStyles = {
    critical: {
      card: 'bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border-2 border-rose-300 shadow-lg shadow-rose-500/10',
      badge: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30',
      glow: 'ring-4 ring-rose-200 ring-opacity-50',
      pulse: true,
    },
    urgent: {
      card: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300 shadow-lg shadow-amber-500/10',
      badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30',
      glow: 'ring-2 ring-amber-200',
      pulse: false,
    },
    warning: {
      card: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300',
      badge: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
      glow: '',
      pulse: false,
    },
    default: {
      card: 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200',
      badge: 'bg-gray-200 text-gray-700',
      glow: '',
      pulse: false,
    },
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            "bg-gradient-to-br from-amber-400 to-orange-500",
            "shadow-lg shadow-amber-500/30"
          )}>
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800">Needs Attention</h2>
            <p className="text-sm text-gray-500">
              {items.length} item{items.length !== 1 ? 's' : ''} expiring soon
            </p>
          </div>
        </div>
        <Link
          href="/inventory"
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-xl",
            "bg-gray-100 hover:bg-gray-200 transition-colors",
            "text-sm font-bold text-gray-700"
          )}
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Critical Items - Larger Cards */}
      {criticalItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-bold text-rose-600 uppercase tracking-wide">
              Act Now
            </span>
          </div>
          <div className="grid gap-4">
            {criticalItems.slice(0, 3).map((item, index) => {
              const urgency = getUrgencyStyle(item.daysUntilExpiration);
              const styles = urgencyStyles[urgency];

              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative rounded-3xl p-5 transition-all duration-300",
                    "hover:shadow-xl hover:-translate-y-1",
                    styles.card,
                    styles.glow,
                    styles.pulse && "animate-pulse-subtle"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    {/* Item Info */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center",
                        "bg-white shadow-lg text-4xl",
                        styles.pulse && "animate-bounce-subtle"
                      )}>
                        {item.emoji}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-800">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            {locationLabels[item.location].emoji}
                            {locationLabels[item.location].label}
                          </span>
                          {item.quantity && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm font-medium text-gray-600">
                                {item.quantity} {item.unit}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expiration Badge */}
                    <div className={cn(
                      "px-4 py-2 rounded-2xl text-sm font-black",
                      styles.badge
                    )}>
                      {item.expiresIn}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200/50">
                    <Button
                      size="sm"
                      onClick={() => setConsumingItem(toInventoryItem(item))}
                      className={cn(
                        "flex-1 h-11 rounded-xl font-bold",
                        "bg-emerald-500 hover:bg-emerald-600 text-white",
                        "shadow-lg shadow-emerald-500/20",
                        "hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      )}
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Use It
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWastingItem(toInventoryItem(item))}
                      className={cn(
                        "flex-1 h-11 rounded-xl font-bold",
                        "border-2 border-gray-300 hover:border-rose-300",
                        "hover:bg-rose-50 hover:text-rose-600",
                        "transition-all"
                      )}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Toss It
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning Items - Compact List */}
      {warningItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-600 uppercase tracking-wide">
              Coming Up
            </span>
          </div>
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-amber-100">
                {warningItems.slice(0, 5).map((item, index) => {
                  const urgency = getUrgencyStyle(item.daysUntilExpiration);
                  const styles = urgencyStyles[urgency];

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-4",
                        "hover:bg-amber-50/50 transition-colors group"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
                          {item.emoji}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            {locationLabels[item.location].emoji}
                            {locationLabels[item.location].label}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          styles.badge
                        )}>
                          {item.expiresIn}
                        </span>

                        {/* Quick action on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => setConsumingItem(toInventoryItem(item))}
                            className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                            title="Use it"
                          >
                            <Utensils className="h-4 w-4 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => setWastingItem(toInventoryItem(item))}
                            className="w-8 h-8 rounded-lg bg-rose-100 hover:bg-rose-200 flex items-center justify-center transition-colors"
                            title="Toss it"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show more link if there are additional items */}
      {items.length > 8 && (
        <Link
          href="/inventory"
          className={cn(
            "flex items-center justify-center gap-2 py-3 px-6 rounded-2xl",
            "bg-gradient-to-r from-amber-100 to-orange-100",
            "border-2 border-amber-200 hover:border-amber-300",
            "text-amber-700 font-bold",
            "hover:shadow-lg transition-all"
          )}
        >
          <Sparkles className="h-4 w-4" />
          View {items.length - 8} more expiring items
        </Link>
      )}

      {/* Modals */}
      <ConsumeItemModal
        open={!!consumingItem}
        onOpenChange={(open) => !open && setConsumingItem(null)}
        item={consumingItem}
        onConfirm={handleConsume}
      />

      <WasteItemModal
        open={!!wastingItem}
        onOpenChange={(open) => !open && setWastingItem(null)}
        item={wastingItem}
        onConfirm={handleWaste}
      />
    </div>
  );
}
