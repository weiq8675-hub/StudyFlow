// Core data types for StudyFlow

export type Priority = 'high' | 'medium' | 'low';

export interface Homework {
  id: string;
  title: string;
  subjectId: string;
  priority: Priority;
  estimatedMinutes: number;
  actualMinutes?: number;
  dueDate: Date;
  scheduledHour?: number; // 8-23, the hour at which this task is planned to start
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Settings {
  id: string;
  language: 'zh-CN' | 'en-US';
  theme: 'light' | 'dark';
}

export interface PointsLog {
  id: string;
  homeworkId?: string;
  points: number;
  reason: string;
  createdAt: Date;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalEstimated: number;
  totalActual: number;
  completedCount: number;
  totalCount: number;
}

// UI state types
export interface HomeworkFormData {
  title: string;
  subjectId: string;
  priority: Priority;
  estimatedMinutes: number;
  dueDate: Date;
  scheduledHour?: number;
}

export type FilterStatus = 'all' | 'pending' | 'completed' | 'overdue';

export type SortBy = 'dueDate' | 'priority' | 'subject' | 'createdAt';
