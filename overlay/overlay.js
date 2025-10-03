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
  host.style.borderRadius = '24px';

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
      
      /* Susurro Design System Variables */
      :root {
        --color-warm-white: #FCF9F7;
        --color-near-black: #030302;
        --color-coral: #FF4500;
        --color-soft-yellow: #FDE99B;
        --color-pastel-blue: #B8CAF5;
        --color-pastel-blue-light: #DBEDFE;
        --color-peach: #FFDBC5;
        --color-peach-light: #FFF3E7;
        --color-lavender: #E9B8D9;
        --color-mint: #B8E9C5;
        --shadow-retro: 0 12px 12px 2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --shadow-glass: 0 50px 40px rgba(0, 0, 0, 0.01), 0 50px 40px rgba(0, 0, 0, 0.02), 0 20px 40px rgba(0, 0, 0, 0.05), 0 3px 10px rgba(0, 0, 0, 0.08);
      }
      
      .wrap {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: var(--color-near-black);
        background: #FFF5EB;
        border: 3px solid rgba(3, 3, 2, 0.1);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: var(--shadow-glass);
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 320px;
        min-height: 280px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: #FFE8D6;
        border-bottom: 2px solid rgba(3, 3, 2, 0.08);
        cursor: move;
        user-select: none;
      }
      .title { 
        font-family: Georgia, serif; 
        font-weight: 400; 
        font-size: 20px; 
        letter-spacing: -0.02em;
        color: var(--color-near-black);
      }
      .actions { display: flex; gap: 8px; }
      button {
        appearance: none;
        background: white;
        color: var(--color-near-black);
        border: 3px solid rgba(3, 3, 2, 0.1);
        padding: 8px 20px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: var(--shadow-retro);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      button:hover { 
        transform: translateY(-2px); 
        box-shadow: 0 16px 16px 4px rgba(0, 0, 0, 0.15);
      }
      button:active { transform: translateY(0); }
      .btn-primary { 
        background: #FF4500;
        border-color: #FF4500;
        color: white;
        box-shadow: var(--shadow-retro);
      }
      .btn-primary:hover { 
        background: #E63E00;
        border-color: #E63E00;
        box-shadow: 0 16px 16px 4px rgba(0, 0, 0, 0.15);
      }
      .btn-danger { 
        background: white;
        border-color: #ef4444;
        color: #dc2626;
      }
      .btn-danger:hover { 
        background: #ef4444;
        border-color: #ef4444;
        color: white;
      }
      .btn-ghost  { 
        background: white; 
        border-color: rgba(3, 3, 2, 0.15); 
        color: rgba(3, 3, 2, 0.7); 
        padding: 6px 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .btn-ghost:hover {
        background: white;
        border-color: rgba(3, 3, 2, 0.25);
        color: var(--color-near-black);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .toolbar { 
        padding: 12px 16px; 
        background: #FFE8D6;
        border-bottom: 2px solid rgba(3, 3, 2, 0.08); 
        display: flex; 
        gap: 8px; 
        align-items: center; 
        flex-wrap: wrap; 
      }
      .toolbar input[type="search"] { 
        flex: 1 1 180px; 
        min-width: 120px; 
        padding: 10px 14px; 
        border-radius: 14px; 
        border: 2px solid rgba(3, 3, 2, 0.1); 
        background: white; 
        color: var(--color-near-black); 
        font-size: 13px; 
        outline: none; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      }
      .toolbar input[type="search"]:focus { 
        border-color: var(--color-coral); 
        box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
      }
      .toolbar input[type="search"]::placeholder { color: rgba(3, 3, 2, 0.4); }
      .toolbar select { 
        padding: 10px 14px; 
        border-radius: 14px; 
        border: 2px solid rgba(3, 3, 2, 0.1); 
        background: white; 
        color: var(--color-near-black); 
        font-size: 12px; 
        cursor: pointer; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      }
      .toolbar select:hover { 
        border-color: rgba(3, 3, 2, 0.2);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      }
      .toolbar select:focus { 
        outline: none; 
        border-color: var(--color-coral); 
        box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1);
      }

      .body { 
        padding: 16px; 
        flex: 1; 
        overflow: auto;
        background: #FFF5EB;
      }
      .empty { 
        color: rgba(3, 3, 2, 0.5); 
        padding: 32px; 
        font-size: 14px;
        text-align: center;
      }
      ul.clips { 
        list-style: none; 
        margin: 0; 
        padding: 0; 
        display: flex; 
        flex-direction: column; 
        gap: 12px; 
      }
      .clip { 
        background: white; 
        border: 3px solid rgba(3, 3, 2, 0.08); 
        border-radius: 16px; 
        padding: 16px; 
        display: grid; 
        grid-template-columns: 1fr auto; 
        gap: 12px; 
        position: relative;
        box-shadow: var(--shadow-retro);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .text { 
        white-space: pre-wrap; 
        word-wrap: break-word; 
        font-size: 13px;
        line-height: 1.5;
        color: var(--color-near-black);
      }
      .meta { 
        color: rgba(3, 3, 2, 0.5); 
        font-size: 11px; 
        margin-top: 8px; 
      }
      .meta a { 
        color: var(--color-coral); 
        text-decoration: none; 
        word-break: break-all; 
      }
      .meta a:hover { text-decoration: underline; }
      .tags { 
        display: flex; 
        gap: 6px; 
        flex-wrap: wrap; 
        margin-top: 8px; 
      }
      .tag { 
        font-size: 11px; 
        padding: 4px 12px; 
        border: 2px solid var(--color-pastel-blue); 
        border-radius: 9999px; 
        color: var(--color-near-black); 
        background: var(--color-pastel-blue-light); 
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .btn-star { 
        width: 100%; 
        height: 100%; 
        min-width: 28px;
        min-height: 28px;
        text-align: center; 
        border-color: #fbbf24; 
        background: #fef3c7; 
        color: #92400e; 
        padding: 0;
        border-radius: 9999px;
      }
      .btn-star:hover {
        background: #fde68a;
        border-color: #f59e0b;
      }
      .btn-star.starred { 
        color: var(--color-near-black); 
        background: var(--color-soft-yellow); 
        border-color: #f59e0b;
      }
      .btn-star.starred:hover {
        background: #fbbf24;
        border-color: #d97706;
      }

      #toast { 
        position: absolute; 
        right: 16px; 
        bottom: 16px; 
        background: white; 
        color: var(--color-near-black); 
        border: 3px solid var(--color-mint); 
        border-radius: 16px; 
        padding: 12px 16px; 
        font-size: 13px;
        font-weight: 500;
        box-shadow: var(--shadow-glass); 
        opacity: 0; 
        transform: translateY(8px); 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        pointer-events: auto; 
        display: inline-flex; 
        align-items: center; 
        gap: 8px; 
      }
      #toast button { 
        background: var(--color-mint); 
        border: 2px solid var(--color-mint); 
        color: var(--color-near-black); 
        padding: 4px 12px; 
        border-radius: 9999px; 
        font-size: 12px; 
        cursor: pointer;
        font-weight: 500;
      }

      button:focus-visible { 
        outline: 3px solid rgba(255, 69, 0, 0.3); 
        outline-offset: 2px; 
      }

      /* Removed old toolbar select duplicate */

      /* Resize handle */
      #resize-handle { 
        position: absolute; 
        width: 24px; 
        height: 24px; 
        right: 8px; 
        bottom: 8px; 
        cursor: nwse-resize; 
        opacity: 0.4; 
        z-index: 2;
        transition: opacity 0.2s ease;
      }
      #resize-handle:hover { opacity: 0.8; }
      #resize-handle::before { 
        content: ""; 
        position: absolute; 
        right: 4px; 
        bottom: 4px; 
        width: 14px; 
        height: 14px; 
        border-right: 3px solid var(--color-near-black); 
        border-bottom: 3px solid var(--color-near-black);
        border-radius: 2px;
      }

      /* Card hover and collapsed text */
      .clip:hover { 
        transform: translateY(-4px);
        border-color: rgba(3, 3, 2, 0.15);
        box-shadow: 0 60px 50px rgba(0, 0, 0, 0.02), 
                    0 50px 40px rgba(0, 0, 0, 0.02), 
                    0 20px 40px rgba(0, 0, 0, 0.08), 
                    0 3px 10px rgba(0, 0, 0, 0.12);
      }
      .clip.collapsed .text { 
        display: -webkit-box; 
        -webkit-line-clamp: 4; 
        -webkit-box-orient: vertical; 
        overflow: hidden; 
      }
      .clip.collapsed .text::after { 
        content: ""; 
        position: absolute; 
        left: 0; 
        right: 0; 
        bottom: 0; 
        height: 32px; 
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1)); 
        pointer-events: none; 
      }
      .btns { 
        display: grid;
        grid-template-columns: repeat(2, minmax(30px, 36px));
        grid-auto-rows: minmax(30px, 36px);
        gap: 4px; 
        align-self: start;
        margin: -4px;
      }
      .icon-btn { 
        width: 100%; 
        height: 100%; 
        min-width: 28px;
        min-height: 28px;
        padding: 0; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        border-radius: 9999px; 
        font-size: 13px; 
        line-height: 1;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @media (max-width: 420px) {
        .clip {
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .btns {
          margin: 0;
          width: 100%;
          grid-template-columns: repeat(auto-fit, minmax(36px, 1fr));
          grid-auto-rows: 36px;
        }
        .icon-btn,
        .btn-star {
          min-width: 36px;
          min-height: 36px;
          font-size: 14px;
        }
        .btns .icon-btn,
        .btns .btn-star {
          width: 100%;
          height: 36px;
        }
      }
      
      /* Clip action buttons with distinct colors */
      ul.clips .btns .icon-btn:nth-child(1) { 
        /* Copy button - pastel blue */
        background: var(--color-pastel-blue-light);
        border-color: var(--color-pastel-blue);
        color: #1e40af;
      }
      ul.clips .btns .icon-btn:nth-child(1):hover {
        background: var(--color-pastel-blue);
        border-color: #1e40af;
      }
      
      ul.clips .btns .icon-btn:nth-child(2) { 
        /* Edit button - peach */
        background: var(--color-peach-light);
        border-color: var(--color-peach);
        color: #c2410c;
      }
      ul.clips .btns .icon-btn:nth-child(2):hover {
        background: var(--color-peach);
        border-color: #c2410c;
      }
      
      ul.clips .btns .icon-btn:nth-child(3):not(.btn-star) { 
        /* Delete button - light red */
        background: #fee2e2;
        border-color: #fca5a5;
        color: #dc2626;
      }
      ul.clips .btns .icon-btn:nth-child(3):not(.btn-star):hover {
        background: #fca5a5;
        border-color: #dc2626;
        color: white;
      }
      ul.clips .btns .icon-btn:hover { 
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.12);
      }
      ul.clips .btns .icon-btn:active { 
        transform: translateY(0) scale(0.98); 
      }
      ul.clips .btns .btn-star:hover { 
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.12);
      }
      ul.clips .btns .btn-star:not(.starred):hover { 
        background: var(--color-peach-light);
        border-color: var(--color-peach);
      }
      ul.clips .btns .btn-star:active { 
        transform: translateY(0) scale(0.98); 
      }
      .left { position: relative; }
      .expand-btn { 
        position: absolute; 
        top: 8px; 
        right: 8px; 
        width: 24px; 
        height: 24px; 
        min-width: 24px; 
        padding: 0; 
        font-size: 12px; 
        line-height: 1; 
        border-color: rgba(3, 3, 2, 0.1); 
        color: rgba(3, 3, 2, 0.5); 
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .expand-btn:hover { 
        color: var(--color-near-black);
        background: white;
        border-color: rgba(3, 3, 2, 0.2);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .toolbar .icon-btn { 
        width: 36px; 
        height: 36px; 
        min-width: 36px; 
        padding: 0;
        border-radius: 9999px;
      }
      .toolbar .icon-btn:hover { 
        transform: translateY(-1px);
        background: white;
        border-color: rgba(3, 3, 2, 0.15);
      }
      .text.editing { 
        outline: 3px solid var(--color-coral); 
        background: white; 
        border-radius: 12px; 
        padding: 8px; 
      }
      .clip:focus-within { 
        border-color: var(--color-coral); 
        box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.15);
      }
      .clip.selected { 
        border-color: var(--color-coral); 
        box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.15);
      }
      .edit-input { 
        width: 100%; 
        min-height: 96px; 
        resize: vertical; 
        border: 2px solid rgba(3, 3, 2, 0.1); 
        background: white; 
        color: var(--color-near-black); 
        border-radius: 12px; 
        padding: 12px; 
        font-size: 13px;
        line-height: 1.5;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .edit-input:focus {
        outline: none;
        border-color: var(--color-coral);
        box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1);
      }

      /* Settings popover - Modern Susurro design */
      .settings-popover { 
        position: absolute; 
        top: 50px; 
        right: 12px; 
        background: #FFF5EB; 
        border: 3px solid rgba(3, 3, 2, 0.1); 
        border-radius: 20px; 
        min-width: 380px; 
        max-width: 500px; 
        max-height: 560px; 
        box-shadow: var(--shadow-glass); 
        z-index: 10; 
        display: flex; 
        flex-direction: column; 
        overflow: hidden; 
      }
      .settings-header { 
        padding: 16px 20px; 
        border-bottom: 2px solid rgba(3, 3, 2, 0.08); 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        background: #FFE8D6;
      }
      .settings-header h3 { 
        margin: 0; 
        font-family: Georgia, serif;
        font-size: 18px; 
        font-weight: 400;
        letter-spacing: -0.02em;
        color: var(--color-near-black); 
      }
      .settings-tabs { 
        display: flex; 
        gap: 4px; 
        border-bottom: 2px solid rgba(3, 3, 2, 0.08); 
        background: #FFE8D6; 
        padding: 8px 12px; 
      }
      .settings-tab { 
        padding: 8px 16px; 
        border-radius: 9999px; 
        font-size: 13px; 
        background: rgba(255, 255, 255, 0.5); 
        border: 2px solid rgba(3, 3, 2, 0.08); 
        color: rgba(3, 3, 2, 0.6); 
        cursor: pointer; 
        font-weight: 500;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
      }
      .settings-tab:hover { 
        background: white; 
        color: var(--color-near-black);
        border-color: rgba(3, 3, 2, 0.15);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }
      .settings-tab.active { 
        background: white; 
        border-color: var(--color-coral); 
        color: var(--color-coral); 
        box-shadow: var(--shadow-retro);
      }
      .settings-content { 
        padding: 20px; 
        overflow-y: auto; 
        flex: 1;
        background: #FFF5EB;
      }
      .settings-section { display: none; }
      .settings-section.active { display: block; }
      .settings-popover h4 { 
        margin: 0 0 12px; 
        font-size: 13px; 
        color: var(--color-near-black); 
        font-weight: 600; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
      }
      .settings-popover .row { 
        display: flex; 
        gap: 12px; 
        align-items: center; 
        font-size: 13px; 
        padding: 10px 0; 
        color: var(--color-near-black); 
      }
      .settings-popover label { 
        display: flex; 
        gap: 10px; 
        align-items: center; 
        cursor: pointer; 
        user-select: none;
        font-weight: 400;
      }
      .settings-popover hr { 
        border: 0; 
        border-top: 2px solid rgba(3, 3, 2, 0.08); 
        margin: 16px 0; 
      }
      .settings-popover input[type="text"], .settings-popover input[type="search"] { 
        flex: 1; 
        padding: 10px 14px; 
        border-radius: 12px; 
        border: 2px solid rgba(3, 3, 2, 0.1); 
        background: white; 
        color: var(--color-near-black); 
        font-size: 13px; 
        outline: none; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      }
      .settings-popover input[type="text"]:focus, .settings-popover input[type="search"]:focus { 
        border-color: var(--color-coral);
        box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
      }
      .settings-popover select { 
        padding: 10px 14px; 
        border-radius: 12px; 
        border: 2px solid rgba(3, 3, 2, 0.1); 
        background: white; 
        color: var(--color-near-black); 
        font-size: 13px; 
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .settings-popover select:hover {
        border-color: rgba(3, 3, 2, 0.2);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      }
      .settings-popover select:focus {
        outline: none;
        border-color: var(--color-coral);
        box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1);
      }
      .settings-popover .form-group { margin-bottom: 16px; }
      .settings-popover .form-label { 
        display: block; 
        margin-bottom: 8px; 
        font-size: 12px; 
        color: rgba(3, 3, 2, 0.6); 
        font-weight: 600; 
      }
      .rule-item { 
        display: flex; 
        gap: 10px; 
        align-items: center; 
        padding: 12px; 
        background: white; 
        border: 2px solid rgba(3, 3, 2, 0.08); 
        border-radius: 12px; 
        margin-bottom: 8px; 
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      }
      .rule-item .rule-text { flex: 1; line-height: 1.5; }
      .rule-item button { padding: 6px 14px; font-size: 12px; }

      /* Reduced motion support */
      .wrap[data-reduce-motion="true"] *,
      .wrap[data-reduce-motion="true"] *::before,
      .wrap[data-reduce-motion="true"] *::after { 
        transition: none !important; 
        animation: none !important;
      }
      .wrap[data-reduce-motion="true"] .clip:hover,
      .wrap[data-reduce-motion="true"] button:hover,
      .wrap[data-reduce-motion="true"] .icon-btn:hover,
      .wrap[data-reduce-motion="true"] .btn-star:hover { 
        transform: none !important; 
      }
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
        <select id="export-format" title="Export format">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="markdown">Markdown</option>
        </select>
        <button id="export-btn" class="btn-ghost icon-btn" title="Export clips">↓</button>
        <button id="import-btn" class="btn-ghost icon-btn" title="Import clips">↑</button>
        <input id="import-file" type="file" accept=".json" style="display:none;" />
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
  const exportFormatSel = shadow.getElementById('export-format');
  const exportBtn = shadow.getElementById('export-btn');
  const importBtn = shadow.getElementById('import-btn');
  const importFileInput = shadow.getElementById('import-file');
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
      <div class="settings-header">
        <h3>Settings</h3>
        <button class="btn-ghost" id="settings-close" title="Close" style="padding: 2px 6px;">✕</button>
      </div>
      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="appearance">Appearance</button>
        <button class="settings-tab" data-tab="tags">Tag Rules</button>
        <button class="settings-tab" data-tab="about">About</button>
      </div>
      <div class="settings-content">
        <div class="settings-section active" id="section-appearance">
          <h4>Theme</h4>
          <div class="row">
            <label><input type="radio" name="qmc-theme" value="auto"> Auto (System)</label>
            <label><input type="radio" name="qmc-theme" value="light"> Light</label>
            <label><input type="radio" name="qmc-theme" value="dark"> Dark</label>
          </div>
          <hr />
          <h4>Accessibility</h4>
          <div class="row">
            <label><input type="checkbox" id="reduce-motion"> Reduce animations</label>
          </div>
        </div>
        <div class="settings-section" id="section-tags">
          <h4>Current Rules</h4>
          <div id="rules-list" style="margin-bottom: 16px;"></div>
          <h4>Add New Rule</h4>
          <div class="form-group">
            <label class="form-label">Rule Type</label>
            <select id="rule-type" style="width: 100%;">
              <option value="url-contains">URL contains</option>
              <option value="text-regex">Text matches regex</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Pattern</label>
            <input type="text" id="rule-pattern" placeholder="e.g., stackoverflow.com or \\bTODO\\b" />
          </div>
          <div class="form-group">
            <label class="form-label">Tags (comma-separated)</label>
            <input type="text" id="rule-tags" placeholder="e.g., Work, Important" />
          </div>
          <button id="rule-add" class="btn-primary" style="width: 100%;">Add Rule</button>
        </div>
        <div class="settings-section" id="section-about">
          <h4>Gigi's Copy Tool</h4>
          <p style="font-size: 11px; color: #9aa4b2; line-height: 1.5; margin: 8px 0;">
            A multi-clipboard manager for Chrome with smart deduplication, auto-tagging, and seamless desktop integration.
          </p>
          <hr />
          <h4>Keyboard Shortcuts</h4>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #9aa4b2;">Save selection</span>
              <kbd style="background: #1f2b45; padding: 2px 6px; border-radius: 4px; font-family: monospace;">⌘⇧U</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #9aa4b2;">Toggle overlay</span>
              <kbd style="background: #1f2b45; padding: 2px 6px; border-radius: 4px; font-family: monospace;">⌘⇧O</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #9aa4b2;">Copy selected clip</span>
              <kbd style="background: #1f2b45; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Enter</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #9aa4b2;">Delete selected clip</span>
              <kbd style="background: #1f2b45; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Del</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #9aa4b2;">Copy all clips</span>
              <kbd style="background: #1f2b45; padding: 2px 6px; border-radius: 4px; font-family: monospace;">A</kbd>
            </div>
          </div>
        </div>
      </div>
    `;
    wrapEl.appendChild(settingsPopoverEl);
    
    // Tab switching
    const tabs = settingsPopoverEl.querySelectorAll('.settings-tab');
    const sections = settingsPopoverEl.querySelectorAll('.settings-section');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        const targetSection = settingsPopoverEl.querySelector(`#section-${tab.dataset.tab}`);
        if (targetSection) targetSection.classList.add('active');
      });
    });
    
    // Close button
    const closeBtn = settingsPopoverEl.querySelector('#settings-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSettingsPopover);
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
          const empty = document.createElement('div');
          empty.textContent = 'No rules yet. Add one below to auto-tag clips.';
          empty.style.cssText = 'color: #9aa4b2; font-size: 11px; padding: 12px; text-align: center; background: #111827; border: 1px dashed #1f2b45; border-radius: 6px;';
          listEl.appendChild(empty);
          return;
        }
        tagRules.forEach((r, idx) => {
          const row = document.createElement('div');
          row.className = 'rule-item';
          const typeLabel = r.type === 'url-contains' ? 'URL' : 'Text';
          const tags = (Array.isArray(r.tags)?r.tags:[]).join(', ');
          const text = document.createElement('div');
          text.className = 'rule-text';
          text.innerHTML = `<strong style="color: #7fd1ff;">${typeLabel}:</strong> <code style="background: #0f172a; padding: 2px 4px; border-radius: 3px; font-size: 10px;">${r.pattern || ''}</code> → <span style="color: #cbd5e1;">${tags}</span>`;
          const del = document.createElement('button');
          del.className = 'btn-danger';
          del.textContent = 'Delete';
          del.addEventListener('click', async ()=>{
            try {
              const { tagRules: cur=[] } = await chrome.storage.local.get({ tagRules: [] });
              const next = cur.filter((_, i)=> i !== idx);
              await chrome.storage.local.set({ tagRules: next });
              showToast('Rule deleted');
              await loadRules();
            } catch(_) {}
          });
          row.append(text, del);
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

  // Export/Import functionality
  function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAsJSON(clips) {
    const data = JSON.stringify(clips, null, 2);
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    downloadFile(`gigi-clips-${timestamp}.json`, data, 'application/json');
  }

  function exportAsCSV(clips) {
    const headers = ['Text', 'Title', 'URL', 'Tags', 'Created', 'Duplicates', 'Source'];
    const rows = clips.map(c => [
      (c.text || '').replace(/"/g, '""'),
      (c.title || '').replace(/"/g, '""'),
      (c.url || '').replace(/"/g, '""'),
      (Array.isArray(c.tags) ? c.tags.join(', ') : '').replace(/"/g, '""'),
      c.createdAt ? new Date(c.createdAt).toISOString() : '',
      c.dupCount || 1,
      c.source || 'web'
    ]);
    const csvLines = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    downloadFile(`gigi-clips-${timestamp}.csv`, csvLines.join('\n'), 'text/csv');
  }

  function exportAsMarkdown(clips) {
    const lines = ['# Gigi\'s Copy Tool - Exported Clips', '', `**Exported:** ${new Date().toLocaleString()}`, `**Total Clips:** ${clips.length}`, ''];
    clips.forEach((c, i) => {
      lines.push(`## ${i + 1}. ${c.title || 'Untitled'}`);
      if (c.url) lines.push(`**URL:** ${c.url}`);
      if (Array.isArray(c.tags) && c.tags.length) lines.push(`**Tags:** ${c.tags.join(', ')}`);
      if (c.dupCount && c.dupCount > 1) lines.push(`**Duplicates:** ×${c.dupCount}`);
      lines.push(`**Created:** ${c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Unknown'}`);
      lines.push('');
      lines.push('```');
      lines.push(c.text || '');
      lines.push('```');
      lines.push('');
    });
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    downloadFile(`gigi-clips-${timestamp}.md`, lines.join('\n'), 'text/markdown');
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const { clips = [] } = await chrome.storage.local.get({ clips: [] });
        const sorted = [...clips].sort((a, b) => {
          const sa = a.starred ? 1 : 0; const sb = b.starred ? 1 : 0;
          if (sa !== sb) return sb - sa;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        const inFolder = activeFolderId ? sorted.filter(c => c.folderId === activeFolderId) : sorted;
        const filtered = applyFilter(inFolder);
        const tagFiltered = applyTagFilter(filtered);
        
        if (tagFiltered.length === 0) {
          showToast('No clips to export');
          return;
        }

        const format = exportFormatSel ? exportFormatSel.value : 'json';
        if (format === 'csv') exportAsCSV(tagFiltered);
        else if (format === 'markdown') exportAsMarkdown(tagFiltered);
        else exportAsJSON(tagFiltered);
        
        showToast(`Exported ${tagFiltered.length} clips as ${format.toUpperCase()}`);
      } catch (e) {
        console.error('Export failed', e);
        showToast('Export failed');
      }
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);

        if (!Array.isArray(imported)) {
          showToast('Invalid file: expected JSON array');
          importFileInput.value = '';
          return;
        }

        // Validate schema
        const valid = imported.every(c => c && typeof c === 'object' && typeof c.text === 'string');
        if (!valid) {
          showToast('Invalid clip format');
          importFileInput.value = '';
          return;
        }

        const action = confirm(
          `Import ${imported.length} clips?\n\n` +
          `OK = Merge with existing clips\n` +
          `Cancel = Abort import`
        );

        if (!action) {
          importFileInput.value = '';
          return;
        }

        const { clips: existing = [] } = await chrome.storage.local.get({ clips: [] });
        const merged = [...existing, ...imported];
        await chrome.storage.local.set({ clips: merged });
        showToast(`Imported ${imported.length} clips`);
        loadAndRender();
      } catch (e) {
        console.error('Import failed', e);
        showToast('Import failed: ' + e.message);
      } finally {
        importFileInput.value = '';
      }
    });
  }

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
