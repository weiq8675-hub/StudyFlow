import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHomeworkStore } from './homeworkStore';

// Regression: Test homework store core functionality
// Found by /retro on 2026-03-25
// Report: .context/retros/2026-03-25-1.json

// Mock the db module
vi.mock('../lib/db', () => ({
  db: {
    homework: {
      orderBy: () => ({ toArray: () => Promise.resolve([]) }),
      add: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    },
  },
}));

describe('homeworkStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useHomeworkStore.setState({
      homework: [],
      loading: false,
      filter: 'all',
      sortBy: 'dueDate',
    });
  });

  describe('getTodayHomework', () => {
    it('returns homework due today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const testHomework = [
        {
          id: '1',
          title: 'Today Task',
          subjectId: 'subject-1',
          priority: 'medium' as const,
          estimatedMinutes: 30,
          dueDate: today,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Tomorrow Task',
          subjectId: 'subject-1',
          priority: 'medium' as const,
          estimatedMinutes: 30,
          dueDate: tomorrow,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          title: 'Yesterday Task',
          subjectId: 'subject-1',
          priority: 'medium' as const,
          estimatedMinutes: 30,
          dueDate: yesterday,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      useHomeworkStore.setState({ homework: testHomework });
      const result = useHomeworkStore.getState().getTodayHomework();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Today Task');
    });

    it('returns empty array when no homework due today', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      useHomeworkStore.setState({
        homework: [
          {
            id: '1',
            title: 'Tomorrow Task',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: tomorrow,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const result = useHomeworkStore.getState().getTodayHomework();
      expect(result).toHaveLength(0);
    });
  });

  describe('getPendingHomework', () => {
    it('returns today homework that is not completed', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      useHomeworkStore.setState({
        homework: [
          {
            id: '1',
            title: 'Pending Task',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            title: 'Completed Task',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const result = useHomeworkStore.getState().getPendingHomework();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Pending Task');
    });
  });

  describe('getCompletedToday', () => {
    it('returns today homework that is completed', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      useHomeworkStore.setState({
        homework: [
          {
            id: '1',
            title: 'Pending Task',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            title: 'Completed Task',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const result = useHomeworkStore.getState().getCompletedToday();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Completed Task');
    });
  });

  describe('setFilter', () => {
    it('updates filter state', () => {
      useHomeworkStore.getState().setFilter('completed');
      expect(useHomeworkStore.getState().filter).toBe('completed');
    });
  });

  describe('setSortBy', () => {
    it('updates sortBy state', () => {
      useHomeworkStore.getState().setSortBy('priority');
      expect(useHomeworkStore.getState().sortBy).toBe('priority');
    });
  });
});
