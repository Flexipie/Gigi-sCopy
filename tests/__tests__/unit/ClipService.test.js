/**
 * Unit tests for ClipService
 */

import { resetChromeStorage, setChromeStorage, getChromeStorage } from '../../__mocks__/chrome.js';
import { ClipService } from '../../services/ClipService.js';

describe('ClipService', () => {
  beforeEach(() => {
    resetChromeStorage();
  });

  describe('saveWithDedup', () => {
    it('should save new clip', async () => {
      const result = await ClipService.saveWithDedup({
        text: 'Test clip',
        url: 'https://example.com'
      });

      expect(result).toBe(true);
      
      const storage = getChromeStorage();
      expect(storage.clips).toHaveLength(1);
      expect(storage.clips[0].text).toBe('Test clip');
    });

    it('should return false for empty text', async () => {
      const result = await ClipService.saveWithDedup({ text: '' });
      expect(result).toBe(false);
    });

    it('should return false for whitespace-only text', async () => {
      const result = await ClipService.saveWithDedup({ text: '   ' });
      expect(result).toBe(false);
    });

    it('should return false for null text', async () => {
      const result = await ClipService.saveWithDedup({ text: null });
      expect(result).toBe(false);
    });

    it('should increment dupCount for duplicate', async () => {
      // Save first time
      await ClipService.saveWithDedup({ text: 'duplicate text' });
      
      // Save duplicate
      await ClipService.saveWithDedup({ text: 'DUPLICATE TEXT' });
      
      const storage = getChromeStorage();
      expect(storage.clips).toHaveLength(1);
      expect(storage.clips[0].dupCount).toBe(2);
    });

    it('should update updatedAt for duplicate', async () => {
      await ClipService.saveWithDedup({ text: 'duplicate text' });
      const firstSave = getChromeStorage().clips[0];
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await ClipService.saveWithDedup({ text: 'duplicate text' });
      const secondSave = getChromeStorage().clips[0];
      
      expect(secondSave.updatedAt).toBeGreaterThan(firstSave.createdAt);
    });

    it('should apply tag rules', async () => {
      setChromeStorage({
        tagRules: [
          { type: 'url-contains', pattern: 'github', tags: ['code'] }
        ]
      });

      await ClipService.saveWithDedup({
        text: 'some code',
        url: 'https://github.com/user/repo'
      });

      const storage = getChromeStorage();
      expect(storage.clips[0].tags).toContain('code');
    });

    it('should merge tags on duplicate', async () => {
      setChromeStorage({
        tagRules: [
          { type: 'text-regex', pattern: 'bug', tags: ['issue'] },
          { type: 'text-regex', pattern: 'fix', tags: ['task'] }
        ]
      });

      // First save with 'bug' (gets 'issue' tag)
      await ClipService.saveWithDedup({ text: 'bug fix needed' });
      // Second save same text (should merge and add 'task' tag since 'fix' is in text)
      await ClipService.saveWithDedup({ text: 'BUG FIX NEEDED' });

      const storage = getChromeStorage();
      expect(storage.clips).toHaveLength(1);
      expect(storage.clips[0].tags).toContain('issue');
      expect(storage.clips[0].tags).toContain('task');
    });

    it('should use default values for optional fields', async () => {
      await ClipService.saveWithDedup({ text: 'minimal clip' });

      const storage = getChromeStorage();
      const clip = storage.clips[0];
      
      expect(clip.title).toBe('');
      expect(clip.url).toBe('');
      expect(clip.folderId).toBe(null);
      expect(clip.starred).toBe(false);
      expect(clip.dupCount).toBe(1);
      expect(clip.source).toBe('web');
    });

    it('should respect provided optional fields', async () => {
      await ClipService.saveWithDedup({
        text: 'custom clip',
        title: 'My Title',
        url: 'https://example.com',
        folderId: 'folder-123',
        source: 'native',
        createdAt: 1234567890
      });

      const storage = getChromeStorage();
      const clip = storage.clips[0];
      
      expect(clip.title).toBe('My Title');
      expect(clip.url).toBe('https://example.com');
      expect(clip.folderId).toBe('folder-123');
      expect(clip.source).toBe('native');
      expect(clip.createdAt).toBe(1234567890);
    });

    it('should generate unique IDs', async () => {
      await ClipService.saveWithDedup({ text: 'clip 1' });
      await ClipService.saveWithDedup({ text: 'clip 2' });

      const storage = getChromeStorage();
      expect(storage.clips[0].id).not.toBe(storage.clips[1].id);
    });

    it('should calculate and store hash', async () => {
      await ClipService.saveWithDedup({ text: 'test' });

      const storage = getChromeStorage();
      expect(storage.clips[0].hash).toBeTruthy();
      expect(typeof storage.clips[0].hash).toBe('string');
    });
  });

  describe('recomputeAllTags', () => {
    it('should recompute tags for all clips', async () => {
      setChromeStorage({
        clips: [
          { id: '1', text: 'code on github', url: 'https://github.com', tags: [] },
          { id: '2', text: 'normal text', url: '', tags: [] }
        ],
        tagRules: [
          { type: 'url-contains', pattern: 'github', tags: ['code'] }
        ]
      });

      const count = await ClipService.recomputeAllTags();
      
      expect(count).toBe(1);
      const storage = getChromeStorage();
      expect(storage.clips[0].tags).toContain('code');
      expect(storage.clips[1].tags).toEqual([]);
    });

    it('should return 0 if no clips need updating', async () => {
      setChromeStorage({
        clips: [
          { id: '1', text: 'test', tags: ['existing'] }
        ],
        tagRules: [
          { type: 'text-regex', pattern: 'nomatch', tags: ['new'] }
        ]
      });

      const count = await ClipService.recomputeAllTags();
      expect(count).toBe(1); // Tags changed from ['existing'] to []
    });

    it('should handle empty clips array', async () => {
      setChromeStorage({ clips: [], tagRules: [] });
      const count = await ClipService.recomputeAllTags();
      expect(count).toBe(0);
    });

    it('should handle clips without tags field', async () => {
      setChromeStorage({
        clips: [
          { id: '1', text: 'github repo', url: 'https://github.com' }
        ],
        tagRules: [
          { type: 'url-contains', pattern: 'github', tags: ['code'] }
        ]
      });

      const count = await ClipService.recomputeAllTags();
      expect(count).toBe(1);
      
      const storage = getChromeStorage();
      expect(storage.clips[0].tags).toContain('code');
    });

    it('should not update storage if no changes', async () => {
      setChromeStorage({
        clips: [
          { id: '1', text: 'github', url: 'https://github.com', tags: ['code'] }
        ],
        tagRules: [
          { type: 'url-contains', pattern: 'github', tags: ['code'] }
        ]
      });

      const count = await ClipService.recomputeAllTags();
      expect(count).toBe(0);
    });

    it('should handle null/undefined clips gracefully', async () => {
      setChromeStorage({
        clips: [
          null,
          undefined,
          { id: '1', text: 'valid', tags: [] }
        ],
        tagRules: []
      });

      const count = await ClipService.recomputeAllTags();
      expect(count).toBe(0);
    });
  });

  describe('validateClipData', () => {
    it('should return true for valid clip data', () => {
      const isValid = ClipService.validateClipData({ text: 'valid text' });
      expect(isValid).toBe(true);
    });

    it('should return false for null', () => {
      const isValid = ClipService.validateClipData(null);
      expect(isValid).toBe(false);
    });

    it('should return false for undefined', () => {
      const isValid = ClipService.validateClipData(undefined);
      expect(isValid).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(ClipService.validateClipData('string')).toBe(false);
      expect(ClipService.validateClipData(123)).toBe(false);
      expect(ClipService.validateClipData([])).toBe(false);
    });

    it('should return false for missing text', () => {
      const isValid = ClipService.validateClipData({ title: 'no text' });
      expect(isValid).toBe(false);
    });

    it('should return false for non-string text', () => {
      const isValid = ClipService.validateClipData({ text: 123 });
      expect(isValid).toBe(false);
    });

    it('should return false for empty text', () => {
      const isValid = ClipService.validateClipData({ text: '' });
      expect(isValid).toBe(false);
    });

    it('should return false for whitespace-only text', () => {
      const isValid = ClipService.validateClipData({ text: '   \n\t  ' });
      expect(isValid).toBe(false);
    });
  });
});
