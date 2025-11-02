/**
 * Integration tests for clip workflows
 * Tests end-to-end scenarios combining multiple services
 */

import { resetChromeStorage, setChromeStorage, getChromeStorage } from '../../__mocks__/chrome.js';
import { ClipService } from '../../services/ClipService.js';
import { getClips, setTagRules, setActiveFolderId } from '../../storage.js';

describe('Clip Workflows Integration', () => {
  beforeEach(() => {
    resetChromeStorage();
  });

  describe('Save workflow', () => {
    it('should save clip with automatic tagging', async () => {
      // Setup: Define tag rules
      await setTagRules([
        { type: 'url-contains', pattern: 'github', tags: ['code', 'dev'] },
        { type: 'text-regex', pattern: 'TODO', tags: ['task'] }
      ]);

      // Action: Save a clip
      const result = await ClipService.saveWithDedup({
        text: 'TODO: Review PR on the new feature',
        url: 'https://github.com/user/repo/pull/123',
        title: 'Pull Request #123'
      });

      // Assert: Clip saved successfully
      expect(result).toBe(true);

      // Assert: Tags were automatically applied
      const clips = await getClips();
      expect(clips).toHaveLength(1);
      expect(clips[0].tags).toContain('code');
      expect(clips[0].tags).toContain('dev');
      expect(clips[0].tags).toContain('task');
    });

    it('should save clip to specified folder', async () => {
      // Action: Save clip with folder specified
      await ClipService.saveWithDedup({
        text: 'Meeting notes from standup',
        title: 'Standup Notes',
        folderId: 'work-folder-123'
      });

      // Assert: Clip assigned to specified folder
      const clips = await getClips();
      expect(clips[0].folderId).toBe('work-folder-123');
    });
  });

  describe('Deduplication workflow', () => {
    it('should deduplicate identical clips and merge tags', async () => {
      // Setup: Tag rules that will apply differently
      await setTagRules([
        { type: 'text-regex', pattern: 'urgent', tags: ['priority'] },
        { type: 'text-regex', pattern: 'bug', tags: ['issue'] }
      ]);

      // Action: Save first version
      await ClipService.saveWithDedup({
        text: 'Fix the urgent bug in login',
        url: 'https://app.example.com'
      });

      let clips = await getClips();
      expect(clips).toHaveLength(1);
      expect(clips[0].dupCount).toBe(1);
      expect(clips[0].tags).toContain('priority');
      expect(clips[0].tags).toContain('issue');

      // Action: Save duplicate with different case/whitespace
      await ClipService.saveWithDedup({
        text: 'FIX THE URGENT BUG IN LOGIN',
        url: 'https://app.example.com'
      });

      // Assert: No new clip created, dupCount incremented
      clips = await getClips();
      expect(clips).toHaveLength(1);
      expect(clips[0].dupCount).toBe(2);
      expect(clips[0].tags).toContain('priority');
      expect(clips[0].tags).toContain('issue');
    });

    it('should update timestamp on duplicate', async () => {
      // Save original
      await ClipService.saveWithDedup({ text: 'original text' });
      const clips1 = await getClips();
      const originalTime = clips1[0].createdAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Save duplicate
      await ClipService.saveWithDedup({ text: 'ORIGINAL TEXT' });
      const clips2 = await getClips();

      // Assert: updatedAt is newer than createdAt
      expect(clips2[0].updatedAt).toBeDefined();
      expect(clips2[0].updatedAt).toBeGreaterThan(originalTime);
    });
  });

  describe('Tag recomputation workflow', () => {
    it('should recompute tags when rules change', async () => {
      // Setup: Save clips with initial rules
      await setTagRules([
        { type: 'url-contains', pattern: 'github', tags: ['code'] }
      ]);

      await ClipService.saveWithDedup({
        text: 'GitHub code review',
        url: 'https://github.com/repo'
      });

      await ClipService.saveWithDedup({
        text: 'Stack Overflow answer',
        url: 'https://stackoverflow.com/questions/123'
      });

      let clips = await getClips();
      expect(clips[0].tags).toEqual(['code']);
      expect(clips[1].tags).toEqual([]);

      // Action: Add new rules and recompute
      await setTagRules([
        { type: 'url-contains', pattern: 'github', tags: ['code'] },
        { type: 'url-contains', pattern: 'stackoverflow', tags: ['qa', 'help'] }
      ]);

      const updatedCount = await ClipService.recomputeAllTags();

      // Assert: Only stackoverflow clip was updated
      expect(updatedCount).toBe(1);
      clips = await getClips();
      expect(clips[0].tags).toEqual(['code']);
      expect(clips[1].tags).toContain('qa');
      expect(clips[1].tags).toContain('help');
    });

    it('should handle removed tag rules', async () => {
      // Setup: Save with tags
      await setTagRules([
        { type: 'text-regex', pattern: 'urgent', tags: ['priority'] }
      ]);

      await ClipService.saveWithDedup({
        text: 'This is urgent!'
      });

      let clips = await getClips();
      expect(clips[0].tags).toEqual(['priority']);

      // Action: Remove all rules and recompute
      await setTagRules([]);
      await ClipService.recomputeAllTags();

      // Assert: Tags removed
      clips = await getClips();
      expect(clips[0].tags).toEqual([]);
    });
  });

  describe('Multi-clip workflow', () => {
    it('should handle saving multiple clips in sequence', async () => {
      await setTagRules([
        { type: 'url-contains', pattern: 'docs', tags: ['documentation'] },
        { type: 'text-regex', pattern: 'API', tags: ['technical'] }
      ]);

      // Save multiple different clips
      const clips = [
        { text: 'API documentation for auth', url: 'https://docs.example.com/auth' },
        { text: 'User guide overview', url: 'https://docs.example.com/guide' },
        { text: 'API error codes', url: 'https://docs.example.com/errors' }
      ];

      for (const clip of clips) {
        await ClipService.saveWithDedup(clip);
      }

      const saved = await getClips();
      expect(saved).toHaveLength(3);
      
      // First and third should have both tags
      expect(saved[0].tags).toContain('documentation');
      expect(saved[0].tags).toContain('technical');
      expect(saved[2].tags).toContain('documentation');
      expect(saved[2].tags).toContain('technical');
      
      // Second only has documentation tag
      expect(saved[1].tags).toEqual(['documentation']);
    });
  });

  describe('Error handling workflow', () => {
    it('should handle invalid clip data gracefully', async () => {
      const result1 = await ClipService.saveWithDedup(null);
      expect(result1).toBe(false);

      const result2 = await ClipService.saveWithDedup({ text: '' });
      expect(result2).toBe(false);

      const result3 = await ClipService.saveWithDedup({ text: '   ' });
      expect(result3).toBe(false);

      // Storage should still be empty
      const clips = await getClips();
      expect(clips).toHaveLength(0);
    });

    it('should handle corrupted storage data', async () => {
      // Setup: Corrupt storage with invalid data
      setChromeStorage({
        clips: [
          null,
          undefined,
          { id: '1', text: 'valid clip' },
          'invalid',
          { id: '2' } // missing text
        ]
      });

      // Action: Try to save new clip
      const result = await ClipService.saveWithDedup({
        text: 'new valid clip'
      });

      // Assert: Should still work
      expect(result).toBe(true);
      const clips = await getClips();
      expect(clips.length).toBeGreaterThan(0);
    });
  });

  describe('Folder assignment workflow', () => {
    it('should save clips to specified folders', async () => {
      await ClipService.saveWithDedup({ text: 'Clip 1', folderId: 'folder-A' });
      await ClipService.saveWithDedup({ text: 'Clip 2', folderId: 'folder-A' });
      await ClipService.saveWithDedup({ text: 'Clip 3', folderId: 'folder-B' });

      const clips = await getClips();
      expect(clips[0].folderId).toBe('folder-A');
      expect(clips[1].folderId).toBe('folder-A');
      expect(clips[2].folderId).toBe('folder-B');
    });

    it('should allow null folder (no folder)', async () => {
      await setActiveFolderId(null);
      await ClipService.saveWithDedup({ text: 'Unfiled clip' });

      const clips = await getClips();
      expect(clips[0].folderId).toBe(null);
    });
  });

  describe('Source tracking workflow', () => {
    it('should track web vs native sources', async () => {
      // Web clip
      await ClipService.saveWithDedup({
        text: 'From web',
        source: 'web'
      });

      // Native clip
      await ClipService.saveWithDedup({
        text: 'From desktop',
        source: 'native'
      });

      const clips = await getClips();
      expect(clips[0].source).toBe('web');
      expect(clips[1].source).toBe('native');
    });
  });
});
