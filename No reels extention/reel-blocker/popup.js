const DEFAULTS = {
  enabled: true,
  allowSharedReels: true,
  hideReelLinks: true,
  blockExplore: true
};

const ids = Object.keys(DEFAULTS);

chrome.storage.sync.get(DEFAULTS, (settings) => {
  ids.forEach((id) => {
    document.getElementById(id).checked = settings[id];
  });
});

ids.forEach((id) => {
  document.getElementById(id).addEventListener('change', (e) => {
    chrome.storage.sync.set({ [id]: e.target.checked });
  });
});

chrome.storage.local.get({ blocked: 0 }, (r) => {
  document.getElementById('blocked').textContent = r.blocked;
});
