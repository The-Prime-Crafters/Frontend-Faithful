import AppSessionTracker from '@/utils/appSessionTracker';
import { useEffect, useState } from 'react';

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

interface AppUsageData {
  // Usage Statistics
  totalTimeSpent: number;
  todayTimeSpent: number;
  totalSessions: number;
  averageSessionDuration: number;
  lastOpenedAt: string;
  formattedTotalTime: string;
  formattedTodayTime: string;
  
  // Streak Data
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string;
  freezesAvailable: number;
  streakMessage: string;
  
  // XP & Gamification
  totalXP: number;
  todayXP: number;
  level: number;
  xpToNextLevel: number;
  
  // Daily Goals
  dailyGoals: DailyGoals | null;
  
  // Milestones
  milestones: Milestone[];
}

/**
 * Hook to access ALL app session data from /api/users/app-session
 * Includes: usage stats, streaks, XP, gamification, daily goals, milestones
 * 
 * Usage:
 * ```tsx
 * const session = useAppUsage();
 * console.log('Today:', session.formattedTodayTime);
 * console.log('Level:', session.level);
 * console.log('Streak:', session.currentStreak);
 * console.log('Daily Goals:', session.dailyGoals);
 * ```
 */
export function useAppUsage(updateInterval: number = 60000): AppUsageData {
  const [usageData, setUsageData] = useState<AppUsageData>({
    totalTimeSpent: 0,
    todayTimeSpent: 0,
    totalSessions: 0,
    averageSessionDuration: 0,
    lastOpenedAt: '',
    formattedTotalTime: '0m',
    formattedTodayTime: '0m',
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActiveDate: '',
    freezesAvailable: 0,
    streakMessage: '',
    totalXP: 0,
    todayXP: 0,
    level: 1,
    xpToNextLevel: 100,
    dailyGoals: null,
    milestones: [],
  });

  const updateUsageData = async () => {
    const tracker = AppSessionTracker.getInstance();
    
    // Get cached session data from backend
    const cachedData = await tracker.getCachedSessionData();
    
    if (cachedData) {
    setUsageData({
        // Usage Statistics
        totalTimeSpent: cachedData.totalTimeSpent || 0,
        todayTimeSpent: cachedData.todayTimeSpent || 0,
        totalSessions: cachedData.totalSessions || 0,
        averageSessionDuration: cachedData.averageSessionDuration || 0,
        lastOpenedAt: cachedData.lastOpenedAt || new Date().toISOString(),
        formattedTotalTime: cachedData.totalTimeFormatted || '0m',
        formattedTodayTime: cachedData.todayTimeFormatted || '0m',
        
        // Streak Data
        currentStreak: cachedData.currentStreak || 0,
        longestStreak: cachedData.longestStreak || 0,
        totalActiveDays: cachedData.totalActiveDays || 0,
        lastActiveDate: cachedData.lastActiveDate || '',
        freezesAvailable: cachedData.freezesAvailable || 0,
        streakMessage: cachedData.streakMessage || '',
        
        // XP & Gamification
        totalXP: cachedData.totalXP || 0,
        todayXP: cachedData.todayXP || 0,
        level: cachedData.level || 1,
        xpToNextLevel: cachedData.xpToNextLevel || 100,
        
        // Daily Goals
        dailyGoals: cachedData.dailyGoals || null,
        
        // Milestones
        milestones: cachedData.milestones || [],
    });
    }
  };

  useEffect(() => {
    // Initial update
    updateUsageData();

    // Update periodically (every minute by default)
    const interval = setInterval(updateUsageData, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return usageData;
}

/**
 * Hook to get just today's usage time from app-session
 */
export function useTodayUsage(updateInterval: number = 60000): { 
  seconds: number; 
  formatted: string;
  xpEarned: number;
} {
  const [todayTime, setTodayTime] = useState({ 
    seconds: 0, 
    formatted: '0m',
    xpEarned: 0 
  });

  useEffect(() => {
    const updateTime = async () => {
      const tracker = AppSessionTracker.getInstance();
      const cachedData = await tracker.getCachedSessionData();
      
      if (cachedData) {
      setTodayTime({
          seconds: cachedData.todayTimeSpent || 0,
          formatted: cachedData.todayTimeFormatted || '0m',
          xpEarned: cachedData.todayXP || 0,
      });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return todayTime;
}

/**
 * Hook to get streak information
 */
export function useStreak(updateInterval: number = 60000): {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  freezesAvailable: number;
  streakMessage: string;
  lastActiveDate: string;
  // XP & Gamification
  totalXP: number;
  todayXP: number;
  level: number;
  xpToNextLevel: number;
} {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    freezesAvailable: 0,
    streakMessage: '',
    lastActiveDate: '',
    totalXP: 0,
    todayXP: 0,
    level: 1,
    xpToNextLevel: 100,
  });

  useEffect(() => {
    const updateStreak = async () => {
      const tracker = AppSessionTracker.getInstance();
      const cachedData = await tracker.getCachedSessionData();
      
      if (cachedData) {
        setStreakData({
          currentStreak: cachedData.currentStreak || 0,
          longestStreak: cachedData.longestStreak || 0,
          totalActiveDays: cachedData.totalActiveDays || 0,
          freezesAvailable: cachedData.freezesAvailable || 0,
          streakMessage: cachedData.streakMessage || '',
          lastActiveDate: cachedData.lastActiveDate || '',
          totalXP: cachedData.totalXP || 0,
          todayXP: cachedData.todayXP || 0,
          level: cachedData.level || 1,
          xpToNextLevel: cachedData.xpToNextLevel || 100,
      });
      }
    };

    updateStreak();
    const interval = setInterval(updateStreak, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return streakData;
}

/**
 * Hook to get XP and level information
 */
export function useXP(updateInterval: number = 60000): {
  totalXP: number;
  todayXP: number;
  level: number;
  xpToNextLevel: number;
} {
  const [xpData, setXPData] = useState({
    totalXP: 0,
    todayXP: 0,
    level: 1,
    xpToNextLevel: 100,
  });

  useEffect(() => {
    const updateXP = async () => {
      const tracker = AppSessionTracker.getInstance();
      const cachedData = await tracker.getCachedSessionData();
      
      if (cachedData) {
        setXPData({
          totalXP: cachedData.totalXP || 0,
          todayXP: cachedData.todayXP || 0,
          level: cachedData.level || 1,
          xpToNextLevel: cachedData.xpToNextLevel || 100,
        });
      }
    };

    updateXP();
    const interval = setInterval(updateXP, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return xpData;
}

/**
 * Hook to get daily goals progress
 */
export function useDailyGoals(updateInterval: number = 60000): DailyGoals | null {
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);

  useEffect(() => {
    const updateGoals = async () => {
      const tracker = AppSessionTracker.getInstance();
      const cachedData = await tracker.getCachedSessionData();
      
      if (cachedData && cachedData.dailyGoals) {
        setDailyGoals(cachedData.dailyGoals);
      }
    };

    updateGoals();
    const interval = setInterval(updateGoals, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return dailyGoals;
}

/**
 * Hook to get milestones
 */
export function useMilestones(updateInterval: number = 60000): Milestone[] {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    const updateMilestones = async () => {
      const tracker = AppSessionTracker.getInstance();
      const cachedData = await tracker.getCachedSessionData();
      
      if (cachedData && cachedData.milestones) {
        setMilestones(cachedData.milestones);
      }
    };

    updateMilestones();
    const interval = setInterval(updateMilestones, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return milestones;
}

