import Dexie, { type EntityTable } from 'dexie';
import type { Homework, Subject, Settings, PointsLog } from '../types';

const db = new Dexie('StudyFlowDB') as Dexie & {
  homework: EntityTable<Homework, 'id'>;
  subjects: EntityTable<Subject, 'id'>;
  settings: EntityTable<Settings, 'id'>;
  pointsLog: EntityTable<PointsLog, 'id'>;
};

// Schema version 1
db.version(1).stores({
  homework: 'id, subjectId, priority, dueDate, completedAt, createdAt',
  subjects: 'id, name',
  settings: 'id',
  pointsLog: 'id, homeworkId, createdAt',
});

// Default subjects for new users
const defaultSubjects: Omit<Subject, 'id' | 'createdAt'>[] = [
  { name: '语文', color: '#fff7e6' },
  { name: '数学', color: '#e6f4ff' },
  { name: '英语', color: '#f6ffed' },
  { name: '物理', color: '#fff0f6' },
  { name: '化学', color: '#f9f0ff' },
  { name: '生物', color: '#e6fffb' },
  { name: '历史', color: '#fffbe6' },
  { name: '地理', color: '#f0f5ff' },
];

// Initialize default data
export async function initializeDatabase() {
  const subjectCount = await db.subjects.count();
  if (subjectCount === 0) {
    const now = new Date();
    await db.subjects.bulkAdd(
      defaultSubjects.map((s, index) => ({
        id: `subject-${index + 1}`,
        ...s,
        createdAt: now,
      }))
    );
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      language: 'zh-CN',
      theme: 'light',
    });
  }
}

export { db };
