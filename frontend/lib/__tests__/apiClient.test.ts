import { apiClient, tokenManager } from '../api-client';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

describe('API Client Token Refresh', () => {
  let mock: MockAdapter;
  let axiosMock: MockAdapter;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  
  beforeEach(() => {
    // Create mock adapter for apiClient
    mock = new MockAdapter(apiClient);
    // Create mock adapter for axios (for refresh endpoint)
    axiosMock = new MockAdapter(axios);
    // Clear localStorage
    localStorage.clear();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mock.restore();
    axiosMock.restore();
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('should automatically refresh token on 401 error and retry the original request', async () => {
    // Test Case ID: TC-FE-1.5
    // Arrange
    const mockAccessToken = 'expired-access-token';
    const mockRefreshToken = 'valid-refresh-token';
    const newAccessToken = 'new-access-token';
    const newRefreshToken = 'new-refresh-token';
    
    // Set up initial tokens
    tokenManager.setTokens(mockAccessToken, mockRefreshToken, 900);
    
    // Track API calls
    let householdsCallCount = 0;
    let refreshCallCount = 0;
    
    // Mock the initial request to /households that returns 401 on first call
    mock.onGet('/households').reply(() => {
      householdsCallCount++;
      if (householdsCallCount === 1) {
        // First call returns 401
        return [401, { message: 'Unauthorized' }];
      } else {
        // Second call (after refresh) returns success
        return [200, {
          households: [
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'Home',
              role: 'admin',
              memberCount: 4,
            }
          ],
          total: 1
        }];
      }
    });
    
    // Mock the refresh token endpoint on the axios instance
    axiosMock.onPost(`${API_BASE_URL}/auth/refresh`).reply((config) => {
      refreshCallCount++;
      const data = JSON.parse(config.data);
      expect(data.refreshToken).toBe(mockRefreshToken);
      
      return [200, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900
      }];
    });
    
    // Act
    const response = await apiClient.get('/households');
    
    // Assert
    // Verify that the refresh endpoint was called after the initial 401
    expect(refreshCallCount).toBe(1);
    
    // Verify that the original request was successfully retried with the new token
    expect(householdsCallCount).toBe(2);
    
    // Verify that the response is successful
    expect(response.status).toBe(200);
    expect(response.data.households).toBeDefined();
    expect(response.data.households[0].name).toBe('Home');
    
    // Verify that new tokens were stored
    expect(tokenManager.getAccessToken()).toBe(newAccessToken);
    expect(tokenManager.getRefreshToken()).toBe(newRefreshToken);
  });

  it('should clear tokens and redirect when refresh fails', async () => {
    // Arrange
    const mockAccessToken = 'expired-access-token';
    const mockRefreshToken = 'invalid-refresh-token';
    
    // Set up initial tokens
    tokenManager.setTokens(mockAccessToken, mockRefreshToken, 900);
    
    // Mock window.location.href
    const originalHref = window.location.href;
    delete (window as any).location;
    window.location = { href: '' } as any;
    
    // Mock request that returns 401
    mock.onGet('/households').reply(401, { message: 'Unauthorized' });
    
    // Mock refresh endpoint to return 401 (invalid refresh token)
    axiosMock.onPost(`${API_BASE_URL}/auth/refresh`).reply(401, {
      message: 'Invalid or expired refresh token'
    });
    
    // Act & Assert
    try {
      await apiClient.get('/households');
      // Should not reach here
      fail('Expected request to throw an error');
    } catch (error: any) {
      // Verify that tokens were cleared
      expect(tokenManager.getAccessToken()).toBeNull();
      expect(tokenManager.getRefreshToken()).toBeNull();
      
      // Verify that redirect to login was triggered
      expect(window.location.href).toBe('/login');
    } finally {
      // Restore window.location
      delete (window as any).location;
      window.location = originalHref as any;
    }
  });

  it('should queue multiple requests during token refresh', async () => {
    // Arrange
    const mockAccessToken = 'expired-access-token';
    const mockRefreshToken = 'valid-refresh-token';
    const newAccessToken = 'new-access-token';
    const newRefreshToken = 'new-refresh-token';
    
    // Set up initial tokens
    tokenManager.setTokens(mockAccessToken, mockRefreshToken, 900);
    
    // Track call counts
    let householdsCallCount = 0;
    let itemsCallCount = 0;
    let refreshCallCount = 0;
    
    // Mock multiple endpoints that return 401 on first call
    mock.onGet('/households').reply(() => {
      householdsCallCount++;
      if (householdsCallCount === 1) {
        return [401, { message: 'Unauthorized' }];
      }
      return [200, { households: [], total: 0 }];
    });
    
    mock.onGet(/\/households\/.*\/items/).reply(() => {
      itemsCallCount++;
      if (itemsCallCount === 1) {
        return [401, { message: 'Unauthorized' }];
      }
      return [200, { items: [], total: 0 }];
    });
    
    // Mock the refresh token endpoint
    axiosMock.onPost(`${API_BASE_URL}/auth/refresh`).reply(() => {
      refreshCallCount++;
      // Add delay to simulate network latency
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([200, {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900
          }]);
        }, 50);
      });
    });
    
    // Act - Make multiple simultaneous requests
    const [response1, response2] = await Promise.all([
      apiClient.get('/households'),
      apiClient.get('/households/123/items')
    ]);
    
    // Assert
    // Verify that refresh was called only once despite multiple 401s
    expect(refreshCallCount).toBe(1);
    
    // Verify both original requests were retried and succeeded
    expect(householdsCallCount).toBe(2);
    expect(itemsCallCount).toBe(2);
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    
    // Verify tokens were updated
    expect(tokenManager.getAccessToken()).toBe(newAccessToken);
    expect(tokenManager.getRefreshToken()).toBe(newRefreshToken);
  });

  it('should not attempt refresh for auth endpoints', async () => {
    // Arrange
    const mockAccessToken = 'expired-access-token';
    const mockRefreshToken = 'valid-refresh-token';
    
    // Set up initial tokens
    tokenManager.setTokens(mockAccessToken, mockRefreshToken, 900);
    
    // Mock window.location.href
    const originalHref = window.location.href;
    delete (window as any).location;
    window.location = { href: '' } as any;
    
    // Track refresh attempts
    let refreshCallCount = 0;
    
    // Mock auth endpoint returning 401
    mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });
    
    // Mock refresh endpoint (should not be called)
    axiosMock.onPost(`${API_BASE_URL}/auth/refresh`).reply(() => {
      refreshCallCount++;
      return [200, {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresIn: 900
      }];
    });
    
    // Act & Assert
    try {
      await apiClient.post('/auth/login', { email: 'test@test.com', password: 'wrong' });
      fail('Expected request to throw an error');
    } catch (error: any) {
      // Verify that refresh was NOT attempted for auth endpoint
      expect(refreshCallCount).toBe(0);
      
      // Verify that tokens were cleared
      expect(tokenManager.getAccessToken()).toBeNull();
      expect(tokenManager.getRefreshToken()).toBeNull();
      
      // Verify redirect to login
      expect(window.location.href).toBe('/login');
    } finally {
      // Restore window.location
      delete (window as any).location;
      window.location = originalHref as any;
    }
  });
});