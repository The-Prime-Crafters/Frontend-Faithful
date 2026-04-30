// API Configuration
// You can change the API_BASE_URL here or use environment variables

// Default API base URL - change this to your desired URL
export const API_BASE_URL = 'https://faithfulcompanion.ai';

// Alternative API URLs (if needed)
export const API_BASE_URL_ALT = 'https://faithfulcompanion.ai';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  GOOGLE_AUTH_URL: `${API_BASE_URL}/api/auth/google/url`,
  GOOGLE_CALENDAR_STATUS: `${API_BASE_URL}/api/auth/google/calendar-status`,
  
  // Google Calendar endpoints
  GOOGLE_CALENDAR_AUTH_URL: `${API_BASE_URL}/api/auth/google-calendar/url`,
  GOOGLE_CALENDAR_CALLBACK: `${API_BASE_URL}/api/auth/google-calendar/callback`,
  GOOGLE_CALENDAR_MOBILE_CALLBACK: `${API_BASE_URL}/api/auth/google-calendar/mobile-callback`,
  GOOGLE_CALENDAR_CONNECT: `${API_BASE_URL}/api/auth/google-calendar/connect`,
  GOOGLE_CALENDAR_STATUS_NEW: `${API_BASE_URL}/api/auth/google-calendar/status`,
  GOOGLE_CALENDAR_DISCONNECT: `${API_BASE_URL}/api/auth/google-calendar/disconnect`,
  
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  
  // Study groups endpoints
  STUDY_GROUPS: `${API_BASE_URL}/api/study-groups`,
  STUDY_GROUPS_PUBLIC: `${API_BASE_URL}/api/study-groups/public`,
  STUDY_GROUPS_CREATE: `${API_BASE_URL}/api/study-groups/create`,
  STUDY_GROUPS_CREATE_RECURRING: `${API_BASE_URL}/api/study-groups/create-recurring`,
  STUDY_GROUPS_MY_JOIN_REQUESTS: `${API_BASE_URL}/api/study-groups/my-join-requests`,
  
  // Bible endpoints
  DAILY_VERSE: `${API_BASE_URL}/api/bible/daily-verse`,
  DAILY_PRAYER: `${API_BASE_URL}/api/bible/daily-prayer`,
  REFLECTION_THEMES: `${API_BASE_URL}/api/bible/reflection-themes`,
  DAILY_REFLECTION: `${API_BASE_URL}/api/bible/daily-reflection`,
  WEEKLY_STUDY_PLAN: `${API_BASE_URL}/api/bible/weekly-study-plan`,
  PRAYER_NOTES: `${API_BASE_URL}/api/bible/prayer-notes`,
  DAILY_ACTIVITY: `${API_BASE_URL}/api/bible/daily-activity`,
  
  // Bible Gateway API endpoints
  BIBLE_VERSIONS: `${API_BASE_URL}/api/bible/versions`,
  BIBLE_TRANSLATION: (bible: string) => `${API_BASE_URL}/api/bible/translation/${bible}`,
  BIBLE_PASSAGE: (bible: string, passage: string) => `${API_BASE_URL}/api/bible/passage/${bible}/${encodeURIComponent(passage)}`,
  BIBLE_SEARCH: (bible: string, query: string) => `${API_BASE_URL}/api/bible/search/${bible}/${encodeURIComponent(query)}`,
  BIBLE_USER_VERSION: `${API_BASE_URL}/api/bible/user-bible-version`,
  
  // User Management
  USERS_PROFILE: `${API_BASE_URL}/api/users/profile`,
  USERS_PROFILE_PICTURE: `${API_BASE_URL}/api/users/profile/picture`,
  USERS_EMAIL: `${API_BASE_URL}/api/users/email`,
  USERS_PREFERENCES: `${API_BASE_URL}/api/users/preferences`,
  USERS_PROFILE_COMPLETION: `${API_BASE_URL}/api/users/profile-completion`,
  USERS_DELETE_ACCOUNT: `${API_BASE_URL}/api/users/account`,
  
  // App Session & Tracking
  APP_SESSION: `${API_BASE_URL}/api/users/app-session`,
  
  // Prayer System
  PRAYER_REQUESTS: `${API_BASE_URL}/api/prayer/requests`,
  PRAYER_MY_REQUESTS: `${API_BASE_URL}/api/prayer/my-requests`,
  PRAYER_CATEGORIES: `${API_BASE_URL}/api/prayer/categories`,
  PRAYER_STATS: `${API_BASE_URL}/api/prayer/stats`,
  PRAYER_REPLY: (responseId: number) => `${API_BASE_URL}/api/prayer/responses/${responseId}/reply`,
  PRAYER_DELETE: (requestId: number) => `${API_BASE_URL}/api/prayer/requests/${requestId}`,
  
  // Helper functions
  getStudyGroup: (groupId: string) => `${API_BASE_URL}/api/study-groups/${groupId}`,
  getStudyGroupJoinRequests: (groupId: string) => `${API_BASE_URL}/api/study-groups/${groupId}/join-requests`,
  getStudyGroupJoinRequestRespond: (groupId: string, requestId: string) => 
    `${API_BASE_URL}/api/study-groups/${groupId}/join-requests/${requestId}/respond`,
  getStudyGroupRequestJoin: (groupId: string) => 
    `${API_BASE_URL}/api/study-groups/${groupId}/request-join`,
};
