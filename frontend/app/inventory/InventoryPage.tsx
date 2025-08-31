"use client";

import { useState } from "react";
import { ItemCard, InventoryItem } from "@/components/inventory/ItemCard";
import { AddEditItemModal } from "@/components/inventory/AddEditItemModal";
import { ConsumeItemModal } from "@/components/inventory/ConsumeItemModal";
import { WasteItemModal } from "@/components/inventory/WasteItemModal";
import { DeleteItemConfirmDialog } from "@/components/inventory/DeleteItemConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Plus, Grid3X3, List, Package, Loader2 } from "lucide-react";
import { useInventoryItems } from "@/hooks/queries/useInventoryItems";
import { useCreateItem, useUpdateItem, useDeleteItem, useConsumeItem, useWasteItem } from "@/hooks/mutations/useInventoryMutations";
import { InventoryItemFormData } from "@/lib/validations/inventory";

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
  const [sortBy, setSortBy] = useState("expiry");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Modal states for actions
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Fetch inventory items using the query hook
  const { data, isLoading, isError, error } = useInventoryItems({
    location,
    category: selectedCategory === "All" ? undefined : selectedCategory,
    search: searchQuery,
    sortBy: sortBy as "expiry" | "name" | "category",
    sortOrder: "asc",
  });

  // Use placeholder data if API fails or is not available
  const items = data?.items || (isError ? getPlaceholderItems(location) : []);

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
          {locationTitle} Inventory ({items.length} items)
        </h1>
        {isError && (
          <p className="text-sm text-warning-600 mt-1">
            Using demo data. API connection unavailable.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] hidden sm:flex">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiry">Sort by Expiry</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="category">Sort by Category</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button className="gap-2" onClick={handleAddItem}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Desktop filters */}
        <div className="hidden sm:flex gap-2 flex-wrap">
          <span className="text-sm text-gray-600 self-center">Categories:</span>
          {["All", ...categories].map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
              {category !== "All" && (
                <span className="ml-1 text-xs text-gray-500">
                  ({items.filter(item => item.category === category).length})
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
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
      {!isLoading && items.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
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
            {items.map((item) => (
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