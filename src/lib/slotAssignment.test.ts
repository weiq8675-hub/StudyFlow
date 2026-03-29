import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  isWorkday,
  getActiveHours,
  getHourSpan,
  buildWeekSchedule,
  daySummary,
  ALL_HOURS,
} from './slotAssignment';
import type { Homework } from '../types';

function makeHomework(overrides: Partial<Homework> & { id: string; dueDate: Date }): Homework {
  return {
    title: 'Test HW',
    subjectId: 'math',
    priority: 'medium',
    estimatedMinutes: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('isWorkday', () => {
  it('returns true for Monday (day 1)', () => {
    expect(isWorkday(dayjs('2026-03-30'))).toBe(true); // Monday
  });
  it('returns true for Friday (day 5)', () => {
    expect(isWorkday(dayjs('2026-04-03'))).toBe(true); // Friday
  });
  it('returns false for Saturday (day 6)', () => {
    expect(isWorkday(dayjs('2026-03-28'))).toBe(false);
  });
  it('returns false for Sunday (day 0)', () => {
    expect(isWorkday(dayjs('2026-03-29'))).toBe(false);
  });
});

describe('getActiveHours', () => {
  it('returns 19-23 for weekdays', () => {
    const hours = getActiveHours(dayjs('2026-03-30')); // Monday
    expect(hours).toEqual([19, 20, 21, 22, 23]);
  });
  it('returns 8-23 for Saturday', () => {
    const hours = getActiveHours(dayjs('2026-03-28')); // Saturday
    expect(hours).toEqual(ALL_HOURS);
  });
  it('returns 8-23 for Sunday', () => {
    const hours = getActiveHours(dayjs('2026-03-29')); // Sunday
    expect(hours).toEqual(ALL_HOURS);
  });
});

describe('getHourSpan', () => {
  it('30min → 1 slot', () => expect(getHourSpan(30)).toBe(1));
  it('59min → 1 slot', () => expect(getHourSpan(59)).toBe(1));
  it('60min → 1 slot', () => expect(getHourSpan(60)).toBe(1));
  it('61min → 2 slots', () => expect(getHourSpan(61)).toBe(2));
  it('90min → 2 slots', () => expect(getHourSpan(90)).toBe(2));
  it('120min → 2 slots', () => expect(getHourSpan(120)).toBe(2));
  it('121min → 3 slots', () => expect(getHourSpan(121)).toBe(3));
});

describe('buildWeekSchedule', () => {
  const weekStart = dayjs('2026-03-30'); // Monday

  it('places task in correct day+hour', () => {
    const hw = makeHomework({
      id: '1',
      dueDate: new Date('2026-03-30'),
      scheduledHour: 19,
    });
    const schedule = buildWeekSchedule(weekStart, [hw]);
    expect(schedule.days[0].slots[19]).toEqual(hw);
    expect(schedule.unscheduled).toHaveLength(0);
  });

  it('puts homework without scheduledHour in unscheduled', () => {
    const hw = makeHomework({
      id: '1',
      dueDate: new Date('2026-03-30'),
    });
    const schedule = buildWeekSchedule(weekStart, [hw]);
    expect(schedule.unscheduled).toHaveLength(1);
    expect(schedule.unscheduled[0].id).toBe('1');
  });

  it('puts homework with invalid scheduledHour in unscheduled', () => {
    const hw = makeHomework({
      id: '1',
      dueDate: new Date('2026-03-30'),
      scheduledHour: 25,
    });
    const schedule = buildWeekSchedule(weekStart, [hw]);
    expect(schedule.unscheduled).toHaveLength(1);
  });

  it('puts workday homework at hour 8 in unscheduled', () => {
    const hw = makeHomework({
      id: '1',
      dueDate: new Date('2026-03-30'), // Monday
      scheduledHour: 8,
    });
    const schedule = buildWeekSchedule(weekStart, [hw]);
    expect(schedule.unscheduled).toHaveLength(1);
  });

  it('allows hour 8 on weekend', () => {
    const hw = makeHomework({
      id: '1',
      dueDate: new Date('2026-04-04'), // Saturday
      scheduledHour: 8,
    });
    const schedule = buildWeekSchedule(weekStart, [hw]);
    expect(schedule.days[5].slots[8]).toEqual(hw);
    expect(schedule.unscheduled).toHaveLength(0);
  });

  it('handles empty week', () => {
    const schedule = buildWeekSchedule(weekStart, []);
    expect(schedule.unscheduled).toHaveLength(0);
    for (const day of schedule.days) {
      for (const h of day.activeHours) {
        expect(day.slots[h]).toBeNull();
      }
    }
  });

  it('skips homework outside the week', () => {
    const hw = makeHomework({
      id: '1',
      dueDate: new Date('2026-04-10'), // Next week
      scheduledHour: 19,
    });
    const schedule = buildWeekSchedule(weekStart, [hw]);
    expect(schedule.unscheduled).toHaveLength(0);
    for (const day of schedule.days) {
      for (const h of day.activeHours) {
        expect(day.slots[h]).toBeNull();
      }
    }
  });
});

describe('daySummary', () => {
  const weekStart = dayjs('2026-03-30');

  it('computes correct summary', () => {
    const hw1 = makeHomework({
      id: '1',
      dueDate: new Date('2026-03-30'),
      estimatedMinutes: 30,
      scheduledHour: 19,
      completedAt: new Date(),
      actualMinutes: 25,
    });
    const hw2 = makeHomework({
      id: '2',
      dueDate: new Date('2026-03-30'),
      estimatedMinutes: 60,
      scheduledHour: 20,
    });
    const schedule = buildWeekSchedule(weekStart, [hw1, hw2]);
    const summary = daySummary(schedule.days[0], [hw1, hw2]);
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.plannedMinutes).toBe(90);
    expect(summary.actualMinutes).toBe(25);
  });

  it('handles empty day', () => {
    const schedule = buildWeekSchedule(weekStart, []);
    const summary = daySummary(schedule.days[0], []);
    expect(summary.total).toBe(0);
    expect(summary.completed).toBe(0);
    expect(summary.plannedMinutes).toBe(0);
    expect(summary.actualMinutes).toBe(0);
  });
});
