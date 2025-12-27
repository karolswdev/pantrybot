'use client';

import { Clock, Users, ChefHat, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecipeCardProps {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  usedIngredients: string[];
  missedIngredients?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  source: 'spoonacular' | 'llm';
  onClick?: () => void;
  className?: string;
}

const difficultyColors = {
  easy: 'bg-fresh-100 text-fresh-700',
  medium: 'bg-accent-100 text-accent-700',
  hard: 'bg-danger-100 text-danger-700',
};

export function RecipeCard({
  title,
  description,
  image,
  readyInMinutes,
  servings,
  usedIngredients,
  missedIngredients,
  difficulty,
  source,
  onClick,
  className,
}: RecipeCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-2xl border-2 border-gray-100 overflow-hidden transition-all duration-300',
        'hover:border-primary-200 hover:shadow-playful-lg hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Image or placeholder */}
      <div className="relative h-36 bg-gradient-to-br from-primary-100 to-fresh-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-primary-300" />
          </div>
        )}

        {/* Source badge */}
        <div className={cn(
          'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium',
          source === 'llm'
            ? 'bg-secondary-500 text-white'
            : 'bg-white/90 text-gray-700'
        )}>
          {source === 'llm' ? (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          ) : (
            'Spoonacular'
          )}
        </div>

        {/* Difficulty badge */}
        {difficulty && (
          <div className={cn(
            'absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium capitalize',
            difficultyColors[difficulty]
          )}>
            {difficulty}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          {readyInMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{readyInMinutes} min</span>
            </div>
          )}
          {servings && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{servings} servings</span>
            </div>
          )}
        </div>

        {/* Ingredients used */}
        {usedIngredients.length > 0 && (
          <div className="mb-2">
            <span className="text-xs font-semibold text-fresh-600 uppercase tracking-wide">
              Using your ingredients:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {usedIngredients.slice(0, 4).map((ingredient, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-fresh-50 text-fresh-700 rounded-full text-xs"
                >
                  {ingredient}
                </span>
              ))}
              {usedIngredients.length > 4 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                  +{usedIngredients.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Missing ingredients */}
        {missedIngredients && missedIngredients.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-accent-600 uppercase tracking-wide">
              You'll need:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {missedIngredients.slice(0, 3).map((ingredient, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-accent-50 text-accent-700 rounded-full text-xs"
                >
                  {ingredient}
                </span>
              ))}
              {missedIngredients.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                  +{missedIngredients.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      {onClick && (
        <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <span className="text-sm font-medium text-primary-600">View Recipe</span>
            <ExternalLink className="w-4 h-4 text-primary-600" />
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeCard;
