import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth.store';

interface HouseholdState {
  activeHouseholdId: string | null;
  setActiveHouseholdId: (id: string) => void;
  getActiveHouseholdId: () => string | null;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      activeHouseholdId: null,
      
      setActiveHouseholdId: (id: string) => {
        set({ activeHouseholdId: id });
      },
      
      getActiveHouseholdId: () => {
        const state = get();
        if (state.activeHouseholdId) {
          return state.activeHouseholdId;
        }
        
        // Fallback to auth store's current household
        const authState = useAuthStore.getState();
        return authState.currentHouseholdId || authState.user?.activeHouseholdId || null;
      }
    }),
    {
      name: 'householdStore',
    }
  )
);

// Initialize from auth store
const authState = useAuthStore.getState();
if (authState.currentHouseholdId && !useHouseholdStore.getState().activeHouseholdId) {
  useHouseholdStore.getState().setActiveHouseholdId(authState.currentHouseholdId);
}