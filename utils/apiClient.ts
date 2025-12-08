import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

/**
 * Centralized API client with automatic authentication error handling
 * Automatically redirects to login on 401/403 errors (expired/invalid tokens)
 */

interface ApiClientOptions extends RequestInit {
  requiresAuth?: boolean;
  skipAuthRedirect?: boolean;
}

export class AuthenticationError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Makes an authenticated API request with automatic error handling
 * @param url - The API endpoint URL
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns The response object
 */
export const apiClient = async (
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> => {
  const {
    requiresAuth = true,
    skipAuthRedirect = false,
    headers = {},
    ...fetchOptions
  } = options;

  try {
    // Get auth token if required
    let token: string | null = null;
    if (requiresAuth) {
      token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        if (!skipAuthRedirect) {
          await handleAuthenticationFailure('No authentication token found');
        }
        throw new AuthenticationError('Not authenticated', 401);
      }
    }

    // Build headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth header if token exists
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Handle authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      
      if (!skipAuthRedirect) {
        const errorBody = await response.clone().text();
        await handleAuthenticationFailure(
          `Authentication failed: ${response.status} - ${errorBody}`
        );
      }
      
      throw new AuthenticationError(
        `Authentication failed: ${response.status}`,
        response.status
      );
    }

    return response;
  } catch (error) {
    // If it's already an AuthenticationError, re-throw it
    if (error instanceof AuthenticationError) {
      throw error;
    }

    // Re-throw other errors
    throw error;
  }
};

/**
 * Handles authentication failures by clearing tokens and redirecting to login
 */
const handleAuthenticationFailure = async (reason: string) => {
  try {
    // Clear auth token
    await SecureStore.deleteItemAsync('authToken');
    
    // Clear user data
    await SecureStore.deleteItemAsync('userData');
    
    // Use setTimeout to ensure state is cleared before navigation
    setTimeout(() => {
      router.replace('/(main)/onboarding');
    }, 100);
    
  } catch (error) {
    // Silently handle errors during cleanup
  }
};

/**
 * Convenience method for GET requests
 */
export const apiGet = async (url: string, options: ApiClientOptions = {}) => {
  return apiClient(url, { ...options, method: 'GET' });
};

/**
 * Convenience method for POST requests
 */
export const apiPost = async (
  url: string,
  data?: any,
  options: ApiClientOptions = {}
) => {
  return apiClient(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Convenience method for PUT requests
 */
export const apiPut = async (
  url: string,
  data?: any,
  options: ApiClientOptions = {}
) => {
  return apiClient(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Convenience method for DELETE requests
 */
export const apiDelete = async (url: string, options: ApiClientOptions = {}) => {
  return apiClient(url, { ...options, method: 'DELETE' });
};

/**
 * Helper to parse JSON response with error handling
 */
export const parseJsonResponse = async <T = any>(response: Response): Promise<T> => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from server');
    }
    throw error;
  }
};

