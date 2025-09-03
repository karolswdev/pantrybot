"use client";

import { useState, useEffect, useMemo } from "react";
import { ItemCard, InventoryItem } from "@/components/inventory/ItemCard";
import { AddEditItemModal } from "@/components/inventory/AddEditItemModal";
import { ConsumeItemModal } from "@/components/inventory/ConsumeItemModal";
import { WasteItemModal } from "@/components/inventory/WasteItemModal";
import { DeleteItemConfirmDialog } from "@/components/inventory/DeleteItemConfirmDialog";
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar";
import { Package, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInventoryItems } from "@/hooks/queries/useInventoryItems";
import { useCreateItem, useUpdateItem, useDeleteItem, useConsumeItem, useWasteItem } from "@/hooks/mutations/useInventoryMutations";
import { InventoryItemFormData } from "@/lib/validations/inventory";
import { signalRService } from "@/lib/realtime/signalr-service";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/stores/auth.store";

interface InventoryPageProps {
  location: "fridge" | "freezer" | "pantry";
  categories: string[];
}

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
  const { user, token: authToken } = useAuthStore();
  const isCypressEnv = process.env.NODE_ENV !== 'production' && 
    typeof window !== 'undefined' && 
    (window as Window & { Cypress?: unknown }).Cypress;
  
  // Use the actual household ID from the user object (including in Cypress tests)
  const householdId = user?.households?.[0]?.householdId || user?.defaultHouseholdId;
  
  // Get access token for SignalR connection
  const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

  // Determine the effective location for API query
  const effectiveLocation = selectedLocation === "all" ? location : selectedLocation;
  
  // Fetch inventory items using the query hook with all filter parameters
  const { data, isLoading, isError, error } = useInventoryItems({
    householdId,
    location: effectiveLocation,
    category: selectedCategory === "All" ? undefined : selectedCategory,
    search: searchQuery,
    sortBy: sortBy as "expiry" | "name" | "category",
    sortOrder: "asc",
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  // Use placeholder data if API fails or is not available
  const items = data?.items || (isError ? getPlaceholderItems(effectiveLocation) : []);
  
  // Filter items client-side for status if API doesn't support it
  const filteredItems = useMemo(() => {
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
  }, [items, selectedStatus]);

  // Set up real-time updates via SignalR
  useEffect(() => {
    if (!householdId || !token) return;

    // Connect to SignalR hub
    const connectSignalR = async () => {
      try {
        await signalRService.connect(token, householdId);
        console.log('SignalR connected for real-time updates');
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
      }
    };

    // Handle item update events
    const handleItemUpdated = (data: { payload: { itemId: string; item: Partial<InventoryItem> } }) => {
      console.log('Real-time update received: item.updated', data);
      
      // Update the query cache with the new item data
      queryClient.setQueryData(
        ["inventory", "items", householdId, { location: effectiveLocation, category: selectedCategory === "All" ? undefined : selectedCategory, search: searchQuery, sortBy, sortOrder: "asc", status: selectedStatus === "all" ? undefined : selectedStatus }],
        (oldData: unknown) => {
          if (!oldData) return oldData;
          
          const updatedItems = (oldData as { items: InventoryItem[] }).items.map((item: InventoryItem) => 
            item.id === data.payload.itemId ? { ...item, ...data.payload.item } : item
          );
          
          return {
            ...oldData,
            items: updatedItems
          };
        }
      );
    };

    // Handle item added events
    const handleItemAdded = (data: { payload: { item: InventoryItem } }) => {
      console.log('Real-time update received: item.added', data);
      
      // Refetch the query to get the new item
      queryClient.invalidateQueries({
        queryKey: ["inventory", "items", householdId]
      });
    };

    // Handle item deleted events
    const handleItemDeleted = (data: { payload: { itemId: string } }) => {
      console.log('Real-time update received: item.deleted', data);
      
      // Update the query cache to remove the deleted item
      queryClient.setQueryData(
        ["inventory", "items", householdId, { location: effectiveLocation, category: selectedCategory === "All" ? undefined : selectedCategory, search: searchQuery, sortBy, sortOrder: "asc", status: selectedStatus === "all" ? undefined : selectedStatus }],
        (oldData: unknown) => {
          if (!oldData) return oldData;
          
          const typedData = oldData as { items: InventoryItem[], totalCount: number };
          const filteredItems = typedData.items.filter((item: InventoryItem) => 
            item.id !== data.payload.itemId
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
    signalRService.on('item.updated', handleItemUpdated);
    signalRService.on('item.added', handleItemAdded);
    signalRService.on('item.deleted', handleItemDeleted);

    // Connect to SignalR
    connectSignalR();

    // Cleanup on unmount
    return () => {
      signalRService.off('item.updated', handleItemUpdated);
      signalRService.off('item.added', handleItemAdded);
      signalRService.off('item.deleted', handleItemDeleted);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {locationTitle} Inventory ({filteredItems.length} items)
        </h1>
        {isError && (
          <p className="text-sm text-warning-600 mt-1">
            Using demo data. API connection unavailable.
          </p>
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
          currentLocation={location}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? "Try adjusting your search or filters" 
              : `Your ${location} is empty. Add some items to get started!`}
          </p>
          <Button className="gap-2" onClick={handleAddItem}>
            <Plus className="h-4 w-4" />
            Add Your First Item
          </Button>
        </div>
      )}

      {/* Items Grid/List */}
      {!isLoading && filteredItems.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                viewMode="grid"
                onEdit={handleEdit}
                onConsume={handleConsume}
                onWaste={handleWaste}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                viewMode="list"
                onEdit={handleEdit}
                onConsume={handleConsume}
                onWaste={handleWaste}
                onDelete={handleDelete}
              />
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