import { API_ENDPOINTS } from '@/constants/API';
import { apiGet, AuthenticationError, parseJsonResponse } from './apiClient';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export const checkProfileCompletion = async (): Promise<ProfileCompletionStatus> => {
  try {
    console.log('🔍 Starting profile completion check...');

    const apiUrl = API_ENDPOINTS.USERS_PROFILE_COMPLETION;
    console.log('🌐 Making API call to:', apiUrl);

    // Use the new API client - it will automatically handle 403 errors
    const response = await apiGet(apiUrl, { 
      requiresAuth: true,
      skipAuthRedirect: false // Allow automatic redirect on 403
    });

    const result = await parseJsonResponse(response);
    console.log('✅ Profile completion status:', result);

    return {
      isComplete: result.data?.isComplete || false,
      missingFields: result.data?.missingFields || [],
      completionPercentage: result.data?.completionPercentage || 0
    };
  } catch (error) {
    console.error('❌ ERROR DETAILS:');
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('❌ Full error object:', error);
    
    // If it's an authentication error, let it propagate (user will be redirected)
    if (error instanceof AuthenticationError) {
      console.log('🔐 Authentication error - user will be redirected to login');
      throw error;
    }
    
    if (error instanceof Error) {
      console.error('❌ Error stack:', error.stack);
      
      // Check for specific network errors
      if (error.message.includes('Network request failed')) {
        console.error('🌐 NETWORK ERROR DETECTED');
        console.error('🌐 This usually means:');
        console.error('🌐 1. Server is down or unreachable');
        console.error('🌐 2. Network connectivity issues');
        console.error('🌐 3. Firewall/proxy blocking the request');
        console.error('🌐 4. SSL/TLS certificate issues');
        console.error('🌐 5. API endpoint does not exist');
      }
    }
    
    return {
      isComplete: false,
      missingFields: ['api_error'],
      completionPercentage: 0
    };
  }
};
