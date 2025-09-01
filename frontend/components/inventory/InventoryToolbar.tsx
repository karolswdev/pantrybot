"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Plus, Grid3X3, List, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";

export interface InventoryToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedLocation: "all" | "fridge" | "freezer" | "pantry";
  onLocationChange: (value: "all" | "fridge" | "freezer" | "pantry") => void;
  selectedStatus: "all" | "expiring-soon" | "expired";
  onStatusChange: (value: "all" | "expiring-soon" | "expired") => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (value: "grid" | "list") => void;
  onAddItem: () => void;
  itemCount?: number;
  currentLocation?: "fridge" | "freezer" | "pantry";
}

export function InventoryToolbar({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onAddItem,
  itemCount = 0,
  currentLocation,
}: InventoryToolbarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce search input to prevent excessive API calls (300ms delay)
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);
  
  // Update parent component when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);
  
  // Sync local state with prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  const handleClearFilters = useCallback(() => {
    setLocalSearchQuery("");
    onSearchChange("");
    onLocationChange("all");
    onStatusChange("all");
    onCategoryChange("All");
  }, [onSearchChange, onLocationChange, onStatusChange, onCategoryChange]);
  
  const hasActiveFilters = 
    searchQuery !== "" || 
    selectedLocation !== "all" || 
    selectedStatus !== "all" || 
    selectedCategory !== "All";
  
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery !== "") count++;
    if (selectedLocation !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedCategory !== "All") count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input with debouncing */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search items..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            data-testid="inventory-search-input"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
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

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("grid")}
              className="rounded-r-none"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("list")}
              className="rounded-l-none"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Item Button */}
          <Button className="gap-2" onClick={onAddItem}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Item</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar - Desktop */}
      <div className="hidden sm:flex flex-wrap gap-2 items-center">
        {/* Location Filter Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={selectedLocation === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onLocationChange("all")}
            className="px-3 py-1"
            data-testid="location-filter-all"
          >
            All
          </Button>
          <Button
            variant={selectedLocation === "fridge" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onLocationChange("fridge")}
            className="px-3 py-1"
            data-testid="location-filter-fridge"
          >
            Fridge
          </Button>
          <Button
            variant={selectedLocation === "freezer" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onLocationChange("freezer")}
            className="px-3 py-1"
            data-testid="location-filter-freezer"
          >
            Freezer
          </Button>
          <Button
            variant={selectedLocation === "pantry" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onLocationChange("pantry")}
            className="px-3 py-1"
            data-testid="location-filter-pantry"
          >
            Pantry
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Status Filter */}
        <div className="flex gap-1">
          <Button
            variant={selectedStatus === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onStatusChange("all")}
            data-testid="status-filter-all"
          >
            All Status
          </Button>
          <Button
            variant={selectedStatus === "expiring-soon" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onStatusChange("expiring-soon")}
            data-testid="status-filter-expiring"
          >
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1" />
            Expiring Soon
          </Button>
          <Button
            variant={selectedStatus === "expired" ? "destructive" : "ghost"}
            size="sm"
            onClick={() => onStatusChange("expired")}
            data-testid="status-filter-expired"
          >
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1" />
            Expired
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Category Filter */}
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-sm text-gray-600">Category:</span>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          </>
        )}
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && (
        <div className="sm:hidden space-y-3 p-4 bg-gray-50 rounded-lg">
          {/* Location Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
            <div className="flex gap-1 p-1 bg-white rounded-lg">
              <Button
                variant={selectedLocation === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onLocationChange("all")}
                className="flex-1"
              >
                All
              </Button>
              <Button
                variant={selectedLocation === "fridge" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onLocationChange("fridge")}
                className="flex-1"
              >
                Fridge
              </Button>
              <Button
                variant={selectedLocation === "freezer" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onLocationChange("freezer")}
                className="flex-1"
              >
                Freezer
              </Button>
              <Button
                variant={selectedLocation === "pantry" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onLocationChange("pantry")}
                className="flex-1"
              >
                Pantry
              </Button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={selectedStatus === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onStatusChange("all")}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === "expiring-soon" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onStatusChange("expiring-soon")}
              >
                Expiring Soon
              </Button>
              <Button
                variant={selectedStatus === "expired" ? "destructive" : "ghost"}
                size="sm"
                onClick={() => onStatusChange("expired")}
              >
                Expired
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiry">Expiry Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button onClick={() => setLocalSearchQuery("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedLocation !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Location: {selectedLocation}
              <button onClick={() => onLocationChange("all")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {selectedStatus === "expiring-soon" ? "Expiring Soon" : "Expired"}
              <button onClick={() => onStatusChange("all")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== "All" && (
            <Badge variant="secondary" className="gap-1">
              Category: {selectedCategory}
              <button onClick={() => onCategoryChange("All")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <span className="text-sm text-gray-500">
            ({itemCount} {itemCount === 1 ? "item" : "items"} found)
          </span>
        </div>
      )}
    </div>
  );
}