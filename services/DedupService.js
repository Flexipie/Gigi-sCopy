/**
 * Deduplication Service
 * Handles clip deduplication logic following Single Responsibility Principle
 */

import { normalizeText, hashString } from '../utils/textUtils.js';

export class DedupService {
  /**
   * Find duplicate clip in collection by hash or text comparison
   * @param {Array} clips - Existing clips
   * @param {string} text - Text to search for
   * @returns {number} Index of duplicate or -1 if not found
   */
  static findDuplicateIndex(clips, text) {
    if (!text || !Array.isArray(clips)) return -1;
    
    const norm = normalizeText(text);
    if (!norm) return -1;
    
    const hash = hashString(norm);
    
    return clips.findIndex(clip => {
      if (!clip) return false;
      
      // Check by hash if available
      if (typeof clip.hash === 'string') {
        return clip.hash === hash;
      }
      
      // Fallback to text comparison
      const clipText = normalizeText(clip.text || '');
      return clipText && hashString(clipText) === hash;
    });
  }

  /**
   * Check if text is a duplicate
   * @param {Array} clips - Existing clips
   * @param {string} text - Text to check
   * @returns {boolean} True if duplicate exists
   */
  static isDuplicate(clips, text) {
    return this.findDuplicateIndex(clips, text) >= 0;
  }

  /**
   * Merge duplicate clip with new data
   * @param {Object} existingClip - The existing clip
   * @param {Object} newData - New clip data to merge
   * @returns {Object} Merged clip
   */
  static mergeDuplicate(existingClip, newData) {
    const dupCount = Number(existingClip.dupCount || 1) + 1;
    const hash = existingClip.hash || hashString(normalizeText(existingClip.text || ''));
    
    // Merge tags (unique)
    const existingTags = Array.isArray(existingClip.tags) 
      ? existingClip.tags.filter(Boolean) 
      : [];
    const newTags = Array.isArray(newData.tags) 
      ? newData.tags.filter(Boolean) 
      : [];
    const mergedTags = Array.from(new Set([...existingTags, ...newTags]));
    
    return {
      ...existingClip,
      dupCount,
      updatedAt: Date.now(),
      hash,
      tags: mergedTags
    };
  }

  /**
   * Calculate hash for text
   * @param {string} text - Text to hash
   * @returns {string} Hash value
   */
  static calculateHash(text) {
    const norm = normalizeText(text);
    return norm ? hashString(norm) : '';
  }
}
