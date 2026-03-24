import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db';
import type { Subject } from '../types';

interface SubjectState {
  subjects: Subject[];
  loading: boolean;

  // Actions
  loadSubjects: () => Promise<void>;
  addSubject: (name: string, color: string) => Promise<Subject>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  getSubjectById: (id: string) => Subject | undefined;
}

// Pastel color palette for auto-assignment
const pastelColors = [
  '#fff7e6', // warm yellow
  '#e6f4ff', // soft blue
  '#f6ffed', // mint green
  '#fff0f6', // blush pink
  '#f9f0ff', // lavender
  '#e6fffb', // cyan
  '#fffbe6', // cream
  '#f0f5ff', // periwinkle
];

let colorIndex = 0;

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  loading: true,

  loadSubjects: async () => {
    set({ loading: true });
    const subjects = await db.subjects.toArray();
    set({ subjects, loading: false });
  },

  addSubject: async (name, color) => {
    const subject: Subject = {
      id: uuidv4(),
      name,
      color: color || pastelColors[colorIndex++ % pastelColors.length],
      createdAt: new Date(),
    };
    await db.subjects.add(subject);
    set((state) => ({ subjects: [...state.subjects, subject] }));
    return subject;
  },

  updateSubject: async (id, data) => {
    await db.subjects.update(id, data);
    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    }));
  },

  deleteSubject: async (id) => {
    await db.subjects.delete(id);
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id),
    }));
  },

  getSubjectById: (id) => {
    return get().subjects.find((s) => s.id === id);
  },
}));
