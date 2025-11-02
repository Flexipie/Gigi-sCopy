/**
 * Unit tests for storage.js helpers
 * Tests the persistence layer with mocked Chrome APIs
 */

import { resetChromeStorage, setChromeStorage, getChromeStorage } from '../../__mocks__/chrome.js';
import {
  getClips,
  setClips,
  updateClips,
  getFolders,
  setFolders,
  getTagRules,
  setTagRules,
  getActiveFolderId,
  setActiveFolderId,
  getCopyFormat,
  setCopyFormat,
  getOverlaySettings,
  setOverlayPosition,
  setOverlaySize,
  setOverlayTheme,
  setOverlayReduceMotion,
  setClipsAndFolders
} from '../../storage.js';

describe('Storage Helpers', () => {
  beforeEach(() => {
    resetChromeStorage();
    jest.clearAllMocks();
  });

  describe('getClips', () => {
    it('should return empty array when no clips exist', async () => {
      const clips = await getClips();
      expect(clips).toEqual([]);
    });

    it('should return stored clips', async () => {
      const mockClips = [
        { id: '1', text: 'Test clip', createdAt: Date.now() }
      ];
      setChromeStorage({ clips: mockClips });
      
      const clips = await getClips();
      expect(clips).toEqual(mockClips);
    });

    it('should return a copy, not original array', async () => {
      const mockClips = [{ id: '1', text: 'Test' }];
      setChromeStorage({ clips: mockClips });
      
      const clips = await getClips();
      clips.push({ id: '2', text: 'Modified' });
      
      const clipsAgain = await getClips();
      expect(clipsAgain.length).toBe(1);
    });

    it('should handle corrupted non-array clips', async () => {
      setChromeStorage({ clips: 'invalid' });
      const clips = await getClips();
      expect(clips).toEqual([]);
    });
  });

  describe('setClips', () => {
    it('should persist clips to storage', async () => {
      const mockClips = [{ id: '1', text: 'Test' }];
      await setClips(mockClips);
      
      const stored = getChromeStorage();
      expect(stored.clips).toEqual(mockClips);
    });

    it('should ensure clips is an array', async () => {
      await setClips('invalid');
      const stored = getChromeStorage();
      expect(Array.isArray(stored.clips)).toBe(true);
    });
  });

  describe('updateClips', () => {
    it('should update clips via callback', async () => {
      const initial = [{ id: '1', text: 'First' }];
      setChromeStorage({ clips: initial });
      
      const result = await updateClips((clips) => {
        return [...clips, { id: '2', text: 'Second' }];
      });
      
      expect(result.length).toBe(2);
      const stored = getChromeStorage();
      expect(stored.clips.length).toBe(2);
    });

    it('should support async updater functions', async () => {
      setChromeStorage({ clips: [] });
      
      await updateClips(async (clips) => {
        return new Promise(resolve => {
          setTimeout(() => resolve([{ id: '1', text: 'Async' }]), 10);
        });
      });
      
      const stored = getChromeStorage();
      expect(stored.clips.length).toBe(1);
    });

    it('should return current clips if updater returns null', async () => {
      const initial = [{ id: '1', text: 'First' }];
      setChromeStorage({ clips: initial });
      
      const result = await updateClips(() => null);
      expect(result).toEqual(initial);
    });
  });

  describe('getFolders', () => {
    it('should return empty array when no folders exist', async () => {
      const folders = await getFolders();
      expect(folders).toEqual([]);
    });

    it('should return stored folders', async () => {
      const mockFolders = [
        { id: 'f1', name: 'Work', createdAt: Date.now() }
      ];
      setChromeStorage({ folders: mockFolders });
      
      const folders = await getFolders();
      expect(folders).toEqual(mockFolders);
    });
  });

  describe('setFolders', () => {
    it('should persist folders to storage', async () => {
      const mockFolders = [{ id: 'f1', name: 'Personal' }];
      await setFolders(mockFolders);
      
      const stored = getChromeStorage();
      expect(stored.folders).toEqual(mockFolders);
    });
  });

  describe('getTagRules', () => {
    it('should return empty array when no tag rules exist', async () => {
      const rules = await getTagRules();
      expect(rules).toEqual([]);
    });

    it('should return stored tag rules', async () => {
      const mockRules = [
        { id: 'r1', type: 'url-contains', pattern: 'github', tags: ['code'] }
      ];
      setChromeStorage({ tagRules: mockRules });
      
      const rules = await getTagRules();
      expect(rules).toEqual(mockRules);
    });
  });

  describe('setTagRules', () => {
    it('should persist tag rules to storage', async () => {
      const mockRules = [
        { id: 'r1', type: 'text-regex', pattern: 'TODO', tags: ['task'] }
      ];
      await setTagRules(mockRules);
      
      const stored = getChromeStorage();
      expect(stored.tagRules).toEqual(mockRules);
    });
  });

  describe('getActiveFolderId', () => {
    it('should return null when no active folder is set', async () => {
      const folderId = await getActiveFolderId();
      expect(folderId).toBeNull();
    });

    it('should return stored active folder ID', async () => {
      setChromeStorage({ activeFolderId: 'folder-123' });
      const folderId = await getActiveFolderId();
      expect(folderId).toBe('folder-123');
    });
  });

  describe('setActiveFolderId', () => {
    it('should persist active folder ID', async () => {
      await setActiveFolderId('folder-456');
      const stored = getChromeStorage();
      expect(stored.activeFolderId).toBe('folder-456');
    });
  });

  describe('getCopyFormat', () => {
    it('should return default format when none is set', async () => {
      const format = await getCopyFormat();
      expect(format).toBe('bullets');
    });

    it('should return stored copy format', async () => {
      setChromeStorage({ copyFormat: 'numbered' });
      const format = await getCopyFormat();
      expect(format).toBe('numbered');
    });
  });

  describe('setCopyFormat', () => {
    it('should persist copy format', async () => {
      await setCopyFormat('plain');
      const stored = getChromeStorage();
      expect(stored.copyFormat).toBe('plain');
    });
  });

  describe('getOverlaySettings', () => {
    it('should return default settings when none exist', async () => {
      const settings = await getOverlaySettings();
      expect(settings).toEqual({
        width: null,
        height: null,
        left: null,
        top: null,
        theme: 'auto',
        reduceMotion: false,
        copyFormat: 'bullets'
      });
    });

    it('should return stored overlay settings', async () => {
      setChromeStorage({
        overlayWidth: 600,
        overlayHeight: 400,
        overlayLeft: 100,
        overlayTop: 50,
        overlayTheme: 'dark',
        overlayReduceMotion: true,
        copyFormat: 'numbered'
      });
      
      const settings = await getOverlaySettings();
      expect(settings).toEqual({
        width: 600,
        height: 400,
        left: 100,
        top: 50,
        theme: 'dark',
        reduceMotion: true,
        copyFormat: 'numbered'
      });
    });
  });

  describe('setOverlayPosition', () => {
    it('should persist overlay position', async () => {
      await setOverlayPosition(200, 150);
      const stored = getChromeStorage();
      expect(stored.overlayLeft).toBe(200);
      expect(stored.overlayTop).toBe(150);
    });
  });

  describe('setOverlaySize', () => {
    it('should persist overlay size', async () => {
      await setOverlaySize(800, 600);
      const stored = getChromeStorage();
      expect(stored.overlayWidth).toBe(800);
      expect(stored.overlayHeight).toBe(600);
    });
  });

  describe('setOverlayTheme', () => {
    it('should persist overlay theme', async () => {
      await setOverlayTheme('light');
      const stored = getChromeStorage();
      expect(stored.overlayTheme).toBe('light');
    });
  });

  describe('setOverlayReduceMotion', () => {
    it('should persist reduce motion preference', async () => {
      await setOverlayReduceMotion(true);
      const stored = getChromeStorage();
      expect(stored.overlayReduceMotion).toBe(true);
    });
  });

  describe('setClipsAndFolders', () => {
    it('should atomically update both clips and folders', async () => {
      const clips = [{ id: '1', text: 'Test' }];
      const folders = [{ id: 'f1', name: 'Work' }];
      
      await setClipsAndFolders(clips, folders);
      
      const stored = getChromeStorage();
      expect(stored.clips).toEqual(clips);
      expect(stored.folders).toEqual(folders);
    });
  });
});
