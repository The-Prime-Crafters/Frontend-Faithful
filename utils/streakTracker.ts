import { API_ENDPOINTS } from '@/constants/API';
import * as SecureStore from 'expo-secure-store';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD format
  totalActiveDays: number;
  streakStartDate: string;
  todayCompleted: boolean;
  freezesAvailable: number; // Streak freeze/protection days
  lastSyncedAt: string;
}

interface DailyGoals {
  readBible: boolean;
  prayer: boolean;
  reflection: boolean;
  studyGroup: boolean;
  note: boolean;
}

class StreakTracker {
  private static instance: StreakTracker;
  private streakData: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    totalActiveDays: 0,
    streakStartDate: new Date().toISOString().split('T')[0],
    todayCompleted: false,
    freezesAvailable: 3,
    lastSyncedAt: new Date().toISOString(),
  };

  private dailyGoals: DailyGoals = {
    readBible: false,
    prayer: false,
    reflection: false,
    studyGroup: false,
    note: false,
  };

  private constructor() {
    this.loadStoredData();
  }

  public static getInstance(): StreakTracker {
    if (!StreakTracker.instance) {
      StreakTracker.instance = new StreakTracker();
    }
    return StreakTracker.instance;
  }

  private async loadStoredData() {
    try {
      const storedStreak = await SecureStore.getItemAsync('streakData');
      const storedGoals = await SecureStore.getItemAsync('dailyGoals');
      
      if (storedStreak) {
        this.streakData = JSON.parse(storedStreak);
      }
      
      if (storedGoals) {
        this.dailyGoals = JSON.parse(storedGoals);
      }
      
      // Check if we need to update streak based on date
      this.checkAndUpdateStreak();
    } catch (error) {
      // Silently handle errors
    }
  }

  private async saveData() {
    try {
      await SecureStore.setItemAsync('streakData', JSON.stringify(this.streakData));
      await SecureStore.setItemAsync('dailyGoals', JSON.stringify(this.dailyGoals));
    } catch (error) {
      // Silently handle errors
    }
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private checkAndUpdateStreak() {
    const today = this.getTodayDate();
    const lastActive = this.streakData.lastActiveDate;
    
    if (!lastActive) {
      // First time user
      return;
    }
    
    if (lastActive === today) {
      // Already checked in today
      return;
    }
    
    const daysDiff = this.getDaysDifference(lastActive, today);
    
    if (daysDiff === 1) {
      // Perfect! Consecutive day - streak continues
    } else if (daysDiff === 2 && this.streakData.freezesAvailable > 0) {
      // Missed 1 day but have freeze available
      this.streakData.freezesAvailable -= 1;
    } else if (daysDiff > 1) {
      // Streak broken
      this.streakData.currentStreak = 0;
      this.streakData.streakStartDate = today;
    }
    
    // Reset today's goals
    this.dailyGoals = {
      readBible: false,
      prayer: false,
      reflection: false,
      studyGroup: false,
      note: false,
    };
    this.streakData.todayCompleted = false;
    this.saveData();
  }

  /**
   * Record activity - called when user completes an action
   */
  public async recordActivity(activity: keyof DailyGoals) {
    const today = this.getTodayDate();
    
    // Mark the specific goal as completed
    this.dailyGoals[activity] = true;
    
    // Check if user opened app today for the first time
    if (this.streakData.lastActiveDate !== today) {
      this.streakData.currentStreak += 1;
      this.streakData.totalActiveDays += 1;
      this.streakData.lastActiveDate = today;
      
      // Update longest streak if needed
      if (this.streakData.currentStreak > this.streakData.longestStreak) {
        this.streakData.longestStreak = this.streakData.currentStreak;
      }
    }
    
    // Check if all goals completed
    this.checkIfTodayCompleted();
    
    this.saveData();
    
    // Sync with backend
    this.syncWithAPI();
  }

  private checkIfTodayCompleted() {
    // Day is completed if user did at least 2 activities
    const completedCount = Object.values(this.dailyGoals).filter(Boolean).length;
    
    if (completedCount >= 2) {
      this.streakData.todayCompleted = true;
    }
  }

  /**
   * Get current streak count
   */
  public getCurrentStreak(): number {
    return this.streakData.currentStreak;
  }

  /**
   * Get longest streak
   */
  public getLongestStreak(): number {
    return this.streakData.longestStreak;
  }

  /**
   * Get total active days
   */
  public getTotalActiveDays(): number {
    return this.streakData.totalActiveDays;
  }

  /**
   * Check if today's goal is completed
   */
  public isTodayCompleted(): boolean {
    return this.streakData.todayCompleted;
  }

  /**
   * Get daily goals progress
   */
  public getDailyGoals(): DailyGoals {
    return { ...this.dailyGoals };
  }

  /**
   * Get completed goals count
   */
  public getCompletedGoalsCount(): number {
    return Object.values(this.dailyGoals).filter(Boolean).length;
  }

  /**
   * Get total goals count
   */
  public getTotalGoalsCount(): number {
    return Object.keys(this.dailyGoals).length;
  }

  /**
   * Get progress percentage
   */
  public getProgressPercentage(): number {
    const completed = this.getCompletedGoalsCount();
    const total = this.getTotalGoalsCount();
    return Math.round((completed / total) * 100);
  }

  /**
   * Get streak freezes available
   */
  public getFreezes(): number {
    return this.streakData.freezesAvailable;
  }

  /**
   * Get all streak data
   */
  public getStreakData(): StreakData {
    return { ...this.streakData };
  }

  /**
   * Check if user is at risk of losing streak
   */
  public isStreakAtRisk(): boolean {
    const today = this.getTodayDate();
    const lastActive = this.streakData.lastActiveDate;
    
    if (!lastActive) return false;
    
    // If last active was not today, streak is at risk
    return lastActive !== today && this.streakData.currentStreak > 0;
  }

  /**
   * Get days until streak breaks
   */
  public getDaysUntilStreakBreak(): number {
    if (!this.isStreakAtRisk()) return -1;
    
    const today = this.getTodayDate();
    const lastActive = this.streakData.lastActiveDate;
    const daysPassed = this.getDaysDifference(lastActive, today);
    
    // If have freezes, can miss up to (freezes + 1) days
    return Math.max(0, this.streakData.freezesAvailable + 1 - daysPassed);
  }

  /**
   * Get streak status message
   */
  public getStreakStatusMessage(): string {
    const streak = this.streakData.currentStreak;
    
    if (streak === 0) {
      return "Start your streak today! 🌟";
    } else if (streak === 1) {
      return "Great start! Keep going! 🔥";
    } else if (streak < 7) {
      return `${streak} days strong! 💪`;
    } else if (streak < 30) {
      return `${streak} days! You're on fire! 🔥`;
    } else if (streak < 100) {
      return `${streak} days! Amazing dedication! 🏆`;
    } else {
      return `${streak} days! You're a legend! 👑`;
    }
  }

  /**
   * Get milestone achievement
   */
  public getNextMilestone(): { days: number; name: string } {
    const streak = this.streakData.currentStreak;
    
    const milestones = [
      { days: 7, name: "Week Warrior" },
      { days: 14, name: "Two Weeks Champion" },
      { days: 30, name: "Monthly Master" },
      { days: 50, name: "50 Days Superstar" },
      { days: 100, name: "Century Club" },
      { days: 365, name: "Year of Faith" },
    ];
    
    const next = milestones.find(m => m.days > streak);
    return next || { days: 365, name: "Year of Faith" };
  }

  /**
   * Sync streak data with backend
   */
  public async syncWithAPI() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        return;
      }

      const streakPayload = {
        currentStreak: this.streakData.currentStreak,
        longestStreak: this.streakData.longestStreak,
        totalActiveDays: this.streakData.totalActiveDays,
        lastActiveDate: this.streakData.lastActiveDate,
        todayCompleted: this.streakData.todayCompleted,
        dailyGoals: this.dailyGoals,
        freezesAvailable: this.streakData.freezesAvailable,
      };

      const response = await fetch(`${API_ENDPOINTS.USERS_PROFILE}/streak`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streakPayload),
      });

      if (response.ok) {
        this.streakData.lastSyncedAt = new Date().toISOString();
        this.saveData();
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  /**
   * Force refresh streak data from backend
   */
  public async refreshFromAPI() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.USERS_PROFILE}/streak`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local data with server data
        if (data.streak) {
          this.streakData = {
            ...this.streakData,
            ...data.streak,
          };
          
          if (data.dailyGoals) {
            this.dailyGoals = data.dailyGoals;
          }
          
          await this.saveData();
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  /**
   * Reset streak (for testing or admin purposes)
   */
  public async resetStreak() {
    this.streakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalActiveDays: 0,
      streakStartDate: this.getTodayDate(),
      todayCompleted: false,
      freezesAvailable: 3,
      lastSyncedAt: new Date().toISOString(),
    };
    
    this.dailyGoals = {
      readBible: false,
      prayer: false,
      reflection: false,
      studyGroup: false,
      note: false,
    };
    
    await this.saveData();
  }
}

export default StreakTracker;

