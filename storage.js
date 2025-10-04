
// Provides typed helpers around chrome.storage.local so background scripts and overlay UI
// share one persistence layer.

const DEFAULT_CLIPS = [];
const DEFAULT_FOLDERS = [];
const DEFAULT_TAG_RULES = [];
const DEFAULT_OVERLAY_THEME = 'auto';
const DEFAULT_OVERLAY_REDUCE_MOTION = false;
const DEFAULT_ACTIVE_FOLDER_ID = null;
const DEFAULT_COPY_FORMAT = 'bullets';
const DEFAULT_OVERLAY_SIZE = null;

/**
 * Internal wrapper around chrome.storage.local.get that returns a promise.
 * @param {Object|string|string[]} keys Keys/defaults to fetch.
 * @returns {Promise<Object>} resolved storage snapshot.
 */
async function storageGet(keys) {
  return await new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        const err = chrome.runtime.lastError;
        if (err) reject(err);
        else resolve(result || {});
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Persist a collection of values into chrome.storage.local.
 * @param {Object} items Map of keys → values to store.
 */
async function storageSet(items) {
  return await new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        const err = chrome.runtime.lastError;
        if (err) reject(err);
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Ensure returned arrays are shallow-copied and fallback to defaults when missing.
 * @param {*} value Value retrieved from storage.
 * @param {Array} fallback Default array if value is not an array.
 * @returns {Array}
 */
function ensureArray(value, fallback = []) {
  return Array.isArray(value) ? value.slice() : fallback.slice();
}

/**
 * Retrieve all stored clips.
 * @returns {Promise<Array>} array of clip objects.
 */
export async function getClips() {
  const { clips = DEFAULT_CLIPS } = await storageGet({ clips: DEFAULT_CLIPS });
  return ensureArray(clips, DEFAULT_CLIPS);
}

/**
 * Replace the clip collection.
 * @param {Array} clips New clip array.
 */
export async function setClips(clips) {
  await storageSet({ clips: ensureArray(clips, DEFAULT_CLIPS) });
}

/**
 * Helper to update clips immutably via a callback.
 * @param {(clips:Array)=>Array|Promise<Array>} updater Callback returning next clips.
 */
export async function updateClips(updater) {
  const current = await getClips();
  const next = await Promise.resolve(updater(current));
  if (!next) return current;
  await setClips(next);
  return next;
}

/**
 * Fetch stored folders.
 */
export async function getFolders() {
  const { folders = DEFAULT_FOLDERS } = await storageGet({ folders: DEFAULT_FOLDERS });
  return ensureArray(folders, DEFAULT_FOLDERS);
}

/**
 * Persist folder list.
 */
export async function setFolders(folders) {
  await storageSet({ folders: ensureArray(folders, DEFAULT_FOLDERS) });
}

/**
 * Update folders via callback and save the result.
 */
export async function updateFolders(updater) {
  const current = await getFolders();
  const next = await Promise.resolve(updater(current));
  if (!next) return current;
  await setFolders(next);
  return next;
}

/**
 * Read the active folder id.
 */
export async function getActiveFolderId() {
  const { activeFolderId = DEFAULT_ACTIVE_FOLDER_ID } = await storageGet({ activeFolderId: DEFAULT_ACTIVE_FOLDER_ID });
  return activeFolderId || null;
}

/**
 * Set the active folder id.
 */
export async function setActiveFolderId(id) {
  await storageSet({ activeFolderId: id || null });
}

/**
 * Load saved tag rules.
 */
export async function getTagRules() {
  const { tagRules = DEFAULT_TAG_RULES } = await storageGet({ tagRules: DEFAULT_TAG_RULES });
  return ensureArray(tagRules, DEFAULT_TAG_RULES);
}

/**
 * Persist tag rule definitions.
 */
export async function setTagRules(tagRules) {
  await storageSet({ tagRules: ensureArray(tagRules, DEFAULT_TAG_RULES) });
}

/**
 * Resolve current overlay theme preference.
 */
export async function getOverlayTheme() {
  const { overlayTheme = DEFAULT_OVERLAY_THEME } = await storageGet({ overlayTheme: DEFAULT_OVERLAY_THEME });
  return overlayTheme || DEFAULT_OVERLAY_THEME;
}

/**
 * Save overlay theme preference.
 */
export async function setOverlayTheme(theme) {
  await storageSet({ overlayTheme: theme || DEFAULT_OVERLAY_THEME });
}

/**
 * Determine whether reduced motion is enabled.
 */
export async function getOverlayReduceMotion() {
  const { overlayReduceMotion = DEFAULT_OVERLAY_REDUCE_MOTION } = await storageGet({ overlayReduceMotion: DEFAULT_OVERLAY_REDUCE_MOTION });
  return !!overlayReduceMotion;
}

/**
 * Toggle reduced motion preference.
 */
export async function setOverlayReduceMotion(enabled) {
  await storageSet({ overlayReduceMotion: !!enabled });
}

/**
 * Read overlay drag position.
 */
export async function getOverlayPosition() {
  const { overlayPos = null } = await storageGet({ overlayPos: null });
  if (!overlayPos || typeof overlayPos !== 'object') return null;
  const { left, top } = overlayPos;
  if (typeof left === 'number' && typeof top === 'number') return { left, top };
  return null;
}

/**
 * Persist overlay drag position.
 */
export async function setOverlayPosition(pos) {
  if (!pos || typeof pos !== 'object') {
    await storageSet({ overlayPos: null });
    return;
  }
  const { left, top } = pos;
  await storageSet({ overlayPos: { left: typeof left === 'number' ? left : 0, top: typeof top === 'number' ? top : 0 } });
}

/**
 * Clear any persisted overlay position.
 */
export async function clearOverlayPosition() {
  await storageSet({ overlayPos: null });
}

/**
 * Bundle theme, motion, and position into a single payload.
 */
export async function getOverlaySettings() {
  const [theme, reduceMotion, pos] = await Promise.all([
    getOverlayTheme(),
    getOverlayReduceMotion(),
    getOverlayPosition()
  ]);
  return { theme, reduceMotion, position: pos };
}

/**
 * Fetch clips, folders, and active folder id together.
 */
export async function getClipsAndFolders() {
  const [{ clips }, { folders, activeFolderId }] = await Promise.all([
    storageGet({ clips: DEFAULT_CLIPS }),
    storageGet({ folders: DEFAULT_FOLDERS, activeFolderId: DEFAULT_ACTIVE_FOLDER_ID })
  ]);
  return {
    clips: ensureArray(clips, DEFAULT_CLIPS),
    folders: ensureArray(folders, DEFAULT_FOLDERS),
    activeFolderId: activeFolderId || null
  };
}

/**
 * Persist any combination of clips, folders, and active folder id.
 */
export async function setClipsAndFolders({ clips, folders, activeFolderId }) {
  const payload = {};
  if (clips) payload.clips = ensureArray(clips, DEFAULT_CLIPS);
  if (folders) payload.folders = ensureArray(folders, DEFAULT_FOLDERS);
  if (typeof activeFolderId !== 'undefined') payload.activeFolderId = activeFolderId || null;
  if (Object.keys(payload).length) await storageSet(payload);
}

/**
 * Convenience helper to fetch arbitrary keys with defaults.
 */
export async function getAll(keysWithDefaults) {
  return await storageGet(keysWithDefaults);
}

/**
 * Resolve current copy-format preference.
 */
export async function getCopyFormat() {
  const { copyFormat = DEFAULT_COPY_FORMAT } = await storageGet({ copyFormat: DEFAULT_COPY_FORMAT });
  return copyFormat || DEFAULT_COPY_FORMAT;
}

/**
 * Persist copy-format preference.
 */
export async function setCopyFormat(format) {
  await storageSet({ copyFormat: format || DEFAULT_COPY_FORMAT });
}

/**
 * Retrieve stored overlay size.
 */
export async function getOverlaySize() {
  const { overlaySize = DEFAULT_OVERLAY_SIZE } = await storageGet({ overlaySize: DEFAULT_OVERLAY_SIZE });
  if (!overlaySize || typeof overlaySize !== 'object') return null;
  const { width, height } = overlaySize;
  if (typeof width === 'number' && typeof height === 'number') return { width, height };
  return null;
}

/**
 * Persist overlay dimensions, guarding against invalid values.
 */
export async function setOverlaySize(size) {
  if (!size || typeof size !== 'object') {
    await storageSet({ overlaySize: null });
    return;
  }
  const { width, height } = size;
  const payload = {};
  if (typeof width === 'number') payload.width = width;
  if (typeof height === 'number') payload.height = height;
  await storageSet({ overlaySize: payload });
}
