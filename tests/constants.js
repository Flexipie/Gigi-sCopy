/**
 * Application constants
 * Centralized configuration values to avoid magic strings/numbers
 */

// Storage Keys
export const STORAGE_KEYS = {
  CLIPS: 'clips',
  FOLDERS: 'folders',
  TAG_RULES: 'tagRules',
  ACTIVE_FOLDER_ID: 'activeFolderId',
  OVERLAY_THEME: 'overlayTheme',
  OVERLAY_REDUCE_MOTION: 'overlayReduceMotion',
  COPY_FORMAT: 'copyFormat',
  OVERLAY_WIDTH: 'overlayWidth',
  OVERLAY_HEIGHT: 'overlayHeight',
  OVERLAY_LEFT: 'overlayLeft',
  OVERLAY_TOP: 'overlayTop'
};

// Default Values
export const DEFAULTS = {
  CLIPS: [],
  FOLDERS: [],
  TAG_RULES: [],
  OVERLAY_THEME: 'auto',
  OVERLAY_REDUCE_MOTION: false,
  ACTIVE_FOLDER_ID: null,
  COPY_FORMAT: 'bullets',
  OVERLAY_SIZE: null
};

// Extension Configuration
export const CONFIG = {
  MENU_ID: 'quickmulticlip_save_selection',
  NATIVE_HOST: 'com.gigi.copytool',
  NATIVE_DRAIN_INTERVAL_MINUTES: 0.083, // ~5 seconds
  TAG_RECOMPUTE_DEBOUNCE_MS: 120,
  CLIP_ID_RANDOM_LENGTH: 6
};

// Tag Rule Types
export const TAG_RULE_TYPES = {
  URL_CONTAINS: 'url-contains',
  TEXT_REGEX: 'text-regex'
};

// Restricted URL Prefixes
export const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:'
];

// Copy Formats
export const COPY_FORMATS = {
  BULLETS: 'bullets',
  NUMBERED: 'numbered',
  PLAIN: 'plain'
};

// Clip Source Types
export const CLIP_SOURCES = {
  WEB: 'web',
  NATIVE: 'native'
};
