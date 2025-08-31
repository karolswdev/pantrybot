import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Token management utilities
export const tokenManager = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },
  
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },
  
  isTokenExpired: () => {
    if (typeof window === 'undefined') return true;
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    return Date.now() >= parseInt(expiryTime, 10);
  }
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracing
    if (config.headers) {
      config.headers['X-Request-Id'] = crypto.randomUUID();
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Don't attempt refresh for auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        tokenManager.clearTokens();
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      try {
        // Use a separate axios instance for refresh to avoid interceptor loops
        const response = await axios.create({
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }).post('/auth/refresh', {
          refreshToken: refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
        
        tokenManager.setTokens(accessToken, newRefreshToken, expiresIn);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        processQueue(null, accessToken);
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        tokenManager.clearTokens();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Export the configured client
export default apiClient;

// Export typed API methods
export const api = {
  // Auth endpoints
  auth: {
    register: (data: {
      email: string;
      password: string;
      displayName: string;
      timezone?: string;
    }) => apiClient.post('/auth/register', data),
    
    login: (data: {
      email: string;
      password: string;
    }) => apiClient.post('/auth/login', data),
    
    logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),
    
    forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
    
    resetPassword: (token: string, newPassword: string) => 
      apiClient.post('/auth/reset-password', { token, newPassword }),
  },
  
  // Household endpoints
  households: {
    list: () => apiClient.get('/households'),
    
    get: (householdId: string) => apiClient.get(`/households/${householdId}`),
    
    create: (data: {
      name: string;
      description?: string;
      timezone?: string;
    }) => apiClient.post('/households', data),
    
    update: (householdId: string, data: {
      name?: string;
      description?: string;
      timezone?: string;
    }) => apiClient.put(`/households/${householdId}`, data),
    
    inviteMember: (householdId: string, email: string, role: 'admin' | 'member' | 'viewer') =>
      apiClient.post(`/households/${householdId}/members`, { email, role }),
    
    removeMember: (householdId: string, userId: string) =>
      apiClient.delete(`/households/${householdId}/members/${userId}`),
    
    updateMemberRole: (householdId: string, userId: string, role: 'admin' | 'member' | 'viewer') =>
      apiClient.put(`/households/${householdId}/members/${userId}/role`, { role }),
  },
  
  // Inventory endpoints
  items: {
    list: (householdId: string, params?: {
      location?: 'fridge' | 'freezer' | 'pantry';
      category?: string;
      status?: 'fresh' | 'expiring_soon' | 'expired';
      search?: string;
      page?: number;
      pageSize?: number;
      sortBy?: 'name' | 'expirationDate' | 'createdAt';
      sortOrder?: 'asc' | 'desc';
    }) => apiClient.get(`/households/${householdId}/items`, { params }),
    
    get: (householdId: string, itemId: string) =>
      apiClient.get(`/households/${householdId}/items/${itemId}`),
    
    create: (householdId: string, data: {
      name: string;
      quantity: number;
      unit?: string;
      location: 'fridge' | 'freezer' | 'pantry';
      category?: string;
      expirationDate?: string;
      bestBeforeDate?: string;
      purchaseDate?: string;
      price?: number;
      notes?: string;
    }) => apiClient.post(`/households/${householdId}/items`, data),
    
    update: (householdId: string, itemId: string, data: any) =>
      apiClient.put(`/households/${householdId}/items/${itemId}`, data),
    
    delete: (householdId: string, itemId: string) =>
      apiClient.delete(`/households/${householdId}/items/${itemId}`),
    
    consume: (householdId: string, itemId: string, quantity?: number) =>
      apiClient.post(`/households/${householdId}/items/${itemId}/consume`, { quantity }),
  },
};