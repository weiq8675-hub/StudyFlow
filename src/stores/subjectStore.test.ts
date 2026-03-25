import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSubjectStore } from './subjectStore';

// Regression: Test subject store functionality
// Found by /retro on 2026-03-25
// Report: .context/retros/2026-03-25-1.json

// Mock the db module
vi.mock('../lib/db', () => ({
  db: {
    subjects: {
      toArray: () => Promise.resolve([]),
      add: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    },
  },
}));

describe('subjectStore', () => {
  beforeEach(() => {
    useSubjectStore.setState({
      subjects: [],
      loading: false,
    });
  });

  describe('getSubjectById', () => {
    it('returns subject when found', () => {
      const testSubjects = [
        { id: 'subject-1', name: '语文', color: '#fff7e6', createdAt: new Date() },
        { id: 'subject-2', name: '数学', color: '#e6f4ff', createdAt: new Date() },
      ];

      useSubjectStore.setState({ subjects: testSubjects });
      const result = useSubjectStore.getState().getSubjectById('subject-1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('语文');
    });

    it('returns undefined when not found', () => {
      useSubjectStore.setState({
        subjects: [
          { id: 'subject-1', name: '语文', color: '#fff7e6', createdAt: new Date() },
        ],
      });

      const result = useSubjectStore.getState().getSubjectById('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('subject state', () => {
    it('initializes with empty subjects', () => {
      expect(useSubjectStore.getState().subjects).toEqual([]);
      expect(useSubjectStore.getState().loading).toBe(false);
    });

    it('can have subjects set directly', () => {
      const testSubjects = [
        { id: 'subject-1', name: '语文', color: '#fff7e6', createdAt: new Date() },
      ];

      useSubjectStore.setState({ subjects: testSubjects });
      expect(useSubjectStore.getState().subjects).toHaveLength(1);
    });
  });
});
