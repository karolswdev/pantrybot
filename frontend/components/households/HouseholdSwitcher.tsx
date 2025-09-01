"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Home, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useHouseholds } from "@/hooks/queries/useHouseholds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HouseholdSwitcher() {
  const { currentHouseholdId, setCurrentHousehold, households: storeHouseholds } = useAuthStore();
  const { data, isLoading, error } = useHouseholds();
  const [isOpen, setIsOpen] = useState(false);

  // Use households from the store if available, otherwise from the API
  const households = data?.households || storeHouseholds || [];
  
  // Get the current household name
  const currentHousehold = households.find(h => h.id === currentHouseholdId);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="flex items-center gap-2">
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Loading...</span>
        <ChevronDown className="h-3 w-3" />
      </Button>
    );
  }

  if (!households.length && !isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="flex items-center gap-2">
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">No Household</span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 data-[state=open]:bg-gray-100"
          data-testid="household-switcher-trigger"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[150px] truncate">
            {currentHousehold?.name || 'Select Household'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Switch Household</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {households.map((household) => (
          <DropdownMenuItem
            key={household.id}
            onClick={() => {
              setCurrentHousehold(household.id);
              setIsOpen(false);
            }}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`household-option-${household.id}`}
          >
            <div className="flex flex-col">
              <span className="font-medium">{household.name}</span>
              <span className="text-xs text-gray-500">
                {household.role}
              </span>
            </div>
            {currentHouseholdId === household.id && (
              <Check className="h-4 w-4 text-primary-600" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            // This will be implemented in Task 3
            console.log('Create new household');
          }}
          className="cursor-pointer text-primary-600"
        >
          Create New Household
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}