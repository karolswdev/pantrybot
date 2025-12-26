"use client";

import { useState, useEffect, useMemo } from "react";
import { ItemCard, InventoryItem } from "@/components/inventory/ItemCard";
import { AddEditItemModal } from "@/components/inventory/AddEditItemModal";
import { ConsumeItemModal } from "@/components/inventory/ConsumeItemModal";
import { WasteItemModal } from "@/components/inventory/WasteItemModal";
import { DeleteItemConfirmDialog } from "@/components/inventory/DeleteItemConfirmDialog";
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInventoryItems } from "@/hooks/queries/useInventoryItems";
import { useCreateItem, useUpdateItem, useDeleteItem, useConsumeItem, useWasteItem } from "@/hooks/mutations/useInventoryMutations";
import { InventoryItemFormData } from "@/lib/validations/inventory";
import { socketService } from "@/lib/realtime/socket-service";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/stores/auth.store";
import { cn } from "@/lib/utils";

interface InventoryPageProps {
  location: "fridge" | "freezer" | "pantry";
  categories: string[];
}

// Location emojis for header
const locationEmojis: Record<string, string> = {
  fridge: "🧊",
  freezer: "❄️",
  pantry: "🗄️",
};

// Placeholder data for development/testing when API is not available
const getPlaceholderItems = (location: "fridge" | "freezer" | "pantry"): InventoryItem[] => {
  const baseItems: Record<typeof location, InventoryItem[]> = {
    fridge: [
      {
        id: "1",
        name: "Organic Whole Milk",
        quantity: 0.5,
        unit: "gal",
        location: "fridge",
        category: "Dairy",
        expirationDate: new Date().toISOString().split('T')[0],
      },
      {
        id: "2",
        name: "Fresh Garden Salad",
        quantity: 1,
        unit: "bag",
        location: "fridge",
        category: "Produce",
        expirationDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      },
      {
        id: "3",
        name: "Aged Cheddar Cheese",
        quantity: 200,
        unit: "g",
        location: "fridge",
        category: "Dairy",
        expirationDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      },
    ],
    freezer: [
      {
        id: "f1",
        name: "Frozen Pizza",
        quantity: 2,
        unit: "boxes",
        location: "freezer",
        category: "Prepared Meals",
        expirationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      },
      {
        id: "f2",
        name: "Ice Cream - Vanilla",
        quantity: 1,
        unit: "pint",
        location: "freezer",
        category: "Desserts",
        bestBeforeDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      },
    ],
    pantry: [
      {
        id: "p1",
        name: "Whole Wheat Bread",
        quantity: 1,
        unit: "loaf",
        location: "pantry",
        category: "Bakery",
        expirationDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      },
      {
        id: "p2",
        name: "Pasta - Spaghetti",
        quantity: 2,
        unit: "boxes",
        location: "pantry",
        category: "Grains",
        bestBeforeDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      },
    ],
  };

  return baseItems[location] || [];
};

export default function InventoryPage({ location, categories }: InventoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState<"all" | "fridge" | "freezer" | "pantry">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "expiring-soon" | "expired">("all");
  const [sortBy, setSortBy] = useState("expiry");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Modal states for actions
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Get auth state and query client for real-time updates
  const queryClient = useQueryClient();
  const { user, token: authToken, currentHouseholdId } = useAuthStore();

  // Use the actual household ID from the user object (including in Cypress tests)
  const householdId = currentHouseholdId || user?.defaultHouseholdId;

  // Get access token for SignalR connection
  const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

  // Determine the effective location for API query
  const effectiveLocation = selectedLocation === "all" ? location : selectedLocation;

  // Fetch inventory items using the query hook with all filter parameters
  const { data, isLoading, isError } = useInventoryItems({
    householdId,
    location: effectiveLocation,
    category: selectedCategory === "All" ? undefined : selectedCategory,
    search: searchQuery,
    sortBy: sortBy as "expiry" | "name" | "category",
    sortOrder: "asc",
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  // Filter items client-side for status if API doesn't support it
  const filteredItems = useMemo(() => {
    // Use placeholder data if API fails or is not available
    const items = data?.items || (isError ? getPlaceholderItems(effectiveLocation) : []);
    if (selectedStatus === "all") return items;

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return items.filter(item => {
      const expDate = item.expirationDate ? new Date(item.expirationDate) :
                      item.bestBeforeDate ? new Date(item.bestBeforeDate) : null;

      if (!expDate) return false;

      if (selectedStatus === "expired") {
        return expDate < now;
      } else if (selectedStatus === "expiring-soon") {
        return expDate >= now && expDate <= threeDaysFromNow;
      }

      return true;
    });
  }, [data?.items, isError, effectiveLocation, selectedStatus]);

  // Set up real-time updates via SignalR
  useEffect(() => {
    if (!householdId || !token) return;

    // Connect to SignalR hub
    const connectSignalR = async () => {
      try {
        await socketService.connect(token, householdId);
        console.log('SignalR connected for real-time updates');
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
      }
    };

    // Handle item update events
    const handleItemUpdated = (data: unknown) => {
      const eventData = data as { payload: { itemId: string; item: Partial<InventoryItem> } };
      console.log('Real-time update received: item.updated', eventData);

      // Update the query cache with the new item data
      queryClient.setQueryData(
        ["inventory", "items", householdId, { location: effectiveLocation, category: selectedCategory === "All" ? undefined : selectedCategory, search: searchQuery, sortBy, sortOrder: "asc", status: selectedStatus === "all" ? undefined : selectedStatus }],
        (oldData: unknown) => {
          if (!oldData) return oldData;

          const updatedItems = (oldData as { items: InventoryItem[] }).items.map((item: InventoryItem) =>
            item.id === eventData.payload.itemId ? { ...item, ...eventData.payload.item } : item
          );

          return {
            ...oldData,
            items: updatedItems
          };
        }
      );
    };

    // Handle item added events
    const handleItemAdded = (data: unknown) => {
      const eventData = data as { payload: { item: InventoryItem } };
      console.log('Real-time update received: item.added', eventData);

      // Refetch the query to get the new item
      queryClient.invalidateQueries({
        queryKey: ["inventory", "items", householdId]
      });
    };

    // Handle item deleted events
    const handleItemDeleted = (data: unknown) => {
      const eventData = data as { payload: { itemId: string } };
      console.log('Real-time update received: item.deleted', eventData);

      // Update the query cache to remove the deleted item
      queryClient.setQueryData(
        ["inventory", "items", householdId, { location: effectiveLocation, category: selectedCategory === "All" ? undefined : selectedCategory, search: searchQuery, sortBy, sortOrder: "asc", status: selectedStatus === "all" ? undefined : selectedStatus }],
        (oldData: unknown) => {
          if (!oldData) return oldData;

          const typedData = oldData as { items: InventoryItem[], totalCount: number };
          const filteredItems = typedData.items.filter((item: InventoryItem) =>
            item.id !== eventData.payload.itemId
          );

          return {
            ...typedData,
            items: filteredItems,
            totalCount: typedData.totalCount - 1
          };
        }
      );
    };

    // Subscribe to events
    socketService.on('item.updated', handleItemUpdated);
    socketService.on('item.added', handleItemAdded);
    socketService.on('item.deleted', handleItemDeleted);

    // Connect to SignalR
    connectSignalR();

    // Cleanup on unmount
    return () => {
      socketService.off('item.updated', handleItemUpdated);
      socketService.off('item.added', handleItemAdded);
      socketService.off('item.deleted', handleItemDeleted);
    };
  }, [householdId, token, queryClient, effectiveLocation, selectedCategory, searchQuery, sortBy, selectedStatus]);

  // Mutation hooks
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();
  const consumeItemMutation = useConsumeItem();
  const wasteItemMutation = useWasteItem();

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: InventoryItemFormData) => {
    if (editingItem) {
      // Update existing item
      // For now, we'll use a simple approach without ETag
      // In a real app, you'd fetch the item first to get the ETag
      await updateItemMutation.mutateAsync({
        itemId: editingItem.id,
        data,
      });
    } else {
      // Create new item
      await createItemMutation.mutateAsync(data);
    }
  };

  const handleConsume = (item: InventoryItem) => {
    setSelectedItem(item);
    setConsumeModalOpen(true);
  };

  const handleConsumeConfirm = (quantity: number, notes?: string) => {
    if (selectedItem) {
      consumeItemMutation.mutate({
        itemId: selectedItem.id,
        quantity,
        notes,
      });
    }
  };

  const handleWaste = (item: InventoryItem) => {
    setSelectedItem(item);
    setWasteModalOpen(true);
  };

  const handleWasteConfirm = (quantity: number, reason: string, notes?: string) => {
    if (selectedItem) {
      wasteItemMutation.mutate({
        itemId: selectedItem.id,
        quantity,
        reason,
        notes,
      });
    }
  };

  const handleDelete = (item: InventoryItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedItem) {
      deleteItemMutation.mutate(selectedItem.id);
    }
  };

  const locationTitle = location.charAt(0).toUpperCase() + location.slice(1);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header - Playful design */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{locationEmojis[location]}</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {locationTitle} Inventory
            </h1>
            <p className={cn(
              "text-sm font-medium mt-0.5",
              filteredItems.length === 0 ? "text-gray-500" : "text-primary-600"
            )}>
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} stored
            </p>
          </div>
        </div>
        {isError && (
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl",
            "bg-warning-50 border border-warning-200 text-warning-700",
            "text-sm font-medium"
          )}>
            <span>Using demo data - API unavailable</span>
          </div>
        )}
      </div>

      {/* Inventory Toolbar */}
      <div className="mb-6">
        <InventoryToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddItem={handleAddItem}
          itemCount={filteredItems.length}
        />
      </div>

      {/* Loading State - Fun animated spinner */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16" data-testid="loading-spinner">
          <div className={cn(
            "relative w-20 h-20 mb-6"
          )}>
            {/* Animated food emojis spinning */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl">🥕</span>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
              <span className="absolute top-1/2 right-0 -translate-y-1/2 text-3xl">🧀</span>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl">🍎</span>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
              <span className="absolute top-1/2 left-0 -translate-y-1/2 text-3xl">🥛</span>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-700">Loading your food...</p>
          <p className="text-sm text-gray-500 mt-1">Checking what&apos;s fresh!</p>
        </div>
      )}

      {/* Empty State - Playful and encouraging */}
      {!isLoading && filteredItems.length === 0 && (
        <div className={cn(
          "text-center py-16 px-6",
          "bg-gradient-to-br from-primary-50 via-white to-secondary-50",
          "rounded-3xl border-2 border-dashed border-primary-200"
        )}>
          {/* Fun illustration */}
          <div className="mb-6">
            <div className={cn(
              "inline-flex items-center justify-center",
              "w-24 h-24 rounded-3xl",
              "bg-gradient-to-br from-primary-100 to-secondary-100",
              "animate-float"
            )}>
              <span className="text-5xl">
                {searchQuery ? "🔍" : locationEmojis[location]}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchQuery
              ? "No items found"
              : `Your ${location} is empty!`}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery
              ? "Try adjusting your search or filters to find what you're looking for."
              : `Add some items to your ${location} to start tracking freshness and reduce food waste.`}
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
              <Sparkles className="h-5 w-5 ml-2" />
            </Button>
          )}

          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className={cn(
                "h-12 px-6 rounded-2xl font-bold border-2",
                "border-primary-300 text-primary-700",
                "hover:bg-primary-50 transition-all duration-200"
              )}
            >
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Items Grid/List */}
      {!isLoading && filteredItems.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ItemCard
                  item={item}
                  viewMode="grid"
                  onEdit={handleEdit}
                  onConsume={handleConsume}
                  onWaste={handleWaste}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ItemCard
                  item={item}
                  viewMode="list"
                  onEdit={handleEdit}
                  onConsume={handleConsume}
                  onWaste={handleWaste}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )
      )}

      {/* Add/Edit Item Modal */}
      <AddEditItemModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={editingItem}
        location={location}
        onSubmit={handleModalSubmit}
      />

      {/* Consume Item Modal */}
      <ConsumeItemModal
        open={consumeModalOpen}
        onOpenChange={setConsumeModalOpen}
        item={selectedItem}
        onConfirm={handleConsumeConfirm}
      />

      {/* Waste Item Modal */}
      <WasteItemModal
        open={wasteModalOpen}
        onOpenChange={setWasteModalOpen}
        item={selectedItem}
        onConfirm={handleWasteConfirm}
      />

      {/* Delete Item Confirm Dialog */}
      <DeleteItemConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={selectedItem}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
