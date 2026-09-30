(() => {
  'use strict';

  const DEFAULTS = {
    enabled: true,          // master switch
    allowSharedReels: true, // let reels sent in DMs open, one at a time, with scrolling disabled
    hideReelLinks: true,    // hide reel thumbnails in profile grids / explore
    blockExplore: true      // hide the Explore button and redirect /explore/ pages
  };

  const root = document.documentElement;
  let settings = { ...DEFAULTS };
  let lastPath = null;

  /* ---------- URL classification ---------- */

  // 'direct' = messages, 'single' = one specific reel, 'feed' = reels feed / reels tabs,
  // 'explore' = Explore page (and /explore/tags, /explore/locations, /explore/search), 'other'
  function classify(path) {
    if (/^\/direct(\/|$)/.test(path)) return 'direct';
    if (/^\/explore(\/|$)/.test(path)) return 'explore';
    if (/^\/reels?\/(?!audio(\/|$))[^/]+\/?$/.test(path)) return 'single'; // /reel/CODE/ or /reels/CODE/
    if (/^\/[^/]+\/reel\/[^/]+\/?$/.test(path)) return 'single';           // /username/reel/CODE/
    if (/^\/reels?(\/|$)/.test(path)) return 'feed';                       // /reels/, /reels/audio/...
    if (/^\/[^/]+\/reels\/?$/.test(path)) return 'feed';                   // profile "Reels" tab
    return 'other';
  }

  function isBlocked(kind) {
    if (!settings.enabled) return false;
    if (kind === 'explore') return settings.blockExplore;
    return kind === 'feed' || (kind === 'single' && !settings.allowSharedReels);
  }

  function bump() {
    try {
      chrome.storage.local.get({ blocked: 0 }, (r) => {
        chrome.storage.local.set({ blocked: (r.blocked || 0) + 1 });
      });
    } catch (_) { /* extension was reloaded; ignore */ }
  }

  /* ---------- Routing ---------- */

  function route() {
    const kind = classify(location.pathname);
    lastPath = location.pathname;

    if (isBlocked(kind)) {
      bump();
      location.replace('/');
      return;
    }

    const single = settings.enabled && settings.allowSharedReels && kind === 'single';
    root.classList.toggle('rf-on', settings.enabled);
    root.classList.toggle('rf-links', settings.enabled && settings.hideReelLinks);
    root.classList.toggle('rf-explore', settings.enabled && settings.blockExplore);
    root.classList.toggle('rf-direct', kind === 'direct');
    root.classList.toggle('rf-single', single);
    syncBanner(single);
  }

  // Instagram is a single-page app, so watch for URL changes.
  setInterval(() => {
    if (location.pathname !== lastPath) route();
  }, 300);
  window.addEventListener('popstate', route);
  document.addEventListener('DOMContentLoaded', route);

  // Stop in-app navigation to the reels feed before it happens.
  document.addEventListener('click', (e) => {
    if (!settings.enabled) return;
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a) return;
    let url;
    try { url = new URL(a.href, location.origin); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (isBlocked(classify(url.pathname))) {
      e.preventDefault();
      e.stopImmediatePropagation();
      bump();
    }
  }, true);

  /* ---------- Single-reel mode: no scrolling to the next reel ---------- */

  const locked = () => root.classList.contains('rf-single');

  function isScrollable(el) {
    const cs = getComputedStyle(el);
    return /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
  }

  // Allow scrolling inside things like the comments panel, but not the reel pager.
  function allowScroll(target) {
    let el = target instanceof Element ? target : null;
    while (el && el !== document.body && el !== root) {
      if (isScrollable(el)) {
        const snap = getComputedStyle(el).scrollSnapType;
        if (snap && snap !== 'none') return false;
        if (el.querySelector('video')) return false;
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function block(e) {
    if (!locked() || allowScroll(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  }

  window.addEventListener('wheel', block, { capture: true, passive: false });
  window.addEventListener('touchmove', block, { capture: true, passive: false });
  window.addEventListener('keydown', (e) => {
    if (!locked()) return;
    const t = e.target;
    if (t instanceof Element && (t.closest('input, textarea, [contenteditable="true"]'))) return;
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  function syncBanner(show) {
    let el = document.getElementById('rf-banner');
    if (!show) { if (el) el.remove(); return; }
    if (el || !document.body) return;

    el = document.createElement('div');
    el.id = 'rf-banner';

    const msg = document.createElement('span');
    msg.textContent = 'Single-reel mode \u00B7 scrolling is turned off';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Back';
    btn.addEventListener('click', () => {
      if (history.length > 1) history.back();
      else location.assign('/direct/inbox/');
    });

    el.append(msg, btn);
    document.body.appendChild(el);
  }

  /* ---------- Settings ---------- */

  chrome.storage.sync.get(DEFAULTS, (s) => {
    settings = { ...DEFAULTS, ...s };
    route();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const key in changes) settings[key] = changes[key].newValue;
    route();
  });

  // Cosmetic hiding applies immediately so the Reels button doesn't flash before
  // saved settings load; redirects only happen once real settings are known.
  root.classList.add('rf-on', 'rf-links', 'rf-explore');
})();
