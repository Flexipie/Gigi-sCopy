/**
 * Unit tests for text utility functions
 */

import { normalizeText, hashString, generateClipId } from '../../utils/textUtils.js';

describe('Text Utils', () => {
  describe('normalizeText', () => {
    it('should collapse multiple spaces into one', () => {
      const result = normalizeText('hello    world');
      expect(result).toBe('hello world');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = normalizeText('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should convert to lowercase', () => {
      const result = normalizeText('Hello WORLD');
      expect(result).toBe('hello world');
    });

    it('should handle newlines and tabs', () => {
      const result = normalizeText('hello\n\tworld');
      expect(result).toBe('hello world');
    });

    it('should handle empty string', () => {
      const result = normalizeText('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
    });

    it('should be idempotent', () => {
      const text = 'Hello   World';
      const normalized = normalizeText(text);
      expect(normalizeText(normalized)).toBe(normalized);
    });
  });

  describe('hashString', () => {
    it('should generate consistent hash for same input', () => {
      const hash1 = hashString('test');
      const hash2 = hashString('test');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = hashString('test1');
      const hash2 = hashString('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return string', () => {
      const hash = hashString('test');
      expect(typeof hash).toBe('string');
    });

    it('should handle empty string', () => {
      const hash = hashString('');
      expect(hash).toBe('0');
    });

    it('should generate same hash for inputs that normalize to same value', () => {
      const text1 = 'Hello World';
      const text2 = 'hello world';
      const hash1 = hashString(normalizeText(text1));
      const hash2 = hashString(normalizeText(text2));
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateClipId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateClipId();
      const id2 = generateClipId();
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp and random part', () => {
      const id = generateClipId();
      expect(id).toMatch(/^\d+-[a-z0-9]{6}$/);
    });

    it('should generate string', () => {
      const id = generateClipId();
      expect(typeof id).toBe('string');
    });

    it('should have consistent format', () => {
      const id = generateClipId();
      const parts = id.split('-');
      expect(parts).toHaveLength(2);
      expect(Number(parts[0])).toBeGreaterThan(0);
      expect(parts[1]).toHaveLength(6);
    });
  });
});
