/**
 * Unit tests for TagRuleEngine
 */

import { TagRuleEngine } from '../../services/TagRuleEngine.js';
import { TAG_RULE_TYPES } from '../../constants.js';

describe('TagRuleEngine', () => {
  describe('evaluateRules', () => {
    it('should return empty array for empty rules', () => {
      const tags = TagRuleEngine.evaluateRules([], 'test', 'https://example.com');
      expect(tags).toEqual([]);
    });

    it('should return empty array for null rules', () => {
      const tags = TagRuleEngine.evaluateRules(null, 'test', 'https://example.com');
      expect(tags).toEqual([]);
    });

    it('should evaluate URL contains rules', () => {
      const rules = [
        { type: 'url-contains', pattern: 'github', tags: ['code', 'dev'] }
      ];
      const tags = TagRuleEngine.evaluateRules(rules, 'some text', 'https://github.com/user/repo');
      expect(tags).toContain('code');
      expect(tags).toContain('dev');
    });

    it('should evaluate text regex rules', () => {
      const rules = [
        { type: 'text-regex', pattern: 'TODO', tags: ['task'] }
      ];
      const tags = TagRuleEngine.evaluateRules(rules, 'TODO: fix bug', '');
      expect(tags).toContain('task');
    });

    it('should combine tags from multiple rules', () => {
      const rules = [
        { type: 'url-contains', pattern: 'github', tags: ['code'] },
        { type: 'text-regex', pattern: 'bug', tags: ['issue'] }
      ];
      const tags = TagRuleEngine.evaluateRules(rules, 'fix bug', 'https://github.com');
      expect(tags).toContain('code');
      expect(tags).toContain('issue');
    });

    it('should deduplicate tags', () => {
      const rules = [
        { type: 'url-contains', pattern: 'github', tags: ['code'] },
        { type: 'url-contains', pattern: 'git', tags: ['code'] }
      ];
      const tags = TagRuleEngine.evaluateRules(rules, 'text', 'https://github.com');
      expect(tags).toEqual(['code']);
    });

    it('should skip invalid rules', () => {
      const rules = [
        null,
        undefined,
        'invalid',
        { type: 'url-contains', pattern: 'github', tags: ['code'] }
      ];
      const tags = TagRuleEngine.evaluateRules(rules, 'text', 'https://github.com');
      expect(tags).toEqual(['code']);
    });
  });

  describe('evaluateRule', () => {
    it('should return empty array if no tags defined', () => {
      const rule = { type: 'url-contains', pattern: 'test', tags: [] };
      const tags = TagRuleEngine.evaluateRule(rule, 'text', 'url');
      expect(tags).toEqual([]);
    });

    it('should return empty array if no pattern', () => {
      const rule = { type: 'url-contains', pattern: '', tags: ['tag1'] };
      const tags = TagRuleEngine.evaluateRule(rule, 'text', 'url');
      expect(tags).toEqual([]);
    });

    it('should filter out empty/null tags', () => {
      const rule = { 
        type: 'url-contains', 
        pattern: 'test', 
        tags: ['tag1', '', null, undefined, 'tag2'] 
      };
      const tags = TagRuleEngine.evaluateRule(rule, 'text', 'test');
      expect(tags).toEqual(['tag1', 'tag2']);
    });

    it('should return empty array for unknown rule type', () => {
      const rule = { type: 'unknown-type', pattern: 'test', tags: ['tag1'] };
      const tags = TagRuleEngine.evaluateRule(rule, 'text', 'url');
      expect(tags).toEqual([]);
    });
  });

  describe('evaluateUrlContains', () => {
    it('should match case-insensitively', () => {
      const tags = TagRuleEngine.evaluateUrlContains(
        'https://GITHUB.com',
        'github',
        ['code']
      );
      expect(tags).toEqual(['code']);
    });

    it('should not match if pattern not in URL', () => {
      const tags = TagRuleEngine.evaluateUrlContains(
        'https://example.com',
        'github',
        ['code']
      );
      expect(tags).toEqual([]);
    });

    it('should match partial strings', () => {
      const tags = TagRuleEngine.evaluateUrlContains(
        'https://stackoverflow.com/questions',
        'stack',
        ['qa']
      );
      expect(tags).toEqual(['qa']);
    });
  });

  describe('evaluateTextRegex', () => {
    it('should match regex pattern', () => {
      const tags = TagRuleEngine.evaluateTextRegex(
        'TODO: fix this',
        'TODO',
        ['task']
      );
      expect(tags).toEqual(['task']);
    });

    it('should match case-insensitively', () => {
      const tags = TagRuleEngine.evaluateTextRegex(
        'todo: fix this',
        'TODO',
        ['task']
      );
      expect(tags).toEqual(['task']);
    });

    it('should handle complex regex', () => {
      const tags = TagRuleEngine.evaluateTextRegex(
        'Email: test@example.com',
        '[a-z]+@[a-z]+\\.[a-z]+',
        ['contact']
      );
      expect(tags).toEqual(['contact']);
    });

    it('should return empty array for invalid regex', () => {
      const tags = TagRuleEngine.evaluateTextRegex(
        'some text',
        '[invalid(regex',
        ['tag']
      );
      expect(tags).toEqual([]);
    });

    it('should not match if pattern not found', () => {
      const tags = TagRuleEngine.evaluateTextRegex(
        'some text',
        'NOTFOUND',
        ['tag']
      );
      expect(tags).toEqual([]);
    });
  });

  describe('recomputeTagsForClip', () => {
    it('should compute tags for clip', () => {
      const clip = { text: 'TODO: fix bug', url: 'https://github.com' };
      const rules = [
        { type: 'url-contains', pattern: 'github', tags: ['code'] },
        { type: 'text-regex', pattern: 'TODO', tags: ['task'] }
      ];
      const tags = TagRuleEngine.recomputeTagsForClip(clip, rules);
      expect(tags).toContain('code');
      expect(tags).toContain('task');
    });

    it('should handle clip without text/url', () => {
      const clip = { id: '1' };
      const rules = [
        { type: 'url-contains', pattern: 'github', tags: ['code'] }
      ];
      const tags = TagRuleEngine.recomputeTagsForClip(clip, rules);
      expect(tags).toEqual([]);
    });

    it('should handle null clip', () => {
      const tags = TagRuleEngine.recomputeTagsForClip(null, []);
      expect(tags).toEqual([]);
    });
  });

  describe('tagsNeedUpdate', () => {
    it('should return false for identical tags', () => {
      const needsUpdate = TagRuleEngine.tagsNeedUpdate(
        ['tag1', 'tag2'],
        ['tag1', 'tag2']
      );
      expect(needsUpdate).toBe(false);
    });

    it('should return false for same tags in different order', () => {
      const needsUpdate = TagRuleEngine.tagsNeedUpdate(
        ['tag2', 'tag1'],
        ['tag1', 'tag2']
      );
      expect(needsUpdate).toBe(false);
    });

    it('should return true for different tags', () => {
      const needsUpdate = TagRuleEngine.tagsNeedUpdate(
        ['tag1'],
        ['tag2']
      );
      expect(needsUpdate).toBe(true);
    });

    it('should return true for different number of tags', () => {
      const needsUpdate = TagRuleEngine.tagsNeedUpdate(
        ['tag1'],
        ['tag1', 'tag2']
      );
      expect(needsUpdate).toBe(true);
    });

    it('should handle empty arrays', () => {
      const needsUpdate = TagRuleEngine.tagsNeedUpdate([], []);
      expect(needsUpdate).toBe(false);
    });

    it('should filter out falsy tags before comparing', () => {
      const needsUpdate = TagRuleEngine.tagsNeedUpdate(
        ['tag1', null, ''],
        ['tag1']
      );
      expect(needsUpdate).toBe(false);
    });
  });
});
