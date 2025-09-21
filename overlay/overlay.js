// Gigi's Copy Tool In-Page Overlay (toggle)
// Injected via chrome.scripting.executeScript to show/hide a draggable overlay inside the page.
(() => {
  const HOST_ID = 'qmc-overlay-host';
  const SHADOW_ID = 'qmc-overlay-shadow-root';

  const existing = document.getElementById(HOST_ID);
  if (existing) {
    // Toggle off: remove overlay entirely
    existing.remove();
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.position = 'fixed';
  host.style.top = '20px';
  host.style.right = '20px';
  host.style.zIndex = '2147483646';
  host.style.width = '380px';
  host.style.maxWidth = '90vw';
  host.style.maxHeight = '80vh';
  host.style.pointerEvents = 'auto';
  host.style.overflow = 'hidden';
  host.style.resize = 'both';

  // Restore position if saved
  try {
    chrome.storage.local.get('overlayPos', ({ overlayPos }) => {
      if (overlayPos && typeof overlayPos.left === 'number' && typeof overlayPos.top === 'number') {
        host.style.left = overlayPos.left + 'px';
        host.style.top = overlayPos.top + 'px';
        host.style.right = 'auto';
      }
    });
  } catch (_) {}

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      .wrap {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #e5edf5;
        background: #0b1220;
        border: 1px solid #1f2b45;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        background: #0f172a;
        border-bottom: 1px solid #172035;
        cursor: move;
        user-select: none;
      }
      .title { font-weight: 700; font-size: 13px; letter-spacing: 0.2px; font-family: "SF Pro Rounded", "Segoe UI Rounded", Inter, Poppins, "Avenir Next Rounded", Nunito, Quicksand, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
      .actions { display: flex; gap: 6px; }
      button {
        appearance: none; background: #0b1220; color: #e5edf5; border: 1px solid #1f2b45;
        padding: 4px 8px; border-radius: 6px; font-size: 12px; cursor: pointer;
      }
      button:hover { border-color: #2a3a60; }
      .btn-primary { border-color: #7fd1ff; }
      .btn-danger { border-color: #ef4444aa; color: #ffd3d3; }
      .btn-ghost  { background: transparent; border-color: transparent; color: #9aa4b2; }

      .toolbar { padding: 6px 8px; background: #0b1220; border-bottom: 1px solid #172035; display: flex; gap: 6px; align-items: center; }
      .toolbar input[type="search"] { width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid #1f2b45; background: #0f172a; color: #e5edf5; font-size: 12px; outline: none; }
      .toolbar input[type="search"]::placeholder { color: #7d8ba1; }

      .body { padding: 8px; flex: 1; overflow: auto; }
      .empty { color: #9aa4b2; padding: 10px; font-size: 12px; }
      ul.clips { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .clip { background: #111827; border: 1px solid #1f2b45; border-radius: 8px; padding: 8px; display: grid; grid-template-columns: 1fr auto; gap: 6px; position: relative; }
      .text { white-space: pre-wrap; word-wrap: break-word; font-size: 12px; }
      .meta { color: #9aa4b2; font-size: 10.5px; margin-top: 4px; }
      .meta a { color: #38bdf8; text-decoration: none; word-break: break-all; }
      .meta a:hover { text-decoration: underline; }
      .tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
      .tag { font-size: 10px; padding: 2px 6px; border: 1px solid #2a3a60; border-radius: 999px; color: #c7d2e0; background: transparent; }

      .btn-star { width: 30px; height: 30px; min-width: 30px; text-align: center; border-color: #2a3a60; background: transparent; color: #e5edf5; padding: 0; }
      .btn-star.starred { color: #0b1b29; background: #ffd166; border-color: #ffd166; }

      #toast { position: absolute; right: 10px; bottom: 10px; background: #d6f2ff; color: #0b1b29; border: 1px solid #7fd1ff; border-radius: 6px; padding: 6px 8px; font-size: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.25); opacity: 0; transform: translateY(4px); transition: opacity 160ms ease, transform 160ms ease; pointer-events: auto; display: inline-flex; align-items: center; gap: 6px; }
      #toast button { background: #7fd1ff; border: 1px solid #7fd1ff; color: #0b1b29; padding: 2px 6px; border-radius: 4px; font-size: 12px; cursor: pointer; }

      /* Outlined buttons with pastel cyan accents */
      button { background: transparent; border: 1px solid #1f2b45; color: #e5edf5; }
      .btn-primary { background: transparent; border-color: #7fd1ff; color: #7fd1ff; }
      .btn-primary:hover { background: #7fd1ff22; }
      .btn-danger { background: transparent; border-color: #ef4444aa; color: #ffb4b4; }
      .btn-danger:hover { background: #ef4444; border-color: #ef4444; color: #ffffff; }
      .btn-ghost  { background: transparent; border-color: transparent; color: #cbd5e1; }
      button:hover { border-color: #2a3a60; }
      button:focus-visible { outline: 2px solid #7fd1ff; outline-offset: 2px; }

      /* Toolbar input/select */
      .toolbar select { padding: 6px 8px; border-radius: 6px; border: 1px solid #1f2b45; background: #0f172a; color: #e5edf5; font-size: 12px; }

      /* Resize handle */
      #resize-handle { position: absolute; width: 18px; height: 18px; right: 6px; bottom: 6px; cursor: nwse-resize; opacity: 0.9; z-index: 2; }
      #resize-handle::before { content: ""; position: absolute; right: 3px; bottom: 3px; width: 12px; height: 12px; border-right: 2px solid #2a3a60; border-bottom: 2px solid #2a3a60; }

      /* Card hover and collapsed text */
      .clip { transition: box-shadow 120ms ease, border-color 120ms ease; }
      .clip:hover { border-color: #2a3a60; box-shadow: 0 2px 12px rgba(0,0,0,0.25); }
      .text { line-height: 1.35; position: relative; }
      .clip.collapsed .text { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
      .clip.collapsed .text::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 24px; background: linear-gradient(to bottom, rgba(11,18,32,0), rgba(11,18,32,1)); pointer-events: none; }
      .btns { display: grid; grid-template-columns: repeat(2, 30px); grid-auto-rows: 30px; gap: 4px; align-self: start; }
      .icon-btn { width: 30px; height: 30px; min-width: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 12px; line-height: 1; }
      /* Slightly more obvious hover animations for copy and favourite */
      .icon-btn, .btn-star { transition: transform 140ms ease, background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease; }
      /* Copy button (scoped to clip action area only) */
      ul.clips .btns .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #7fd1ff; background: #7fd1ff22; color: #d6f2ff; box-shadow: 0 2px 10px rgba(0,0,0,0.18); }
      ul.clips .btns .icon-btn.btn-ghost:active { transform: translateY(0) scale(0.97); }
      /* Generic lift for all icon buttons in clip actions (edit, copy, delete, etc.) */
      ul.clips .btns .icon-btn:hover { transform: translateY(-1px) scale(1.06); }
      ul.clips .btns .icon-btn:active { transform: translateY(0) scale(0.97); }
      /* Favourite (star) */
      ul.clips .btns .btn-star:hover { transform: translateY(-1px) scale(1.06); box-shadow: 0 0 0 2px #ffd16655; }
      ul.clips .btns .btn-star:not(.starred):hover { background: #ffd16622; border-color: #ffd166; color: #ffd166; }
      ul.clips .btns .btn-star:active { transform: translateY(0) scale(0.97); }
      .left { position: relative; }
      .expand-btn { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; min-width: 18px; padding: 0; font-size: 11px; line-height: 1; border-color: transparent; color: #9aa4b2; background: transparent; }
      .expand-btn:hover { color: #cbd5e1; }
      /* Toolbar icon buttons (folder add/delete) */
      .toolbar .icon-btn { width: 28px; height: 28px; min-width: 28px; padding: 0; }
      .toolbar .icon-btn:hover { transform: translateY(-1px) scale(1.06); }
      .toolbar .icon-btn:active { transform: translateY(0) scale(0.97); }
      /* Default accent for toolbar ghost icon buttons */
      .toolbar .icon-btn.btn-ghost:hover { border-color: #7fd1ff; background: #7fd1ff22; color: #d6f2ff; box-shadow: 0 2px 10px rgba(0,0,0,0.18); }
      .text.editing { outline: 2px solid #7fd1ff; background: #0f172a; border-radius: 6px; padding: 4px; }
      .clip:focus-within { border-color: #7fd1ff; box-shadow: 0 0 0 2px #7fd1ff33; }
      .clip.selected { border-color: #7fd1ff; box-shadow: 0 0 0 2px #7fd1ff33; }
      .edit-input { width: 100%; min-height: 96px; resize: vertical; border: 1px solid #1f2b45; background: #0f172a; color: #e5edf5; border-radius: 6px; padding: 6px; font-size: 12px; }

      /* Settings popover */
      .settings-popover { position: absolute; top: 40px; right: 8px; background: #0b1220; border: 1px solid #1f2b45; border-radius: 8px; padding: 8px; min-width: 200px; box-shadow: 0 8px 28px rgba(0,0,0,0.35); z-index: 10; }
      .settings-popover h4 { margin: 4px 0 8px; font-size: 12px; color: #cbd5e1; font-weight: 600; }
      .settings-popover .row { display: flex; gap: 8px; align-items: center; font-size: 12px; padding: 4px 0; color: inherit; }
      .settings-popover label { display: flex; gap: 6px; align-items: center; cursor: pointer; }
      .settings-popover hr { border: 0; border-top: 1px solid #172035; margin: 6px 0; }

      /* Light theme overrides */
      @media (prefers-color-scheme: light) {
        .wrap { color: #0b1b29; background: #ffffff; border-color: #d3e0ef; }
        .header { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
        .toolbar { background: #ffffff; border-bottom: 1px solid #e2e8f0; }
        .toolbar input[type="search"], .toolbar select { background: #f8fafc; color: #0b1b29; border-color: #d3e0ef; }
        .clip { background: #f8fafc; border-color: #e2e8f0; }
        .meta { color: #475569; }
        .meta a { color: #0ea5e9; }
        button { background: transparent; border-color: #c7e3ff; color: #0b1b29; }
        .btn-primary { background: transparent; border-color: #7fd1ff; color: #0369a1; }
        .btn-primary:hover { background: #dff3ff; }
        .btn-danger { background: transparent; border-color: #ef4444aa; color: #b91c1c; }
        .btn-danger:hover { background: #dc2626; border-color: #dc2626; color: #ffffff; }
        .btn-ghost  { background: transparent; border-color: transparent; color: #334155; }
        .btn-star { background: transparent; border-color: #e2e8f0; color: #0b1b29; }
        .btn-star.starred { background: #ffd166; border-color: #ffd166; color: #0b1b29; }
        #toast { background: #e6f7ff; color: #083041; border-color: #b6e6ff; }
        .clip.collapsed .text::after { background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); }
        .edit-input { background: #ffffff; color: #0b1b29; border-color: #d3e0ef; }
        .tag { border-color: #e2e8f0; color: #334155; }
        .expand-btn { color: #64748b; }
        .settings-popover { background: #ffffff; border-color: #e2e8f0; }
        /* Stronger hover cue for copy & star in light mode */
        ul.clips .btns .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #38bdf8; background: #e8f6ff; color: #075985; box-shadow: 0 2px 10px rgba(2, 132, 199, 0.20); }
        /* Match toolbar ghost icon buttons with same accent */
        .toolbar .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #38bdf8; background: #e8f6ff; color: #075985; box-shadow: 0 2px 10px rgba(2, 132, 199, 0.20); }
        ul.clips .btns .icon-btn.btn-ghost:active { transform: translateY(0) scale(0.97); }
        ul.clips .btns .btn-star:hover { transform: translateY(-1px) scale(1.06); box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.30); }
        ul.clips .btns .btn-star:not(.starred):hover { background: #fff7cc; border-color: #facc15; color: #a16207; }
      }

      /* Dark theme (Auto) hover tuning */
      @media (prefers-color-scheme: dark) {
        /* Stronger hover cue for copy & star in dark mode */
        ul.clips .btns .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #7fd1ff; background: #7fd1ff22; color: #e6f6ff; box-shadow: 0 2px 12px rgba(0,0,0,0.28); }
        /* Match toolbar ghost icon buttons with same accent */
        .toolbar .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #7fd1ff; background: #7fd1ff22; color: #e6f6ff; box-shadow: 0 2px 12px rgba(0,0,0,0.28); }
        ul.clips .btns .icon-btn.btn-ghost:active { transform: translateY(0) scale(0.97); }
        ul.clips .btns .btn-star:hover { transform: translateY(-1px) scale(1.06); box-shadow: 0 0 0 2px rgba(255, 209, 102, 0.35); }
        ul.clips .btns .btn-star:not(.starred):hover { background: #ffd16622; border-color: #ffd166; color: #ffd166; }
      }

      /* Forced theme overrides (take precedence over system) */
      .wrap[data-theme="light"] { color: #0b1b29; background: #ffffff; border-color: #d3e0ef; }
      .wrap[data-theme="light"] .header { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
      .wrap[data-theme="light"] .toolbar { background: #ffffff; border-bottom: 1px solid #e2e8f0; }
      .wrap[data-theme="light"] .toolbar input[type="search"], .wrap[data-theme="light"] .toolbar select { background: #f8fafc; color: #0b1b29; border-color: #d3e0ef; }
      .wrap[data-theme="light"] .clip { background: #f8fafc; border-color: #e2e8f0; }
      .wrap[data-theme="light"] .meta { color: #475569; }
      .wrap[data-theme="light"] .meta a { color: #0ea5e9; }
      .wrap[data-theme="light"] button { background: transparent; border-color: #c7e3ff; color: #0b1b29; }
      .wrap[data-theme="light"] .btn-primary { background: transparent; border-color: #7fd1ff; color: #0369a1; }
      .wrap[data-theme="light"] .btn-primary:hover { background: #dff3ff; }
      .wrap[data-theme="light"] .btn-danger { background: transparent; border-color: #ef4444aa; color: #b91c1c; }
      .wrap[data-theme="light"] .btn-danger:hover { background: #dc2626; border-color: #dc2626; color: #ffffff; }
      .wrap[data-theme="light"] .btn-ghost { background: transparent; border-color: transparent; color: #334155; }
      .wrap[data-theme="light"] .btn-star { background: transparent; border-color: #e2e8f0; color: #0b1b29; }
      .wrap[data-theme="light"] .btn-star.starred { background: #ffd166; border-color: #ffd166; color: #0b1b29; }
      .wrap[data-theme="light"] #toast { background: #e6f7ff; color: #083041; border-color: #b6e6ff; }
      .wrap[data-theme="light"] .clip.collapsed .text::after { background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); }
      .wrap[data-theme="light"] .edit-input { background: #ffffff; color: #0b1b29; border-color: #d3e0ef; }
      .wrap[data-theme="light"] .expand-btn { color: #64748b; }
      .wrap[data-theme="light"] .settings-popover { background: #ffffff; border-color: #e2e8f0; }
      /* Forced light theme stronger hover cues */
      .wrap[data-theme="light"] .toolbar .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #38bdf8; background: #e8f6ff; color: #075985; box-shadow: 0 2px 10px rgba(2, 132, 199, 0.20); }
      .wrap[data-theme="light"] ul.clips .btns .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #38bdf8; background: #e8f6ff; color: #075985; box-shadow: 0 2px 10px rgba(2, 132, 199, 0.20); }
      .wrap[data-theme="light"] ul.clips .btns .icon-btn.btn-ghost:active { transform: translateY(0) scale(0.97); }
      .wrap[data-theme="light"] ul.clips .btns .btn-star:hover { transform: translateY(-1px) scale(1.06); box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.30); }
      .wrap[data-theme="light"] ul.clips .btns .btn-star:not(.starred):hover { background: #fff7cc; border-color: #facc15; color: #a16207; }

      .wrap[data-theme="dark"] { color: #e5edf5; background: #0b1220; border-color: #1f2b45; }
      .wrap[data-theme="dark"] .header { background: #0f172a; border-bottom: 1px solid #172035; }
      .wrap[data-theme="dark"] .toolbar { background: #0b1220; border-bottom: 1px solid #172035; }
      .wrap[data-theme="dark"] .toolbar input[type="search"], .wrap[data-theme="dark"] .toolbar select { background: #0f172a; color: #e5edf5; border-color: #1f2b45; }
      .wrap[data-theme="dark"] .clip { background: #111827; border-color: #1f2b45; }
      .wrap[data-theme="dark"] .meta { color: #9aa4b2; }
      .wrap[data-theme="dark"] .meta a { color: #38bdf8; }
      .wrap[data-theme="dark"] button { background: transparent; border-color: #1f2b45; color: #e5edf5; }
      .wrap[data-theme="dark"] .btn-primary { background: transparent; border-color: #7fd1ff; color: #7fd1ff; }
      .wrap[data-theme="dark"] .btn-primary:hover { background: #7fd1ff22; }
      .wrap[data-theme="dark"] .btn-danger { background: transparent; border-color: #ef4444aa; color: #ffb4b4; }
      .wrap[data-theme="dark"] .btn-danger:hover { background: #ef4444; border-color: #ef4444; color: #ffffff; }
      .wrap[data-theme="dark"] .btn-ghost { background: transparent; border-color: transparent; color: #cbd5e1; }
      .wrap[data-theme="dark"] .btn-star { background: transparent; border-color: #2a3a60; color: #e5edf5; }
      .wrap[data-theme="dark"] .btn-star.starred { background: #ffd166; border-color: #ffd166; color: #0b1b29; }
      .wrap[data-theme="dark"] #toast { background: #d6f2ff; color: #0b1b29; border-color: #7fd1ff; }
      .wrap[data-theme="dark"] .clip.collapsed .text::after { background: linear-gradient(to bottom, rgba(11,18,32,0), rgba(11,18,32,1)); }
      .wrap[data-theme="dark"] .edit-input { background: #0f172a; color: #e5edf5; border-color: #1f2b45; }
      .wrap[data-theme="dark"] .expand-btn { color: #9aa4b2; }
      .wrap[data-theme="dark"] .settings-popover { background: #0b1220; border-color: #1f2b45; }
      /* Toolbar hover cues for folder buttons in dark theme */
      .wrap[data-theme="dark"] .toolbar .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #7fd1ff; background: #7fd1ff22; color: #e6f6ff; box-shadow: 0 2px 12px rgba(0,0,0,0.28); }
      /* Forced dark theme hover cues (slightly stronger) */
      .wrap[data-theme="dark"] ul.clips .btns .icon-btn.btn-ghost:hover { transform: translateY(-1px) scale(1.06); border-color: #7fd1ff; background: #7fd1ff22; color: #e6f6ff; box-shadow: 0 2px 12px rgba(0,0,0,0.28); }
      .wrap[data-theme="dark"] ul.clips .btns .icon-btn.btn-ghost:active { transform: translateY(0) scale(0.97); }
      .wrap[data-theme="dark"] ul.clips .btns .btn-star:hover { transform: translateY(-1px) scale(1.06); box-shadow: 0 0 0 2px rgba(255, 209, 102, 0.35); }
      .wrap[data-theme="dark"] ul.clips .btns .btn-star:not(.starred):hover { background: #ffd16622; border-color: #ffd166; color: #ffd166; }
      /* Reduced motion setting */
      .wrap[data-reduce-motion="true"] .clip,
      .wrap[data-reduce-motion="true"] .icon-btn,
      .wrap[data-reduce-motion="true"] .btn-star,
      .wrap[data-reduce-motion="true"] #toast { transition: none !important; }
      .wrap[data-reduce-motion="true"] ul.clips .btns .icon-btn:hover,
      .wrap[data-reduce-motion="true"] ul.clips .btns .btn-star:hover { transform: none !important; box-shadow: none !important; }
      .wrap[data-reduce-motion="true"] ul.clips .btns .icon-btn:active,
      .wrap[data-reduce-motion="true"] ul.clips .btns .btn-star:active { transform: none !important; }
      .wrap[data-reduce-motion="true"] .icon-btn:hover,
      .wrap[data-reduce-motion="true"] .icon-btn:active { transform: none !important; box-shadow: none !important; }
      .wrap[data-reduce-motion="true"] #toast { transform: none !important; }
    </style>
    <div class="wrap">
      <div class="header" id="drag-handle">
        <div class="title">Gigi's Copy Tool</div>
        <div class="actions">
          <button id="copy-all" class="btn-primary">Copy all</button>
          <button id="clear-all" class="btn-danger">Clear</button>
          <button id="settings" class="btn-ghost icon-btn" title="Settings">⚙</button>
          <button id="close" class="btn-ghost" title="Close">✕</button>
        </div>
      </div>
      <div class="toolbar">
        <input id="search" type="search" placeholder="Search clips..." />
        <select id="tag-filter" title="Tag filter">
          <option value="">All tags</option>
        </select>
        <select id="folder" title="Folder">
          <option value="">All</option>
        </select>
        <button id="folder-add" class="btn-ghost icon-btn" title="New folder">＋</button>
        <button id="folder-del" class="btn-ghost icon-btn" title="Delete folder">🗑</button>
        <select id="format" title="Copy format">
          <option value="bullets">• Bulleted</option>
          <option value="numbers">1. Numbered</option>
          <option value="lines">Plain lines</option>
        </select>
      </div>
      <div class="body">
        <div id="empty" class="empty" hidden>No clips yet. Select text and press your shortcut or use the right-click menu.</div>
        <ul id="list" class="clips"></ul>
      </div>
      <div id="toast"></div>
      <div id="resize-handle" title="Resize"></div>
    </div>
  `;

  const listEl = shadow.getElementById('list');
  const emptyEl = shadow.getElementById('empty');
  const copyAllBtn = shadow.getElementById('copy-all');
  const clearAllBtn = shadow.getElementById('clear-all');
  const closeBtn = shadow.getElementById('close');
  const settingsBtn = shadow.getElementById('settings');
  const toastEl = shadow.getElementById('toast');
  const dragHandle = shadow.getElementById('drag-handle');
  const searchInput = shadow.getElementById('search');
  const folderSel = shadow.getElementById('folder');
  const addFolderBtn = shadow.getElementById('folder-add');
  const delFolderBtn = shadow.getElementById('folder-del');
  const formatSel = shadow.getElementById('format');
  const tagFilterSel = shadow.getElementById('tag-filter');
  const resizeHandle = shadow.getElementById('resize-handle');
  const wrapEl = shadow.querySelector('.wrap');
  // Make overlay container focusable so it can receive key events
  try { if (wrapEl && !wrapEl.hasAttribute('tabindex')) wrapEl.setAttribute('tabindex', '0'); } catch(_) {}

  let filterText = '';
  let lastDeletedClip = null;
  let lastClearedSnapshot = null;
  let copyFormat = 'bullets';
  let folders = [];
  let activeFolderId = null;
  let allTags = [];
  let currentTagFilter = '';
  // Resize state
  let resizing = false; let startRX = 0, startRY = 0, startW = 0, startH = 0;

  // Theme management
  let currentTheme = 'auto';
  function applyTheme(theme) {
    currentTheme = theme || 'auto';
    if (!wrapEl) return;
    if (currentTheme === 'auto') wrapEl.removeAttribute('data-theme');
    else wrapEl.setAttribute('data-theme', currentTheme);
  }
  try {
    chrome.storage.local.get({ overlayTheme: 'auto' }, ({ overlayTheme }) => {
      applyTheme(overlayTheme);
    });
  } catch(_) {}
  function saveTheme(theme) {
    try { chrome.storage.local.set({ overlayTheme: theme }); } catch(_){ }
    applyTheme(theme);
  }

  // Reduce motion management
  let reduceMotion = false;
  let hasUserReduceMotionPref = false;
  function applyReduceMotion(enabled) {
    reduceMotion = !!enabled;
    if (!wrapEl) return;
    if (reduceMotion) wrapEl.setAttribute('data-reduce-motion', 'true');
    else wrapEl.removeAttribute('data-reduce-motion');
  }
  try {
    chrome.storage.local.get('overlayReduceMotion', ({ overlayReduceMotion }) => {
      if (typeof overlayReduceMotion === 'boolean') {
        hasUserReduceMotionPref = true;
        applyReduceMotion(overlayReduceMotion);
      } else {
        const prefers = (typeof window !== 'undefined' && window.matchMedia)
          ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
          : false;
        applyReduceMotion(prefers);
      }
    });
  } catch(_) {}
  // React to OS-level reduced motion preference when the user hasn't set an explicit preference
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = (e) => { if (!hasUserReduceMotionPref) applyReduceMotion(e.matches); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  } catch(_) {}
  function saveReduceMotion(enabled) {
    hasUserReduceMotionPref = true;
    try { chrome.storage.local.set({ overlayReduceMotion: !!enabled }); } catch(_){ }
    applyReduceMotion(enabled);
  }

  // Settings popover
  let settingsPopoverEl = null;
  function closeSettingsPopover(){
    if (settingsPopoverEl && settingsPopoverEl.parentNode) settingsPopoverEl.parentNode.removeChild(settingsPopoverEl);
    settingsPopoverEl = null;
    shadow.removeEventListener('mousedown', onOutsideDown, true);
  }
  function onOutsideDown(e){
    if (!settingsPopoverEl) return;
    const t = e.target;
    if (settingsPopoverEl.contains(t) || (settingsBtn && settingsBtn.contains(t))) return;
    closeSettingsPopover();
  }
  function openSettingsPopover(){
    if (settingsPopoverEl) { closeSettingsPopover(); return; }
    settingsPopoverEl = document.createElement('div');
    settingsPopoverEl.className = 'settings-popover';
    settingsPopoverEl.innerHTML = `
      <h4>Settings</h4>
      <div class="row">
        <div style="min-width:56px;">Theme</div>
        <div style="display:flex; gap:8px;">
          <label><input type="radio" name="qmc-theme" value="auto"> Auto</label>
          <label><input type="radio" name="qmc-theme" value="light"> Light</label>
          <label><input type="radio" name="qmc-theme" value="dark"> Dark</label>
        </div>
      </div>
      <div class="row">
        <div style="min-width:56px;">Motion</div>
        <label><input type="checkbox" id="reduce-motion"> Reduce motion</label>
      </div>
      <hr />
      <h4>Tag Rules</h4>
      <div class="row" id="rules-list" style="flex-direction:column; gap:6px;"></div>
      <div class="row" style="gap:6px; align-items:center;">
        <select id="rule-type">
          <option value="url-contains">URL contains</option>
          <option value="text-regex">Text matches regex</option>
        </select>
        <input id="rule-pattern" placeholder="pattern or regex" style="flex:1;" />
        <input id="rule-tags" placeholder="tags (comma-separated)" style="flex:1;" />
        <button id="rule-add" class="btn-primary">Add</button>
      </div>
    `;
    wrapEl.appendChild(settingsPopoverEl);
    const radios = settingsPopoverEl.querySelectorAll('input[name="qmc-theme"]');
    radios.forEach(r=>{
      if (r.value === currentTheme) r.checked = true;
      r.addEventListener('change', ()=>{ saveTheme(r.value); showToast(`Theme: ${r.value}`); });
    });
    const rm = settingsPopoverEl.querySelector('#reduce-motion');
    if (rm) {
      rm.checked = !!reduceMotion;
      rm.addEventListener('change', ()=>{ saveReduceMotion(rm.checked); showToast(rm.checked ? 'Reduced motion on' : 'Reduced motion off'); });
    }
    // Tag rules: load, render, add/remove
    async function loadRules(){
      try {
        const { tagRules=[] } = await chrome.storage.local.get({ tagRules: [] });
        const listEl = settingsPopoverEl.querySelector('#rules-list');
        listEl.textContent = '';
        if (!Array.isArray(tagRules) || tagRules.length === 0) {
          const empty = document.createElement('div'); empty.textContent = 'No rules yet.'; empty.style.color = '#9aa4b2'; listEl.appendChild(empty);
          return;
        }
        tagRules.forEach((r, idx) => {
          const row = document.createElement('div'); row.style.display='flex'; row.style.gap='6px'; row.style.alignItems='center';
          const span = document.createElement('div'); span.style.fontSize='12px'; span.style.flex='1';
          const tags = (Array.isArray(r.tags)?r.tags:[]).join(', ');
          span.textContent = `${r.type || ''} • ${r.pattern || ''} → [${tags}]`;
          const del = document.createElement('button'); del.className='btn-danger'; del.textContent = 'Delete';
          del.addEventListener('click', async ()=>{
            try {
              const { tagRules: cur=[] } = await chrome.storage.local.get({ tagRules: [] });
              const next = cur.filter((_, i)=> i !== idx);
              await chrome.storage.local.set({ tagRules: next });
              showToast('Rule deleted');
              await loadRules();
            } catch(_) {}
          });
          row.append(span, del);
          listEl.appendChild(row);
        });
      } catch(_) {}
    }
    const addBtn = settingsPopoverEl.querySelector('#rule-add');
    addBtn?.addEventListener('click', async ()=>{
      try {
        const typeSel = settingsPopoverEl.querySelector('#rule-type');
        const patternInp = settingsPopoverEl.querySelector('#rule-pattern');
        const tagsInp = settingsPopoverEl.querySelector('#rule-tags');
        const type = typeSel?.value || 'url-contains';
        const pattern = (patternInp?.value || '').trim();
        const tags = (tagsInp?.value || '').split(',').map(s=>s.trim()).filter(Boolean);
        if (!pattern || tags.length === 0) { showToast('Enter pattern and tags'); return; }
        const { tagRules: cur=[] } = await chrome.storage.local.get({ tagRules: [] });
        const next = [...cur, { type, pattern, tags }];
        await chrome.storage.local.set({ tagRules: next });
        showToast('Rule added');
        if (patternInp) patternInp.value = '';
        if (tagsInp) tagsInp.value = '';
        await loadRules();
      } catch(_){ showToast('Failed to add rule'); }
    });
    loadRules();
    shadow.addEventListener('mousedown', onOutsideDown, true);
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openSettingsPopover(); });
    settingsBtn.addEventListener('mousedown', (e)=> e.stopPropagation());
  }
  // Prevent header buttons from initiating drag
  [copyAllBtn, clearAllBtn, closeBtn].forEach(b=>{ if(b) b.addEventListener('mousedown', (e)=> e.stopPropagation()); });

  function fmtUrl(url) {
    try { const u = new URL(url); return u.origin + u.pathname + (u.search || ''); } catch { return url || ''; }
  }
  function showToast(msg, action) {
    // Build toast with optional action button
    toastEl.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = msg;
    toastEl.append(span);
    if (action && action.label && typeof action.onClick === 'function') {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.addEventListener('click', action.onClick);
      toastEl.append(btn);
    }
    toastEl.style.opacity = '0'; toastEl.style.transform = 'translateY(4px)';
    requestAnimationFrame(() => { toastEl.style.opacity = '1'; toastEl.style.transform = 'translateY(0)'; });
    setTimeout(() => { toastEl.style.opacity = '0'; toastEl.style.transform = 'translateY(4px)'; }, action ? 2200 : 1400);
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  // Folder helpers
  function getFolderNameById(id){ const f = (folders||[]).find(x=>x.id===id); return f ? (f.name||'') : ''; }
  function fillFolderSelect(){
    if (!folderSel) return;
    folderSel.textContent = '';
    const optAll = document.createElement('option'); optAll.value=''; optAll.textContent='All'; folderSel.append(optAll);
    for (const f of (folders||[])) {
      const opt = document.createElement('option'); opt.value = f.id; opt.textContent = f.name || 'Untitled'; folderSel.append(opt);
    }
    folderSel.value = activeFolderId || '';
  }
  function setActiveFolder(id){
    activeFolderId = id || null;
    try { chrome.storage.local.set({ activeFolderId }); } catch(_){ }
    loadAndRender();
    showToast(activeFolderId ? `Folder: ${getFolderNameById(activeFolderId)}` : 'All clips');
  }
  function applyFilter(items) {
    const q = (filterText || '').trim().toLowerCase();
    if (!q) return items;
    return items.filter(c => {
      const t = (c.text||'').toLowerCase();
      const ti = (c.title||'').toLowerCase();
      const u = (c.url||'').toLowerCase();
      return t.includes(q) || ti.includes(q) || u.includes(q);
    });
  }
  function uniqueTagsFromClips(items){
    const set = new Set();
    for (const c of items) {
      if (Array.isArray(c.tags)) { c.tags.filter(Boolean).forEach(t=>set.add(String(t))); }
    }
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }
  function fillTagFilterSelect(){
    if (!tagFilterSel) return;
    const cur = tagFilterSel.value || '';
    tagFilterSel.textContent = '';
    const optAll = document.createElement('option'); optAll.value=''; optAll.textContent='All tags'; tagFilterSel.append(optAll);
    for (const t of (allTags||[])) { const o=document.createElement('option'); o.value=t; o.textContent=t; tagFilterSel.append(o); }
    tagFilterSel.value = currentTagFilter || cur || '';
  }
  function applyTagFilter(items){
    const tag = (currentTagFilter||'').trim();
    if (!tag) return items;
    return items.filter(c => Array.isArray(c.tags) && c.tags.includes(tag));
  }
  const expandedIds = new Set();
  // Selection state for keyboard navigation
  let selectedClipId = null;
  function getClipElements(){ return Array.from(listEl.querySelectorAll('li.clip')); }
  function findLiById(id){ return listEl.querySelector(`li.clip[data-id="${id}"]`); }
  function setSelectedById(id, opts){
    const options = opts || {};
    const prev = listEl.querySelector('li.clip.selected');
    if (prev) prev.classList.remove('selected');
    selectedClipId = id || null;
    if (selectedClipId) {
      const li = findLiById(selectedClipId);
      if (li) {
        li.classList.add('selected');
        if (options.scroll !== false) li.scrollIntoView({ block: 'nearest' });
      }
    }
  }
  function getSelectedIndex(){
    const els = getClipElements();
    if (!selectedClipId) return -1;
    return els.findIndex(el => el.dataset.id === String(selectedClipId));
  }
  function selectByIndex(i){
    const els = getClipElements();
    if (!els.length) return;
    const idx = Math.max(0, Math.min(i, els.length - 1));
    const id = els[idx].dataset.id;
    setSelectedById(id, { scroll: true });
    try { els[idx].focus({ preventScroll: true }); } catch(_) { /* noop */ }
  }
  function isEditableTarget(t){
    if (!t) return false;
    const tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  }
  async function copyClipById(id){
    const li = findLiById(id);
    if (!li) return;
    const ta = li.querySelector('textarea.edit-input');
    const textEl = li.querySelector('.text');
    const text = ta ? ta.value : (textEl ? textEl.textContent || '' : '');
    try { await navigator.clipboard.writeText(text); showToast('Copied'); }
    catch(e){ console.error('Copy failed', e); showToast('Copy failed'); }
  }
  async function deleteClipById(id){
    try {
      const li = findLiById(id);
      if (li && li.querySelector('textarea.edit-input')) { showToast('Finish editing before deleting'); return; }
      const { clips=[] } = await chrome.storage.local.get({ clips: [] });
      const target = clips.find(c=>c.id===id);
      const next = clips.filter(c=>c.id!==id);
      if (!target) return;
      lastDeletedClip = target;
      await chrome.storage.local.set({ clips: next });
      showToast('Deleted', {
        label: 'Undo',
        onClick: async ()=>{
          try {
            const { clips: cur=[] } = await chrome.storage.local.get({ clips: [] });
            const exists = cur.some(c=>c.id===lastDeletedClip.id);
            const restored = exists ? cur : [...cur, lastDeletedClip];
            await chrome.storage.local.set({ clips: restored });
            showToast('Restored');
          } catch (e) { console.error('Undo failed', e); showToast('Undo failed'); }
        }
      });
    } catch(e){ console.error('Delete failed', e); showToast('Delete failed'); }
  }
  function render(clips) {
    const items = [...clips]
      .sort((a,b)=>{
        const sa = a.starred ? 1 : 0;
        const sb = b.starred ? 1 : 0;
        if (sa !== sb) return sb - sa; // starred first
        return (b.createdAt||0)-(a.createdAt||0);
      });
    const inFolder = activeFolderId ? items.filter(c=>c.folderId===activeFolderId) : items;
    const filtered = applyFilter(inFolder);
    const tagFiltered = applyTagFilter(filtered);
    listEl.textContent = '';
    if (!tagFiltered.length) { emptyEl.hidden = false; return; }
    emptyEl.hidden = true;
    for (const clip of tagFiltered) {
      const li = document.createElement('li'); li.className = 'clip collapsed'; li.tabIndex = 0;
      li.dataset.id = clip.id;
      if (clip.id === selectedClipId) li.classList.add('selected');
      li.addEventListener('focusin', ()=> setSelectedById(clip.id, { scroll: false }));
      li.addEventListener('mousedown', (e)=>{ if (!e.target.closest('button, input, textarea, select, a')) setSelectedById(clip.id, { scroll: false }); });
      const left = document.createElement('div'); left.className = 'left';
      const textDiv = document.createElement('div'); textDiv.className='text'; textDiv.textContent = clip.text || ''; left.appendChild(textDiv);
      const meta = document.createElement('div'); meta.className='meta';
      const title = (clip.title||'').trim(); const url = (clip.url||'').trim();
      if (title || url) {
        meta.textContent = '';
        if (title) meta.append(document.createTextNode(title + (url ? ' • ' : '')));
        if (url) { const a = document.createElement('a'); a.href=url; a.textContent = fmtUrl(url); a.target='_blank'; a.rel='noreferrer noopener'; meta.append(a); }
        left.appendChild(meta);
      }
      // Show duplicate count if > 1 (defaults to 1 when missing)
      const dupCountVal = Number(clip.dupCount || 1);
      if (dupCountVal > 1) {
        if (!(title || url)) { meta.textContent = ''; left.appendChild(meta); }
        if (meta.childNodes.length > 0) meta.append(document.createTextNode(' • '));
        const dcSpan = document.createElement('span');
        dcSpan.textContent = `×${dupCountVal}`;
        meta.append(dcSpan);
      }
      // Tag chips
      if (Array.isArray(clip.tags) && clip.tags.length) {
        const tagsDiv = document.createElement('div'); tagsDiv.className='tags';
        for (const tg of clip.tags) {
          const chip = document.createElement('span'); chip.className='tag'; chip.textContent=String(tg);
          tagsDiv.appendChild(chip);
        }
        left.appendChild(tagsDiv);
      }
      const btns = document.createElement('div'); btns.className = 'btns';
      const starBtn = document.createElement('button');
      starBtn.className = 'icon-btn btn-star' + (clip.starred ? ' starred' : '');
      starBtn.textContent = clip.starred ? '★' : '☆';
      starBtn.title = clip.starred ? 'Unpin' : 'Pin';
      starBtn.addEventListener('click', async ()=>{
        try {
          const { clips=[] } = await chrome.storage.local.get({ clips: [] });
          const next = clips.map(c => c.id===clip.id ? { ...c, starred: !c.starred } : c);
          await chrome.storage.local.set({ clips: next });
        } catch(e){ console.error('Star failed', e); showToast('Star failed'); }
      });
      // Expand/Collapse toggle
      const isExpanded = expandedIds.has(clip.id);
      if (isExpanded) li.classList.remove('collapsed');
      const expandBtn = document.createElement('button');
      expandBtn.className = 'expand-btn';
      const setExpandUI = ()=>{ expandBtn.textContent = (li.classList.contains('collapsed') ? '▾' : '▴'); expandBtn.title = li.classList.contains('collapsed') ? 'Expand' : 'Collapse'; };
      setExpandUI();
      expandBtn.addEventListener('click', ()=>{
        const collapsed = li.classList.toggle('collapsed');
        if (collapsed) expandedIds.delete(clip.id); else expandedIds.add(clip.id);
        setExpandUI();
      });
      left.appendChild(expandBtn);

      // Inline edit
      let editing = false; let textarea = null;
      const editBtn = document.createElement('button'); editBtn.className='icon-btn btn-primary'; editBtn.textContent='✎'; editBtn.title = 'Edit';
      function exitEdit(cancel){
        if (!editing) return;
        editing = false; editBtn.textContent = '✎'; editBtn.title = 'Edit';
        if (textarea) {
          if (cancel) {
            // restore view
            left.replaceChild(textDiv, textarea);
          }
          textarea = null;
        }
      }
      editBtn.addEventListener('click', async ()=>{
        if (!editing) {
          editing = true; editBtn.textContent = '✓'; editBtn.title = 'Save';
          textarea = document.createElement('textarea');
          textarea.className = 'edit-input';
          textarea.value = clip.text || '';
          textarea.addEventListener('keydown', async (e)=>{
            if (e.key === 'Escape') {
              e.stopPropagation(); exitEdit(true);
            }
          });
          left.replaceChild(textarea, textDiv);
          textarea.focus();
        } else {
          // Save
          try {
            const newText = textarea ? textarea.value : (clip.text||'');
            const { clips=[] } = await chrome.storage.local.get({ clips: [] });
            const next = clips.map(c => c.id===clip.id ? { ...c, text: newText } : c);
            await chrome.storage.local.set({ clips: next });
            textDiv.textContent = newText;
            showToast('Saved');
            exitEdit(true);
          } catch(e){ console.error('Edit save failed', e); showToast('Save failed'); }
        }
      });

      const copyBtn = document.createElement('button'); copyBtn.className='icon-btn btn-ghost'; copyBtn.textContent='⧉'; copyBtn.title = 'Copy';
      copyBtn.addEventListener('click', async ()=>{
        try {
          const current = (editing && textarea) ? textarea.value : (textDiv.textContent || '');
          await navigator.clipboard.writeText(current);
          showToast('Copied');
        } catch(e){ console.error('Copy failed', e); showToast('Copy failed'); }
      });
      const delBtn = document.createElement('button'); delBtn.className='icon-btn btn-danger'; delBtn.textContent='🗑'; delBtn.title = 'Delete';
      delBtn.addEventListener('click', async ()=>{
        try {
          const { clips=[] } = await chrome.storage.local.get({ clips: [] });
          const target = clips.find(c=>c.id===clip.id) || clip;
          const next = clips.filter(c=>c.id!==clip.id);
          lastDeletedClip = target;
          await chrome.storage.local.set({ clips: next });
          showToast('Deleted', {
            label: 'Undo',
            onClick: async ()=>{
              try {
                const { clips: cur=[] } = await chrome.storage.local.get({ clips: [] });
                const exists = cur.some(c=>c.id===lastDeletedClip.id);
                const restored = exists ? cur : [...cur, lastDeletedClip];
                await chrome.storage.local.set({ clips: restored });
                showToast('Restored');
              } catch (e) { console.error('Undo failed', e); showToast('Undo failed'); }
            }
          });
        } catch(e){ console.error('Delete failed', e); showToast('Delete failed'); }
      });
      btns.append(starBtn, editBtn, copyBtn, delBtn);
      li.append(left); li.append(btns); listEl.append(li);
    }
  }
  async function loadAndRender(){
    const { clips=[] } = await chrome.storage.local.get({ clips: [] });
    // Light migration: ensure dupCount defaults to 1 for legacy items
    let migrated = false;
    const next = clips.map(c => {
      if (!c || typeof c !== 'object') return c;
      if (typeof c.dupCount !== 'number' || !isFinite(c.dupCount) || c.dupCount <= 0) {
        migrated = true;
        return { ...c, dupCount: 1 };
      }
      return c;
    });
    // Compute unique tags and fill selector
    allTags = uniqueTagsFromClips(next);
    fillTagFilterSelect();
    if (migrated) {
      try { await chrome.storage.local.set({ clips: next }); } catch(_) {}
      render(next);
    } else {
      render(clips);
    }
  }

  function formatMulti(items, fmt) {
    if (fmt === 'numbers') return items.map((c,i)=>`${i+1}. ${c.text||''}`).join('\n');
    if (fmt === 'lines') return items.map(c=>`${c.text||''}`).join('\n');
    return items.map(c=>`- ${c.text||''}`).join('\n');
  }

  copyAllBtn.addEventListener('click', async ()=>{
    try {
      const { clips=[] } = await chrome.storage.local.get({ clips: [] });
      const sorted=[...clips].sort((a,b)=>{
        const sa = a.starred ? 1 : 0; const sb = b.starred ? 1 : 0; if (sa!==sb) return sb-sa; return (b.createdAt||0)-(a.createdAt||0);
      });
      const inFolder = activeFolderId ? sorted.filter(c=>c.folderId===activeFolderId) : sorted;
      const filtered = applyFilter(inFolder);
      const text = formatMulti(filtered, copyFormat);
      await navigator.clipboard.writeText(text);
      showToast('Copied');
    } catch(e){ console.error('Copy all failed', e); showToast('Copy all failed'); }
  });
  clearAllBtn.addEventListener('click', async ()=>{
    if(!confirm('Clear all clips?')) return;
    try {
      const { clips=[] } = await chrome.storage.local.get({ clips: [] });
      lastClearedSnapshot = clips;
      await chrome.storage.local.set({ clips: [] });
      showToast('Cleared', {
        label: 'Undo',
        onClick: async ()=>{
          try { await chrome.storage.local.set({ clips: lastClearedSnapshot || [] }); showToast('Restored'); }
          catch(e){ console.error('Undo clear failed', e); showToast('Undo failed'); }
        }
      });
    } catch(e){ console.error('Clear failed', e); showToast('Clear failed'); }
  });
  closeBtn.addEventListener('click', ()=> host.remove());

  // Search filtering
  if (searchInput) {
    searchInput.addEventListener('input', ()=>{ filterText = searchInput.value || ''; loadAndRender(); });
  }
  if (tagFilterSel) {
    tagFilterSel.addEventListener('change', ()=>{ currentTagFilter = tagFilterSel.value || ''; loadAndRender(); });
  }

  // Focus the overlay when clicking anywhere non-interactive so keyboard shortcuts work
  if (wrapEl) {
    wrapEl.addEventListener('mousedown', (e)=>{
      const t = e.target;
      if (!t) return;
      // don't steal focus from interactive elements or when resizing
      if (t.closest('#resize-handle')) return;
      if (isEditableTarget(t) || t.closest('button, a, select, input, textarea')) return;
      try { wrapEl.focus(); } catch(_) {}
    }, true);
  }

  // Folders: initialize and event handlers
  try {
    chrome.storage.local.get({ folders: [], activeFolderId: null }, ({ folders: fs, activeFolderId: af }) => {
      folders = Array.isArray(fs) ? fs : [];
      activeFolderId = af || null;
      fillFolderSelect();
    });
  } catch(_) {}
  if (folderSel) {
    folderSel.addEventListener('change', ()=>{ setActiveFolder(folderSel.value || null); });
  }
  if (addFolderBtn) {
    addFolderBtn.addEventListener('click', async ()=>{
      const name = (prompt('New folder name')||'').trim();
      if (!name) return;
      const f = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name, createdAt: Date.now() };
      try {
        const { folders: cur=[] } = await chrome.storage.local.get({ folders: [] });
        const next = [...cur, f];
        await chrome.storage.local.set({ folders: next, activeFolderId: f.id });
        showToast('Folder created');
      } catch(e){ console.error('Add folder failed', e); showToast('Add folder failed'); }
    });
  }
  if (delFolderBtn) {
    delFolderBtn.addEventListener('click', async ()=>{
      if (!activeFolderId) { showToast('Select a folder'); return; }
      if (!confirm('Delete this folder? Clips will be kept in All.')) return;
      try {
        const [{ folders: cur=[] }, { clips=[] }] = await Promise.all([
          chrome.storage.local.get({ folders: [] }),
          chrome.storage.local.get({ clips: [] })
        ]);
        const nextFolders = cur.filter(f => f.id !== activeFolderId);
        const nextClips = clips.map(c => c.folderId === activeFolderId ? ({ ...c, folderId: null }) : c);
        await chrome.storage.local.set({ folders: nextFolders, clips: nextClips, activeFolderId: null });
        showToast('Folder deleted');
      } catch(e){ console.error('Delete folder failed', e); showToast('Delete folder failed'); }
    });
  }

  // Keyboard navigation (ArrowUp/Down to move, Enter to copy, Delete/Backspace to remove with undo, 'A' to copy all)
  function onKeyDown(e){
    const t = e.target;
    // Ignore when typing in inputs, textareas, selects or contenteditable, or interacting with links/buttons
    const tag = (t && t.tagName ? t.tagName.toLowerCase() : '');
    if (isEditableTarget(t) || tag === 'button' || tag === 'a') return;

    const els = getClipElements();
    const hasItems = els.length > 0;
    const curIdx = getSelectedIndex();

    if (e.key === 'ArrowDown') {
      if (!hasItems) return;
      e.preventDefault();
      if (curIdx < 0) selectByIndex(0);
      else selectByIndex(curIdx + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      if (!hasItems) return;
      e.preventDefault();
      if (curIdx < 0) selectByIndex(0);
      else selectByIndex(curIdx - 1);
      return;
    }
    if (e.key === 'Enter') {
      if (!selectedClipId) return;
      e.preventDefault();
      copyClipById(selectedClipId);
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!selectedClipId) return;
      e.preventDefault();
      // Choose next selection before deleting
      const idx = curIdx;
      let nextIdx = idx;
      if (idx >= els.length - 1) nextIdx = Math.max(0, els.length - 2);
      const nextId = (els[nextIdx] && els[nextIdx].dataset.id) || null;
      setSelectedById(nextId, { scroll: true });
      deleteClipById(selectedClipId);
      return;
    }
    if ((e.code === 'KeyA' || e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      // Trigger existing copy-all handler
      if (copyAllBtn) copyAllBtn.click();
      return;
    }
  }
  if (wrapEl) wrapEl.addEventListener('keydown', onKeyDown);

  // Load and persist copy format
  try {
    chrome.storage.local.get({ copyFormat: 'bullets' }, ({ copyFormat: storedFmt }) => {
      copyFormat = storedFmt || 'bullets';
      if (formatSel) formatSel.value = copyFormat;
    });
  } catch(_) {}
  // Persist copy format on change
  if (formatSel) {
    formatSel.addEventListener('change', ()=>{
      copyFormat = formatSel.value || 'bullets';
      try { chrome.storage.local.set({ copyFormat }); } catch(_){ }
    });
  }
  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', (e)=>{
      resizing = true; startRX = e.clientX; startRY = e.clientY;
      const rect = host.getBoundingClientRect(); startW = rect.width; startH = rect.height;
      e.preventDefault(); e.stopPropagation();
    });
  }
  window.addEventListener('mousemove', (e)=>{
    if(!resizing) return;
    const dx = e.clientX - startRX; const dy = e.clientY - startRY;
    const maxW = Math.round(window.innerWidth * 0.95);
    const maxH = Math.round(window.innerHeight * 0.9);
    const newW = clamp(startW + dx, 300, maxW);
    const newH = clamp(startH + dy, 220, maxH);
    host.style.width = newW + 'px'; host.style.height = newH + 'px';
  });
  window.addEventListener('mouseup', async ()=>{
    if(!resizing) return; resizing=false;
    try {
      const rect = host.getBoundingClientRect();
      await chrome.storage.local.set({ overlaySize: { width: Math.round(rect.width), height: Math.round(rect.height) } });
    } catch(_){}
  });

  // Restore saved size
  try {
    chrome.storage.local.get('overlaySize', ({ overlaySize }) => {
      if (overlaySize && typeof overlaySize.width==='number' && typeof overlaySize.height==='number') {
        host.style.width = overlaySize.width + 'px';
        host.style.height = overlaySize.height + 'px';
      } else {
        host.style.height = '520px';
      }
    });
  } catch(_){}

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if ('overlayTheme' in changes) { const val = changes.overlayTheme.newValue; if (val) applyTheme(val); }
    if ('overlayReduceMotion' in changes) { applyReduceMotion(!!changes.overlayReduceMotion.newValue); }
    if ('folders' in changes) { folders = changes.folders.newValue || []; fillFolderSelect(); }
    if ('activeFolderId' in changes) { activeFolderId = changes.activeFolderId.newValue || null; if (folderSel) folderSel.value = activeFolderId || ''; loadAndRender(); }
    if ('clips' in changes) { loadAndRender(); }
    if ('tagRules' in changes) { /* rules impact saving; UI lists them in settings only */ }
  });

  // Dragging
  let dragging=false; let startX=0, startY=0; let startLeft=0, startTop=0;
  dragHandle.addEventListener('mousedown', (e)=>{
    dragging=true; startX=e.clientX; startY=e.clientY;
    const rect = host.getBoundingClientRect();
    startLeft = rect.left; startTop = rect.top;
    // ensure overlay has focus while dragging so keyboard shortcuts remain active
    try { wrapEl && wrapEl.focus(); } catch(_) {}
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    const left = Math.max(0, startLeft + dx); const top = Math.max(0, startTop + dy);
    host.style.left = left + 'px'; host.style.top = top + 'px'; host.style.right = 'auto';
  });
  window.addEventListener('mouseup', async ()=>{
    if(!dragging) return; dragging=false;
    try {
      const rect = host.getBoundingClientRect();
      await chrome.storage.local.set({ overlayPos: { left: Math.round(rect.left), top: Math.round(rect.top) } });
    } catch(_){}
  });

  document.documentElement.appendChild(host);
  loadAndRender();
})();
