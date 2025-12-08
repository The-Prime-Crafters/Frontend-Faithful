import { API_ENDPOINTS } from '@/constants/API';
import * as SecureStore from 'expo-secure-store';

interface DailyActivity {
  versesRead: number;
  studyHours: number;
  prayersSaid: number;
  reflectionsCompleted: number;
  notesCreated: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
}

interface ActivityTracker {
  startTime: number | null;
  totalStudyMinutes: number;
  dailyActivity: DailyActivity;
}

class ActivityTrackerService {
  private static instance: ActivityTrackerService;
  private tracker: ActivityTracker = {
    startTime: null,
    totalStudyMinutes: 0,
    dailyActivity: {
      versesRead: 0,
      studyHours: 0,
      prayersSaid: 0,
      reflectionsCompleted: 0,
      notesCreated: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastUpdated: new Date().toISOString(),
    }
  };

  private constructor() {
    this.loadStoredData();
  }

  public static getInstance(): ActivityTrackerService {
    if (!ActivityTrackerService.instance) {
      ActivityTrackerService.instance = new ActivityTrackerService();
    }
    return ActivityTrackerService.instance;
  }

  private async loadStoredData() {
    try {
      const storedData = await SecureStore.getItemAsync('activityTracker');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        this.tracker = { ...this.tracker, ...parsed };
      }
      
      // Load streak data from index screen
      await this.loadStreakData();
    } catch (error) {
      console.error('❌ Error loading activity tracker data:', error);
    }
  }

  private async loadStreakData() {
    try {
      const currentStreak = await SecureStore.getItemAsync('userStreak');
      const longestStreak = await SecureStore.getItemAsync('longestStreak');
      
      if (currentStreak) {
        this.tracker.dailyActivity.currentStreak = parseInt(currentStreak);
      }
      if (longestStreak) {
        this.tracker.dailyActivity.longestStreak = parseInt(longestStreak);
      }
      
      console.log('📊 Loaded streak data:', {
        currentStreak: this.tracker.dailyActivity.currentStreak,
        longestStreak: this.tracker.dailyActivity.longestStreak
      });
    } catch (error) {
      console.error('❌ Error loading streak data:', error);
    }
  }

  private async saveData() {
    try {
      await SecureStore.setItemAsync('activityTracker', JSON.stringify(this.tracker));
    } catch (error) {
      console.error('❌ Error saving activity tracker data:', error);
    }
  }

  // Start tracking study time when user opens the app
  public startStudySession() {
    if (!this.tracker.startTime) {
      this.tracker.startTime = Date.now();
      console.log('📚 Study session started');
    }
  }

  // Stop tracking study time and update total
  public stopStudySession() {
    if (this.tracker.startTime) {
      const sessionMinutes = (Date.now() - this.tracker.startTime) / (1000 * 60);
      this.tracker.totalStudyMinutes += sessionMinutes;
      this.tracker.startTime = null;
      this.tracker.dailyActivity.studyHours = Math.round(this.tracker.totalStudyMinutes / 60 * 10) / 10;
      this.tracker.dailyActivity.lastUpdated = new Date().toISOString();
      this.saveData();
      console.log('📚 Study session ended. Total minutes:', this.tracker.totalStudyMinutes);
    }
  }

  // Track verse reading
  public trackVerseRead() {
    this.tracker.dailyActivity.versesRead += 1;
    this.tracker.dailyActivity.lastUpdated = new Date().toISOString();
    this.saveData();
    console.log('📖 Verse read tracked. Total:', this.tracker.dailyActivity.versesRead);
  }

  // Track prayer listening/reading
  public trackPrayerSaid() {
    this.tracker.dailyActivity.prayersSaid += 1;
    this.tracker.dailyActivity.lastUpdated = new Date().toISOString();
    this.saveData();
    console.log('🙏 Prayer said tracked. Total:', this.tracker.dailyActivity.prayersSaid);
  }

  // Track reflection completion
  public trackReflectionCompleted() {
    this.tracker.dailyActivity.reflectionsCompleted += 1;
    this.tracker.dailyActivity.lastUpdated = new Date().toISOString();
    this.saveData();
    console.log('💭 Reflection completed tracked. Total:', this.tracker.dailyActivity.reflectionsCompleted);
  }

  // Track note creation
  public trackNoteCreated() {
    this.tracker.dailyActivity.notesCreated += 1;
    this.tracker.dailyActivity.lastUpdated = new Date().toISOString();
    this.saveData();
    console.log('📝 Note created tracked. Total:', this.tracker.dailyActivity.notesCreated);
  }

  // Get current daily activity
  public getDailyActivity(): DailyActivity {
    return { ...this.tracker.dailyActivity };
  }

  // Sync with API
  public async syncWithAPI() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ No auth token for activity sync');
        return;
      }

      const activityData = this.getDailyActivity();
      
      // Only sync if there's actual activity
      if (activityData.versesRead > 0 || activityData.studyHours > 0 || 
          activityData.prayersSaid > 0 || activityData.reflectionsCompleted > 0 || 
          activityData.notesCreated > 0) {
        
        const response = await fetch(API_ENDPOINTS.DAILY_ACTIVITY, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData),
        });

        if (response.ok) {
          console.log('✅ Daily activity synced successfully');
          // Reset daily activity after successful sync
          this.resetDailyActivity();
        } else {
          console.error('❌ Failed to sync daily activity:', response.status);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing daily activity:', error);
    }
  }

  // Reset daily activity (call after successful API sync)
  private resetDailyActivity() {
    // Preserve streak data when resetting
    const currentStreak = this.tracker.dailyActivity.currentStreak;
    const longestStreak = this.tracker.dailyActivity.longestStreak;
    
    this.tracker.dailyActivity = {
      versesRead: 0,
      studyHours: 0,
      prayersSaid: 0,
      reflectionsCompleted: 0,
      notesCreated: 0,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      lastUpdated: new Date().toISOString(),
    };
    this.tracker.totalStudyMinutes = 0;
    this.saveData();
  }

  // Get total study time across all days
  public getTotalStudyMinutes(): number {
    return this.tracker.totalStudyMinutes;
  }

  // Check if it's a new day and reset if needed
  public checkAndResetForNewDay() {
    const today = new Date().toISOString().split('T')[0];
    const lastUpdated = this.tracker.dailyActivity.lastUpdated.split('T')[0];
    
    if (today !== lastUpdated) {
      console.log('📅 New day detected, resetting activity tracker');
      this.resetDailyActivity();
    }
  }

  // Refresh streak data from SecureStore
  public async refreshStreakData() {
    await this.loadStreakData();
    this.saveData();
  }
}

export default ActivityTrackerService;
