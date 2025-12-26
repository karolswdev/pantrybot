"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Plus, Grid3X3, List, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

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
}

// Location icons/emojis for playful filter pills
const locationEmojis: Record<string, string> = {
  all: "🏠",
  fridge: "🧊",
  freezer: "❄️",
  pantry: "🗄️",
};

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
        {/* Search Input - Playful rounded design */}
        <div className="relative flex-1">
          <div className={cn(
            "absolute left-4 top-1/2 transform -translate-y-1/2",
            "w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center"
          )}>
            <Search className="h-4 w-4 text-primary-600" />
          </div>
          <Input
            type="text"
            placeholder="Search your food..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className={cn(
              "pl-14 pr-12 h-12 rounded-2xl border-2 border-gray-200",
              "focus:border-primary-400 focus:ring-primary-200",
              "text-base font-medium placeholder:text-gray-400",
              "transition-all duration-200",
              "hover:border-gray-300"
            )}
            data-testid="inventory-search-input"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery("")}
              className={cn(
                "absolute right-4 top-1/2 transform -translate-y-1/2",
                "w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300",
                "flex items-center justify-center transition-colors"
              )}
              aria-label="Clear search"
            >
              <X className="h-3 w-3 text-gray-600" />
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
            className={cn(
              "sm:hidden h-12 w-12 rounded-2xl border-2",
              "relative transition-all duration-200",
              showFilters && "bg-primary-50 border-primary-300"
            )}
          >
            <Filter className="h-5 w-5" />
            {hasActiveFilters && (
              <Badge className={cn(
                "absolute -top-1.5 -right-1.5 h-5 w-5 p-0",
                "flex items-center justify-center text-xs",
                "bg-secondary-500 text-white rounded-full"
              )}>
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          {/* Sort Dropdown - Playful styling */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className={cn(
              "w-[160px] h-12 rounded-2xl border-2 hidden sm:flex",
              "font-medium text-gray-700",
              "hover:border-gray-300 transition-colors"
            )}>
              <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              <SelectItem value="expiry" className="rounded-lg">Sort by Expiry</SelectItem>
              <SelectItem value="name" className="rounded-lg">Sort by Name</SelectItem>
              <SelectItem value="category" className="rounded-lg">Sort by Category</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle - Playful pill design */}
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "h-10 w-10 rounded-xl transition-all duration-200",
                viewMode === "grid"
                  ? "bg-white shadow-md text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "h-10 w-10 rounded-xl transition-all duration-200",
                viewMode === "list"
                  ? "bg-white shadow-md text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>

          {/* Add Item Button - Fun and prominent */}
          <Button
            onClick={onAddItem}
            className={cn(
              "h-12 px-5 rounded-2xl font-bold",
              "bg-primary-500 hover:bg-primary-600 text-white",
              "shadow-lg shadow-primary-500/30",
              "hover:shadow-xl hover:shadow-primary-500/40",
              "hover:-translate-y-0.5 transition-all duration-200",
              "flex items-center gap-2"
            )}
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Add Item</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar - Desktop - Colorful pills */}
      <div className="hidden sm:flex flex-wrap gap-3 items-center">
        {/* Location Filter Pills */}
        <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-2xl">
          {(["all", "fridge", "freezer", "pantry"] as const).map((loc) => (
            <Button
              key={loc}
              variant="ghost"
              size="sm"
              onClick={() => onLocationChange(loc)}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200",
                selectedLocation === loc
                  ? "bg-white shadow-md text-primary-700"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
              )}
              data-testid={`location-filter-${loc}`}
            >
              <span className="mr-1.5">{locationEmojis[loc]}</span>
              {loc.charAt(0).toUpperCase() + loc.slice(1)}
            </Button>
          ))}
        </div>

        <div className="h-8 w-0.5 bg-gray-200 rounded-full" />

        {/* Status Filter Pills */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange("all")}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200",
              selectedStatus === "all"
                ? "bg-gray-200 text-gray-800"
                : "text-gray-600 hover:bg-gray-100"
            )}
            data-testid="status-filter-all"
          >
            All Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange("expiring-soon")}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200",
              selectedStatus === "expiring-soon"
                ? "bg-warning-100 text-warning-700 shadow-sm"
                : "text-gray-600 hover:bg-warning-50 hover:text-warning-700"
            )}
            data-testid="status-filter-expiring"
          >
            <span className="inline-block w-2.5 h-2.5 bg-warning-500 rounded-full mr-2 animate-pulse-soft" />
            Expiring Soon
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange("expired")}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200",
              selectedStatus === "expired"
                ? "bg-danger-100 text-danger-700 shadow-sm"
                : "text-gray-600 hover:bg-danger-50 hover:text-danger-700"
            )}
            data-testid="status-filter-expired"
          >
            <span className="inline-block w-2.5 h-2.5 bg-danger-500 rounded-full mr-2" />
            Expired
          </Button>
        </div>

        <div className="h-8 w-0.5 bg-gray-200 rounded-full" />

        {/* Category Filter Dropdown */}
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-500">Category:</span>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className={cn(
              "w-[160px] h-9 rounded-xl border-2 font-medium",
              selectedCategory !== "All" && "border-secondary-300 bg-secondary-50"
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              <SelectItem value="All" className="rounded-lg font-medium">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="rounded-lg">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <>
            <div className="h-8 w-0.5 bg-gray-200 rounded-full" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-sm",
                "text-gray-500 hover:text-danger-600 hover:bg-danger-50",
                "transition-all duration-200"
              )}
            >
              <X className="h-4 w-4 mr-1.5" />
              Clear All
            </Button>
          </>
        )}
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && (
        <div className={cn(
          "sm:hidden space-y-4 p-5 rounded-2xl",
          "bg-gradient-to-br from-gray-50 to-white",
          "border-2 border-gray-100 shadow-playful",
          "animate-slide-down"
        )}>
          {/* Location Filter */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Location</label>
            <div className="flex gap-2 flex-wrap">
              {(["all", "fridge", "freezer", "pantry"] as const).map((loc) => (
                <Button
                  key={loc}
                  variant="ghost"
                  size="sm"
                  onClick={() => onLocationChange(loc)}
                  className={cn(
                    "px-3 py-2 rounded-xl font-bold text-sm transition-all",
                    selectedLocation === loc
                      ? "bg-primary-100 text-primary-700 shadow-sm"
                      : "bg-white text-gray-600 border-2 border-gray-200"
                  )}
                >
                  <span className="mr-1">{locationEmojis[loc]}</span>
                  {loc.charAt(0).toUpperCase() + loc.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Status</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange("all")}
                className={cn(
                  "px-3 py-2 rounded-xl font-bold text-sm transition-all",
                  selectedStatus === "all"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-white text-gray-600 border-2 border-gray-200"
                )}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange("expiring-soon")}
                className={cn(
                  "px-3 py-2 rounded-xl font-bold text-sm transition-all",
                  selectedStatus === "expiring-soon"
                    ? "bg-warning-100 text-warning-700"
                    : "bg-white text-gray-600 border-2 border-gray-200"
                )}
              >
                <span className="inline-block w-2 h-2 bg-warning-500 rounded-full mr-1.5" />
                Expiring
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange("expired")}
                className={cn(
                  "px-3 py-2 rounded-xl font-bold text-sm transition-all",
                  selectedStatus === "expired"
                    ? "bg-danger-100 text-danger-700"
                    : "bg-white text-gray-600 border-2 border-gray-200"
                )}
              >
                <span className="inline-block w-2 h-2 bg-danger-500 rounded-full mr-1.5" />
                Expired
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Category</label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full rounded-xl border-2 h-11 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="All" className="rounded-lg">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="rounded-lg">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Sort By</label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full rounded-xl border-2 h-11 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="expiry" className="rounded-lg">Expiry Date</SelectItem>
                <SelectItem value="name" className="rounded-lg">Name</SelectItem>
                <SelectItem value="category" className="rounded-lg">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className={cn(
                "w-full h-11 rounded-xl border-2 font-bold",
                "text-danger-600 border-danger-200 hover:bg-danger-50"
              )}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Active Filter Summary - Playful badges */}
      {hasActiveFilters && (
        <div className={cn(
          "flex flex-wrap gap-2 items-center p-3 rounded-xl",
          "bg-gradient-to-r from-primary-50 to-secondary-50",
          "border border-primary-100"
        )}>
          <Sparkles className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-gray-600">Active filters:</span>
          {searchQuery && (
            <Badge className={cn(
              "bg-white border-2 border-gray-200 text-gray-700 rounded-xl px-3 py-1",
              "font-medium flex items-center gap-1.5 hover:border-gray-300"
            )}>
              Search: &quot;{searchQuery}&quot;
              <button
                onClick={() => setLocalSearchQuery("")}
                className="ml-1 hover:text-danger-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedLocation !== "all" && (
            <Badge className={cn(
              "bg-white border-2 border-primary-200 text-primary-700 rounded-xl px-3 py-1",
              "font-medium flex items-center gap-1.5"
            )}>
              {locationEmojis[selectedLocation]} {selectedLocation}
              <button
                onClick={() => onLocationChange("all")}
                className="ml-1 hover:text-danger-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedStatus !== "all" && (
            <Badge className={cn(
              "bg-white border-2 rounded-xl px-3 py-1 font-medium flex items-center gap-1.5",
              selectedStatus === "expiring-soon"
                ? "border-warning-300 text-warning-700"
                : "border-danger-300 text-danger-700"
            )}>
              {selectedStatus === "expiring-soon" ? "Expiring Soon" : "Expired"}
              <button
                onClick={() => onStatusChange("all")}
                className="ml-1 hover:text-danger-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== "All" && (
            <Badge className={cn(
              "bg-white border-2 border-secondary-200 text-secondary-700 rounded-xl px-3 py-1",
              "font-medium flex items-center gap-1.5"
            )}>
              {selectedCategory}
              <button
                onClick={() => onCategoryChange("All")}
                className="ml-1 hover:text-danger-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <span className={cn(
            "ml-auto text-sm font-bold px-3 py-1 rounded-xl",
            "bg-white text-primary-600 border border-primary-200"
          )}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      )}
    </div>
  );
}
