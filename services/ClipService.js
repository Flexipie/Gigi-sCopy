/**
 * Clip Service
 * High-level clip operations combining storage, dedup, and tagging
 * Follows Dependency Inversion - depends on abstractions (services) not concretions
 */

import { getClips, setClips, getTagRules } from '../storage.js';
import { DedupService } from './DedupService.js';
import { TagRuleEngine } from './TagRuleEngine.js';
import { generateClipId } from '../utils/textUtils.js';
import { CLIP_SOURCES } from '../constants.js';

export class ClipService {
  /**
   * Save a clip with deduplication and tag evaluation
   * @param {Object} clipData - Partial clip data
   * @param {string} clipData.text - Clip text (required)
   * @param {string} [clipData.title] - Clip title
   * @param {string} [clipData.url] - Source URL
   * @param {number} [clipData.createdAt] - Creation timestamp
   * @param {string} [clipData.folderId] - Folder ID
   * @param {string} [clipData.source] - Source type (web/native)
   * @returns {Promise<boolean>} True if saved, false if failed
   */
  static async saveWithDedup(clipData) {
    try {
      const {
        text,
        title = '',
        url = '',
        createdAt = Date.now(),
        folderId = null,
        source = CLIP_SOURCES.WEB
      } = clipData || {};

      // Validate text
      if (!text || !text.trim()) {
        return false;
      }

      // Calculate hash
      const hash = DedupService.calculateHash(text);
      if (!hash) return false;

      // Evaluate tags
      const tagRules = await getTagRules();
      const tags = TagRuleEngine.evaluateRules(tagRules, text, url);

      // Get existing clips
      const clips = await getClips();

      // Check for duplicate
      const dupIndex = DedupService.findDuplicateIndex(clips, text);

      if (dupIndex >= 0) {
        // Merge with existing
        const existing = clips[dupIndex];
        clips[dupIndex] = DedupService.mergeDuplicate(existing, { tags });
      } else {
        // Create new clip
        const newClip = {
          id: generateClipId(),
          text,
          title,
          url,
          createdAt,
          folderId,
          starred: false,
          dupCount: 1,
          hash,
          source,
          tags
        };
        clips.push(newClip);
      }

      // Save
      await setClips(clips);
      return true;
    } catch (error) {
      console.warn('ClipService.saveWithDedup error:', error);
      return false;
    }
  }

  /**
   * Recompute tags for all clips based on current tag rules
   * @returns {Promise<number>} Number of clips updated
   */
  static async recomputeAllTags() {
    try {
      const [clips, tagRules] = await Promise.all([
        getClips(),
        getTagRules()
      ]);

      let updatedCount = 0;

      const updatedClips = clips.map(clip => {
        if (!clip || typeof clip !== 'object') return clip;

        const newTags = TagRuleEngine.recomputeTagsForClip(clip, tagRules);
        
        if (TagRuleEngine.tagsNeedUpdate(clip.tags, newTags)) {
          updatedCount++;
          return { ...clip, tags: newTags };
        }
        
        return clip;
      });

      if (updatedCount > 0) {
        await setClips(updatedClips);
      }

      return updatedCount;
    } catch (error) {
      console.warn('ClipService.recomputeAllTags error:', error);
      return 0;
    }
  }

  /**
   * Validate clip data has required fields
   * @param {Object} clipData - Clip data to validate
   * @returns {boolean} True if valid
   */
  static validateClipData(clipData) {
    if (!clipData || typeof clipData !== 'object') {
      return false;
    }
    
    if (!clipData.text || typeof clipData.text !== 'string') {
      return false;
    }
    
    if (clipData.text.trim().length === 0) {
      return false;
    }
    
    return true;
  }
}
