/**
 * Text processing utilities
 * Pure functions for text normalization and hashing
 */

/**
 * Normalize text by collapsing whitespace and converting to lowercase
 * Used for deduplication comparisons
 * @param {string} text - Raw text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Generate a simple 32-bit hash from a string
 * Used for fast clip deduplication
 * @param {string} str - String to hash
 * @returns {string} Hash as string
 */
export function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

/**
 * Generate unique ID for clips
 * Format: timestamp-random
 * @returns {string} Unique ID
 */
export function generateClipId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
