"use client";

import { useState, useEffect, useMemo } from "react";
import { ItemCard, InventoryItem } from "@/components/inventory/ItemCard";
import { AddEditItemModal } from "@/components/inventory/AddEditItemModal";
import { ConsumeItemModal } from "@/components/inventory/ConsumeItemModal";
import { WasteItemModal } from "@/components/inventory/WasteItemModal";
import { DeleteItemConfirmDialog } from "@/components/inventory/DeleteItemConfirmDialog";
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar";
import { Plus, Sparkles, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInventoryItems } from "@/hooks/queries/useInventoryItems";
import { useCreateItem, useUpdateItem, useDeleteItem, useConsumeItem, useWasteItem } from "@/hooks/mutations/useInventoryMutations";
import { InventoryItemFormData } from "@/lib/validations/inventory";
import { socketService } from "@/lib/realtime/socket-service";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/stores/auth.store";
import { cn } from "@/lib/utils";

// All categories from all locations
const ALL_CATEGORIES = [
  "Dairy", "Produce", "Meat", "Beverages", "Condiments", "Leftovers",
  "Frozen Meals", "Ice Cream", "Vegetables", "Fruits", "Proteins",
  "Grains", "Canned Goods", "Snacks", "Spices", "Baking", "Other"
];

// Location emojis
const locationEmojis: Record<string, string> = {
  fridge: "🧊",
  freezer: "❄️",
  pantry: "🗄️",
  all: "📦",
};

export default function AllInventoryPage() {
  const queryClient = useQueryClient();
  const currentHouseholdId = useAuthStore((state) => state.currentHouseholdId);

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [consumingItem, setConsumingItem] = useState<InventoryItem | null>(null);
  const [wastingItem, setWastingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [addLocation, setAddLocation] = useState<"fridge" | "freezer" | "pantry">("pantry");

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<"all" | "fridge" | "freezer" | "pantry">("all");
  const [sortBy, setSortBy] = useState<"name" | "expiration" | "category" | "location">("expiration");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch all inventory items (no location filter)
  const { data: items = [], isLoading, error } = useInventoryItems({
    location: selectedLocation === "all" ? undefined : selectedLocation,
  });

  // Mutations
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const consumeItem = useConsumeItem();
  const wasteItem = useWasteItem();

  // Real-time updates
  useEffect(() => {
    if (!currentHouseholdId) return;

    socketService.connect();

    const handleInventoryUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    };

    socketService.onInventoryUpdated(handleInventoryUpdate);

    return () => {
      socketService.offInventoryUpdated(handleInventoryUpdate);
    };
  }, [currentHouseholdId, queryClient]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Sort items
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "expiration":
          const aDate = a.expirationDate ? new Date(a.expirationDate).getTime() : Infinity;
          const bDate = b.expirationDate ? new Date(b.expirationDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "");
          break;
        case "location":
          comparison = a.location.localeCompare(b.location);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [items, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Get unique categories from items
  const availableCategories = useMemo(() => {
    const categories = new Set(items.map((item) => item.category).filter(Boolean));
    return ["all", ...Array.from(categories).sort()];
  }, [items]);

  // Handlers
  const handleAddItem = () => {
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setAddLocation(item.location);
    setIsAddModalOpen(true);
  };

  const handleConsumeItem = (item: InventoryItem) => {
    setConsumingItem(item);
  };

  const handleWasteItem = (item: InventoryItem) => {
    setWastingItem(item);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setDeletingItem(item);
  };

  const handleSubmitItem = async (data: InventoryItemFormData) => {
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, data });
    } else {
      await createItem.mutateAsync(data);
    }
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handleConfirmConsume = async (quantity: number, notes?: string) => {
    if (consumingItem) {
      await consumeItem.mutateAsync({
        itemId: consumingItem.id,
        quantity,
        notes,
      });
      setConsumingItem(null);
    }
  };

  const handleConfirmWaste = async (quantity: number, reason: string, notes?: string) => {
    if (wastingItem) {
      await wasteItem.mutateAsync({
        itemId: wastingItem.id,
        quantity,
        reason,
        notes,
      });
      setWastingItem(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deleteItem.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😵</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h3>
        <p className="text-gray-600">We couldn&apos;t load your inventory. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between",
        "bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50",
        "rounded-3xl p-6 shadow-playful",
        "border-2 border-white/50"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            "bg-white shadow-lg",
            "text-3xl"
          )}>
            📦
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">
              All Items
            </h1>
            <p className="text-gray-600">
              {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? "s" : ""} across all locations
            </p>
          </div>
        </div>

        <Button
          onClick={handleAddItem}
          className={cn(
            "h-12 px-6 rounded-2xl font-bold",
            "bg-primary-500 hover:bg-primary-600 text-white",
            "shadow-lg shadow-primary-500/30",
            "hover:shadow-xl hover:shadow-primary-500/40",
            "hover:-translate-y-0.5 transition-all duration-200"
          )}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Toolbar */}
      <InventoryToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        categories={availableCategories}
        currentLocation={undefined}
      />

      {/* Items Grid/List */}
      {filteredAndSortedItems.length > 0 ? (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
          )}
        >
          {filteredAndSortedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              variant={viewMode}
              showLocation={true}
              onEdit={() => handleEditItem(item)}
              onConsume={() => handleConsumeItem(item)}
              onWaste={() => handleWasteItem(item)}
              onDelete={() => handleDeleteItem(item)}
            />
          ))}
        </div>
      ) : (
        // Empty State
        <div className={cn(
          "flex flex-col items-center justify-center py-16 px-4",
          "bg-gradient-to-b from-gray-50 to-white",
          "rounded-3xl border-2 border-dashed border-gray-200"
        )}>
          <div className="relative mb-6">
            <div className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center",
              "bg-gradient-to-br from-primary-100 to-secondary-100",
              "shadow-xl animate-float"
            )}>
              <span className="text-5xl">
                {searchQuery ? "🔍" : "📦"}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchQuery
              ? "No items found"
              : "Your inventory is empty!"}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-center">
            {searchQuery
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Add items to your fridge, freezer, or pantry to start tracking freshness and reduce food waste."}
          </p>

          {!searchQuery && (
            <Button
              onClick={handleAddItem}
              className={cn(
                "h-14 px-8 rounded-2xl font-bold text-lg",
                "bg-primary-500 hover:bg-primary-600 text-white",
                "shadow-lg shadow-primary-500/30",
                "hover:shadow-xl hover:shadow-primary-500/40",
                "hover:-translate-y-1 transition-all duration-300",
                "animate-bounce-in"
              )}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Item
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <AddEditItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        item={editingItem}
        location={editingItem?.location || addLocation}
        onSubmit={handleSubmitItem}
      />

      <ConsumeItemModal
        open={!!consumingItem}
        onOpenChange={(open) => !open && setConsumingItem(null)}
        item={consumingItem}
        onConfirm={handleConfirmConsume}
      />

      <WasteItemModal
        open={!!wastingItem}
        onOpenChange={(open) => !open && setWastingItem(null)}
        item={wastingItem}
        onConfirm={handleConfirmWaste}
      />

      <DeleteItemConfirmDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        item={deletingItem}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
