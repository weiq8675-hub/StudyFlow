import type { Dayjs } from 'dayjs';
import type { Homework } from '../types';

// TODO: Make these user-configurable in settings
const WORKDAY_START_HOUR = 19;
const WORKDAY_END_HOUR = 23;
const WEEKEND_START_HOUR = 8;
const WEEKEND_END_HOUR = 23;

export const ALL_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

export function isWorkday(date: Dayjs): boolean {
  const day = date.day();
  return day >= 1 && day <= 5;
}

export function getActiveHours(date: Dayjs): number[] {
  if (isWorkday(date)) {
    const hours: number[] = [];
    for (let h = WORKDAY_START_HOUR; h <= WORKDAY_END_HOUR; h++) hours.push(h);
    return hours;
  }
  const hours: number[] = [];
  for (let h = WEEKEND_START_HOUR; h <= WEEKEND_END_HOUR; h++) hours.push(h);
  return hours;
}

export type TaskStatus = 'green' | 'red' | 'gray' | 'overdue';

export function getTaskStatus(homework: Homework, now?: Date): TaskStatus {
  const referenceDate = now ?? new Date();
  if (homework.completedAt && homework.actualMinutes !== undefined) {
    return homework.actualMinutes <= homework.estimatedMinutes + 10 ? 'green' : 'red';
  }
  // Not completed — check if overdue
  const dueDate = new Date(homework.dueDate);
  dueDate.setHours(23, 59, 59, 999);
  if (dueDate < referenceDate) {
    return 'overdue';
  }
  return 'gray';
}

export function getHourSpan(estimatedMinutes: number): number {
  return Math.ceil(estimatedMinutes / 60);
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  slots: Record<number, Homework | null>; // hour -> homework (null = empty)
  activeHours: number[];
  isWorkday: boolean;
}

export interface WeekSchedule {
  weekStart: string; // YYYY-MM-DD
  days: DaySchedule[];
  unscheduled: Homework[];
}

export function buildWeekSchedule(weekStart: Dayjs, homework: Homework[]): WeekSchedule {
  const weekStartStr = weekStart.format('YYYY-MM-DD');
  const days: DaySchedule[] = [];

  for (let i = 0; i < 7; i++) {
    const day = weekStart.add(i, 'day');
    const dateStr = day.format('YYYY-MM-DD');
    const activeHours = getActiveHours(day);
    const dayIsWorkday = isWorkday(day);
    const slots: Record<number, Homework | null> = {};
    for (const h of activeHours) {
      slots[h] = null;
    }

    days.push({ date: dateStr, slots, activeHours, isWorkday: dayIsWorkday });
  }

  const unscheduled: Homework[] = [];

  for (const h of homework) {
    const dueDateStr = new Date(h.dueDate).toISOString().slice(0, 10);
    const dayIndex = days.findIndex((d) => d.date === dueDateStr);
    if (dayIndex === -1) {
      // Not in this week — skip
      continue;
    }

    const hour = h.scheduledHour;
    // Range guard: skip invalid scheduledHour values
    if (hour === undefined || hour < 8 || hour > 23) {
      unscheduled.push(h);
      continue;
    }

    const daySchedule = days[dayIndex];
    if (!(hour in daySchedule.slots)) {
      // Hour is not an active hour for this day (e.g., 8am on a workday)
      unscheduled.push(h);
      continue;
    }

    // Place task at scheduled hour
    daySchedule.slots[hour] = h;

    // Mark continuation slots for multi-hour tasks
    const span = getHourSpan(h.estimatedMinutes);
    for (let s = 1; s < span; s++) {
      const nextHour = hour + s;
      if (nextHour in daySchedule.slots && daySchedule.slots[nextHour] === null) {
        // Mark as continuation by keeping null but the CalendarView
        // will render these as continuation cells based on the parent task
        // We don't place the homework object here — the view checks the span
      }
    }
  }

  return { weekStart: weekStartStr, days, unscheduled };
}

export function daySummary(day: DaySchedule, homework: Homework[]) {
  const dayHomework = homework.filter((h) => {
    const dueDateStr = new Date(h.dueDate).toISOString().slice(0, 10);
    return dueDateStr === day.date;
  });

  const completed = dayHomework.filter((h) => h.completedAt);
  const plannedMinutes = dayHomework.reduce((sum, h) => sum + h.estimatedMinutes, 0);
  const actualMinutes = completed.reduce((sum, h) => sum + (h.actualMinutes || 0), 0);

  return {
    total: dayHomework.length,
    completed: completed.length,
    plannedMinutes,
    actualMinutes,
  };
}
