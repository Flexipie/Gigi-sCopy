// Gigi's Copy Tool Background Service Worker (MV3)
// Handles commands, context menu, selection capture, storage, and overlay UI

import { getActiveFolderId } from './storage.js';
import { ClipService } from './services/ClipService.js';
import { SyncService } from './services/SyncService.js';
import { CONFIG, RESTRICTED_URL_PREFIXES, CLIP_SOURCES } from './constants.js';

const { MENU_ID, NATIVE_HOST, NATIVE_DRAIN_INTERVAL_MINUTES, TAG_RECOMPUTE_DEBOUNCE_MS } = CONFIG;

chrome.runtime.onInstalled.addListener(async () => {
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Save selection to Gigi's Copy Tool",
      contexts: ['selection']
    });
    // poll the native host periodically to import desktop clips
    chrome.alarms.create('desktop-drain', { periodInMinutes: NATIVE_DRAIN_INTERVAL_MINUTES });
    // do an immediate drain on install to avoid waiting for first alarm
    drainDesktopQueue();
    
    // Create sync alarm (sync every 5 minutes)
    chrome.alarms.create('clip-sync', { periodInMinutes: 5 });
    // Do immediate sync on install
    SyncService.syncClips().catch(err => console.warn('Initial sync failed:', err));
  } catch (e) {
    // Ignore if already exists
  }
});

// also recreate the alarm on browser startup (MV3 SW can be restarted)
if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    try { 
      chrome.alarms.create('desktop-drain', { periodInMinutes: NATIVE_DRAIN_INTERVAL_MINUTES });
      chrome.alarms.create('clip-sync', { periodInMinutes: 5 });
    } catch (_) {}
    // immediate drain and sync on startup
    drainDesktopQueue();
    SyncService.syncClips().catch(err => console.warn('Startup sync failed:', err));
  });
}

// Recompute tags retroactively when Tag Rules change (register on every SW start)
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if ('tagRules' in changes) {
      clearTimeout(globalThis.__qmc_recomputeTagsTimer);
      globalThis.__qmc_recomputeTagsTimer = setTimeout(() => {
        ClipService.recomputeAllTags().catch(err => console.warn('Tag recompute error:', err));
      }, TAG_RECOMPUTE_DEBOUNCE_MS);
    }
  });
} catch(_) {}

// All business logic moved to services/

// ---- Alarm handlers ----
if (chrome.alarms && chrome.alarms.onAlarm && typeof chrome.alarms.onAlarm.addListener === 'function') {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === 'desktop-drain') {
      console.log('Native: alarm fired, starting drain...');
      drainDesktopQueue();
    } else if (alarm && alarm.name === 'clip-sync') {
      console.log('Sync: alarm fired, starting sync...');
      SyncService.syncClips().catch(err => console.warn('Periodic sync failed:', err));
    }
  });
}

async function drainDesktopQueue() {
  console.log('Native: drainDesktopQueue() called');
  try {
    console.log('Native: connecting to host:', NATIVE_HOST);
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    console.log('Native: port connected');
    const receivedMsgs = [];
    
    port.onMessage.addListener((msg) => {
      // Collect messages synchronously
      console.log('Native: raw message received:', JSON.stringify(msg));
      if (msg && msg.type === 'clip' && typeof msg.text === 'string') {
        receivedMsgs.push(msg);
        console.log('Native: valid clip received', { id: msg.id, textLength: msg.text.length, preview: msg.text.substring(0, 50) });
      } else {
        console.warn('Native: invalid message format:', msg);
      }
    });
    
    port.onDisconnect.addListener(async () => {
      console.log('Native: port disconnected');
      const err = chrome.runtime.lastError;
      if (err) {
        const msg = String(err.message || '').toLowerCase();
        console.log('Native: disconnect error:', err.message);
        // ignore normal exit noise
        if (!msg.includes('native host has exited')) {
          console.warn('Native host disconnect:', err.message);
        }
      }
      
      // Process all received messages after disconnect
      console.log(`Native: processing ${receivedMsgs.length} clips from queue`);
      const activeFolderId = await getActiveFolderId();
      console.log('Native: active folder:', activeFolderId);
      
      for (let i = 0; i < receivedMsgs.length; i++) {
        const m = receivedMsgs[i];
        console.log(`Native: saving clip ${i + 1}/${receivedMsgs.length}`);
        const createdAt = m.createdAt ? Math.round(Number(m.createdAt) * 1000) : Date.now();
        const app = typeof m.app === 'string' ? m.app : 'Desktop';
        const result = await ClipService.saveWithDedup({
          text: m.text,
          title: app,
          url: '',
          createdAt,
          folderId: activeFolderId || null,
          source: CLIP_SOURCES.NATIVE
        });
        console.log(`Native: clip ${i + 1} save result:`, result);
      }
      
      if (receivedMsgs.length > 0) {
        console.log(`Native: ✓ saved ${receivedMsgs.length} clips to storage`);
      } else {
        console.log('Native: no clips received from host');
      }
    });
    
    // Ask host to drain queued items and exit
    console.log('Native: sending drain message to host');
    port.postMessage({ type: 'drain' });
  } catch (e) {
    console.error('Native messaging error:', e);
    // host may not be installed; ignore quietly
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU_ID && tab?.id != null) {
    // info.selectionText is available, but we recalc to also get rects
    await handleSaveSelection(tab.id, tab);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-selection') {
    const tab = await getActiveTab();
    if (tab?.id != null) await handleSaveSelection(tab.id, tab);
  } else if (command === 'toggle-popup') {
    await openOrToggleUI();
  }
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Sticky window and fullscreen detection removed; overlay is now the single UI

// Toggle the in-page draggable overlay inside the active tab
async function toggleOverlayInActiveTab() {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'ISOLATED',
      files: ['overlay/overlay.js']
    });
  } catch (_) {}
}

// Toggle the in-page overlay in all modes (normal and fullscreen)
async function openOrToggleUI() {
  await toggleOverlayInActiveTab();
}

// Clicking the action toggles the in-page overlay
chrome.action?.onClicked.addListener(async () => {
  await openOrToggleUI();
});

async function handleSaveSelection(tabId, tabMeta) {
  try {
    // Skip restricted pages
    const url = tabMeta?.url || '';
    const isRestricted = RESTRICTED_URL_PREFIXES.some(prefix => url.startsWith(prefix));
    if (isRestricted) {
      console.log('Cannot save selection from restricted page:', url);
      return;
    }

    // 1) Capture selection (text + rects) across all frames
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: 'MAIN',
      func: () => {
        const sel = window.getSelection();
        const text = sel ? sel.toString() : '';
        let rects = [];
        try {
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const clientRects = range.getClientRects();
            rects = Array.from(clientRects).map(r => ({
              x: Math.round(r.left + window.scrollX),
              y: Math.round(r.top + window.scrollY),
              width: Math.round(r.width),
              height: Math.round(r.height)
            }));
          }
        } catch (_) {}
        return { text, rects };
      }
    });

    const frames = (results || []).map(r => ({ frameId: r.frameId, ...(r.result || { text: '', rects: [] }) }));
    const best = frames.reduce((acc, cur) => {
      const len = (cur.text || '').trim().length;
      const accLen = (acc?.text || '').trim().length;
      return len > accLen ? cur : acc;
    }, null);

    const text = (best?.text || '').trim();
    const targetFrameId = typeof best?.frameId === 'number' ? best.frameId : 0;
    if (!text) {
      // Show unobtrusive toast that no selection was found (in top frame)
      await injectToast(tabId, targetFrameId, 'No text selected');
      return;
    }

    // 2) Save to storage with dedup (prefer tab metadata for title/url) and attach active folder if set
    const activeFolderId = await getActiveFolderId();
    await ClipService.saveWithDedup({
      text,
      title: tabMeta?.title || '',
      url: tabMeta?.url || '',
      createdAt: Date.now(),
      folderId: activeFolderId || null,
      source: CLIP_SOURCES.WEB
    });

    // 3) Visual feedback: highlight selection + toast in the correct frame
    if (Array.isArray(best?.rects) && best.rects.length > 0) {
      await injectFlash(tabId, targetFrameId, best.rects);
    }
    await injectToast(tabId, targetFrameId, 'Saved');
  } catch (e) {
    // Silently ignore errors on restricted pages or inaccessible tabs
    console.warn('handleSaveSelection error:', e.message);
  }
}

async function injectFlash(tabId, frameId, rects) {
  const target = { tabId };
  if (typeof frameId === 'number') target.frameIds = [frameId];
  await chrome.scripting.executeScript({
    target,
    world: 'MAIN',
    args: [rects],
    func: (rectsArg) => {
      try {
        const container = document.createElement('div');
        container.className = 'qmc-flash-container';
        container.style.position = 'absolute';
        container.style.left = '0';
        container.style.top = '0';
        container.style.width = '100%';
        const docH = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight || 0,
          document.documentElement.clientHeight
        );
        container.style.height = docH + 'px';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '2147483646';
        container.style.opacity = '1';

        rectsArg.forEach(r => {
          const el = document.createElement('div');
          el.style.position = 'absolute';
          el.style.left = r.x + 'px';
          el.style.top = r.y + 'px';
          el.style.width = r.width + 'px';
          el.style.height = r.height + 'px';
          el.style.boxSizing = 'border-box';
          el.style.background = 'rgba(255, 215, 0, 0.25)'; // gold-ish
          el.style.border = '2px solid rgba(255, 165, 0, 0.8)';
          el.style.borderRadius = '2px';
          el.style.transition = 'opacity 220ms ease';
          container.appendChild(el);
        });

        document.documentElement.appendChild(container);
        setTimeout(() => {
          container.style.transition = 'opacity 250ms ease';
          container.style.opacity = '0';
        }, 450);
        setTimeout(() => container.remove(), 800);
      } catch (_) {}
    }
  });
}

async function injectToast(tabId, frameId, text) {
  const target = { tabId };
  if (typeof frameId === 'number') target.frameIds = [frameId];
  await chrome.scripting.executeScript({
    target,
    world: 'MAIN',
    args: [text],
    func: (message) => {
      try {
        const hostId = 'qmc-toast-host';
        let host = document.getElementById(hostId);
        if (!host) {
          host = document.createElement('div');
          host.id = hostId;
          host.style.position = 'fixed';
          host.style.top = '16px';
          host.style.right = '16px';
          host.style.zIndex = '2147483647';
          host.style.pointerEvents = 'none';
          host.style.display = 'flex';
          host.style.flexDirection = 'column';
          host.style.gap = '8px';
          document.documentElement.appendChild(host);
        }

        const toast = document.createElement('div');
        toast.textContent = message || 'Saved';
        toast.style.pointerEvents = 'auto';
        toast.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        toast.style.fontSize = '12px';
        toast.style.color = '#0b1b29';
        toast.style.background = '#d6f2ff';
        toast.style.border = '1px solid #7fd1ff';
        toast.style.borderRadius = '6px';
        toast.style.padding = '8px 10px';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-4px)';
        toast.style.transition = 'opacity 160ms ease, transform 160ms ease';

        host.appendChild(toast);
        requestAnimationFrame(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(-4px)';
          setTimeout(() => toast.remove(), 200);
        }, message === 'No text selected' ? 900 : 1300);
      } catch (_) {}
    }
  });
}
