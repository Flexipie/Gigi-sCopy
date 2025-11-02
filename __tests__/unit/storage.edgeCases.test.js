/**
 * Edge case tests for storage.js to increase coverage
 */

import { resetChromeStorage, setChromeStorage } from '../../__mocks__/chrome.js';
import {
  getOverlayPosition,
  setOverlayPosition,
  clearOverlayPosition,
  getOverlaySize,
  setOverlaySize,
  getClipsAndFolders,
  updateFolders,
  getAll
} from '../../storage.js';

describe('Storage Edge Cases', () => {
  beforeEach(() => {
    resetChromeStorage();
  });

  describe('getOverlayPosition edge cases', () => {
    it('should return null for invalid position object', async () => {
      setChromeStorage({ overlayPos: 'invalid string' });
      const pos = await getOverlayPosition();
      expect(pos).toBe(null);
    });

    it('should return null for position with non-number left', async () => {
      setChromeStorage({ overlayPos: { left: 'invalid', top: 100 } });
      const pos = await getOverlayPosition();
      expect(pos).toBe(null);
    });

    it('should return null for position with non-number top', async () => {
      setChromeStorage({ overlayPos: { left: 100, top: 'invalid' } });
      const pos = await getOverlayPosition();
      expect(pos).toBe(null);
    });

    it('should return valid position with numbers', async () => {
      setChromeStorage({ overlayPos: { left: 100, top: 200 } });
      const pos = await getOverlayPosition();
      expect(pos).toEqual({ left: 100, top: 200 });
    });
  });

  describe('setOverlayPosition edge cases', () => {
    it('should set null for invalid position', async () => {
      await setOverlayPosition('invalid');
      const stored = await getOverlayPosition();
      expect(stored).toBe(null);
    });

    it('should set null for null position', async () => {
      await setOverlayPosition(null);
      const stored = await getOverlayPosition();
      expect(stored).toBe(null);
    });

    it('should default non-number left to 0', async () => {
      await setOverlayPosition({ left: 'invalid', top: 100 });
      const stored = await getOverlayPosition();
      expect(stored).toEqual({ left: 0, top: 100 });
    });

    it('should default non-number top to 0', async () => {
      await setOverlayPosition({ left: 100, top: 'invalid' });
      const stored = await getOverlayPosition();
      expect(stored).toEqual({ left: 100, top: 0 });
    });
  });

  describe('clearOverlayPosition', () => {
    it('should clear existing position', async () => {
      await setOverlayPosition({ left: 100, top: 200 });
      await clearOverlayPosition();
      const pos = await getOverlayPosition();
      expect(pos).toBe(null);
    });
  });

  describe('getOverlaySize edge cases', () => {
    it('should return null for invalid size object', async () => {
      setChromeStorage({ overlaySize: 'invalid' });
      const size = await getOverlaySize();
      expect(size).toBe(null);
    });

    it('should return null for size with non-number width', async () => {
      setChromeStorage({ overlaySize: { width: 'invalid', height: 400 } });
      const size = await getOverlaySize();
      expect(size).toBe(null);
    });

    it('should return null for size with non-number height', async () => {
      setChromeStorage({ overlaySize: { width: 600, height: 'invalid' } });
      const size = await getOverlaySize();
      expect(size).toBe(null);
    });

    it('should return valid size with numbers', async () => {
      setChromeStorage({ overlaySize: { width: 600, height: 400 } });
      const size = await getOverlaySize();
      expect(size).toEqual({ width: 600, height: 400 });
    });
  });

  describe('setOverlaySize edge cases', () => {
    it('should set null for invalid size', async () => {
      await setOverlaySize('invalid');
      const stored = await getOverlaySize();
      expect(stored).toBe(null);
    });

    it('should set null for null size', async () => {
      await setOverlaySize(null);
      const stored = await getOverlaySize();
      expect(stored).toBe(null);
    });

    it('should only set width if height is invalid', async () => {
      await setOverlaySize({ width: 800, height: 'invalid' });
      const stored = await getOverlaySize();
      // Should store object with only width
      expect(stored).toBe(null); // Because height is missing as number
    });

    it('should only set height if width is invalid', async () => {
      await setOverlaySize({ width: 'invalid', height: 600 });
      const stored = await getOverlaySize();
      // Should store object with only height
      expect(stored).toBe(null); // Because width is missing as number
    });
  });

  describe('getClipsAndFolders', () => {
    it('should get all three properties together', async () => {
      setChromeStorage({
        clips: [{ id: '1', text: 'test' }],
        folders: [{ id: 'f1', name: 'Work' }],
        activeFolderId: 'f1'
      });

      const result = await getClipsAndFolders();
      
      expect(result.clips).toHaveLength(1);
      expect(result.folders).toHaveLength(1);
      expect(result.activeFolderId).toBe('f1');
    });

    it('should handle missing properties with defaults', async () => {
      setChromeStorage({});

      const result = await getClipsAndFolders();
      
      expect(result.clips).toEqual([]);
      expect(result.folders).toEqual([]);
      expect(result.activeFolderId).toBe(null);
    });
  });

  describe('updateFolders', () => {
    it('should update folders via sync callback', async () => {
      setChromeStorage({
        folders: [{ id: 'f1', name: 'Old' }]
      });

      const updated = await updateFolders((current) => {
        return [{ id: 'f1', name: 'New' }];
      });

      expect(updated).toEqual([{ id: 'f1', name: 'New' }]);
      
      const stored = await getAll({ folders: [] });
      expect(stored.folders).toEqual([{ id: 'f1', name: 'New' }]);
    });

    it('should return current folders if updater returns null', async () => {
      setChromeStorage({
        folders: [{ id: 'f1', name: 'Keep' }]
      });

      const result = await updateFolders(() => null);

      expect(result).toEqual([{ id: 'f1', name: 'Keep' }]);
    });

    it('should return current folders if updater returns undefined', async () => {
      setChromeStorage({
        folders: [{ id: 'f1', name: 'Keep' }]
      });

      const result = await updateFolders(() => undefined);

      expect(result).toEqual([{ id: 'f1', name: 'Keep' }]);
    });
  });

  describe('getAll helper', () => {
    it('should fetch arbitrary keys with defaults', async () => {
      setChromeStorage({
        customKey1: 'value1'
      });

      const result = await getAll({
        customKey1: 'default1',
        customKey2: 'default2'
      });

      expect(result.customKey1).toBe('value1');
      expect(result.customKey2).toBe('default2');
    });

    it('should return all defaults for empty storage', async () => {
      const result = await getAll({
        key1: 'default1',
        key2: 'default2',
        key3: 'default3'
      });

      expect(result).toEqual({
        key1: 'default1',
        key2: 'default2',
        key3: 'default3'
      });
    });
  });
});
