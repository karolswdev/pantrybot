'use client';

import { useState } from 'react';
import { ChefHat, Sparkles, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { useRecipeSuggestions, useExpiringRecipes, useRecipeStatus } from '@/hooks/queries/useRecipes';
import { useAuthStore } from '@/stores/auth.store';
import { RecipeCard } from './RecipeCard';
import { cn } from '@/lib/utils';

type ViewMode = 'all' | 'expiring';

interface RecipeSuggestionsProps {
  className?: string;
  compact?: boolean;
}

export function RecipeSuggestions({ className, compact = false }: RecipeSuggestionsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const currentHouseholdId = useAuthStore((state) => state.currentHouseholdId);

  const { data: status } = useRecipeStatus();
  const {
    data: allRecipes,
    isLoading: isLoadingAll,
    refetch: refetchAll,
    isRefetching: isRefetchingAll,
  } = useRecipeSuggestions(currentHouseholdId, {
    count: compact ? 3 : 6,
    enabled: viewMode === 'all',
  });

  const {
    data: expiringRecipes,
    isLoading: isLoadingExpiring,
    refetch: refetchExpiring,
    isRefetching: isRefetchingExpiring,
  } = useExpiringRecipes(currentHouseholdId, {
    days: 3,
    count: compact ? 3 : 6,
    enabled: viewMode === 'expiring',
  });

  const isLoading = viewMode === 'all' ? isLoadingAll : isLoadingExpiring;
  const isRefetching = viewMode === 'all' ? isRefetchingAll : isRefetchingExpiring;
  const data = viewMode === 'all' ? allRecipes : expiringRecipes;
  const refetch = viewMode === 'all' ? refetchAll : refetchExpiring;

  if (!status?.available) {
    return null;
  }

  const handleRecipeClick = (recipeId: string | number) => {
    // For Spoonacular recipes, could open a modal or navigate
    // For LLM recipes, show the generated instructions
    console.log('Recipe clicked:', recipeId);
  };

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-secondary-100">
            <ChefHat className="w-5 h-5 text-secondary-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Recipe Ideas</h2>
            <p className="text-sm text-gray-500">Based on your inventory</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className={cn(
            'p-2 rounded-xl transition-all',
            'hover:bg-gray-100 active:scale-95',
            isRefetching && 'animate-spin'
          )}
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('all')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            viewMode === 'all'
              ? 'bg-primary-500 text-white shadow-glow-primary'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Sparkles className="w-4 h-4" />
          All Recipes
        </button>
        <button
          onClick={() => setViewMode('expiring')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            viewMode === 'expiring'
              ? 'bg-accent-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Use Expiring
          {expiringRecipes?.expiringCount && expiringRecipes.expiringCount > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
              {expiringRecipes.expiringCount}
            </span>
          )}
        </button>
      </div>

      {/* Expiring items notice */}
      {viewMode === 'expiring' && expiringRecipes?.expiringItems && expiringRecipes.expiringItems.length > 0 && (
        <div className="mb-4 p-3 bg-accent-50 rounded-xl border border-accent-200">
          <div className="flex items-center gap-2 text-accent-700 mb-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-sm">Items expiring soon:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringRecipes.expiringItems.map((item, i) => (
              <span key={i} className="px-2 py-1 bg-white rounded-lg text-sm text-accent-800">
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!data?.recipes || data.recipes.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {viewMode === 'expiring'
              ? 'No items expiring soon - great job!'
              : 'Add items to your inventory for recipe suggestions'}
          </p>
        </div>
      )}

      {/* Recipe grid */}
      {!isLoading && data?.recipes && data.recipes.length > 0 && (
        <div className={cn(
          'grid gap-4',
          compact
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        )}>
          {data.recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              {...recipe}
              onClick={() => handleRecipeClick(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Provider info */}
      {data?.provider && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Powered by {data.provider === 'llm' ? 'AI' : 'Spoonacular'}
        </p>
      )}
    </div>
  );
}

export default RecipeSuggestions;
