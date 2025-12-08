import StreakTracker from '@/utils/streakTracker';
import { useEffect, useState } from 'react';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  todayCompleted: boolean;
  completedGoals: number;
  totalGoals: number;
  progressPercentage: number;
  freezesAvailable: number;
  isAtRisk: boolean;
  statusMessage: string;
  nextMilestone: { days: number; name: string };
}

/**
 * Hook to access streak information
 * 
 * Usage:
 * ```tsx
 * const streak = useStreak();
 * console.log('Current streak:', streak.currentStreak);
 * ```
 */
export function useStreak(updateInterval: number = 60000): StreakInfo {
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    todayCompleted: false,
    completedGoals: 0,
    totalGoals: 5,
    progressPercentage: 0,
    freezesAvailable: 3,
    isAtRisk: false,
    statusMessage: '',
    nextMilestone: { days: 7, name: 'Week Warrior' },
  });

  const updateStreakInfo = () => {
    const tracker = StreakTracker.getInstance();
    
    setStreakInfo({
      currentStreak: tracker.getCurrentStreak(),
      longestStreak: tracker.getLongestStreak(),
      totalActiveDays: tracker.getTotalActiveDays(),
      todayCompleted: tracker.isTodayCompleted(),
      completedGoals: tracker.getCompletedGoalsCount(),
      totalGoals: tracker.getTotalGoalsCount(),
      progressPercentage: tracker.getProgressPercentage(),
      freezesAvailable: tracker.getFreezes(),
      isAtRisk: tracker.isStreakAtRisk(),
      statusMessage: tracker.getStreakStatusMessage(),
      nextMilestone: tracker.getNextMilestone(),
    });
  };

  useEffect(() => {
    // Initial update
    updateStreakInfo();

    // Update periodically
    const interval = setInterval(updateStreakInfo, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return streakInfo;
}

/**
 * Hook to get daily goals
 */
export function useDailyGoals() {
  const [goals, setGoals] = useState({
    readBible: false,
    prayer: false,
    reflection: false,
    studyGroup: false,
    note: false,
  });

  useEffect(() => {
    const tracker = StreakTracker.getInstance();
    const updateGoals = () => {
      setGoals(tracker.getDailyGoals());
    };

    updateGoals();
    const interval = setInterval(updateGoals, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return goals;
}

/**
 * Hook to record activity
 */
export function useRecordActivity() {
  const recordActivity = async (activity: 'readBible' | 'prayer' | 'reflection' | 'studyGroup' | 'note') => {
    const tracker = StreakTracker.getInstance();
    await tracker.recordActivity(activity);
  };

  return { recordActivity };
}

