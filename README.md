# No Reels

A Chrome extension that removes Instagram Reels while keeping **messages** and **stories**.

- Hides the Reels button in the navigation
- Redirects the Reels feed (`/reels/`) and profile Reels tabs back to the home page
- Hides reel thumbnails in profile grids and explore (optional)
- **Reels sent to you in DMs still open**, but in single-reel mode: wheel, touch, and arrow/page keys are blocked, so you can't scroll to the next reel
- Hides the Explore button and redirects the Explore page (`/explore/`, including hashtag and location pages) to the home page
- Toggle each behavior from the toolbar popup; settings apply instantly

## Install (developer mode)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium browser).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder (the one containing `manifest.json`).
5. Open [instagram.com](https://www.instagram.com) and refresh the page.

## Settings

| Toggle | What it does |
| --- | --- |
| Block Instagram Reels | Master switch. Hides the Reels button and redirects the Reels feed. |
| Allow reels sent to me | Lets a single reel open (e.g. from a DM) with scrolling disabled. Turn off to block every reel page. |
| Hide reel thumbnails | Hides reel tiles in profile grids and explore. |
| Block Explore page | Hides the Explore button and redirects `/explore/` pages. |

## How it works

Everything runs locally in a content script on `instagram.com`.

- `content.css` hides the Reels button and tiles using CSS selectors
- `content.js` watches URL changes (Instagram is a single-page app), redirects blocked routes, intercepts clicks to the Reels feed, and locks scrolling on a single reel page
- `popup.html/css/js` provide the settings popup, stored with `chrome.storage.sync`

The only permission requested is `storage`. No data leaves your browser.

## Limitations

Instagram changes its markup often, so some selectors may need updating over time.

- Reels that appear as regular posts in the home feed (`/p/CODE/` links) can't be reliably told apart from photos and videos, so they are not hidden.
- Explore thumbnails that link to `/p/` instead of `/reel/` will still show.
- The next/previous arrow selectors in single-reel mode are best effort; the scroll lock itself doesn't depend on them.
- The Search button (the panel for finding accounts) is left alone, since it's how you find people to message. Only the Explore page is blocked.
- Desktop web only. It does not affect the Instagram mobile app.

## Project structure

```
manifest.json     Extension manifest (Manifest V3)
content.js        Routing, click blocking, single-reel scroll lock
content.css       Hides Reels UI, styles the single-reel banner
popup.html/css/js Toolbar popup with settings
icons/            Extension icons
```

## License

MIT. See [LICENSE](LICENSE). This project is not affiliated with or endorsed by Instagram or Meta.
