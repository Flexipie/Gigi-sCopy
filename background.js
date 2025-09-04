// Gigi's Copy Tool Background Service Worker (MV3)
// Handles commands, context menu, selection capture, storage, and overlay UI

const MENU_ID = 'quickmulticlip_save_selection';

chrome.runtime.onInstalled.addListener(async () => {
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Save selection to Gigi's Copy Tool",
      contexts: ['selection']
    });
  } catch (e) {
    // Ignore if already exists
  }
});

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

  // 2) Save to storage (prefer tab metadata for title/url) and attach active folder if set
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { clips = [], activeFolderId = null } = await chrome.storage.local.get({ clips: [], activeFolderId: null });
  const clip = {
    id,
    text,
    title: tabMeta?.title || '',
    url: tabMeta?.url || '',
    createdAt: Date.now(),
    folderId: activeFolderId || null
  };
  clips.push(clip);
  await chrome.storage.local.set({ clips });

  // 3) Visual feedback: highlight selection + toast in the correct frame
  if (Array.isArray(best?.rects) && best.rects.length > 0) {
    await injectFlash(tabId, targetFrameId, best.rects);
  }
  await injectToast(tabId, targetFrameId, 'Saved');
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
