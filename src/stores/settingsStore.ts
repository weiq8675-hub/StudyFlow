import { create } from 'zustand';
import { db } from '../lib/db';
import type { Settings } from '../types';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: true,

  loadSettings: async () => {
    set({ loading: true });
    const settings = await db.settings.get('default');
    set({ settings: settings || null, loading: false });
  },

  updateSettings: async (data) => {
    await db.settings.update('default', data);
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...data } : null,
    }));
  },
}));
