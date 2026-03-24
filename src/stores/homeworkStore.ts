import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db';
import type { Homework, Priority, FilterStatus, SortBy } from '../types';

interface HomeworkState {
  homework: Homework[];
  loading: boolean;
  filter: FilterStatus;
  sortBy: SortBy;

  // Actions
  loadHomework: () => Promise<void>;
  addHomework: (data: {
    title: string;
    subjectId: string;
    priority: Priority;
    estimatedMinutes: number;
    dueDate: Date;
  }) => Promise<Homework>;
  updateHomework: (id: string, data: Partial<Homework>) => Promise<void>;
  completeHomework: (id: string, actualMinutes: number) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;
  setFilter: (filter: FilterStatus) => void;
  setSortBy: (sortBy: SortBy) => void;

  // Computed (called as functions)
  getTodayHomework: () => Homework[];
  getPendingHomework: () => Homework[];
  getCompletedToday: () => Homework[];
}

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
  homework: [],
  loading: true,
  filter: 'all',
  sortBy: 'dueDate',

  loadHomework: async () => {
    set({ loading: true });
    const homework = await db.homework.orderBy('dueDate').toArray();
    set({ homework, loading: false });
  },

  addHomework: async (data) => {
    const now = new Date();
    const homework: Homework = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.homework.add(homework);
    set((state) => ({ homework: [...state.homework, homework] }));
    return homework;
  },

  updateHomework: async (id, data) => {
    const now = new Date();
    await db.homework.update(id, { ...data, updatedAt: now });
    set((state) => ({
      homework: state.homework.map((h) =>
        h.id === id ? { ...h, ...data, updatedAt: now } : h
      ),
    }));
  },

  completeHomework: async (id, actualMinutes) => {
    const now = new Date();
    await db.homework.update(id, {
      actualMinutes,
      completedAt: now,
      updatedAt: now,
    });
    set((state) => ({
      homework: state.homework.map((h) =>
        h.id === id ? { ...h, actualMinutes, completedAt: now, updatedAt: now } : h
      ),
    }));
  },

  deleteHomework: async (id) => {
    await db.homework.delete(id);
    set((state) => ({
      homework: state.homework.filter((h) => h.id !== id),
    }));
  },

  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),

  getTodayHomework: () => {
    const { homework } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return homework.filter((h) => {
      const dueDate = new Date(h.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    });
  },

  getPendingHomework: () => {
    return get()
      .getTodayHomework()
      .filter((h) => !h.completedAt);
  },

  getCompletedToday: () => {
    return get()
      .getTodayHomework()
      .filter((h) => h.completedAt);
  },
}));
