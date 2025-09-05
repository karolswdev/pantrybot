import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, tokenManager } from '@/lib/api-client';

// Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  defaultHouseholdId?: string;
  activeHouseholdId?: string;
}

export interface Household {
  id: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface AuthState {
  // State
  user: User | null;
  households: Household[];
  currentHouseholdId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    timezone?: string;
    householdName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentHousehold: (householdId: string) => void;
  clearError: () => void;
  checkAuth: () => boolean;
  updateTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
}

// Create the store
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      households: [],
      currentHouseholdId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      refreshToken: null,
      
      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.auth.login({ email, password });
          const { accessToken, refreshToken, expiresIn, userId } = response.data;
          
          // Store tokens
          tokenManager.setTokens(accessToken, refreshToken, expiresIn || 900);
          
          // Construct user object from login response
          const user: User = {
            id: userId,
            email: email,
            displayName: response.data.displayName || email.split('@')[0],
            activeHouseholdId: response.data.defaultHouseholdId || undefined,
          };
          
          // Set households if provided, otherwise empty array
          const households: Household[] = response.data.households || [];
          const defaultHousehold = response.data.defaultHouseholdId || (households.length > 0 ? households[0].id : null);
          
          set({
            user,
            households,
            currentHouseholdId: defaultHousehold,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token: accessToken,
            refreshToken: refreshToken,
          });
        } catch (error) {
          const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw error;
        }
      },
      
      // Register action
      register: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          // Pass the household name from the form or use 'Home' as default
          const response = await api.auth.register({
            email: data.email,
            password: data.password,
            displayName: data.displayName,
            timezone: data.timezone || 'UTC',
            defaultHouseholdName: data.householdName || 'Home' // Use provided household name or default
          });
          
          const { 
            userId, 
            email, 
            displayName, 
            accessToken, 
            refreshToken, 
            expiresIn,
            defaultHouseholdId 
          } = response.data;
          
          // Store tokens
          tokenManager.setTokens(accessToken, refreshToken, expiresIn || 900);
          
          // Create user object
          const user: User = {
            id: userId,
            email,
            displayName,
            activeHouseholdId: defaultHouseholdId || undefined,
          };
          
          // Create default household
          const households: Household[] = defaultHouseholdId ? [{
            id: defaultHouseholdId,
            name: data.householdName || 'Home',
            role: 'admin',
          }] : [];
          
          set({
            user,
            households,
            currentHouseholdId: defaultHouseholdId,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token: accessToken,
            refreshToken: refreshToken,
          });
        } catch (error) {
          const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw error;
        }
      },
      
      // Logout action
      logout: async () => {
        set({ isLoading: true });
        
        const refreshToken = tokenManager.getRefreshToken();
        
        try {
          if (refreshToken) {
            await api.auth.logout(refreshToken);
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          // Ignore logout errors - we're logging out anyway
          // Error logged);
        } finally {
          // Clear tokens and state
          tokenManager.clearTokens();
          
          set({
            user: null,
            households: [],
            currentHouseholdId: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            token: null,
            refreshToken: null,
          });
        }
      },
      
      // Set current household
      setCurrentHousehold: (householdId: string) => {
        const { households } = get();
        const household = households.find(h => h.id === householdId);
        
        if (household) {
          set({ currentHouseholdId: householdId });
        }
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Check if authenticated
      checkAuth: () => {
        const { token: stateToken } = get();
        const accessToken = stateToken || tokenManager.getAccessToken();
        
        // If we have a token from state, set it in tokenManager
        if (stateToken && !tokenManager.getAccessToken()) {
          const refreshToken = get().refreshToken;
          if (refreshToken) {
            tokenManager.setTokens(stateToken, refreshToken, 900); // Default 15 min expiry
          }
        }
        
        const isExpired = tokenManager.isTokenExpired();
        const isAuthenticated = !!accessToken && !isExpired;
        
        if (!isAuthenticated) {
          set({
            user: null,
            households: [],
            currentHouseholdId: null,
            isAuthenticated: false,
            token: null,
            refreshToken: null,
          });
        }
        
        return isAuthenticated;
      },
      
      // Update tokens (used by API client after refresh)
      updateTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
        tokenManager.setTokens(accessToken, refreshToken, expiresIn);
        // Keep the user authenticated
        set({ isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        households: state.households,
        currentHouseholdId: state.currentHouseholdId,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export { useAuthStore };
export default useAuthStore;