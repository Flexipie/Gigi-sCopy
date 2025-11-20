/**
 * Unit tests for DedupService
 */

import { DedupService } from '../../services/DedupService.js';

describe('DedupService', () => {
  describe('findDuplicateIndex', () => {
    it('should return -1 when clips array is empty', () => {
      const index = DedupService.findDuplicateIndex([], 'test');
      expect(index).toBe(-1);
    });

    it('should return -1 when text is empty', () => {
      const clips = [{ id: '1', text: 'existing' }];
      const index = DedupService.findDuplicateIndex(clips, '');
      expect(index).toBe(-1);
    });

    it('should find duplicate by hash', () => {
      const hash = DedupService.calculateHash('hello world');
      const clips = [
        { id: '1', text: 'hello world', hash }
      ];
      const index = DedupService.findDuplicateIndex(clips, 'HELLO   WORLD');
      expect(index).toBe(0);
    });

    it('should find duplicate by text comparison when no hash', () => {
      const clips = [
        { id: '1', text: 'hello world' }
      ];
      const index = DedupService.findDuplicateIndex(clips, 'Hello World');
      expect(index).toBe(0);
    });

    it('should return -1 when no duplicate exists', () => {
      const clips = [
        { id: '1', text: 'hello world' }
      ];
      const index = DedupService.findDuplicateIndex(clips, 'different text');
      expect(index).toBe(-1);
    });

    it('should handle clips with null/undefined gracefully', () => {
      const clips = [null, undefined, { id: '1', text: 'hello' }];
      const index = DedupService.findDuplicateIndex(clips, 'hello');
      expect(index).toBe(2);
    });
  });

  describe('isDuplicate', () => {
    it('should return true for duplicate', () => {
      const clips = [{ id: '1', text: 'test' }];
      expect(DedupService.isDuplicate(clips, 'test')).toBe(true);
    });

    it('should return false for non-duplicate', () => {
      const clips = [{ id: '1', text: 'test' }];
      expect(DedupService.isDuplicate(clips, 'different')).toBe(false);
    });
  });

  describe('mergeDuplicate', () => {
    it('should increment dupCount', () => {
      const existing = { id: '1', text: 'test', dupCount: 1 };
      const merged = DedupService.mergeDuplicate(existing, {});
      expect(merged.dupCount).toBe(2);
    });

    it('should default dupCount to 1 if missing', () => {
      const existing = { id: '1', text: 'test' };
      const merged = DedupService.mergeDuplicate(existing, {});
      expect(merged.dupCount).toBe(2);
    });

    it('should update updatedAt timestamp', () => {
      const before = Date.now();
      const existing = { id: '1', text: 'test' };
      const merged = DedupService.mergeDuplicate(existing, {});
      expect(merged.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('should preserve existing hash', () => {
      const existing = { id: '1', text: 'test', hash: 'abc123' };
      const merged = DedupService.mergeDuplicate(existing, {});
      expect(merged.hash).toBe('abc123');
    });

    it('should calculate hash if missing', () => {
      const existing = { id: '1', text: 'test' };
      const merged = DedupService.mergeDuplicate(existing, {});
      expect(merged.hash).toBeTruthy();
      expect(typeof merged.hash).toBe('string');
    });

    it('should merge tags uniquely', () => {
      const existing = { id: '1', text: 'test', tags: ['tag1', 'tag2'] };
      const newData = { tags: ['tag2', 'tag3'] };
      const merged = DedupService.mergeDuplicate(existing, newData);
      expect(merged.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle missing tags', () => {
      const existing = { id: '1', text: 'test' };
      const newData = { tags: ['tag1'] };
      const merged = DedupService.mergeDuplicate(existing, newData);
      expect(merged.tags).toEqual(['tag1']);
    });

    it('should filter out falsy tags', () => {
      const existing = { id: '1', text: 'test', tags: ['tag1', null, '', 'tag2'] };
      const newData = { tags: ['tag3', undefined, 'tag4'] };
      const merged = DedupService.mergeDuplicate(existing, newData);
      expect(merged.tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4']);
    });
  });

  describe('calculateHash', () => {
    it('should return hash for valid text', () => {
      const hash = DedupService.calculateHash('test');
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should return empty string for empty text', () => {
      const hash = DedupService.calculateHash('');
      expect(hash).toBe('');
    });

    it('should normalize before hashing', () => {
      const hash1 = DedupService.calculateHash('HELLO WORLD');
      const hash2 = DedupService.calculateHash('hello   world');
      expect(hash1).toBe(hash2);
    });
  });
});
