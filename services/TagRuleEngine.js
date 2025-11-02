/**
 * Tag Rule Engine
 * Evaluates tag rules and applies tags to clips
 * Follows Open/Closed Principle - easy to extend with new rule types
 */

import { TAG_RULE_TYPES } from '../constants.js';

export class TagRuleEngine {
  /**
   * Evaluate all tag rules against text and URL
   * @param {Array} tagRules - Array of tag rule objects
   * @param {string} text - Clip text
   * @param {string} url - Clip URL
   * @returns {Array<string>} Array of matched tags
   */
  static evaluateRules(tagRules, text, url) {
    try {
      const rules = Array.isArray(tagRules) ? tagRules : [];
      if (!rules.length) return [];
      
      const matchedTags = new Set();
      const textStr = String(text || '');
      const urlStr = String(url || '');
      
      for (const rule of rules) {
        if (!rule || typeof rule !== 'object') continue;
        
        const tags = this.evaluateRule(rule, textStr, urlStr);
        tags.forEach(tag => matchedTags.add(tag));
      }
      
      return Array.from(matchedTags);
    } catch (error) {
      console.warn('TagRuleEngine.evaluateRules error:', error);
      return [];
    }
  }

  /**
   * Evaluate a single tag rule
   * @param {Object} rule - Tag rule object
   * @param {string} text - Clip text
   * @param {string} url - Clip URL
   * @returns {Array<string>} Matched tags from this rule
   */
  static evaluateRule(rule, text, url) {
    const { type, pattern, tags } = rule;
    
    // Validate rule has tags
    const ruleTags = Array.isArray(tags) 
      ? tags.map(t => String(t || '').trim()).filter(Boolean) 
      : [];
    
    if (ruleTags.length === 0) return [];
    if (!pattern) return [];
    
    const patternStr = String(pattern);
    
    // Evaluate based on rule type
    switch (type) {
      case TAG_RULE_TYPES.URL_CONTAINS:
        return this.evaluateUrlContains(url, patternStr, ruleTags);
      
      case TAG_RULE_TYPES.TEXT_REGEX:
        return this.evaluateTextRegex(text, patternStr, ruleTags);
      
      default:
        return [];
    }
  }

  /**
   * Evaluate URL contains rule
   * @param {string} url - URL to check
   * @param {string} pattern - Pattern to search for
   * @param {Array<string>} tags - Tags to return if matched
   * @returns {Array<string>} Tags if matched, empty array otherwise
   */
  static evaluateUrlContains(url, pattern, tags) {
    if (url.toLowerCase().includes(pattern.toLowerCase())) {
      return tags;
    }
    return [];
  }

  /**
   * Evaluate text regex rule
   * @param {string} text - Text to check
   * @param {string} pattern - Regex pattern
   * @param {Array<string>} tags - Tags to return if matched
   * @returns {Array<string>} Tags if matched, empty array otherwise
   */
  static evaluateTextRegex(text, pattern, tags) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(text)) {
        return tags;
      }
    } catch (error) {
      // Invalid regex - silently ignore
      console.warn('Invalid regex pattern:', pattern, error);
    }
    return [];
  }

  /**
   * Recompute tags for a single clip
   * @param {Object} clip - Clip object
   * @param {Array} tagRules - Tag rules to evaluate
   * @returns {Array<string>} New tags for the clip
   */
  static recomputeTagsForClip(clip, tagRules) {
    if (!clip || typeof clip !== 'object') return [];
    return this.evaluateRules(tagRules, clip.text || '', clip.url || '');
  }

  /**
   * Check if clip tags need updating
   * @param {Array<string>} oldTags - Current tags
   * @param {Array<string>} newTags - Computed tags
   * @returns {boolean} True if tags differ
   */
  static tagsNeedUpdate(oldTags, newTags) {
    const oldSet = new Set(Array.isArray(oldTags) ? oldTags.filter(Boolean) : []);
    const newSet = new Set(Array.isArray(newTags) ? newTags.filter(Boolean) : []);
    
    if (oldSet.size !== newSet.size) return true;
    
    for (const tag of oldSet) {
      if (!newSet.has(tag)) return true;
    }
    
    return false;
  }
}
