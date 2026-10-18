# LP: Album Player

Files that belong together in the same folder: `shelf.html`, `shelf-cabinet.png`. Don't separate them.

See `CHANGELOG.md` for what's changed version to version.

## Setup — two parts now

### Part 1: what you already had (search still works without any of this)

Your Spotify Client ID and Secret are already filled in for **search** — this part needs no login and works exactly as before, regardless of whether you set up playback below.

### Part 2: enabling in-page playback (new)

This needs three things, because Spotify requires a real login (not just the app key) to stream anything.

1. **Add a Redirect URI in your Spotify app.** Go to your app on [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → Settings, and add a Redirect URI matching exactly how you'll run the local server below — for example `http://127.0.0.1:5500/`. It must match **exactly**, including the trailing slash, or the login will fail.

2. **Run the page through a local server, not a double-click.** Real login needs a proper `http://` address, not a `file://` one:
   - **VS Code**: install the "Live Server" extension, right-click `shelf.html` → "Open with Live Server."
   - **Python**: `cd` into the folder, run `python3 -m http.server 5500`, then open `http://127.0.0.1:5500/shelf.html` in your browser.
   - Whatever address actually shows in your browser's address bar once it's running — that's what needs to match your Redirect URI in step 1, exactly.

3. **Click "connect spotify for in-page playback"** — a small link under the search bar, only shown until you've logged in once. You'll be sent to Spotify's real login page, then straight back here. After that first time, you won't need to do it again; it quietly refreshes itself in the background.

**Spotify Premium is required for playback** — this is Spotify's rule, not a setting here. Free accounts can still search and build the shelf, just not play in-page (clicking a record will fall back to opening it in the Spotify app/website instead).

## Using it

- **Add a record**: click "add a record," type an album or artist, press **Enter**. A short list appears — click the one you meant, confirm the cover, click **Add**.
- **Play a record**: once you're connected to Spotify, hover a record to open its card, then click the cover art to play the album — a play icon appears over it on hover. Click a specific track inside the expanded panel (numbered) to start from there instead. Either way, the card closes and the record settles back into the shelf.
- **Playback controls**: once something's loaded, the search bar itself turns into large circular `‹ ▶/⏸ ›` buttons, with the track name, its position in the album, and the album name shown above them. A tiny equalizer bounces next to the title while actually playing. The record that's playing also breathes very slightly on the shelf, so you can spot which one it is at a glance.
- **Switching between search and playback**: a small icon in the top-right corner of the scene toggles between them at any time — a magnifying glass while playback controls are showing, a small waveform while search is showing, even before you've ever played anything. See Keyboard shortcuts below for Space/Enter/Tab.
- **Tag a record**: open a card, hover into the panel that slides out from its **left** edge. Type a name in the small bar at the top and press Enter (or click **+**) to create a new tag, assigned to this record immediately — or click any existing tag pill below to toggle it on/off for this record. A pill whose name is too long to fit will slowly scroll to reveal the rest when you hover it.
- **Filter by tag**: click the filter icon (top-left) to see every tag you've created as rounded pill buttons — hover one whose name is too long to fit and it'll slowly scroll to reveal the rest. Click one to show only that tag's records — click it again to go back to everything. **Cmd+click** additional tags to select several at once (shows records matching any of them). **Option+click** a tag to exclude it from the general view instead (it looks fainter when excluded, and stays that way until you option+click it again) — you can still select an excluded tag normally to see its records. **Press and hold** a tag for about 0.6 seconds to delete it — every tag fades in a small × on its border; tap the × for a confirm step that defaults to *not* deleting, or tap any tag to back out without deleting anything. The panel stays open until you click the filter icon again or click elsewhere.
- **Back up your collection**: click the small icon in the bottom-right corner. **Export backup** downloads everything — records, tags, filters, zoom — as a `.json` file you keep yourself, anywhere you like (Desktop, a cloud drive, wherever). **Import backup** picks one of those files back up; it shows you the record count and the exact date/time it was made before doing anything, and "Cancel" is the default if you press Enter without looking. The small circle icon next to it fills in solid when everything's backed up, and turns hollow/outlined once anything's changed since — records and tags count, zoom and filter selection don't. See "Backing up your collection" below for why this matters.
- **Paging, zoom, keyboard shortcuts, etc.**: unchanged from before — see below.

## Keyboard shortcuts

- **Space** — play/pause, always, in every context except actually typing in the search field
- **Enter** — from idle, opens the search bar (space is reserved for playback now)
- **Tab** — toggle between search and playback controls, one press, from anywhere, at any time
- **↑ / ↓** — browse search results
- **→ / Enter** — select a result, or add the album from its preview
- **←** — back out of a preview to the results list
- **Escape** — clear the search, from anywhere
- **← / →** — page through the shelf (whenever you're not in the search bar)

## Backing up your collection

Your shelf lives in this browser's own storage (`localStorage`), tied to this specific browser on this specific device. That means:
- Opening the page in a **different browser** (Chrome instead of Brave, say) starts with an empty shelf — browsers never share this kind of storage with each other, by design, regardless of website.
- **Clearing browsing data / site data** in your browser usually clears this too, even if you didn't mean to touch it.
- There's no setting that makes this storage permanently safe from every possible reset — it's just how browsers work.

The reliable fix is the **Export backup** button (bottom-right corner) — it saves your whole collection to a real file on your computer, completely independent of the browser. Get in the habit of exporting every so often, especially after adding a bunch of records or setting up new tags. If the shelf ever does come back empty, **Import backup** puts it right back exactly as it was.

## If something goes wrong

- **Login fails / redirects to a broken page** — almost always a Redirect URI mismatch. Check the exact address in your browser bar matches what's registered in the Spotify dashboard, character for character.
- **"Connect Spotify" link never disappears after logging in** — check the browser console (right-click → Inspect → Console) for an error; most likely the redirect URI issue above.
- **Nothing plays, falls back to opening Spotify instead** — either you're not Premium, or the in-page device hasn't finished connecting yet (give it a few seconds after logging in before your first click).
- **Playback controls never appear** — they only replace the search bar once something has actually started playing at least once.

## Keep this folder private

Both your Client Secret and (once you log in) your Spotify login session live in this file/browser. Don't upload it anywhere public or share it.

## Hosting and installing (v121)
Upload everything in this folder to a public GitHub repo, turn on Pages (Settings, Pages, deploy from branch `main`, folder `/ (root)`), add `https://<username>.github.io/<repo>/` as a Redirect URI in the Spotify developer dashboard, then open that address in Brave/Chrome/Edge and choose Install.
