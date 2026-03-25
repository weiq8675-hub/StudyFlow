import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from './settingsStore';

// Regression: Test settings store functionality
// Found by /retro on 2026-03-25
// Report: .context/retros/2026-03-25-1.json

// Mock the db module
vi.mock('../lib/db', () => ({
  db: {
    settings: {
      get: vi.fn(() => Promise.resolve(null)),
      update: vi.fn(() => Promise.resolve()),
    },
  },
}));

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: null,
      loading: false,
    });
  });

  describe('initial state', () => {
    it('starts with null settings', () => {
      expect(useSettingsStore.getState().settings).toBeNull();
      expect(useSettingsStore.getState().loading).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('updates settings state', async () => {
      // First set some initial settings
      useSettingsStore.setState({
        settings: {
          id: 'default',
          language: 'zh-CN',
          theme: 'light',
        },
      });

      await useSettingsStore.getState().updateSettings({ theme: 'dark' });

      expect(useSettingsStore.getState().settings?.theme).toBe('dark');
      expect(useSettingsStore.getState().settings?.language).toBe('zh-CN');
    });

    it('preserves existing settings when partial update', async () => {
      useSettingsStore.setState({
        settings: {
          id: 'default',
          language: 'zh-CN',
          theme: 'light',
        },
      });

      await useSettingsStore.getState().updateSettings({ language: 'en-US' });

      expect(useSettingsStore.getState().settings?.language).toBe('en-US');
      expect(useSettingsStore.getState().settings?.theme).toBe('light');
    });
  });
});
