// Centralized storage helpers for Gigi's Copy Tool
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

function ensureArray(value, fallback = []) {
  return Array.isArray(value) ? value.slice() : fallback.slice();
}

export async function getClips() {
  const { clips = DEFAULT_CLIPS } = await storageGet({ clips: DEFAULT_CLIPS });
  return ensureArray(clips, DEFAULT_CLIPS);
}

export async function setClips(clips) {
  await storageSet({ clips: ensureArray(clips, DEFAULT_CLIPS) });
}

export async function updateClips(updater) {
  const current = await getClips();
  const next = await Promise.resolve(updater(current));
  if (!next) return current;
  await setClips(next);
  return next;
}

export async function getFolders() {
  const { folders = DEFAULT_FOLDERS } = await storageGet({ folders: DEFAULT_FOLDERS });
  return ensureArray(folders, DEFAULT_FOLDERS);
}

export async function setFolders(folders) {
  await storageSet({ folders: ensureArray(folders, DEFAULT_FOLDERS) });
}

export async function updateFolders(updater) {
  const current = await getFolders();
  const next = await Promise.resolve(updater(current));
  if (!next) return current;
  await setFolders(next);
  return next;
}

export async function getActiveFolderId() {
  const { activeFolderId = DEFAULT_ACTIVE_FOLDER_ID } = await storageGet({ activeFolderId: DEFAULT_ACTIVE_FOLDER_ID });
  return activeFolderId || null;
}

export async function setActiveFolderId(id) {
  await storageSet({ activeFolderId: id || null });
}

export async function getTagRules() {
  const { tagRules = DEFAULT_TAG_RULES } = await storageGet({ tagRules: DEFAULT_TAG_RULES });
  return ensureArray(tagRules, DEFAULT_TAG_RULES);
}

export async function setTagRules(tagRules) {
  await storageSet({ tagRules: ensureArray(tagRules, DEFAULT_TAG_RULES) });
}

export async function getOverlayTheme() {
  const { overlayTheme = DEFAULT_OVERLAY_THEME } = await storageGet({ overlayTheme: DEFAULT_OVERLAY_THEME });
  return overlayTheme || DEFAULT_OVERLAY_THEME;
}

export async function setOverlayTheme(theme) {
  await storageSet({ overlayTheme: theme || DEFAULT_OVERLAY_THEME });
}

export async function getOverlayReduceMotion() {
  const { overlayReduceMotion = DEFAULT_OVERLAY_REDUCE_MOTION } = await storageGet({ overlayReduceMotion: DEFAULT_OVERLAY_REDUCE_MOTION });
  return !!overlayReduceMotion;
}

export async function setOverlayReduceMotion(enabled) {
  await storageSet({ overlayReduceMotion: !!enabled });
}

export async function getOverlayPosition() {
  const { overlayPos = null } = await storageGet({ overlayPos: null });
  if (!overlayPos || typeof overlayPos !== 'object') return null;
  const { left, top } = overlayPos;
  if (typeof left === 'number' && typeof top === 'number') return { left, top };
  return null;
}

export async function setOverlayPosition(pos) {
  if (!pos || typeof pos !== 'object') {
    await storageSet({ overlayPos: null });
    return;
  }
  const { left, top } = pos;
  await storageSet({ overlayPos: { left: typeof left === 'number' ? left : 0, top: typeof top === 'number' ? top : 0 } });
}

export async function clearOverlayPosition() {
  await storageSet({ overlayPos: null });
}

export async function getOverlaySettings() {
  const [theme, reduceMotion, pos] = await Promise.all([
    getOverlayTheme(),
    getOverlayReduceMotion(),
    getOverlayPosition()
  ]);
  return { theme, reduceMotion, position: pos };
}

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

export async function setClipsAndFolders({ clips, folders, activeFolderId }) {
  const payload = {};
  if (clips) payload.clips = ensureArray(clips, DEFAULT_CLIPS);
  if (folders) payload.folders = ensureArray(folders, DEFAULT_FOLDERS);
  if (typeof activeFolderId !== 'undefined') payload.activeFolderId = activeFolderId || null;
  if (Object.keys(payload).length) await storageSet(payload);
}

export async function getAll(keysWithDefaults) {
  return await storageGet(keysWithDefaults);
}

export async function getCopyFormat() {
  const { copyFormat = DEFAULT_COPY_FORMAT } = await storageGet({ copyFormat: DEFAULT_COPY_FORMAT });
  return copyFormat || DEFAULT_COPY_FORMAT;
}

export async function setCopyFormat(format) {
  await storageSet({ copyFormat: format || DEFAULT_COPY_FORMAT });
}

export async function getOverlaySize() {
  const { overlaySize = DEFAULT_OVERLAY_SIZE } = await storageGet({ overlaySize: DEFAULT_OVERLAY_SIZE });
  if (!overlaySize || typeof overlaySize !== 'object') return null;
  const { width, height } = overlaySize;
  if (typeof width === 'number' && typeof height === 'number') return { width, height };
  return null;
}

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
