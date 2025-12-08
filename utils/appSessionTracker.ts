import { API_ENDPOINTS } from '@/constants/API';
import * as SecureStore from 'expo-secure-store';

interface Activity {
  type: 'daily_verse' | 'daily_prayer' | 'daily_reflection' | 'ai_chat' | 'community_engagement';
  timestamp: string;
  xpEarned: number;
  metadata?: {
    action?: 'read' | 'listen'; // For daily content: read or listen
    duration?: number;
    messageLength?: number; // For AI chat
    type?: string; // For community: prayer_post, prayer_response, etc.
    [key: string]: any;
  };
}

interface SessionData {
  sessionStartTime: string;
  sessionEndTime?: string;
  durationSeconds: number;
  timezone: string;
  activities?: Activity[];
}

interface DailyGoal {
  type: string;
  completed: boolean;
}

interface DailyGoals {
  totalGoals: number;
  completedGoals: number;
  progressPercentage: number;
  goals: DailyGoal[];
}

interface Milestone {
  milestone_days: number;
  milestone_name: string;
  achieved_at: string;
  reward_granted: boolean;
}

interface SessionResponse {
  success: boolean;
  data: {
    // Usage Statistics
    totalSessions: number;
    totalTimeSpent: number;              // seconds
    totalTimeFormatted: string;          // human readable
    todayTimeSpent: number;              // seconds
    todayTimeFormatted: string;          // human readable
    lastOpenedAt: string;
    averageSessionDuration?: number;
    
    // Streak Data
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    lastActiveDate: string;
    freezesAvailable: number;
    streakMessage: string;
    isNewStreak?: boolean;
    streakStartDate?: string;
    
    // XP & Gamification
    totalXP: number;
    todayXP: number;
    level: number;
    xpToNextLevel: number;
    
    // Daily Goals
    dailyGoals: DailyGoals;
    
    // Milestone Achievements
    milestones: Milestone[];
  };
  message?: string;
}

class AppSessionTracker {
  private static instance: AppSessionTracker;
  private sessionStartTime: Date | null = null;
  private backgroundTime: Date | null = null;
  private activities: Activity[] = [];
  private isEndingSession: boolean = false; // Prevent multiple simultaneous calls
  private lastSyncAttempt: number = 0; // Track last sync time
  private minSyncInterval: number = 30000; // Minimum 30 seconds between syncs
  private retryQueue: SessionData[] = []; // Queue for failed sessions

  private constructor() {
    console.log('📱 AppSessionTracker initialized');
    this.loadRetryQueue(); // Load any previously failed sessions
  }

  public static getInstance(): AppSessionTracker {
    if (!AppSessionTracker.instance) {
      AppSessionTracker.instance = new AppSessionTracker();
    }
    return AppSessionTracker.instance;
  }

  /**
   * Load retry queue from storage
   */
  private async loadRetryQueue() {
    try {
      const stored = await SecureStore.getItemAsync('sessionRetryQueue');
      if (stored) {
        this.retryQueue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.retryQueue.length} failed sessions from queue`);
      }
    } catch (error) {
      console.error('❌ Error loading retry queue:', error);
    }
  }

  /**
   * Save retry queue to storage
   */
  private async saveRetryQueue() {
    try {
      await SecureStore.setItemAsync('sessionRetryQueue', JSON.stringify(this.retryQueue));
      console.log(`💾 Saved ${this.retryQueue.length} sessions to retry queue`);
    } catch (error) {
      console.error('❌ Error saving retry queue:', error);
    }
  }

  /**
   * Add session to retry queue
   */
  private async addToRetryQueue(sessionData: SessionData) {
    this.retryQueue.push(sessionData);
    // Keep only last 10 failed sessions to avoid memory issues
    if (this.retryQueue.length > 10) {
      this.retryQueue = this.retryQueue.slice(-10);
    }
    await this.saveRetryQueue();
    console.log(`📥 Added session to retry queue (${this.retryQueue.length} pending)`);
  }

  /**
   * Process retry queue - try to send failed sessions
   * Only process once per hour to avoid hammering the API
   */
  private async processRetryQueue() {
    if (this.retryQueue.length === 0) return;

    // Check if we should process the queue (once per hour)
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const lastRetryTime = await SecureStore.getItemAsync('lastRetryQueueProcess');
    const lastRetry = lastRetryTime ? parseInt(lastRetryTime) : 0;
    
    if (now - lastRetry < oneHour) {
      console.log(`⏱️ Skipping retry queue - will retry in ${Math.round((oneHour - (now - lastRetry)) / 60000)} minutes`);
      return;
    }

    console.log(`🔄 Processing ${this.retryQueue.length} queued sessions...`);
    
    const sessionsToRetry = [...this.retryQueue];
    this.retryQueue = [];
    
    for (const sessionData of sessionsToRetry) {
      const success = await this.sendSessionToBackend(
        sessionData.durationSeconds,
        new Date(sessionData.sessionEndTime || Date.now()),
        sessionData.activities
      );
      
      // If failed again, add back to queue (max 10 items)
      if (!success && this.retryQueue.length < 10) {
        this.retryQueue.push(sessionData);
      }
      
      // Add delay between retries to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
    
    await this.saveRetryQueue();
    await SecureStore.setItemAsync('lastRetryQueueProcess', now.toString());
    
    if (this.retryQueue.length > 0) {
      console.log(`⚠️ ${this.retryQueue.length} sessions still pending`);
    } else {
      console.log('✅ All queued sessions processed successfully');
    }
  }
  public trackActivity(
    type: Activity['type'],
    xpEarned: number,
    metadata?: any
  ) {
    const activity: Activity = {
      type,
      timestamp: new Date().toISOString(),
      xpEarned,
      metadata,
    };

    this.activities.push(activity);
    console.log(`✅ Activity tracked: ${type} (+${xpEarned} XP)`);
    console.log(`📊 Total activities this session: ${this.activities.length}`);
  }

  /**
   * Get all activities for this session
   */
  public getActivities(): Activity[] {
    return [...this.activities];
  }

  /**
   * Clear activities (called after successful sync)
   */
  private clearActivities() {
    this.activities = [];
    console.log('🧹 Activities cleared');
  }

  /**
   * Start a new session when app opens
   */
  public async startSession() {
    try {
      this.sessionStartTime = new Date();
      console.log('🚀 Session started at:', this.sessionStartTime.toISOString());

      // Don't process retry queue on startup - wait for scheduled time
      // This prevents hammering the API with failed requests
      console.log('⏱️ Retry queue will be processed later (not on startup)');

      // Fetch latest streak data from backend (with rate limiting)
      const now = Date.now();
      if (now - this.lastSyncAttempt > this.minSyncInterval) {
        await this.fetchLatestStreakData();
        this.lastSyncAttempt = now;
      } else {
        console.log('⏱️ Skipping data fetch - too soon since last sync');
      }
    } catch (error) {
      console.error('❌ Error starting session:', error);
    }
  }

  /**
   * Fetch all session data from backend: usage stats, streak, XP, daily goals, milestones
   */
  private async fetchLatestStreakData() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('⚠️ No auth token, using cached data');
        return;
      }

      console.log('📥 Fetching all session data from backend...');
      console.log('📡 Endpoint:', API_ENDPOINTS.APP_SESSION);

      const response = await fetch(API_ENDPOINTS.APP_SESSION, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response Status:', response.status);

      if (response.ok) {
        const result: SessionResponse = await response.json();
        
        // Debug: Log the FULL response
        console.log('📦 FULL Backend Response (GET):', JSON.stringify(result.data, null, 2));
        
        console.log('✅ Session data fetched successfully');
        
        // Log Usage Statistics
        console.log('\n📊 USAGE STATISTICS:');
        console.log('=====================');
        console.log('Total Sessions:', result.data.totalSessions);
        console.log('Total Time Spent (seconds):', result.data.totalTimeSpent);
        console.log('Total Time Spent (formatted):', result.data.totalTimeFormatted);
        console.log('Today Time Spent (seconds):', result.data.todayTimeSpent);
        console.log('Today Time Spent (formatted):', result.data.todayTimeFormatted);
        console.log('Last Opened At:', result.data.lastOpenedAt);
        
        // Log Streak Data
        console.log('\n🔥 STREAK DATA:');
        console.log('================');
        console.log('Current Streak:', result.data.currentStreak);
        console.log('Longest Streak:', result.data.longestStreak);
        console.log('Total Active Days:', result.data.totalActiveDays);
        console.log('Last Active Date:', result.data.lastActiveDate);
        console.log('Freezes Available:', result.data.freezesAvailable);
        console.log('Streak Message:', result.data.streakMessage);
        
        // Log XP & Gamification
        console.log('\n⭐ XP & GAMIFICATION:');
        console.log('======================');
        console.log('Total XP:', result.data.totalXP);
        console.log('Today XP:', result.data.todayXP);
        console.log('Level:', result.data.level);
        console.log('XP to Next Level:', result.data.xpToNextLevel);
        
        // Check if XP data is missing
        if (result.data.totalXP === undefined || result.data.level === undefined) {
          console.log('⚠️ WARNING: XP data is undefined! Backend may not be returning XP fields.');
          console.log('⚠️ Expected fields: totalXP, todayXP, level, xpToNextLevel');
        }
        
        // Log Daily Goals
        if (result.data.dailyGoals) {
          console.log('\n🎯 DAILY GOALS:');
          console.log('================');
          console.log(`Progress: ${result.data.dailyGoals.completedGoals}/${result.data.dailyGoals.totalGoals} (${result.data.dailyGoals.progressPercentage}%)`);
          console.log('Goals:', result.data.dailyGoals.goals.map(g => 
            `${g.type}: ${g.completed ? '✅' : '❌'}`
          ).join(', '));
        } else {
          console.log('\n⚠️ WARNING: Daily goals data is undefined!');
        }
        
        // Log Milestones
        if (result.data.milestones && result.data.milestones.length > 0) {
          console.log('\n🏅 MILESTONES:');
          console.log('===============');
          result.data.milestones.forEach(m => {
            console.log(`- ${m.milestone_name} (${m.milestone_days} days): Achieved at ${m.achieved_at}`);
          });
        } else {
          console.log('\n⚠️ No milestones found');
        }

        // Cache the complete data
        await this.cacheSessionData(result.data);
      } else {
        const errorText = await response.text();
        console.log('⚠️ Could not fetch session data:', response.status);
        console.log('Error:', errorText);
        console.log('Using cached data instead');
      }
    } catch (error) {
      console.error('❌ Error fetching session data:', error);
      // Continue silently - will use cached data
    }
  }

  /**
   * End session when app closes/goes to background
   */
  public async endSession() {
    try {
      // Prevent multiple simultaneous calls
      if (this.isEndingSession) {
        console.log('⚠️ Session end already in progress, skipping...');
        return;
      }

      if (!this.sessionStartTime) {
        console.log('⚠️ No active session to end');
        return;
      }

      this.isEndingSession = true;

      const sessionEnd = new Date();
      const durationSeconds = Math.floor((sessionEnd.getTime() - this.sessionStartTime.getTime()) / 1000);

      // Only send if duration is positive (backend requirement)
      if (durationSeconds <= 0) {
        console.log('⚠️ Session duration too short, skipping backend sync');
        this.sessionStartTime = null;
        this.isEndingSession = false;
        return;
      }

      console.log('⏹️ Session ended');
      console.log('⏱️ Duration:', durationSeconds, 'seconds');
      console.log('📊 Activities tracked:', this.activities.length);

      // Send session data to backend (with rate limiting)
      const now = Date.now();
      if (now - this.lastSyncAttempt > this.minSyncInterval) {
        await this.sendSessionToBackend(durationSeconds, sessionEnd, this.activities);
        this.lastSyncAttempt = now;
      } else {
        console.log('⏱️ Rate limit: Queueing session for later sync');
        // Add to queue instead of sending immediately
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await this.addToRetryQueue({
          sessionStartTime: this.sessionStartTime.toISOString(),
          sessionEndTime: sessionEnd.toISOString(),
          durationSeconds,
          timezone,
          activities: this.activities.length > 0 ? this.activities : undefined
        });
      }

      // Reset session
      this.sessionStartTime = null;
      this.isEndingSession = false;
    } catch (error) {
      console.error('❌ Error ending session:', error);
      this.isEndingSession = false;
    }
  }

  /**
   * Handle app going to background
   */
  public handleAppStateChange(nextAppState: string) {
    if (nextAppState === 'active') {
      // App came to foreground
      console.log('✨ App came to foreground');
      if (this.backgroundTime) {
        const now = new Date();
        const backgroundDuration = Math.floor((now.getTime() - this.backgroundTime.getTime()) / 1000);
        console.log('Background duration:', backgroundDuration, 'seconds');
        this.backgroundTime = null;
      }
      
      // Start new session
      this.startSession();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background
      console.log('🌙 App went to background');
      this.backgroundTime = new Date();
      
      // End current session
      this.endSession();
    }
  }

  /**
   * Send session data to backend with retry logic and rate limit handling
   * Returns true if successful, false otherwise
   */
  private async sendSessionToBackend(
    durationSeconds: number, 
    sessionEnd: Date,
    activities?: Activity[]
  ): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('⚠️ No auth token found, skipping session sync');
        return false;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const sessionStart = this.sessionStartTime || new Date(sessionEnd.getTime() - (durationSeconds * 1000));

      const payload: SessionData = {
        sessionStartTime: sessionStart.toISOString(),
        sessionEndTime: sessionEnd.toISOString(),
        durationSeconds,
        timezone,
        activities: activities || (this.activities.length > 0 ? this.activities : undefined)
      };

      console.log('📤 Sending session to backend:', {
        duration: durationSeconds,
        activities: payload.activities?.length || 0
      });
      console.log('📡 Endpoint:', API_ENDPOINTS.APP_SESSION);

      const response = await fetch(API_ENDPOINTS.APP_SESSION, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result: SessionResponse = await response.json();
        
        // Debug: Log the FULL response to see what we're actually getting
        console.log('📦 FULL Backend Response:', JSON.stringify(result.data, null, 2));
        
        console.log('✅ Session tracked successfully');
        console.log('📊 Backend Response Summary:');
        console.log('  - Current Streak:', result.data.currentStreak, 'days');
        console.log('  - Total Sessions:', result.data.totalSessions);
        console.log('  - Total Time:', result.data.totalTimeFormatted);
        console.log('  - Today Time:', result.data.todayTimeFormatted);
        console.log('  - Level:', result.data.level, '| XP:', result.data.totalXP);
        console.log('  - Today XP:', result.data.todayXP);
        console.log('  - XP to Next Level:', result.data.xpToNextLevel);
        console.log('  - Daily Goals:', `${result.data.dailyGoals?.completedGoals || 0}/${result.data.dailyGoals?.totalGoals || 0}`);
        console.log(`🔥 ${result.data.streakMessage}`);
        
        if (result.data.isNewStreak) {
          console.log('🎉 NEW STREAK DAY! Keep going!');
        }

        if (result.data.todayXP && result.data.todayXP > 0) {
          console.log(`⭐ Today's XP: ${result.data.todayXP} XP earned!`);
        } else {
          console.log('⚠️ No XP data in response - XP system may not be initialized');
        }

        // Clear activities after successful sync (only if we're syncing current session)
        if (!activities) {
          this.clearActivities();
        }

        // Store the latest data in cache for offline use
        await this.cacheSessionData(result.data);
        
        return true;
      } else {
        const errorText = await response.text();
        
        // Handle rate limiting (429)
        if (response.status === 429) {
          console.error('⚠️ Rate limited (429) - session will be queued for retry');
          console.error('Error:', errorText);
          
          // Add to retry queue for later
          await this.addToRetryQueue(payload);
          return false;
        }
        
        // Handle other errors
        console.error('❌ Failed to track session:', response.status);
        console.error('Error:', errorText);
        
        // For server errors (5xx), also queue for retry
        if (response.status >= 500) {
          console.log('💾 Server error - queuing for retry');
          await this.addToRetryQueue(payload);
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending session to backend:', error);
      
      // On network errors, save to retry queue
      console.log('💾 Network error - saving session for later');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const sessionStart = this.sessionStartTime || new Date(sessionEnd.getTime() - (durationSeconds * 1000));
      
      await this.addToRetryQueue({
        sessionStartTime: sessionStart.toISOString(),
        sessionEndTime: sessionEnd.toISOString(),
        durationSeconds,
        timezone,
        activities: activities || (this.activities.length > 0 ? this.activities : undefined)
      });
      
      return false;
    }
  }

  /**
   * Cache session data locally for offline use
   */
  private async cacheSessionData(data: SessionResponse['data']) {
    try {
      const cacheData = {
        ...data,
        lastSyncedAt: new Date().toISOString(),
      };

      await SecureStore.setItemAsync('cachedSessionData', JSON.stringify(cacheData));
      console.log('💾 Session data cached locally');
    } catch (error) {
      console.error('❌ Error caching session data:', error);
    }
  }

  /**
   * Get cached session data
   */
  public async getCachedSessionData(): Promise<SessionResponse['data'] | null> {
    try {
      const cached = await SecureStore.getItemAsync('cachedSessionData');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('❌ Error reading cached session data:', error);
    }
    return null;
  }

  /**
   * Fetch latest session data from backend (public method)
   * Returns: usage stats, streak, XP, daily goals, milestones
   */
  public async fetchSessionData(): Promise<SessionResponse['data'] | null> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('⚠️ No auth token, using cached data');
        return await this.getCachedSessionData();
      }

      console.log('📥 Fetching session data...');

      const response = await fetch(API_ENDPOINTS.APP_SESSION, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result: SessionResponse = await response.json();
        console.log('✅ Session data fetched');
        
        // Cache the data
        await this.cacheSessionData(result.data);
        
        return result.data;
      } else {
        console.log('⚠️ Could not fetch from server, using cached data');
        return await this.getCachedSessionData();
      }
    } catch (error) {
      console.error('❌ Error fetching session data:', error);
      return await this.getCachedSessionData();
    }
  }
}

export default AppSessionTracker;

