import { API_ENDPOINTS } from '@/constants/API';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

/**
 * Initiates Google Calendar authentication flow
 * Opens browser for user to grant Google Calendar access
 * Returns true if successful, false otherwise
 */
export const requestGoogleCalendarAccess = async (): Promise<boolean> => {
  try {
    console.log('📅 Requesting Google Calendar access...');
    
    // Get the current auth token to identify the user
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return false;
    }

    // Step 1: Get Google Calendar OAuth URL from backend using new endpoint
    // Add platform=mobile parameter so backend knows to use mobile callback
    console.log('📡 Fetching OAuth URL from:', `${API_ENDPOINTS.GOOGLE_CALENDAR_AUTH_URL}?platform=mobile`);
    const response = await fetch(`${API_ENDPOINTS.GOOGLE_CALENDAR_AUTH_URL}?platform=mobile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Failed to get Google Calendar OAuth URL:', response.status);
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error details:', errorData);
      return false;
    }

    const responseData = await response.json();
    console.log('📋 Response data:', responseData);
    
    const authUrl = responseData.url || responseData.authUrl;
    if (!authUrl) {
      console.error('❌ No URL in response');
      return false;
    }

    console.log('🔗 Opening Google Calendar authorization...');
    
    // Step 2: Open OAuth in browser
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl, 
      'faithfulcompanion://google-calendar-callback'
    );
    
    console.log('✅ Browser result received');
    console.log('🔍 Result type:', result.type);
    
    if (result.type === 'success') {
      console.log('✅ Google Calendar access granted');
      console.log('🔗 Full Result URL:', result.url);
      
      // Extract data from the callback URL
      if (result.url) {
        try {
          const { queryParams } = Linking.parse(result.url);
          console.log('📋 Parsed query params:', queryParams);
          
          const code = queryParams?.code as string;
          const state = queryParams?.state as string;
          
          // If we have a code, send it to the mobile callback endpoint
          if (code) {
            console.log('📤 Sending code to backend via mobile callback...');
            const callbackResponse = await fetch(
              `${API_ENDPOINTS.GOOGLE_CALENDAR_MOBILE_CALLBACK}?code=${code}&state=${state || ''}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (callbackResponse.ok) {
              const callbackData = await callbackResponse.json();
              console.log('✅ Calendar connected successfully:', callbackData);
              
              // If backend returns a new token, update it
              if (callbackData.token) {
                console.log('💾 Updating auth token...');
                await SecureStore.setItemAsync('authToken', callbackData.token);
              }
              
              return true;
            } else {
              console.error('❌ Failed to complete callback:', callbackResponse.status);
              return false;
            }
          }
          
          // Fallback: check if token is in URL (old flow)
          const newToken = queryParams?.token as string;
          if (newToken) {
            console.log('💾 Storing updated auth token...');
            await SecureStore.setItemAsync('authToken', newToken);
            console.log('✅ New token stored securely');
            
            // Update user data if provided
            const name = queryParams?.name as string;
            const email = queryParams?.email as string;
            const picture = queryParams?.picture as string;
            const userId = queryParams?.userId as string;
            
            if (name && email && userId) {
              const existingUserData = await SecureStore.getItemAsync('userData');
              const userData = existingUserData ? JSON.parse(existingUserData) : {};
              
              const updatedUserData = {
                ...userData,
                name,
                email,
                picture,
                userId: parseInt(userId)
              };
              
              console.log('💾 Updating user data...');
              await SecureStore.setItemAsync('userData', JSON.stringify(updatedUserData));
              console.log('✅ User data updated');
            }
            
            return true;
          }
        } catch (parseError) {
          console.error('⚠️ Error parsing callback URL:', parseError);
          return false;
        }
      }
      
      console.log('ℹ️ No data in callback URL, assuming backend handled it');
      return true;
    } else {
      console.log('❌ Google Calendar authorization cancelled or failed');
      console.log('🔍 Result type:', result.type);
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting Google Calendar access:', error);
    return false;
  }
};

/**
 * Checks if the error is related to missing Google Calendar access
 */
export const isGoogleCalendarAccessError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.error || '';
  return errorMessage.toLowerCase().includes('google calendar access not granted') ||
         errorMessage.toLowerCase().includes('please authenticate with google');
};

/**
 * Checks if the current user has Google Calendar access
 * Returns true if the user has access, false otherwise
 */
export const checkGoogleCalendarAccess = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking Google Calendar access...');
    
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return false;
    }

    // Check with backend if user has Google Calendar access using new endpoint
    console.log('📡 Checking status at:', API_ENDPOINTS.GOOGLE_CALENDAR_STATUS_NEW);
    const response = await fetch(API_ENDPOINTS.GOOGLE_CALENDAR_STATUS_NEW, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Failed to check Google Calendar status:', response.status);
      // Fallback to old endpoint
      console.log('🔄 Trying fallback endpoint...');
      const fallbackResponse = await fetch(API_ENDPOINTS.GOOGLE_CALENDAR_STATUS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const hasAccess = fallbackData.hasCalendarAccess === true || fallbackData.connected === true;
        console.log(hasAccess ? '✅ User has Google Calendar access (fallback)' : '❌ User does not have Google Calendar access (fallback)');
        return hasAccess;
      }
      
      return false;
    }

    const data = await response.json();
    console.log('📋 Status response:', data);
    
    // Check multiple possible response formats
    // Note: Don't check data.success alone - that just means the API call succeeded
    const hasAccess = data.hasCalendarAccess === true || 
                      data.connected === true || 
                      data.calendarConnected === true ||
                      data.googleMeetAccess === true ||
                      data.status === 'connected';
    
    console.log(hasAccess ? '✅ User has Google Calendar access' : '❌ User does not have Google Calendar access');
    return hasAccess;
  } catch (error) {
    console.error('❌ Error checking Google Calendar access:', error);
    // If there's an error checking, we'll let them try and catch the error later
    return false;
  }
};

/**
 * Disconnects Google Calendar access
 * Returns true if successful, false otherwise
 */
export const disconnectGoogleCalendar = async (): Promise<boolean> => {
  try {
    console.log('🔌 Disconnecting Google Calendar...');
    
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return false;
    }

    const response = await fetch(API_ENDPOINTS.GOOGLE_CALENDAR_DISCONNECT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Failed to disconnect Google Calendar:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('✅ Google Calendar disconnected:', data);
    return true;
  } catch (error) {
    console.error('❌ Error disconnecting Google Calendar:', error);
    return false;
  }
};

