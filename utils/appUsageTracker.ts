import { API_ENDPOINTS } from '@/constants/API';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

interface AppSession {
  sessionId: string;
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
  date: string;
}

interface AppUsageStats {
  totalSessions: number;
  totalTimeSpent: number; // in seconds
  averageSessionDuration: number;
  lastOpenedAt: string;
  todayTimeSpent: number;
  sessions: AppSession[];
}

class AppUsageTracker {
  private static instance: AppUsageTracker;
  private currentSession: AppSession | null = null;
  private appState: AppStateStatus = 'active';
  private stats: AppUsageStats = {
    totalSessions: 0,
    totalTimeSpent: 0,
    averageSessionDuration: 0,
    lastOpenedAt: new Date().toISOString(),
    todayTimeSpent: 0,
    sessions: [],
  };

  private constructor() {
    this.loadStoredData();
    this.setupAppStateListener();
  }

  public static getInstance(): AppUsageTracker {
    if (!AppUsageTracker.instance) {
      AppUsageTracker.instance = new AppUsageTracker();
    }
    return AppUsageTracker.instance;
  }

  private async loadStoredData() {
    try {
      const storedData = await SecureStore.getItemAsync('appUsageStats');
      if (storedData) {
        this.stats = JSON.parse(storedData);
        
        // Check if it's a new day
        this.checkAndResetDailyStats();
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  private async saveData() {
    try {
      await SecureStore.setItemAsync('appUsageStats', JSON.stringify(this.stats));
    } catch (error) {
      // Silently handle errors
    }
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Start first session
    this.startSession();
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    // App coming to foreground
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.startSession();
    }
    
    // App going to background
    if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      this.endSession();
    }
    
    this.appState = nextAppState;
  };

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startSession() {
    if (this.currentSession) {
      // End previous session if it exists
      this.endSession();
    }

    const now = Date.now();
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: now,
      endTime: null,
      duration: 0,
      date: new Date().toISOString(),
    };

    this.stats.lastOpenedAt = new Date().toISOString();
    this.stats.totalSessions += 1;
    
    this.saveData();
  }

  private endSession() {
    if (!this.currentSession) {
      return;
    }

    const now = Date.now();
    const duration = Math.floor((now - this.currentSession.startTime) / 1000); // Convert to seconds
    
    this.currentSession.endTime = now;
    this.currentSession.duration = duration;

    // Update stats
    this.stats.totalTimeSpent += duration;
    this.stats.todayTimeSpent += duration;
    this.stats.averageSessionDuration = Math.floor(this.stats.totalTimeSpent / this.stats.totalSessions);
    
    // Store session (keep last 50 sessions)
    this.stats.sessions.push({ ...this.currentSession });
    if (this.stats.sessions.length > 50) {
      this.stats.sessions.shift(); // Remove oldest session
    }

    this.currentSession = null;
    this.saveData();
    
    // Sync with backend
    this.syncWithAPI();
  }

  private checkAndResetDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    const lastOpened = this.stats.lastOpenedAt.split('T')[0];
    
    if (today !== lastOpened) {
      this.stats.todayTimeSpent = 0;
      this.saveData();
    }
  }

  // Public methods

  /**
   * Get current session duration in seconds
   */
  public getCurrentSessionDuration(): number {
    if (!this.currentSession) {
      return 0;
    }
    return Math.floor((Date.now() - this.currentSession.startTime) / 1000);
  }

  /**
   * Get total time spent in app (all time) in seconds
   * Includes current active session for real-time updates
   */
  public getTotalTimeSpent(): number {
    const currentSessionTime = this.getCurrentSessionDuration();
    const total = this.stats.totalTimeSpent + currentSessionTime;
    return total;
  }

  /**
   * Get time spent in app today in seconds
   * Includes current active session for real-time updates
   */
  public getTodayTimeSpent(): number {
    const currentSessionTime = this.getCurrentSessionDuration();
    const total = this.stats.todayTimeSpent + currentSessionTime;
    return total;
  }

  /**
   * Get formatted time string (e.g., "2h 15m")
   */
  public getFormattedTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get all app usage statistics
   */
  public getStats(): AppUsageStats {
    return { ...this.stats };
  }

  /**
   * Get sessions from today
   */
  public getTodaySessions(): AppSession[] {
    const today = new Date().toISOString().split('T')[0];
    return this.stats.sessions.filter(session => 
      session.date.split('T')[0] === today
    );
  }

  /**
   * Sync usage data with backend API
   */
  public async syncWithAPI() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        return;
      }

      // Prepare data to send
      const usageData = {
        totalSessions: this.stats.totalSessions,
        totalTimeSpent: this.stats.totalTimeSpent,
        todayTimeSpent: this.stats.todayTimeSpent,
        averageSessionDuration: this.stats.averageSessionDuration,
        lastOpenedAt: this.stats.lastOpenedAt,
        recentSessions: this.stats.sessions.slice(-10), // Send last 10 sessions
      };

      const response = await fetch(`${API_ENDPOINTS.USERS_PROFILE}/usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usageData),
      });
    } catch (error) {
      // Silently handle errors
    }
  }

  /**
   * Force end current session (useful on app logout/exit)
   */
  public forceEndSession() {
    this.endSession();
  }

  /**
   * Clean up when app is closing
   */
  public cleanup() {
    this.endSession();
    // Remove listener if needed
  }

  /**
   * Log usage summary
   */
  public logSummary() {
    // Method kept for backward compatibility but no logging
  }
}

export default AppUsageTracker;

