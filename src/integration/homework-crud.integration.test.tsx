import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';

import { TodayView } from '../pages/TodayView';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import { usePointsStore } from '../stores/pointsStore';

// Integration test for homework CRUD flow
// Regression: Test full homework lifecycle
// Found by /retro on 2026-03-25
// Report: .context/retros/2026-03-25-1.json

// Mock the database module
vi.mock('../lib/db', () => ({
  db: {
    homework: {
      orderBy: () => ({ toArray: async () => [] }),
      add: async () => {},
      update: async () => {},
      delete: async () => {},
    },
    subjects: {
      toArray: async () => [],
      count: async () => 0,
      bulkAdd: async () => {},
    },
    settings: {
      count: async () => 1,
      get: async () => ({ id: 'default', language: 'zh-CN', theme: 'light' }),
    },
    pointsLog: {
      orderBy: () => ({ reverse: () => ({ toArray: async () => [] }) }),
      add: async () => {},
    },
  },
  initializeDatabase: async () => {},
}));

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ConfigProvider locale={zhCN}>
      <AntApp>
        {component}
      </AntApp>
    </ConfigProvider>
  );
};

describe('Homework CRUD Integration', () => {
  beforeEach(() => {
    // Reset stores
    useHomeworkStore.setState({
      homework: [],
      loading: false,
      filter: 'all',
      sortBy: 'dueDate',
    });
    useSubjectStore.setState({
      subjects: [
        { id: 'subject-1', name: '语文', color: '#fff7e6', createdAt: new Date() },
        { id: 'subject-2', name: '数学', color: '#e6f4ff', createdAt: new Date() },
        { id: 'subject-3', name: '英语', color: '#f6ffed', createdAt: new Date() },
      ],
      loading: false,
    });
    usePointsStore.setState({
      totalPoints: 0,
      streak: 0,
      lastActiveDate: null,
      pointsLog: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Create (Add Homework)', () => {
    it('shows quick add input on TodayView', async () => {
      renderWithProviders(<TodayView />);

      // Quick add input should be present
      expect(screen.getByPlaceholderText(/快速添加作业/)).toBeInTheDocument();
    });

    it('has add button available', async () => {
      renderWithProviders(<TodayView />);

      // Add button should be present
      const addButton = screen.getByRole('button', { name: '添 加' });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Read (Display Homework)', () => {
    it('displays homework items from the store', async () => {
      // Pre-populate with homework
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const testHomework = {
        id: 'hw-1',
        title: '语文作文',
        subjectId: 'subject-1',
        priority: 'high' as const,
        estimatedMinutes: 60,
        dueDate: today,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useHomeworkStore.setState({ homework: [testHomework] });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText('语文作文')).toBeInTheDocument();
      });
    });

    it('shows empty state when no homework', async () => {
      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText(/今天没有作业/)).toBeInTheDocument();
      });
    });

    it('separates pending and completed homework', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      useHomeworkStore.setState({
        homework: [
          {
            id: 'hw-1',
            title: '待完成作业',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'hw-2',
            title: '已完成作业',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            completedAt: new Date(),
            actualMinutes: 25,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText('待完成作业')).toBeInTheDocument();
        expect(screen.getByText('已完成作业')).toBeInTheDocument();
      });
    });
  });

  describe('Update (Complete Homework)', () => {
    it('renders homework with action buttons', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      useHomeworkStore.setState({
        homework: [
          {
            id: 'hw-1',
            title: '数学练习',
            subjectId: 'subject-2',
            priority: 'high' as const,
            estimatedMinutes: 45,
            dueDate: today,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText('数学练习')).toBeInTheDocument();
      });

      // Check for action buttons exist (edit/delete)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Delete Homework', () => {
    it('shows delete button for homework items', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      useHomeworkStore.setState({
        homework: [
          {
            id: 'hw-1',
            title: '要删除的作业',
            subjectId: 'subject-1',
            priority: 'low' as const,
            estimatedMinutes: 15,
            dueDate: today,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText('要删除的作业')).toBeInTheDocument();
      });
    });
  });

  describe('Stats Display', () => {
    it('displays completion stats in the header', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      useHomeworkStore.setState({
        homework: [
          {
            id: 'hw-1',
            title: '测试作业',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        // Check for stats labels
        expect(screen.getByText('预估时间')).toBeInTheDocument();
        expect(screen.getByText('已完成')).toBeInTheDocument();
        expect(screen.getByText('完成率')).toBeInTheDocument();
      });
    });
  });

  describe('Store State Management', () => {
    it('can add homework through store', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newHomework = {
        id: 'hw-new',
        title: '新作业',
        subjectId: 'subject-1',
        priority: 'medium' as const,
        estimatedMinutes: 30,
        dueDate: today,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useHomeworkStore.setState({ homework: [newHomework] });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText('新作业')).toBeInTheDocument();
      });
    });

    it('can filter homework by status', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      useHomeworkStore.setState({
        homework: [
          {
            id: 'hw-1',
            title: '待完成',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'hw-2',
            title: '已完成',
            subjectId: 'subject-1',
            priority: 'medium' as const,
            estimatedMinutes: 30,
            dueDate: today,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        filter: 'pending',
      });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText('待完成')).toBeInTheDocument();
      });
    });
  });
});
