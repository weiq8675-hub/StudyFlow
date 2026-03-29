import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db';
import type { PointsLog, Homework, Priority } from '../types';

interface PointsState {
  totalPoints: number;
  streak: number;
  lastActiveDate: string | null;
  pointsLog: PointsLog[];

  // Actions
  loadPointsData: () => Promise<void>;
  awardPoints: (homework: Homework, actualMinutes: number) => Promise<number>;
  addPointsLog: (points: number, reason: string, homeworkId?: string) => Promise<void>;
  updateStreak: () => Promise<void>;
}

// Points calculation
function calculateBasePoints(estimatedMinutes: number, priority: Priority): number {
  const multiplier = { high: 3, medium: 2, low: 1 }[priority];
  return estimatedMinutes * multiplier;
}

function calculateOnTimeBonus(dueDate: Date): number {
  return new Date() <= dueDate ? 10 : 0;
}

function calculateAccuracyBonus(estimated: number, actual: number): number {
  return Math.abs(estimated - actual) < 10 ? 5 : 0;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  totalPoints: 0,
  streak: 0,
  lastActiveDate: null,
  pointsLog: [],

  loadPointsData: async () => {
    const logs = await db.pointsLog.orderBy('createdAt').reverse().toArray();
    const totalPoints = logs.reduce((sum, log) => sum + log.points, 0);

    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get unique days with activity
    const activeDays = new Set(
      logs.map((log) => log.createdAt.toISOString().split('T')[0])
    );

    let streak = 0;
    let checkDate = today;

    // Check if active today or yesterday to start streak count
    if (activeDays.has(today) || activeDays.has(yesterday)) {
      if (!activeDays.has(today)) {
        checkDate = yesterday;
      }

      while (activeDays.has(checkDate)) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split('T')[0];
      }
    }

    set({
      totalPoints,
      streak,
      lastActiveDate: logs[0]?.createdAt.toISOString().split('T')[0] || null,
      pointsLog: logs,
    });
  },

  awardPoints: async (homework, actualMinutes) => {
    const basePoints = calculateBasePoints(homework.estimatedMinutes, homework.priority);
    const onTimeBonus = homework.dueDate
      ? calculateOnTimeBonus(new Date(homework.dueDate))
      : 0;
    const accuracyBonus = calculateAccuracyBonus(homework.estimatedMinutes, actualMinutes);

    const streakBonus = Math.min(get().streak * 5, 50);

    const totalPointsAwarded = basePoints + onTimeBonus + accuracyBonus + streakBonus;

    // Add base points log
    await get().addPointsLog(
      basePoints,
      `完成作业: ${homework.title}`,
      homework.id
    );

    if (onTimeBonus > 0) {
      await get().addPointsLog(onTimeBonus, '按时完成奖励', homework.id);
    }

    if (accuracyBonus > 0) {
      await get().addPointsLog(accuracyBonus, '预估准确奖励', homework.id);
    }

    if (streakBonus > 0) {
      await get().addPointsLog(streakBonus, `连续${get().streak}天奖励`);
    }

    await get().updateStreak();

    return totalPointsAwarded;
  },

  addPointsLog: async (points, reason, homeworkId) => {
    const log: PointsLog = {
      id: uuidv4(),
      points,
      reason,
      homeworkId,
      createdAt: new Date(),
    };

    await db.pointsLog.add(log);

    set((state) => ({
      totalPoints: state.totalPoints + points,
      pointsLog: [log, ...state.pointsLog],
    }));
  },

  updateStreak: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { lastActiveDate, streak } = get();

    if (lastActiveDate === today) {
      // Already counted today
      return;
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastActiveDate === yesterday ? streak + 1 : 1;

    set({
      streak: newStreak,
      lastActiveDate: today,
    });
  },
}));
