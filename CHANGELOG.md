# LP: Album Player: Changelog

(Formerly "Vinyl Shelf". Entries before v118 use the old name.)

## v133 (current)
- **Cloud Sync menu tidied:** "Change server address" and "Restore an earlier day" buttons removed (the daily cloud snapshots are still kept by the Worker); title is now "Cloud Sync"; under it a fainter italic line says **Online** or **Offline**, then the status line as before, with proper space above the button.
- **Sync now is greyed out while offline** (and switches on again when you're back online, even with the menu open).
- **The tick circle now means "saved to the cloud".** Dirty (outline) the moment you change something that syncs; ticked once the cloud has it, normally a few seconds later. Offline changes stay un-ticked until they upload. Redraws and housekeeping that is never synced (first-hover track fetches, the "unwrapped" sheen, the Downloaded tag) don't flip it. If cloud sync isn't set up, it falls back to the old "differs from last export" meaning. Hover text/label says "Saved to the cloud" / "Changes not saved to the cloud yet". Showing as un-ticked for the first second or two after launch, before the first sync finishes, is expected.
- Tests: `test_v133_sync` 76 checks (the 59 sync checks, with the restore test driven without the removed buttons, plus 17 new for menu text/layout, offline-disabled button and the tick in six situations); v130 account and smoke suites pass. The page-error check reports "Spotify is not defined" in this test setup after going back online; it comes from the empty stand-in for Spotify's player script used in tests and happens identically in v130.
- Service worker cache v133.

## v132
- **The sync server address is built in** (`https://lp-sync.simonohagan.workers.dev`), so nobody has to paste anything: connect Spotify and sync starts. The paste box is now only a fallback under the cloud bubble's "Change server address".
- Tests: `test_v131_sync` re-run for v132 (59 checks) with its last section replaced by built-in-address checks (shelf uploads with nothing pasted, no paste box shown, a brand-new computer gets the shelf with zero setup, a second Spotify account syncs its own separate shelf); v130 account and smoke suites pass; no page errors.
- Not verified: the live Worker itself (I can't reach it from here); the first real launch will show a green dot if it's set up correctly, or a red one with the reason if not.
- Service worker cache v132.

## v131
- **Account bubbles are now capitals:** "Simon" → **SI**, "Jane" → **JA** (accented and non-Latin names work too).
- **Cloud sync.** The same Spotify account on two computers now shows the same shelf. It needs a free Cloudflare Worker (included: `lp-sync-worker.js`; setup steps in `CLOUD-SYNC-SETUP.md`); until you paste its address the app behaves exactly as v130 and sends nothing anywhere.
  - **How you use it:** a new cloud bubble above the account stack shows a coloured dot (green synced, amber syncing, red problem, grey off). Click it to paste the Worker address once, sync now, or restore an earlier day. After that it just works: changes go up a few seconds after you make them, and the app checks for the other computer's changes every minute, when you come back to the window, and on launch.
  - **Who sees what:** the Worker asks Spotify whose sign-in token it is and only ever serves that person's shelf, so you and your partner each have your own. Each account keeps its own sync state when you switch accounts on one computer.
  - **Merging:** each computer remembers what every record looked like at its last sync. Changes on only one side are simply taken (including deletions). If both computers edited the *same* record, the more recent edit wins for that record; edits to *different* records both survive; a record edited on one side and deleted on the other is kept. Tags merge as a set. Nothing is ever deleted by a brand-new computer.
  - **"Downloaded" is not synced**, because it describes what is downloaded in the Spotify app on that computer. Each computer keeps its own.
  - **Safety brake:** if most of a shelf of 10+ records vanishes locally (browser storage wiped, a bug), the cloud copy is kept and put back instead of the loss being synced, and a message says so. An import or a restore is deliberate and bypasses the brake.
  - **Automatic backups:** the Worker keeps the state from the start of each day you make changes, for 30 days. "Restore an earlier day" in the cloud dialog replaces the shelf (on all your synced computers) with that day. Export/Import files still work as before, and importing a file now also syncs.
  - Works offline: edits are saved locally and uploaded when you're back online. The shelf is never rebuilt under an open record card; it waits.
- Tests: new `test_v131_sync` (59 checks, with the real Worker code running against an in-memory store and two simulated computers: first upload, new-computer download, edit/add/delete in both directions, same-record conflict, edit-vs-delete, Downloaded isolation, tag merge and tag deletion, the wipe brake, daily snapshot + restore to a second computer, server errors and a forced 409 retry, accounts staying separate, the address dialog, and Worker auth: no/unknown token, other users' shelves and snapshots, optional allow-list); all earlier account/refusal/race/smoke suites re-run with the capitals rule; no page errors.
- Not verified against the real thing: the Cloudflare dashboard's exact button names and that the free plan needs no card (as far as I know it doesn't); real Spotify tokens being accepted by the Worker; how quickly Cloudflare's storage shows one computer's change to another (it can take up to about a minute). Cloudflare's free storage allows about 1,000 writes a day, which is far above normal use here (a write happens once per burst of changes). The shelf is stored unencrypted in your own Cloudflare account; set the optional `ALLOWED_IDS` variable (see the setup guide) to limit it to the two of you.
- Service worker cache v131.

## v130
- **Account bubbles show the first two letters of the name** (not initials): "Simon O'Hagan" → **Si**, "Jane Doe" → **Ja**. Falls back to the account id if there is no display name. Works for accented/non-Latin names.
- **Fixed the Connect-Spotify loop.** After v129, switching back to your account asked you to sign in again (your stored login for that account had been overwritten earlier by the pre-v129 bug, so the app correctly refused to use it), but clicking Connect then returned as the *other* account and switched to it. Cause: Spotify's authorize page silently reuses whichever account this browser is signed into on Spotify, and that was the newly added one. Now:
  1. The app records why a sign-in started (adding someone, re-connecting the account on screen, or first sign-in).
  2. If you re-connect an account and Spotify comes back as someone else, the app does **not** follow it to that shelf. It puts things back and says: "Spotify signed you in as <other>, but this is <you>'s shelf. On Spotify's page choose "Not you?" (or log out at open.spotify.com first) and sign in as <you>. To use <other>'s shelf, switch to it with the account bubbles." Nothing is lost: the other account's shelf and login stay in its stash.
  3. Sign-in now always asks Spotify to show its dialog (`show_dialog=true`) once more than one account is on the device (it was only done for +).
- **To get unstuck on your machine:** open open.spotify.com in Brave and log out, click Connect Spotify in the app, and sign in as yourself (or choose "Not you?" on Spotify's page if it offers it). The login is then stored correctly for your account and switching works both ways.
- Tests: new `test_v130_reconnect` (12 checks: your exact situation, first try returns as Jane and is refused cleanly, second try as Simon succeeds, then switching to Jane and back works, plus the two-letter rule on six names); the 38 account checks (one updated to the new rule), 8 refused-sign-in, 11 stale-window/race and 6 smoke checks all pass; no page errors.
- Not verified against real Spotify: whether its dialog shows a "Not you?" link in your browser; if it doesn't, logging out at open.spotify.com first is the sure way.
- Service worker cache v130.

## v129
- **Fixed: switching back to your account flipped to the other one.** I could not see your Spotify, so I reproduced the failure from two mechanisms and fixed both; against v128 the new tests fail (a late token refresh overwrote the other account's login, and a login belonging to another account flipped the shelf), against v129 they pass.
  1. *A token refresh still in the air when you switch could write its login into the slot that now belongs to the other account* (v127/v128 wrote any refresh result straight into the live login). It then looked, to the next page load, like the shelf of one account was signed in as the other, and the app "corrected" it by flipping accounts. Refreshes now (a) share one request instead of racing two (the player and the app both asked at startup), (b) are blocked from the moment a switch or sign-in starts, and (c) are discarded if the active account or live login changed while they were in the air.
  2. *Safety net:* if the live Spotify login belongs to a different account than the shelf on screen and nobody just signed in, the shelf no longer flips. The foreign login is signed out and a message says: "Spotify was signed in as someone else, so it was signed out to protect <name>'s shelf. Click Connect Spotify (or +) and sign in as them to continue." Signing in again as that person restores everything. If the problem you hit left the wrong login stored for your account, this is also the repair: switch to your account, then Connect Spotify once.
- **Other windows follow along.** The installed app and a browser tab share storage; if one switches account, the other now reloads to match instead of carrying on as the old account (a second window running as the old account was one way to cause the problem above). Coming back with the Back button after starting a sign-in now reloads the page.
- **Account bubble text:** initials are larger and lighter: 16px at weight 400 (was 12.8px at 600), on the account button and on the bubbles. Added Barlow Condensed 400 to the font link.
- **Backup filename:** `lp-backup-<first name>-<date-time>.json`, e.g. `lp-backup-simon-2026-10-21-2030.json` (was `lp-album-player-backup-simon-o-hagan-…`). Files without an account use `lp-backup-<date-time>.json`. Old backup files (any name) still import.
- Tests: new `test_v129_flip` (11 checks: mismatched login, late-refresh race across two windows, single-flight refresh, font) plus the 38 account checks, 8 refused-sign-in checks and 6 smoke checks, all passing; no page errors.
- Not verified against real Spotify: whether this was the exact cause on your machine. If it still flips, tell me whether two windows were open and I'll look at it with that in mind.
- Service worker cache v129.

## v128
- **Refused sign-ins are now harmless.** Found while answering "what if my partner tries before I add her to the dashboard": in v127, a person Spotify lets sign in but then refuses (an account not on the owner's allowlist is expected to get a 403 from Spotify's API) left their login in the live slot, replacing the active account's. The shelf was safe, but the next switch would have saved that bad login over the good one, forcing a re-sign-in. Now, if a sign-in is refused (401/403 on the "who am I" call), the previous account's login is restored from its stash, no account is created, nothing changes, and a message says: "Spotify wouldn't let that account in yet. Ask the app's owner to add its email in the Spotify developer dashboard, then try again. Your shelf is unchanged." A network failure right after sign-in does not trigger this (the new login is kept).
- Tests: new `test_v128_refused` (8 checks: message shown, own login and scope restored, no account added, shelf unchanged, still works after reload); the 38 account checks and 6 smoke checks pass unchanged. Not verified against real Spotify: that a non-allowlisted account really gets a 403 (that is Spotify's documented behaviour for development-mode apps as far as I know).
- Service worker cache v128.

## v127
**Accounts: one Spotify account = one shelf on this browser.** (Local only; cloud sync is the next step.)
- **The bottom-right button is now your account.** A circle with your initials from your Spotify display name (a person glyph until someone is signed in). Click it for a stack of round bubbles above it: Export backup, Import backup, a divider, **+** (add account), then bubbles for every other account on this device (click to switch; hover shows "Switch to <name>" and a small × to remove that account from this device, with a confirm). The small backup-status tick next to it is unchanged. Export/import work exactly as before, on the active account's shelf; export filenames now include the account, e.g. `lp-album-player-backup-simon-o-hagan-2026-10-21-1930.json`. Backup contents and `BACKUP_KEYS` are unchanged.
- **How it works.** The active account's data stays in the normal storage keys, so the rest of the app is untouched; every account also has a stash (`vinyl_shelf_acct_<id>__…`) holding its shelf, filters, releases cache and its own Spotify login. Switching saves the old account, loads the new one and reloads. The account list (`vinyl_shelf_accounts`) is per browser and is not in backups.
- **Existing shelf is kept.** The first time you open v127 while signed in, your current shelf is claimed by your Spotify account automatically (the app asks Spotify who you are, once per load while online).
- **Adding an account** uses Spotify's login with `show_dialog=true`, so Spotify always offers its account chooser. Your own shelf and login are saved before leaving the page. Signing in as someone who is already on the device just returns to their shelf (no duplicate). If a login ever expires and a *different* person signs in through "Connect Spotify", the previous shelf is kept safe under its own account instead of being overwritten.
- **Offline**: the + bubble is hidden (signing in needs internet); switching between existing accounts, import and export still work.
- Service worker cache v127.
- Tests (new, Playwright with Spotify mocked, 38 checks + 5 smoke checks): guest/menu behaviour, migration of an existing signed-in shelf, adding a second account, blank starting shelf, separate logins, exact data round-trips when switching both ways, re-adding an existing account, export filename and payload shape, import round-trip leaving the other account alone, removing an account, expired-login-then-different-person, offline behaviour, initials fallback from the id. Earlier regression suites were lost with the old working container, so older features got only a smoke test (shelf render, hover card, service worker, offline cold open); the backup/import paths were covered above.
- Not verified against real Spotify: the account chooser behaviour, a real `/me` response (display name field), and whether a partner not yet on your developer-dashboard allowlist gets a 403 (in which case the app keeps showing the guest button).

## v126
- **Icon: full-size tile for Brave/Chrome on Mac.** A screenshot of the v124 install showed a second, larger cream rounded square around the icon that is in none of the files; Brave wraps plain web-app icons in its own plate and scales them down. v126 restores the transparent tile (your PNG, tight crop) as the "any" icon at 192/512/1024 and adds a maskable 512 icon where the same tile's cream fills the whole square edge to edge, so a platform that applies its own rounded mask gets your tile at full size rather than shrunk inside another one. Reverts v125's sleeve-only cut-out. Service worker cache v126 (also caches the maskable icon). No app code changed. Unverified on a real Mac: whether Brave picks the maskable icon.
- Fallback that bypasses Brave entirely: paste the transparent PNG onto the app in Finder (Get Info).

## v125
- **Icon = the sleeve-and-record artwork only.** I had misread the brief: the rounded cream square in your transparent PNG is the "margin" you wanted gone, not part of the icon. v125 cuts the sleeve stack and record out of that cream square (sleeve outline built geometrically, the other sheets and record separated by edge detection) and centres it on transparency with a 6% margin at 192, 512 and 1024 px. Previewed on dark and light backgrounds. macOS 15 adds no backing of its own, so this should show on its own. Service worker cache renamed v125. No app code changed.

## v124
- **Icon: only your transparent image, no cream margin.** The cream border seen on Mac came from the maskable icon (a cream full-bleed square), which Brave on Mac was choosing. It is removed from the manifest and the files, so the app now declares only your transparent-tile icon at 192, 512 and 1024 px (2% margin, purpose "any"). Service worker cache renamed v124 and now caches `icon-1024.png`. Phones that want a maskable icon would need one added back later. No app code changed.

## v123
- **App icon rebuilt from your transparent PNG.** True alpha (corners fully transparent), so the rounded cream tile is the whole icon with no extra square around it. Cropped to the tile and centred with a 5% margin in `icon-512.png` / `icon-192.png`. `icon-maskable-512.png` is the same tile at 62% on cream full-bleed for systems that crop icons to a shape. Replaces v122's automatic cut-out. Service worker cache renamed v123. No app code changed.

## v122
- **App icon: artwork only, no background square.** v121 used your image as supplied, so its cream margin showed as a second icon around the icon. The sleeve/record artwork is now cut out of that margin (transparent surround, soft edge) and centred with a small margin in `icon-512.png` and `icon-192.png`. The maskable icon keeps a cream full-bleed background (needed by systems that crop icons into shapes) with the artwork inside the safe zone. Checked on dark and light backgrounds. Service worker cache renamed v122.
- No app code changed.

## v121
- **New app icon** from your artwork (LP record sleeve). `icon-512.png` / `icon-192.png` use it as supplied; `icon-maskable-512.png` is the same art at 72% on a smoothly extended cream background so rounded/circular crops never clip it. Manifest and page `theme-color` changed to the icon's cream (#f2e1cc); service worker cache renamed v121 so the new icons are fetched.
- No app code changed. Brave won't refresh an installed app's icon on its own: delete the installed app and reinstall.

## v120
Installable web app (PWA) for free hosting on GitHub Pages. The app file is now `index.html` (was `shelf.html`).
- **Installable**: added `manifest.webmanifest`, three icons (record on dark wood; one maskable), and `sw.js`, a service worker that saves the app, both cabinet images and the fonts so it opens instantly and loads with no internet. Spotify calls are never cached. Test: service worker controls the page, 8 files cached, manifest/icons load, and a cold open with the network off shows the app with the Offline badge.
- **Client secret removed.** A public site can't hold a secret, so `SPOTIFY_CLIENT_SECRET` is gone from the file (verified: not in page source). Search, new releases and track lookups now use your signed-in (PKCE) token instead of the old app-only one. Consequence: searching needs Spotify connected once (the existing "Connect Spotify" prompt). Test: signed out makes no client-credentials request; signed in, search sends `Bearer` user token via the refresh flow only.
- Sign-in redirect is still worked out from the page's own address, so it needs no change when hosted; the new address just has to be added in the Spotify dashboard.
- Storage names and backup format unchanged. Note: a new web address has its own empty storage, so use Export on the old copy and Import on the new one once.
- Regressions: all earlier suites pass; the song-link suites (v110/v114/v115) only pass when signed in, as expected now. v118 opacity checks fail by design (reverted in v119).

## v119
- **Backup-status tick (bottom-right) is fainter** in both states (up to date / unsaved changes): opacity 0.85 → 0.4. Verified by computed style in both states.
- **Downloaded boxes back to their original opacity**: card button full opacity (ticked and unticked); filter-row box 0.45 off / 1 on (hover 0.8). The v118 fading is removed.
- No backup keys or data changed.

## v118
- **The project is now "LP: Album Player".** Updated in the page title, the device name that shows up in Spotify's "Connect to a device" list (it will appear under the new name once the page reconnects), backup file names (`lp-album-player-backup-…json`), the backup file's internal label and the "doesn't look like a backup" message, and the README. **Backups made before the rename still import**, and your data is untouched: the storage names inside the browser keep their old internal prefix on purpose, since renaming them would hide your shelf.
- **Offline mode now also removes the New Releases button and the follow icons entirely** (no greyed-out leftovers). They return when the connection does. Offline now shows only the shelf, filters, badge and the backup/zoom controls.
- **The Downloaded tick-box is fainter** (I read "in both instances" as ticked and unticked, applied to the hover-card button and the filter-row box): on the card, about half strength off and 60% on (was full strength); in the filter row, about 28% off and 62% on (was 45% and 100%). Hover brightens them slightly.
- Verified: 13 new checks (title, device name, storage names kept, export name and label, old/new/unrelated backup import, fainter opacities both states in both places, offline removals and return) plus the earlier suites.

## v117
- **The Downloaded button is now a down-arrow landing on a tray** (on the hover card beside the +, and in the filter row left of the star tiers). Still filled when on, outline when off.
- **Offline mode removes the search bar, the playback controls and the switch between them entirely**, instead of greying them out. New Releases and the follow icon stay greyed (with the "Needs internet" tooltip). The Enter and Tab shortcuts that jump into search/playback do nothing offline.
- **Offline defaults to the Downloaded filter**, so only records you've marked as downloaded (the ones that can play offline) are shown. Details:
  - It applies when the connection drops and when the page is opened offline, and clears any star-tier filter (it would otherwise hide most of what you're meant to see).
  - It is **not saved**: your own last filters are untouched in storage, so they're back next time you open the app online.
  - When the connection returns, your previous filters are put back, unless you changed the filters yourself while offline, in which case your choice stands.
  - If nothing is marked yet, the shelf says "Nothing marked as downloaded yet" and how to mark one.
- **Backups:** the Downloaded marker is a tag inside each record, and records are in the backup, so yes, it's saved and restored. The saved cover copies are deliberately not (they live in the browser's cache and are re-saved automatically while online). `BACKUP_KEYS` unchanged.
- Verified: 33 + 8 new checks (offline layout and defaults, not saved, restore rules, empty message, icon, backup contents) plus the earlier suites; the two older tests that don't mock Spotify's reachability check needed that mock, because a sandbox with Spotify blocked now (correctly) counts as offline.

## v116
- **Offline mode.** When the connection drops (or the page is opened with none), a small "Offline mode" pill with a crossed-out wifi icon fades in at the **top centre**, and fades away by itself when the connection is back. It is only there while offline.
  - **Detection:** the browser's own online/offline signal, double-checked with a tiny request (only while offline, every 15 seconds, and after a failed Spotify request) since the browser's signal can be wrong on wifi with no internet.
  - **Greyed out, with a "Needs internet" tooltip and no action:** search, New Releases, the follow icon, and the in-page prev/play/next controls. Everything else works normally: browsing, filters, Crate and Singles, tags, ratings, filing singles, removing records, backup/restore.
  - **Playing a record offline opens it in the Spotify app and starts it:** a cover click plays the album, a track-row click plays that track, a song-link single plays its song (using Spotify's "open and play" link type). The browser will ask once to allow opening Spotify. If the album is downloaded in the app it plays offline there.
  - **Covers and spines look right offline.** A copy of each cover is saved on the device (in the browser's own storage, not in your backups or localStorage; it can always be re-downloaded). New records save theirs straight away, and existing records are filled in quietly in the background while online, at a few a second.
  - **Track lists** you've already opened stay visible offline; others say "Track list needs internet".
  - If the page was opened offline, Spotify's player script is fetched when the connection returns, so in-page playback comes back without a reload.
- **"Downloaded" marker.** A tick-in-a-box button sits right of the **+** on the tag side of each hover card (same squared shape, fills when on). It tags the record "Downloaded", which works like any tag but has its own controls: it's kept out of the ordinary tag lists, you can't create, rename or delete a tag by that name, and any existing "Downloaded" tag you already had is picked up automatically.
- **Downloaded filter:** a matching tick-in-a-box sits at the **left of the star tiers** in the filter row. Click to show only downloaded records, click again to clear, Cmd/Ctrl-click to combine with other tags, and it also combines with a star tier. Singles have no tag panel, so they can't be marked.
- Verified: 29 new checks (online baseline, cover caching, Downloaded tag/reserved name/tick/filter, badge appears top-centre and disappears, greyed controls and tooltips, search disabled, shelf and covers/spines offline from local copies, tagging offline, cover/track/song-link play links, greyed controls inert, recovery, and a page opened while offline with no page errors) plus screenshots, and the full earlier suites (only the explained v103 "pills ordered" check differs). `BACKUP_KEYS` unchanged; the Downloaded flag is a tag inside the records.
- Not tested for real: the "open and play" link depends on the Spotify app and your browser's handling of it, and the sandbox can't open either; the link text is verified, not what the app does with it. Fonts still come from Google, so offline you may see close-looking system fonts unless the browser already holds them.

## v115
- **Fixed: a single added from a song link before v114 showed no length on its hover card.** That is the one you spotted (the only one that's a song from an album rather than a dedicated release). v114 only stored a song's length when you added it, and its "look it up on first hover" step skipped song-link singles entirely. Now any single with no stored length looks it up on first hover, and song-link singles ask Spotify about the **song itself** (an album lookup would be the wrong thing, since their id is a song id). The length is then saved on the record and never fetched again. If the lookup fails, the card just keeps saying "Single" and tries again next hover. The same length also feeds the elapsed / total time in the playback controls.
- Verified: 6 new checks (no length at first, failed lookup is harmless, next hover shows "Single · 3:18", persisted, no refetch, album endpoint not used) and the earlier suites. `BACKUP_KEYS` unchanged.

## v114
- **A single's hover card now shows its length beside "Single"** (bottom right), e.g. "Single · 3:33". Songs added by link know it straight away. Albums-that-are-singles (including your older ones) look it up from Spotify the first time you hover them, then keep it on the record, so it's never fetched twice.
- **While a single plays, the playback controls show elapsed / total time** (e.g. "1:05 / 3:33") instead of "Track 1 of 1", updating twice a second so you can see how long is left. Albums still show "Track 2 of 2" with no time label, exactly as before.
- Verified: 10 new checks (card label for both kinds of single, one-time fetch and persistence, no refetch on a second hover, song-link add stores its length, time label follows a moving player, albums unchanged) plus a screenshot of the card, and the earlier suites. `BACKUP_KEYS` unchanged (the length is stored inside the record).
- Note: the live time reading comes from Spotify's player, which isn't reachable from this sandbox; it was tested against a simulated player.

## v113
- **The end-of-record stop is now timed to the end of the song rather than "within half a second".** Instead of pausing whenever a 0.2s poll happens to notice the last track is nearly over, the app works out exactly when the last track ends and schedules one pause aimed at that moment, minus the time a pause takes to land (starts at 100ms, then re-measures itself from the real pause time each play and tunes to it). Tested with a simulated clock-driven player: the pause landed 0-106ms before the true end, and about 30ms once it had measured the latency (v112: up to 450ms). The track is rewound to 0:00 so Play replays it, and the middle tracks of an album are never touched.
- Not changed: this is still a workaround. Spotify's player has no "stop after this" control; the only fully clean switch is Spotify's own **Autoplay** setting (account/app setting, applies to every device including this player), which this app cannot change.
- Verified: 5 timing checks plus the earlier suites that cover unchanged areas. The v112 end-detection test was superseded. Spotify's real player isn't reachable from the sandbox, so please confirm on a single. `BACKUP_KEYS` unchanged.

## v112
- **Autoplay fix (v111 didn't work on a single).** Cause: v111 treated the player's "context" as proof the music was still yours, but Spotify can keep the old context while it plays an unrelated track after the end, so the next song slipped straight through. Now:
  - **It stops before the next song starts.** While one of your records is playing, the app reads the player every 0.2s. When the track playing is the last one of yours (nothing of yours queued next) and it is within 0.45s of its end, it pauses and rewinds to 0:00. So a single ends silently, the card stays on your record, and Play/Space replays it. Applies to albums (only after their final track; earlier tracks roll on normally), album-based singles and song-link singles.
  - **Backstop:** if the player does reach a track that isn't yours (judged by the track itself, never the context), it is paused and left showing your record. After that it stops guarding, so anything you start afterwards, even from your phone, is left alone.
- Limit: up to about half a second of a record's final tail can be clipped. I tested this against simulated player states (Spotify's player isn't reachable from here), including the exact case that broke in v111; please check one single and one album's last track on the real thing.
- Verified: 6 new checks (foreign track with unchanged context, proactive stop plus rewind, track single, middle track of an album untouched, polling alone, ignored cases) and the earlier suites. `BACKUP_KEYS` unchanged.

## v111
- **Singles have twice the default spine width** (a 1-track record was the thinnest spine possible; it's now about 22px at default zoom instead of about 11px). Applied to both the spine itself and the shelf's page-fitting maths, so pages still fill correctly.
- **Playback stops when your record ends.** The Spotify player has no autoplay switch, so the app now remembers what it asked to play and, the moment the player moves on to something else after having actually been playing yours (an album's last track rolling into Spotify's pick, or a single ending), it pauses. The card/spine keep showing your record's last track rather than Spotify's choice. Works for albums, album-based singles and song-link singles. Limit: the pause is triggered by Spotify's first move to the next song, so you may catch a fraction of a second of it before it stops. A song Spotify starts that you didn't ask for (e.g. picking music from your phone for this player) is only paused if it replaces a record the app was playing.
- **Singles can no longer live in the regular collection.** On load, any existing record with exactly one track that was added before Singles existed is moved straight into **Singles** (not the Crate — it was already on your shelf). Its old rating/tags stay in the data but aren't shown on a single's card. They show the release year until you re-add them, since the full date wasn't saved back then. Records marked as not-a-single, and everything with more than one track, are untouched; a reload never moves a single you left in the Crate.
- Verified: 13 new checks (migration of legacy cases, explicit not-single respected, regular shelf has none, width exactly 2x and rendered, autoplay guard across loading / own tracks / foreign track / track single / no guard) and the full prior suites (only the explained v103 "pills ordered" check differs). The autoplay guard was tested by feeding it player-state messages directly; the real Spotify player can't be reached from this sandbox. `BACKUP_KEYS` unchanged.

## v110
- **Paste a song link to add one song as a single.** Paste a Spotify "Copy song link" (or `spotify:track:` URI) into the search box and press Enter: you get the usual preview (cover, song title, artist) and Add. It lands in the Crate as a single like any other, and you file it into Singles from there. Track links with `?si=` or a language prefix both work, and a bad link shows "Couldn't find that song — double check the link was copied correctly."
  - The record is keyed on the song's own id, so adding one song from an album does not clash with owning that album.
  - It uses the album's cover and release date (Spotify has no separate single artwork for a song inside an album).
  - Playing it plays just that song (`uris:[track]`), not the album. Verified the exact request body, and that an ordinary album-based single still sends the album context.
  - No track-list fetch is made for these.
- **"Unfollow (Artist)?" text is centred** (the follow-related popovers share this).
- **"Add to Singles" is a filled button** (gold with light text) instead of hollow.
- **No button on single cards inside Singles:** the "In Singles" button and its move-back-to-Crate confirmation are gone.
- Verified: 13 new checks (link parsing for URL / intl URL / URI, album vs track link not confused, bad-link message, preview, record fields, Crate landing, filled button, no album fetch, Singles view has no button, play request body, centred text); prior suites re-run, with only the already-explained v103 "pills ordered" assertion differing. The v109 single-flow test is superseded by this change (it exercised the removed "In Singles" button). `BACKUP_KEYS` unchanged.

## v109
- **Singles.** A new pinned **Singles** category sits right beside the Crate in the filter list, always present, with a small CD icon (the Crate keeps its own icon). It is a built-in view like the Crate, so it can't be renamed, deleted or used as a tag name.
- **Flow:** any release added with exactly one track is treated as a single and lands in the Crate. From its card, **Add to Singles** moves it into Singles; it then shows only under the Singles pill. On a filed single the button reads **In Singles**; clicking it asks "This will be moved to your Crate." before moving it back.
- **Single hover card is the base card only:** cover, title, artist, follow/unfollow, the ✕ remove button, the full release date (e.g. "Oct 3, 2026") and "Single" in place of the track count. No tags, track list or star rating, and no track fetch from Spotify for singles.
- **Singles never appear on the main shelf or under real tag filters.** Singles view and Crate view combine (OR) with each other, like any multi-select. Picking a star tier clears Singles, same as it already does for the Crate.
- **Not changed:** existing 1-track albums already on your shelf are left alone, and only exactly-1-track releases count (a 2-3 track "single" stays an album). Singles live inside the records, so **no new backup key**; `BACKUP_KEYS` unchanged.
- **One-time rename:** if you already had a real tag called "Singles", it is renamed everywhere to "Singles (tag)" so it can't collide with the new view.
- Fixed during testing: a first-render ReferenceError (new helpers declared too late) caught by the new test.
- Verified: 20 new checks (visibility in All/Crate/Singles/OR/real-tag views, card contents, add and move-back flow, persistence, tag migration, reserved names, backup keys) plus screenshots; full regression suite re-run. The only failing old check is v103's "pills ordered" assertion, which expects the Crate pill alone before the tags and now sees the Singles pill too.

## v108
- **The unfollow confirmation now appears over the hover card, not under it.** Root cause: every record you hover is given a stacking order one higher than the last (so the newest hover is always on top) with no upper limit, while the confirmation box sat at a fixed low number — so after enough hovering the card outranked the box it had just opened. The box now sits far above any card. The same fix applies to the "This will be moved to your Crate" box, which opens from the card in the same way. Verified with the card's stacking order forced to 90,000: the box is the topmost element at its corners and centre.
- **Wording trimmed to "Unfollow (Artist)?"** (the "on Spotify" is gone), and the follow/reconnect boxes have more room around their text and buttons (padding about 8px → 13px, wider gap between the buttons).
- **Playing-record "breathing" doubled in range**: brightness peak 1.15 → 1.30 and size peak 1.5% → 3%, same 4.5s rhythm.
- **The blue sheen is replaced by a solid blue that pulses gently.** The diagonal sweep was removed; the playing spine now carries a solid blue wash that fades between about 20% and 48% strength over the same 4.5s as the breathing, so the two move together. It fades in when playback starts and out when it stops, as before, and the reduced-motion setting holds it at a steady mid-strength instead of pulsing. Verified by sampling the colour over time (it varies smoothly within those bounds, with no gradient left) and by screenshot.
- Full regression suite re-run: all prior versions' tests (including the 36 follow-icon checks), syntax checks, the mock-execution check, and an opacity-rule diff against v104 showing no change. `BACKUP_KEYS` unchanged.

## v107
- **Follow state is now re-checked with Spotify at most once per 30 minutes per artist (was 15 seconds), and switching tabs no longer triggers any check.** The 15-second window was far more eager than a follow made on your phone needs, and a burst of hover-driven requests is exactly the pattern that has caused Spotify rate-limit trouble before. What remains: a fresh page load always re-checks from scratch (the state is held in memory only, never saved), and a tab left open for a long time re-checks the next time a card opens after 30 minutes. A follow/unfollow made here is trusted for the same 30 minutes. The v106 "re-check when you return to the tab" behaviour was removed.
- Verified (mocked Spotify): remembered state reused with no extra request when reopening soon after, tab switching causes no requests, a follow made elsewhere appears once the 30 minutes are up, and a page reload always re-checks. The v106 checks for the icon size/alignment and the missing-icon fallbacks still pass (14 + 22 follow checks).
- Full regression suite re-run: all prior versions' tests, syntax checks, the mock-execution check, and an opacity-rule diff against v104 showing no change. `BACKUP_KEYS` unchanged.

## v106
- **Follow icon is a little smaller (15px → 12px) and now sits on the same vertical line as the ✕ above it** — measured directly: the two centres are within about 0.1px of each other.
- **Follows/unfollows you make in Spotify itself now show up here.** You were right about the cause: v105 asked Spotify once per artist and then trusted that answer until the page was reloaded. Now:
  - A card opening re-checks with Spotify if the last check for that artist is more than 15 seconds old. It shows what it already knew instantly and corrects itself a moment later if that has changed. The check is per artist, not per card, so sweeping across several records by one artist is still a single request.
  - Switching back to this tab (e.g. after following someone in Spotify) marks everything as stale and re-checks straight away for any card that's open.
  - A follow/unfollow you make here is trusted for 15 seconds rather than immediately re-asked, since Spotify can take a moment to reflect a change.
- **Fixed records that had no follow icon (e.g. one of several Elijah Fox albums).** I couldn't reproduce your exact records, so I worked from the likely causes: the icon needs the artist's Spotify id, which older records get from an album lookup, and an album Spotify has removed or re-issued under a new id returns nothing, leaving that record with no icon permanently. The lookup now falls back through three steps:
  1. **Another record by the same artist** already knows the id, so it's copied across with no request. This also handles a credit like "Elijah Fox, Someone Else" via the shelf's "Elijah Fox" record.
  2. The album lookup, as before.
  3. **Searching Spotify by artist name** — used only when exactly one artist has exactly that name. If two or more artists share the name the icon stays hidden, because following the wrong namesake would change your real account. An id found this way is held in memory only and never saved onto the record.
  - If none of these can identify the artist, the icon stays hidden and the browser console says why ("Follow icon: couldn't work out which Spotify artist …"), so if any record is still missing its icon, the console will name the record.
  - Verified (13 new checks, mocked Spotify): external change appears on return to the tab and after 15 seconds, no extra requests within the 15 seconds, an open card refreshing in place, sibling reuse including the "Elijah Fox, Someone Else" case, the unique-name search, the ambiguous-name refusal, and that search-derived ids aren't saved. The 22 checks from v105 still pass.
- Full regression suite re-run: all prior versions' tests (100+ checks), syntax checks, the mock-execution check, and an opacity-rule diff against v104 showing no change. `BACKUP_KEYS` unchanged.

## v105
- **New: follow / unfollow an artist from the hover card.** A small person silhouette sits to the right of the artist's name — outline when you don't follow them, filled (gold) when you do. Clicking it follows straight away; clicking it on someone you follow asks "Unfollow <artist> on Spotify?" first, with "No, keep" as the pre-focused default (same pattern as the other confirm popovers). If Spotify rejects the change the icon rolls back, so it never claims a state Spotify didn't accept.
  - **Nothing about follow state is saved or backed up.** It's looked up from Spotify each time a card opens and held in memory for that page load only, so it can't go stale in a backup. `BACKUP_KEYS` is unchanged. The one new stored value is which permissions your Spotify login was granted (`vinyl_shelf_spotify_scope`), which describes this browser's login rather than your collection, so it is also kept out of backups.
  - **One-time reconnect needed.** Following requires a new Spotify permission (`user-follow-modify`), and Spotify fixes permissions at login. Until you reconnect, clicking the icon shows "Following needs one extra Spotify permission — reconnect once to enable it" with a Reconnect button, and nothing is sent.
  - **Uses Spotify's current API.** Spotify's February 2026 change replaced the old follow calls with `/me/library` calls that take `spotify:artist:` addresses; v105 uses those, and falls back to the old `/me/following` calls if Spotify answers 404/405/410. Checked against Spotify's migration guide and reference pages.
  - Records now remember their artists' Spotify ids (and exact names, so "Tyler, The Creator" isn't split at the comma). Older records get these filled in automatically the first time their card opens, riding on the same album lookup that already fetches the tracklist — no extra request. The icon follows the first-credited artist when an album has several. The icon is hidden entirely when you're not logged in to Spotify.
  - Unfollowing changes your real Spotify account and takes effect for the New Releases feed the next time you hit Refresh there.
  - Verified end-to-end in a browser against mocked Spotify responses (22 checks): hidden when logged out, backfilling an old record, hollow→filled→confirm→hollow, "No" leaving the follow in place, playback not triggered by the click, card staying open, missing-permission prompt with no request sent, 403 rollback, legacy-endpoint fallback, and nothing follow-related persisted. **Not tested against live Spotify** — my sandbox can't reach it — so the first real follow is the real test.
- Full regression suite re-run: all prior versions' tests (v101–v104, 100+ checks), syntax checks, the mock-execution check, and an opacity-rule diff against v104 showing no change.

## v104
- **Crate-promote modal ("Add to collection") tweaked per feedback**: category pills now lay out in 3 columns instead of 4 (noticeably wider, so a longer name is much less likely to get cut off — verified directly via the grid's own computed column count); the album cover now sits at the top of the panel so it's clear at a glance which record you're about to add; and the subtitle was cut down from the full explanatory sentence to a plain "Pick at least one category."
- **Rename popover made narrower, with its input text centered** — width dropped from its old content-driven ~185px down to a fixed 120px (verified directly, including that "Cancel"/"Save" still fit without wrapping, and that a full 24-character tag name still displays sensibly in the now-narrower input).
- **New: a blue sheen on whichever record's spine is currently playing**, layered on top of the existing subtle breathing animation (which stays exactly as it was) rather than replacing it — per feedback that breathing alone was too subtle to spot at a glance. Same technique as the existing gold "freshly unwrapped" sheen on new records (a real child element doing a diagonal sweep, since the spine's own `::before`/`::after` are already used for the top-face and floor-reflection effects), just in blue and gated by the existing `now-playing-spine` class rather than its own per-record flag — "currently playing" is already tracked that way, and purely transient, so no new persisted state was needed. Verified directly: the sheen is visible the moment a record starts playing, fades back out the moment it stops, and a record that isn't playing never shows it.
- Full regression suite re-run before shipping: all of v101's 14 tests, v102's 16 viewport-safety tests + 2 track-count tests, v103's 23 crate/rename-sort tests + 19 rename/hover-stays-open tests, a syntax check on both script blocks, the mock-execution check, and an opacity-rule diff against v103 confirming exactly the two new rules the playing-sheen needed (`opacity: 0` default / `opacity: 1` active) were added and nothing else shifted — all clean. `BACKUP_KEYS` re-confirmed unchanged.

## v103
- **Selecting a star-rating tier in the filters now backs out of the Crate first, same as the reverse direction already worked.** v102 made choosing a star tier clear the Crate selection if it was active; this closes the matching gap — opening the Crate while a star tier was selected now clears the star-tier selection, instead of landing on a combination ("Crate" AND "2 stars") that can never show anything, since the Crate is specifically the *unrated* records. Verified directly: selecting 2-star, then clicking Crate, correctly clears the star filter and shows the unrated records, not an empty page.
- **Moving a record to the Crate from the main shelf now asks first** ("This will be moved to your Crate," Yes/No), the same pattern already used elsewhere for confirm-before-acting. Triggered by clearing a record's rating back to 0 stars — the rating stays untouched while the popover is open, "No" leaves it exactly as it was, and "Yes" applies the change and the record correctly drops out of whatever (non-Crate) view you were looking at. Verified all four states directly.
- **Rating a record out of the Crate now prompts for a category before it's allowed onto the main shelf, instead of moving it across instantly.** A new modal opens ("Add '<name>' to your collection"), listing every existing category as a pill plus a field to create a new one on the spot; "Add to collection" stays disabled until at least one category is picked, and the rating itself isn't applied until you confirm. Cancelling (via its own button, clicking the backdrop, or Escape) leaves the record at 0 stars in the Crate, untouched. This directly closes the gap asked for — nothing can land on the main shelf uncategorized by accident anymore.
  - Building this surfaced a genuine, previously-undiscovered bug in an *existing* pattern elsewhere in the app: the per-record tag panel's `<label><input type="checkbox">` pills rely on `preventDefault()` during `pointerdown` to suppress the browser's native label→checkbox click-forwarding — direct testing proved that forwarding isn't actually suppressed by that call at all, it still fires its own `click` a moment later and silently fights whatever the JS just set. It happened not to cause visible problems in the existing panel, but building a second copy of that same pattern for this modal reproduced it as a real, confirmed double-toggle (a checked pill snapping back to unchecked right after being clicked). Rather than carry the same latent issue into new code, this picker uses plain `<button>` pills instead — the same reliable, already-proven approach the filter-tag and star-filter buttons elsewhere in the app already use, with a single straightforward click listener and no native forwarding involved. Verified the fix directly: picking a category now sticks on the first click, every time.
- **Categories in the filter panel are now sorted by how many records carry them, most first** (Crate still always sits first, ahead of every real category, exactly as before). Verified against a 3/2/1-record split across three tags — order came back correctly as the 3-record tag, then the 2-record tag, then the 1-record tag. The per-record tag panel (the one you tag an individual album from) deliberately stays alphabetical — it's a different list with a different job, where you're hunting for a specific name rather than scanning by popularity.
- **New: right-click a category to rename it**, everywhere it's used — a small "Rename" menu appears at the cursor; clicking it opens a pre-filled text field (Enter or "Save" to confirm, Escape/"Cancel"/clicking outside to back out unchanged). A rename updates the tag on every record that carries it and in the master tag list in one step, and if you had that tag selected as a filter (or excluded) at the time, the rename carries your selection across with it rather than silently kicking you off the view. Renaming to "Crate" is refused (same reserved-name rule as creating any other new tag), as is renaming to a name that collides with a different existing tag — a pure case-only change (e.g. "rock" → "Rock") is allowed through, since that's not a real collision. The Crate pill itself has no rename option, since it isn't a real tag. Verified all of this directly: menu open/close, pre-fill, Enter and Save both submitting correctly, Escape/Cancel/click-outside all correctly discarding changes, the rename propagating to every record and the master list together, the active-filter-selection carry-through, and both refusal cases (Crate collision, existing-tag collision) leaving the tag list genuinely unchanged.
- **Hitting play from a record's hover card no longer closes it.** Clicking the cover (plays the album from the start) and pressing Enter on a focused record both used to close the card the moment playback started; now the card stays open for as long as you're still hovering it — exactly the same as everything else that happens on an open card (rating, tagging, picking a specific track). It still closes the normal way, the instant the mouse actually leaves. Clicking a specific track in the tracklist was already left open from an earlier version and is unaffected. Verified both the click-the-cover and Enter-key paths directly, plus that the existing mouseleave-driven close still works afterward.
- Full regression suite re-run before shipping: all of v101's 14 tests (stuck-dim fix, Crate visibility/combinations, fresh-sheen lifecycle, search-zone dimming), v102's 16 hover-card-safety/horizontal-overflow viewport checks and its 2 track-count checks, a syntax check on both script blocks, the mock-execution check, and an opacity-rule diff against v102 confirming nothing shifted (none of this version's changes touch opacity) — all clean. `BACKUP_KEYS` re-confirmed unchanged.

## v102
- **Rating a Crate record now moves it out the moment you click the star**, instead of waiting for some unrelated render to notice. It stays on the Crate view itself (rather than being kicked to "All records") — the record just correctly disappears, since it's no longer 0 stars. Only actually re-renders when the new rating genuinely takes the record out of whatever you're currently looking at (checked against the live filtered set after every rating click); rating an already-visible record in place (no crate/star-tier filter narrowing things) still just refreshes its star icons and leaves the open card alone exactly as before — confirmed both paths directly.
- **Selecting a star-rating tier in the filter panel now backs out of the Crate first**, if it was open. A star tier can only ever match a *rated* record and the Crate is by definition only unrated ones, so the two together used to just show an empty page with no explanation. Selecting a tier now drops the Crate from the selection (leaving any other real tag filter selected alongside it untouched — confirmed a Crate+"Rock" combo correctly keeps "Rock" and only sheds the Crate) and lands you on the normal view showing that tier, exactly like backing out of the Crate manually first would have.
- **Fixed the momentary yellow flash on a record's spine when clicking a star to rate it.** Root-caused rather than patched blind: clicking a star button natively focuses it, which lights up an existing `.record:focus-within` outline rule (brass/gold) on the spine — and the click handler immediately rebuilds that row's HTML afterward, destroying the just-focused button and dropping focus back to `<body>`, switching the outline off again just as fast. That focus-then-teardown round trip is what read as a "flash." Fixed at the source: star buttons no longer take focus on a pointer click at all (keyboard Tab-focus, the only real reason they need to be focusable, is untouched) — confirmed via a real pointer click that the spine's outline never appears in the first place now.
- Hover-card star icons sized up slightly (11px → 13px) per feedback — scoped to the hover card specifically, so the separate star-tier row in the filter panel (which draws from the same underlying icon markup) is unaffected, confirmed directly.
- **New Releases rows now show each release's track count** next to its date ("Aug 15, 2026 · 14 tracks"), so it's clear at a glance whether something's a single, an EP, or a full album without having to open it — same "N tracks"/"1 track" phrasing already used in search results. Verified against a single, a 5-track EP, and a 14-track album, including correct singular/plural wording.
- Full regression suite re-run before shipping: all of v101's own tests (stuck-dim fix, Crate visibility/combinations, fresh-sheen lifecycle, jump-to-crate-on-add), hover-card safety across 5 viewport sizes, horizontal-overflow check across 3 viewport sizes, a syntax check on both script blocks, the mock-execution check, and an opacity-rule diff against v101 confirming nothing shifted (none of this version's changes touch opacity).

## v101
- **Fixed a real bug: search/playback controls could get stuck permanently dimmed.** Hovering a record dims the search controls out of the way (via an `openCardCount` counter); the bug hit when the record you were hovering got *removed* while its card was open — `renderPageContent` fully rebuilds every `.record` element on any shelf change, destroying the hovered element without ever running the code that decrements the counter (that code only runs on a genuine `mouseleave` of a still-existing element). Root-caused rather than guessed at: reproduced the exact steps (hover a record → remove it via its own remove button → move the mouse away) and confirmed the counter was left stranded above zero forever. Fixed by resetting the counter and clearing the dimmed class directly inside `renderPageContent` whenever it rebuilds with something still counted as open. Verified with the exact original reproduction, plus a 5-viewport hover-sweep regression check (desktop through mobile) to confirm ordinary hovering still dims and releases correctly everywhere.
- **New: the Crate — a standing, always-present view of unrated (0-star) records**, distinct from a real tag:
  - A brand-new record always starts unrated and lands in the Crate; adding one now jumps straight to the Crate filter (replacing whatever filter was active before) so the record you just added is actually visible where it landed, instead of possibly vanishing into whatever view was showing. Verified end-to-end through the real search-and-add UI (not just the underlying function): starting on a "Rock" filter, adding a new album, and confirming the filter switched to exactly `["crate"]`, only the new record was visible, and the filter-toggle icon showed its active state.
  - Unrated records are invisible everywhere except the Crate view itself — not on "All records", not under any real tag filter — confirmed directly against a mixed shelf of rated and unrated records, including ones that also carry a real tag.
  - The Crate pill always appears first in the filter panel, styled with a dashed border and a small crate icon to mark it as conceptually different from a real tag pill — and, unlike a real tag, has no delete-✕ (you can't delete it). It reuses the exact same delegated click handling as real tags, so Cmd+click multi-select correctly OR's the Crate together with real tags (confirmed: Crate + "Rock" shows unrated records *and* Rock-tagged records, nothing else).
  - A real tag literally named "crate" can't be created — the tag-creation input silently ignores that name (case-insensitive) rather than creating a colliding pseudo-tag.
  - Ratings themselves already lived inside `vinyl_shelf_records`, which is backed up — so the Crate (being purely "0 stars" under the hood) needed no new backup key, and none was added. Per explicit instruction this session, the separate star-*filter-selection* backup gap identified earlier was deliberately left alone.
- **New: a gold "unwrapped" sheen on freshly-added records**, meant to feel like the moment you take a record out of its plastic wrap. A new record is flagged `isFresh: true` and shows an animated diagonal gold-white sweep across its spine; the very first time you hover it, the sheen fades out over 0.6s and is removed from the DOM entirely, with the cleared state persisted immediately so it doesn't reappear on reload. Verified the full lifecycle directly: sheen present in the DOM immediately after adding, `.fading` class applied the instant a first hover starts, the element actually removed from the DOM once the fade finishes, `isFresh` persisted as `false` afterward, the cleared state surviving a reload, and — separately — a record seeded as still-unhovered correctly still shows its sheen after a reload (persistence confirmed in both directions, not just the "cleared" one).
- Two temporal-dead-zone bugs caught and fixed before shipping: both `openCardCount` and the new `CRATE_KEY` constant ended up referenced by code that runs during the very first render (`renderPageContent` / `getVisibleShelf`), which happens before a `let`/`const` declared further down the script has actually executed — same class of bug documented earlier in this project's history for other variables. Both moved into the existing early-declarations block; confirmed fixed by loading the page fresh (would otherwise throw "Cannot access before initialization" on every load) and separately via a mock-execution harness that runs the full script outside a browser to catch exactly this class of error.
- Full regression suite re-run before shipping: hover-card safety across 5 viewport sizes (large desktop through mobile), horizontal-overflow check across 3 viewport sizes with a 30-record shelf, a JS syntax check on both script blocks, the mock-execution check, and an opacity-rule diff against v100 confirming exactly one new `opacity: 1` rule was added (the fresh-sheen's own) and nothing else shifted unexpectedly.

## v100
- **New: a 3-star rating system**, separate from tags — 0 stars ("haven't listened yet") up to 3 ("tried and tested over time"). Click a star on the hover card, between the year and track count, to set a record's rating; click the currently-set top star again to clear it back to unrated. Confirmed the card stays open through this (rating something isn't a "close the record" action, unlike playing it).
- **A separate star filter row**, to the right of the filter icon, visible only while the filter panel is open — each of the three buttons shows that many filled stars, purely to label which tier it represents.
  - **Selecting a tier shows an exact match only** — selecting "2 stars" shows only 2-star records, not 2-and-above or 2-and-below — confirmed directly against a shelf with records at every rating level.
  - **Cmd+click multi-selects tiers together** (e.g. 2-star and 3-star at once), mirroring the existing tag filter's own interaction pattern exactly — same plain-click-exclusive, Cmd-click-additive convention, confirmed working in both directions (adding a tier, then removing one from an active selection).
  - **Combines with an active tag filter as AND, not replacing it** — selecting a tag and a star tier together shows only records matching both, confirmed against a mixed shelf.
  - The selection persists across reloads, the same as tag filters already did.
- **Found and fixed a real bug during testing**: the first version of the star filter's click handler rebuilt its buttons' HTML on every click, which detached the just-clicked button from the page before the click had finished bubbling up to the "click outside closes the panel" listener — making every single star-filter click immediately close the panel that click had just opened. This is the exact same trap the tag filter list hit and was fixed for earlier in this project; fixed the same way here too, by toggling a class in place instead of rebuilding — confirmed the panel now correctly stays open through a star-filter click.

## v99
- Export filenames now include time of day, not just the date (`vinyl-shelf-backup-2026-09-15-1432.json`) — multiple same-day backups are distinguishable now.
- Clicking a specific track in the tracklist to play it now leaves the hover card open, rather than closing it — clicking the album cover still plays from the start and closes the card as before, since that felt like a different, more deliberate action.
- Day/night lamp icon moved 6px lower again, and the moon redrawn as a genuinely slimmer crescent (rebuilt with a cleaner mask-based technique rather than tweaking the old arc-path numbers blindly) — confirmed both visually.
- **Investigated the reported page-turn animation issue thoroughly and could not reproduce it.** Sampled the actual transform/opacity values throughout a real page turn (both day and night mode) and captured visual frames mid-transition — everything interpolated smoothly in every test constructed. Rather than guess at a fix for something not actually reproducible, this needs more detail before touching anything (see reply).

## v98 — critical hotfix
- **Fixed a severe regression from v97: night mode showed no buttons and almost no records.** Root cause, found by direct diagnosis rather than guessing: the night-mode background image layer I added in v97 (`.scene::after`) had no explicit stacking order, and since it's a pseudo-element (always last in DOM order), it stacked visually *on top of* every other element in the scene — the corner icon buttons, the records, all of it — once its opacity reached 1 in night mode. In day mode this was invisible (opacity 0, so it didn't matter that it was covering everything); switching to night mode made an already-existing stacking bug visible for the first time.
- The first attempted fix (`z-index: -1` on the layer alone) was **also wrong**, and I want to be upfront about that rather than skip past it — it made the night image disappear completely instead, because `.scene` doesn't form its own stacking context on its own (`position: relative` alone doesn't, without an explicit z-index), so the negative z-index escaped all the way up to the page's root context instead of staying local to `.scene`, sending the night layer behind literally everything including `.scene`'s own day background. Confirmed this second bug directly by screenshot before shipping anything.
- The real fix needed both pieces together: `isolation: isolate` on `.scene` itself (forcing it to form its own local stacking context, the standard way to do this without faking a z-index value) *and* `z-index: -1` on `.scene::after` (keeping the night layer below `.scene`'s other children but above `.scene`'s own background, now correctly scoped locally). Verified this specific combination directly — night mode now shows the dark background, all button icons, and all record spines correctly, confirmed via screenshot, not just computed-style inspection.
- Re-ran the entire test suite built across every previous version — all 19 tests covering search, duplicate detection, the releases feed, duration, load-more, direct-link search, the fade transition, and every auto-mode scenario from v97 (day/night detection, manual override, migration, no-replay-on-load, denied geolocation, transition scheduling) — plus the full regression suite, to make sure this fix didn't disturb anything else.

## v97
- **New: automatic day/night switching based on real sunrise and sunset times at your location** (Night Shift-style), while the lamp click still works exactly as before as a manual override.
  - The sunrise/sunset calculation itself was verified against a real authoritative source before being trusted — computed London's sunrise and sunset for a specific date, checked the result against an independent reference, and got an exact match to the minute (06:36 am / 07:18 pm) before this went anywhere near the app.
  - Auto mode is the default for anyone who hasn't explicitly chosen a mode; clicking the lamp at any point sets an explicit preference from then on, the same as it always has, rather than fighting with auto mode about which one's in charge.
  - If geolocation is granted, the app computes today's sunrise/sunset for your actual location, sets the correct mode immediately, and schedules a timer for whichever transition is next — verified this scheduling logic picks the right target (today's sunrise, today's sunset, or tomorrow's sunrise) correctly across three different times of day.
  - If geolocation is denied, unavailable, or never granted, the app simply stays on its current mode rather than erroring or nagging — confirmed no errors are thrown and the manual lamp toggle still works normally in that case.
  - A returning visitor's last known location is cached, so on reload the correct mode can be applied immediately (verified via direct pixel-opacity check — already at full opacity within 50ms, not fading in) without waiting on a fresh geolocation round-trip; a background refresh still corrects it shortly after if needed.
  - The 1-second fade only plays for a transition you actually watch happen (a manual click, or a real automatic switch while the page is open) — restoring a saved or auto-computed mode on page load applies instantly, with the transition itself suppressed for one frame, confirmed both behaviors independently.
  - Existing saved preferences from the previous simple on/off toggle carry over automatically as an explicit choice rather than silently resetting anyone to auto mode — verified this migration path directly.

## v96
- Lamp icon moved 8px lower and made fainter (0.22 → 0.15 opacity) per feedback — confirmed visually.
- **Added the 1-second fade transition for day/night mode** — verified as genuine smooth animation, not an instant snap, by sampling the actual computed background-opacity and text-color values at multiple points during the transition and confirming they move through real intermediate states.
- **Save-status and owned-badge circles switched from a dark brown fill to the same gold (`--brass`) used elsewhere** (e.g. the Add button), addressing feedback that they read as too dark. Also caught and fixed two adjacent issues while in there: the "unsaved" indicator icon had the same hardcoded-color problem and would have been nearly invisible in night mode, and the zoom slider's track color was hardcoded too and wouldn't have adapted to night mode at all.

## v95
- **New: Night mode.** Click the right-hand lamp to toggle between the current look and a new dark, gold-toned aesthetic — same layout, fonts, and structure throughout, only the coloring changes. Preference persists across reloads with no flash of the wrong mode (a tiny inline script in `<head>` applies it before anything else renders).
  - A very faint moon icon appears on the lamp shade in day mode (click for night), and a faint sun icon in night mode (click for day) — confirmed both render correctly and legibly against the shade.
  - New night background image confirmed pixel-perfect to the day one (identical furniture/lamp positions) via direct visual comparison, so all existing positioning needed zero adjustment.
  - Colors are handled by two shared variables already used consistently for everything floating directly on the scene (icons, search input, playback text, results) — traced every one of their ~28 uses through the whole stylesheet first and confirmed none of the genuinely opaque cards (hover card, tracklist, tag panel, backup panel, popovers) touch them, so those stay exactly as they've always looked in both modes.
  - Found and fixed a real contrast bug while checking this: the search preview card's artist name was nearly unreadable in night mode, a white-tinted wash meant for the light day background was turning to a washed-out grey against the dark one. Same fix applied to two other spots using the identical pattern.
  - Verified against every part of the app touched by this: search results, the album preview, the filter panel and tag pills, the hover card (confirmed correctly *unchanged*, reading like a lit page against the dark room), and the full New Releases feed including its loaded state. Also re-ran the full existing test suite (search, duplicate detection, releases feed states, direct-link search, load-more) to confirm none of it regressed.

## v94
- **New: paste a Spotify album link (or URI) straight into search to bypass ranking entirely.** Directly addresses a real gap — some albums (self-titled records competing with an artist's other work, older/less-popular releases) can rank outside the top 10 search results, which is the most Spotify's API allows as of a recent change. Pasting a link Spotify itself gives you (via "Copy link" or "Copy Spotify URI") goes straight to that exact album by ID instead of searching for it, so ranking never comes into play.
  - Recognizes both formats Spotify's own share menu produces: a full `open.spotify.com/album/...` link (including the `?si=...` tracking parameter "Copy link" adds, and the `intl-xx/` locale prefix some regions get) and the shorter `spotify:album:...` URI form.
  - Verified the detection itself against six cases — three real link variations, the URI form, a plain text search query, and a *track* link (which should correctly fall through to normal search, not be mistaken for an album) — all six behaved correctly.
  - Verified the full flow end-to-end with a mocked real album response: pasting a link with a live tracking parameter attached resolves straight to the correct preview, and Adding from there works exactly like a normal search result. Also verified the failure path (an invalid or nonexistent ID) shows a clear message rather than a silent or confusing failure, and confirmed ordinary text search is completely unaffected by any of this.

## v93
- **Fixed the rolloff order — the fainter shadow pixel wasn't actually rendering above the darker one.** The v92 inset shadow used a negative Y-offset (`-1px`), which for an inset shadow positions it near the *top* inner edge, not the bottom — so the intended two-step gradient wasn't really happening; pixel-sampling the actual render confirmed only one dark spike existed, not two distinct steps. Fixed by flipping the offset to positive (`1px`), which correctly pulls it to the bottom inner edge, just above the darker external line. Verified this time with actual pixel sampling rather than trusting the CSS reasoning alone — temporarily exaggerated both shadow layers to unambiguous, high-contrast values, confirmed a genuine gradual darkening (fainter → darker) across the boundary, then restored the intended subtle values.

## v92
- **Spine base shadow made much darker** (0.75 → 0.97 opacity on the crisp external line) **with a rolloff effect added**: a new inset shadow, one pixel inside the spine's own bottom edge, carries the darkness the external line used to have — so there's now a two-step gradient into the base (spine color → 0.75-dark pixel → 0.97-dark line → wood) rather than one flat line.
- Album duration text made slightly smaller (0.72rem → 0.65rem).

## v91
- Page arrows moved 20px closer together again (net +20px wider than v89, not +40px).
- **Duration moved off the cluttered meta row entirely, down to the bottom of the tracklist panel, centered** — so scrolling to the end of a longer tracklist reveals the total duration right there, rather than it competing for space next to the track count up top. Meta row is back to a clean "year · tracks" with nothing else. Verified the new placement directly (screenshot-checked) and re-confirmed the backfill logic from the last version still correctly fills it in at the new location, including for a record with a stale pre-existing cache.
- **Reinterpreted the spine shadow entirely — not a blurred drop shadow, but a crisp 1px line of darkness sitting between the spine and its own reflection.** Replaced the soft, blurred shadow from last time with a hard-edged, zero-blur 1px line, and eased the bottom-corner curve back slightly (2px → 1.5px).

## v90
- **"Load 2 more months" now lands you at the newly-revealed content instead of resetting to the top of the list**, with the new rows fading in rather than the whole list re-appearing abruptly. Only the genuinely new rows animate — the ones already visible aren't re-triggered. Verified directly: 6 rows visible, scrolled to top deliberately, clicked Load More, confirmed 9 rows now present, the list correctly scrolled to its bottom, and exactly the 3 new rows carry the fade-in class.
- **Found and fixed the real reason album duration wasn't showing.** Any record whose tracklist was already cached from before the duration feature existed (or from any earlier partial-cache state) had its duration permanently stuck missing — both `ensureTrackList` and `fetchTrackListIfNeeded` were checking only whether the tracklist existed, not whether the duration had ever actually been computed, so a cached-but-incomplete record would short-circuit forever and never trigger the fetch needed to backfill it. Fixed both checks to require duration too, careful not to disrupt an already-correctly-rendered tracklist while quietly fetching in the background. Verified with a record deliberately seeded to look exactly like this case — duration now correctly backfills, and the existing tracklist isn't disrupted while it happens.
- Page arrows moved 40px further apart.
- **Spine drop shadow strengthened** (was a barely-visible 1px line, now has real blur and a touch more darkness — reads as the record actually resting on the shelf rather than just touching it), **and the bottom corners now carry a slight curve** matching the existing subtle top-corner radius, rather than being sharp and square.

## v89
- **The page cap is no longer tuned as a coverage limit — raised from 4 to 20, reframed as what it should have been from the start: a defensive backstop, not a ceiling on how much of an artist's recent output actually gets checked.** A small artist still naturally stops after 1 page; a prolific one now genuinely keeps going, page after page, until it actually reaches material older than the lookback window — however many pages that takes — rather than being cut off at an arbitrary number regardless of whether it had finished. The v88 "possibly incomplete" notice still exists as the real safety net for the (now far rarer) case of a catalog so deep even 20 pages doesn't confirm completeness.
- Re-verified the important distinction directly: an ordinary, smaller artist still resolves in exactly 2 requests (unaffected by the higher ceiling), while the deliberately-never-ending test artist from v88 still correctly gets flagged as possibly incomplete once it genuinely exhausts the new, much higher cap. Every other feed state re-confirmed unaffected.

## v88
- **Closed the one remaining silent gap in coverage confidence.** The per-artist page cap (4 pages per type) exists as a safety net against runaway requests — necessary, but it meant an extremely prolific artist could theoretically hit that cap *before* we'd confirmed we'd reached old-enough material, and there was no way to tell that had happened versus genuinely having checked everything relevant.
- Now tracked and surfaced directly: if any followed artist's catalog runs deep enough that the page cap is reached without confirming completeness, the feed shows an honest note ("N artist(s) have a catalog deep enough that we stopped checking before confirming we'd reached older material") rather than staying silent about it. Verified with a test built specifically for this — an artist whose catalog never "runs out" within the page cap — confirming the counter increments correctly and the note renders.
- Re-verified all seven of the feed's distinct states (clean success, zero followed artists, cooldown expiry, the type-split fix finding a hidden single, the early-stop optimization, confirmed quota exhaustion stopping immediately, and an ordinary ambiguous 429 still taking the more cautious path) all still behave correctly after this change.
- Worth being clear about what this does and doesn't close: it makes a known, narrow edge case *visible* rather than fixing it outright — closing it completely would mean either an unbounded page cap (which reintroduces the exact request-volume risk that caused a full day-long block earlier) or Spotify formally documenting the sort behavior this all leans on, which is out of anyone's control here.

## v87
- **The app can now tell you definitively whether a 429 is the short rolling rate limit or the separate Development Mode daily quota, instead of both looking identical.** As of a July 2026 Spotify change, a 429 response body includes a `"reason": "QUOTA_EXCEEDED"` field specifically for this. The app now reads it:
  - **Confirmed quota exhaustion** stops immediately on the very first request — no point spending several more minutes "confirming" what Spotify already said outright — and shows an honest, specific message ("Spotify said outright that today's quota is used up... not a guess this time") with a 24-hour cooldown, matching direct, repeated experience of how long this specific kind of block actually takes to clear.
  - An **ordinary, ambiguous 429** (no quota reason given) still goes through the original, more cautious path — 7 consecutive failures before giving up, 6-hour cooldown — since that one genuinely might just be a short-lived burst.
  - Verified both paths directly and separately: a simulated `QUOTA_EXCEEDED` response stops in under a second (was ~48s) and shows a 24-hour countdown; a simulated ordinary 429 still takes the full 7-failure/48-second path exactly as before, confirming the new logic doesn't change behavior when Spotify's response is genuinely ambiguous.

## v86
- **Found the actual root cause of missing releases, not just a deeper workaround.** Confirmed on Spotify's own developer community: requesting `include_groups=album,single` together (what this always sent) sorts results *by type first, then date* — every album newest-to-oldest, then every single newest-to-oldest — not one true chronological stream. A recent single could sit behind an artist's entire album catalog, since it was never actually competing with those albums on date at all. That explains the "random, not artist- or type-specific" pattern exactly.
- **Fixed by requesting each type separately** (`include_groups=album` and `include_groups=single` as two distinct requests) instead of combined — the same community source confirms a single-group request comes back genuinely sorted by date. This also makes the "stop paging once old enough" optimization legitimately trustworthy for the first time — earlier attempts at that same idea were correctly abandoned because it wasn't safe against the combined, scrambled order; it's safe now that each type's own list really is sorted.
- Verified directly: a test recreating the exact bug (an artist with several old albums and one very recent single) now finds the single correctly, confirmed via the two separate outgoing requests. Also verified the early-stop genuinely works — a page of clearly old items with more pages available is correctly left unfollowed, rather than blindly fetching up to the cap every time. Re-confirmed the rate-limit circuit breaker, cooldown, zero-followed-artists state, and a full successful run all still behave correctly with this restructuring.
- The one caveat worth carrying forward: the community report warning that this sort behavior "can change at any time" is the community's own words, not Spotify's documented guarantee — the page cap and de-duplication are still in place as a backstop in case it does.

## v85
- **Fixed releases still going missing within a single artist's own catalog** (both albums and singles affected, so not a groups-filtering issue) — the same non-chronological-ordering problem pagination was built to fix, just deeper than 2 pages could reach for sufficiently prolific artists. Raised the per-artist page cap from 2 back up to 5. This was kept low specifically to avoid tripping the rate limit, but that was always about request *rate*, not total request count — now that every request is spaced 4 seconds apart regardless of how many get sent, more pages mainly costs time for the handful of artists who actually have that much depth, not a faster burst against Spotify. Artists with only a page or two of real content still stop early, so this doesn't uniformly slow every artist down.
- Verified with a deliberately deep test: a release planted specifically on page 5, behind four pages of older material, is now correctly found (confirmed missing at the old 2-page cap, confirmed found at 5), and the page cap itself still holds at exactly 5 rather than paging indefinitely. Re-confirmed the rate-limit circuit breaker and cooldown from the last two versions are both unaffected by this change.

## v84
- **Requests spaced much further apart, explicitly trading speed for a better shot at not tripping the limit at all** — per feedback that 5–10 minutes for a refresh is genuinely fine. Spacing between requests widened from 300ms to 4 seconds (a full refresh across ~43 artists now takes several minutes by design). The capped wait after a 429 was also relaxed, from 5s up to 20s, so a real `Retry-After` value gets properly respected now that there's time budget for it. The circuit breaker's threshold was raised too (4 consecutive rate-limited artists → 7) — a handful of 429s is less conclusive evidence of a truly sustained block when each one is already minutes into a much slower refresh.
- Verified the new pacing directly rather than assuming: a full successful run, the pagination fix, and the circuit-breaker path (now correctly requiring 7 consecutive failures, taking about 48 seconds in a worst-case simulation, still well inside the "up to 10 minutes is fine" range) were all re-confirmed against the new timings.
- Worth being honest about what this does and doesn't promise: this addresses request *rate* (how fast we send requests), which several data points suggest genuinely may have been the direct cause. If the underlying limit turns out to be closer to a longer-duration quota (a fixed number of requests per day, as the one full-day clear-up earlier suggested) rather than a short-term burst rate, slower pacing within a single refresh won't help that on its own — but between this and the cooldown from the last update, there's now very little left to reasonably try adjusting further on the code side.

## v83
- **Stopped trying to out-guess the rate limit with more code tweaks — it failed the same way ("checked 4 of 43") even after v82's gentler settings, which points at the quota itself needing time to reset rather than anything left to optimize in the request pattern.** Instead of another speculative pacing change, added a genuine cooldown: after Refresh gets rate-limited, the button is disabled for 6 hours with a visible countdown ("Refresh (6 hr 0 min)") and an honest explanation, rather than quietly inviting another click that would likely fail the same way and spend more of whatever quota is left. Verified directly: a failed refresh disables the button and blocks a follow-up attempt from sending any further requests at all; simulating the cooldown having genuinely elapsed correctly re-enables it.
- Worth being honest about the 6-hour number: it isn't a confirmed fact about Spotify's own reset timing (the one real data point took closer to a full day) — it's a conservative floor below which retrying is clearly pointless, not a promise that it'll definitely work right after.

## v82
- **My own fault, and fixed: the v81 pagination fix (up to 3 pages per artist instead of 1) roughly tripled request volume against the exact endpoint that had just spent over a day rate-limited, and tripped the limit again almost immediately.** Backed off meaningfully rather than just a little:
  - Pages per artist down from 3 to 2 — still catches the ordering problem the pagination fix was built for, at much less cost.
  - Concurrency down from 2 to fully sequential (1 at a time), with the pause between requests increased (120ms → 300ms).
  - Re-verified all of it together: pagination still correctly catches a recent release "hiding" on page 2, the page cap still holds (now stopping at exactly 2 requests instead of 3), and the rate-limit circuit breaker still recovers quickly under a worst-case simulation rather than hanging.
- Caught a real bug of my own before it shipped this time, too: my first pass at these edits left the *old* concurrency/spacing constants declared right alongside the new ones — a duplicate `const` in the same scope, which would have been an immediate syntax error. The syntax check that runs before every release caught it before it went out.
- This is slower than v81 by design. Given how much this one endpoint has already been rate-limited, trading a bit more time for a much lower chance of tripping it again felt like the right call.

## v81
- **Releases list capped at 3 rows deep before scrolling** (was sized for more, ~16.5rem → 11.5rem, measured against the actual rendered row height so it's exactly 3, not an approximation).
- **Found and fixed the real cause of missing releases.** Spotify doesn't document this endpoint as returning items in any consistent order, and the report matched that exactly: some artists' genuinely recent releases just weren't in the results, while others were fine. A single page was never guaranteed to include everything current, regardless of page size. Now pages through (via Spotify's own pagination link) up to 3 pages per artist, capped so an extremely prolific artist can't balloon the request count.
  - Worth calling out: my first attempt at this fix still had a bug — it tried to stop paging early once a page's oldest item looked "old enough," which quietly reintroduced the same ordering assumption it was meant to remove. Caught this with a test built around the exact failure mode (a page of all-old items sitting before a page with a genuinely recent one) — the first version failed that test, confirming the flaw before it shipped; the fixed version, which pages through unconditionally rather than trying to guess when to stop, passes it.
  - Also verified the page cap itself holds under a worst case — an endpoint that claims to have more pages forever — confirming it stops at exactly 3 requests rather than looping.

## v80
- **Real progress: the rate-limit issue is gone** (it correctly worked through all 43 followed artists this time, confirming that really was a temporary quota that needed time to reset) **— and a new, different bug took its place: `400: Invalid limit`, uniform across every artist.** `limit=20` is a completely ordinary value for this endpoint, and it's unclear why it was rejected — rather than guess at a specific replacement number, removed the parameter entirely and let Spotify apply its own default page size, which sidesteps the question altogether. Verified the actual outgoing request no longer includes a `limit` parameter at all, and re-ran the full set of feed states (clean success, zero followed artists, a genuine sustained rate-limit simulation, a single transient 429 that recovers on retry) to confirm nothing else regressed.

## v79
- **A 429 persisting for over half a day ruled out ordinary rate limiting entirely — that clears in seconds to minutes, never that long.** The useful diagnostic was that regular search kept working fine throughout, and so did the followed-artists lookup inside this same feature (that's the only reason we know there are 43 artists to check at all) — both of those succeed. Only the per-artist albums lookup failed, consistently. Since search and the follows lookup succeed but this doesn't, the difference had to be specific to that one request, not an account- or app-wide block.
- The one real difference: the albums lookup was using your personal user-login token, the same one behind the follows list. But that endpoint is public catalog data — it was never personal, and never actually needed your login at all, only the *follows list* did. **Switched it to use the same app-only token search already relies on successfully**, leaving the user token for just the one call that genuinely needs it (the follows lookup itself). Re-verified all the key states — a clean successful run, zero followed artists, and the worst-case rate-limit simulation — all still behave correctly with this change.
- If the true cause turns out to be something at the Spotify app-configuration level rather than in this code, this change sidesteps it either way, since the failing calls no longer go through that path at all.

## v78
- **Fixed the multi-minute silent hang — this was the v77 retry logic compounding badly against a sustained rate limit, plus a genuine UX gap (no progress shown at all, so there was no way to tell "still working" from "stuck").** Three changes:
  - **A circuit breaker.** If 4 different artists in a row come back rate-limited even after retrying, the whole refresh stops immediately with a clear message, instead of continuing to retry every remaining artist against a limit that isn't going to clear mid-refresh. Tested against a worst-case simulation — all 43 artists permanently rate-limited — and confirmed it now stops in about 5 seconds having checked just 4, rather than working through all 43 with up to 5 retries each (which, worked out against a real multi-second `Retry-After`, is exactly the kind of multi-minute hang that happened).
  - **A hard cap on retry wait**, and down to one retry instead of five — still respects Spotify's own `Retry-After` when it's short, but never lets a single retry block for longer than 5 seconds regardless of what's requested.
  - **Live progress** ("Checked 12 of 43 followed artists…") shown throughout, not just a static "this can take a while" — confirmed this updates mid-refresh, so a genuinely long check (if you have many artists and no rate-limit issues) no longer looks identical to a stall.
- Re-verified every other feed state (clean success, zero followed artists, a single transient 429 that succeeds on retry) still behaves correctly with all of this in place.

## v77
- **Real cause confirmed: 429, Too Many Requests — genuine rate limiting, not an auth or request problem.** The fix is in two parts:
  - **Retry with backoff.** A 429 now waits and retries (respecting Spotify's own `Retry-After` header when present, defaulting to 3 seconds when it isn't) instead of giving up immediately, up to 5 attempts per artist. Verified end-to-end with a mock that fails the first request and succeeds the second — confirmed the retry actually fires, waits, and the release that failed on attempt one shows up correctly once attempt two succeeds.
  - **Back off proactively, not just reactively.** Concurrency dropped from 6 in flight to 2, with a small pause between each request a worker sends. Since a manual refresh was already the whole point of this feature (you said you don't mind it taking a while), there's no reason to push Spotify's limit in the first place — spreading 43 requests out costs nothing here.
- Re-verified the other feed states (success, zero followed artists, a genuinely non-retryable error like a real 403) all still behave correctly with this change.

## v76
- **The v75 fix didn't resolve it — same 43-of-43 message, meaning my hypothesis was wrong.** Rather than guess a third time, this version makes the actual failure impossible to miss: the per-artist fetch now captures Spotify's own error message from the response body (not just the numeric status) and shows it directly in the feed's own failure notice — no console-digging required. Verified with a realistic mock of what Spotify actually returns on an error (a 403 with `{"error": {"message": "..."}}`) and confirmed that exact message now surfaces word-for-word in the UI.
- Whatever the real cause turns out to be, this is the version that will actually reveal it on the next refresh — the notice will read "Spotify said: ..." followed by their own explanation, which is the detail needed to fix this properly instead of guessing again.

## v75
- **Fixed the 43-of-43 failure the new error visibility from v74 revealed — my own fault, introduced in that same version.** The `market=from_token` parameter I added to the per-artist albums request isn't actually a valid value for this catalog endpoint (it's meant for a few personalized endpoints, not this one) — almost certainly a 400 on every single request. The tell was the followed-artists call itself succeeding fine with the same token: if the token or scope were the problem, that call would have failed too, so the issue had to be specific to the one request that had just changed. Removed the parameter entirely — verified the actual outgoing request no longer includes it, and re-ran all three feed states (success, partial failure, zero followed artists) to confirm nothing else regressed.
- If this was in fact the cause, it should work cleanly now. If a refresh still reports failures, the console will show the real status code this time (400 was the previous default; a different one now would point somewhere else entirely).

## v74
- **Fixed the real bug behind "found nothing as far back as 12 months."** The per-artist album fetch was silently swallowing every failure into an empty result — a real problem (bad token, wrong scope, rate limit, anything) looked *identical* to "this artist genuinely released nothing," so a systematic failure across every followed artist just quietly produced an empty feed with no indication anything had gone wrong. Fixed in three parts:
  - Failures are now logged to the console with the actual HTTP status, and the feed shows a visible notice ("Couldn't check N of M followed artists...") instead of a silent, misleading "nothing found."
  - Added `market=from_token` to the per-artist albums request — omitting it can thin out or empty results for some accounts, and it's a safe, standard addition either way.
  - Distinguished "checked everyone, nothing recent" from "found zero followed artists to check" — previously both looked the same.
  - Verified all three states directly: the normal success path still works exactly as before, a simulated 403 on every artist now surfaces the new failure notice (confirmed via captured console output too), and a simulated empty follows list shows its own distinct message.
- If you hit this again after updating, the browser console will now show exactly which artist lookups failed and why (401 = expired/bad token, 403 = scope or access issue, 429 = rate limited, etc.) — that detail would help pin down anything still going on.

## v73
- **New: a New Releases feed** — a manually-refreshed, chronological list of what your followed artists have put out recently, opened via a new envelope icon in the bottom-left corner (mirroring the backup icon's position exactly, completing a four-corner icon layout).
  - **Auth**: reuses your existing playback login rather than adding a second one — just widened its scope to include `user-follow-read`. Anyone already logged in before this update will need to log in again once, since Spotify fixes scope at authorization time.
  - **Fetching**: two-step, since Spotify has no "new releases from people I follow" endpoint — paginate through your followed artists, then pull each one's recent albums/singles (6 artists at a time in flight, so it doesn't hammer the API). Fully manual: nothing runs until you click Refresh, and results are cached in `localStorage` until you ask again.
  - **The 2-month window and "Load 2 more months"** are pure client-side re-slicing of the same cached fetch — each artist's fetch already pulls their last ~20 releases, comfortably covering several months for all but the most prolific artists, so paging the window back doesn't need another round of network calls.
  - **Owned detection** reuses the same tick and `isOnShelf` check built for search, and Add reuses the same underlying add-to-shelf logic (refactored out into a shared `buildAndAddRecord` so both places call one thing).
  - Verified end-to-end against **mocked real Spotify API responses** (not just pre-seeded data) for every piece: date-window filtering, chronological sort, the owned tick landing on the right item, clicking Add actually adding a record and flipping to the tick afterward, and "load more" correctly revealing an older release that was hidden a moment before.
  - Found and fixed a real redundancy along the way: the existing "connect spotify for in-page playback" prompt was showing at the same time as the feed's own inline connect message when logged out. Now suppressed while the releases view is open.

## v72
- **Hover card reverted to the previous version's size** (209px → 190px desktop, 170px → 155px mobile).
- **Found and fixed the real reason album duration wasn't showing.** There were two separate places that trigger the track/duration fetch when a card opens — one for mouse hover, one for keyboard focus — and only the hover path had been updated to pass through the element duration gets written into; the focus path was silently missing it. Whichever path actually fired in practice, if it wasn't the hover one, duration would never appear. Fixed both call sites, then verified with a proper end-to-end test this time — mocking the real Spotify API responses (not just pre-seeding the result) and confirming duration goes from blank to "· 11 min" purely from a hover event, the same way a real user would trigger it.
- Owned-album tick on search results made fainter (opacity 0.55) and moved further from the text (margin 0.4em → 0.75em).
- **Duplicate handling changed from a popup warning to a disabled "Added" button state**, decided at preview-render time rather than reactively on click — no popup needed, since the button already shows the album is owned before you'd try. The disabled style now uses an actual grey background rather than just dimming the brass color, so it reads as "done/inactive" rather than "brass, but sad." The old warning tooltip and its CSS were removed entirely rather than left dormant.
- Reflection made less faint (opacity 0.48 → 0.62).
- Page arrows moved 5px higher and ~150px further apart — confirmed visually against the actual cabinet doors, and they now land right at the doors rather than short of them.

## v71
- **Export/import + save status now level with the magnification slider** (7.8% bottom inset, matching it vertically), while keeping the same right-inset as the search/playback icon above it, so the horizontal alignment is preserved.
- Reflection shortened 1px on its bottom end (6px → 5px).
- Hover card made 10% bigger (190px → 209px desktop, 155px → 170px mobile).
- Track and tag panels now the same width (both 210px, was 210px/190px).
- Search loading vinyl icon scaled to 80% — outer disc, center label, and groove-stripe density all scaled together for a clean proportional shrink rather than just a smaller circle with the same stripe pattern.
- **New: album duration on the hover card**, next to the track count ("8 tracks · 42 min"). Piggybacks on the existing lazy track fetch (which already runs when a card opens) rather than adding a new network call — sums the real per-track durations from that same response and updates the meta row once it resolves.
- **New: duplicate-album prevention.** Trying to add an album already on the shelf shows a small tooltip warning ("You've already got that") instead of adding a second copy — verified directly: shelf count stays unchanged and the warning becomes visible. Search results also get a small filled-checkmark tick next to any album already owned, using the same icon as the save-status indicator so it reads as the same kind of confirmation everywhere it appears.
- Page arrows moved 2px higher and ~25px further apart.
- Along the way, fixed a real layout bug the duration feature introduced: the meta row's flex layout was built for exactly two items (year, track count), and inserting a third for duration broke the spacing — fixed by folding duration into the same span as the track count instead of adding a sibling.

## v70
- **Hover card corrected — smaller than v68 now, not bigger.** The v69 bump to 245px was a misread of "still a little smaller" as "still too small" rather than "make it smaller still"; now 190px on desktop (172px on mobile), genuinely smaller than v68's 210px.
- Zoom/magnification slider moved down 2px (7.8% inset, was 8%).
- **Top-face perspective effect reverted to the earlier, more subtle geometry** (v69's taller/shallower version didn't land) — **and darkened**: brightness lift reduced (1.45 → 1.2), and the fade toward the back now reaches near-darkness by 55% up the strip instead of gradually across the whole thing, so the "depth" part reads darker and fades sooner, as asked.
- **Top corner icons (search/playback toggle, filter) brought in further** (6% → 9% inset), filter panel's anchor updated to match. **The import/export button and its save-state indicator now match the same inset** (4% → 9%), so all four corner-area controls sit at a consistent distance from the edge.

## v69
- **Hover card nudged up again** (210px → 245px cover width on desktop, 172px → 200px on mobile) — still too small at 210px. Re-confirmed the dynamic sizing logic at the new natural size (359.5px): full size wherever there's room, only shrinking on genuinely tight windows, never off-screen.
- **Track and tag panels widened** (190px → 210px, 170px → 190px) **with a softer shadow** where the main card overlaps them (inset shadow alpha 0.5 → 0.3).
- **Top-face perspective effect made significantly more pronounced** — taller (15px → 22px), a shallower tilt (rotateX 56° → 48°), and a longer local perspective distance (22px → 30px), together reading as a noticeably higher camera angle looking down at each spine's top edge.
- **Zoom/magnification slider moved up**, closer to the cabinet (bottom inset 3% → 8%).
- **Search/playback toggle and filter icon brought in from the corners** (4% inset → 6%) — the filter panel's own anchor position updated to match, so it still opens from directly under its icon.

## v68
- **Hover card resized to split the difference** (210px cover width on desktop, 172px on mobile) — v67's doubling turned out to be too big; this sits between that and the original size. Re-confirmed the dynamic sizing logic at the new natural size (321.7px): full size wherever there's room, gracefully shrinking only on genuinely short windows, never off-screen.
- **The wide contact-shadow behind each record now only appears while it's lifted (hovered/open)**, not while it's just sitting in the shelf — matches the same `.open`/`:focus-within` state that drives the lift itself, with a 0.28s fade so it eases in and out rather than snapping.
- **Reflection made less faint** (opacity 0.32 → 0.48) **and now fades out while the record is lifted**, fading back in when it drops back down. It's a child of the spine, so without this it would otherwise rise right off the floor along with the record on hover — not how a real reflection behaves, since a reflection stays on the surface rather than following the object up. Confirmed both states directly: shadow 0/reflection 0.48 at rest, shadow 1/reflection 0 while lifted.

## v67
- **Hover card doubled in size** (140px → 280px cover width on desktop, 115px → 230px on mobile) — genuinely much more readable now. Re-verified the dynamic sizing logic still holds up against a card this much bigger: full natural size (397px) wherever there's room, and only shrinks — never overlapping other UI, never going off-screen — on windows short enough to actually need it (verified down to an extreme 600px-tall window, where it gracefully scrolls its info section rather than breaking).
- Reflection extended 1px further (5px → 6px).
- **New: a tight 1px drop shadow right at the spine's own base** — separate from the wider, softer contact-shadow added a few versions back (`.record::before`), which is about the general area around a record; this one is specifically about the spine's own edge meeting the shelf. Added directly to `.spine`'s existing box-shadow list.
- **Top-face perspective effect extended further back, to read as a higher camera angle.** Taller (9px → 15px) with a shallower tilt (rotateX 63° → 56°) and a longer local perspective distance (15px → 22px) — together these reveal more of the "top surface" rather than foreshortening it away to almost nothing, the same way a more overhead view of a shelf shows more of each book's top edge than a low, raking one would.

## v66
- **Follow-up QA on the v65 hover-card fix found and fixed one more gap: mobile portrait was still artificially constrained.** The v65 safety net measured available space against the *scene's* own top edge — reasonable on desktop, but on a tall narrow phone screen the scene itself shrinks to fit the available width and ends up quite short, so bounding the card to the scene's edge specifically was still needlessly tight (was hitting the 120px floor there, same as before the v65 fix). Since `.scene` has `overflow: visible` and only `.page` actually clips, the card can safely use the extra space above the scene, right up to the real edge of the screen — changed the boundary to the viewport's own top instead. Mobile card height went from ~118px (still hitting the floor) to ~208–238px (close to its natural size). Confirmed across the full viewport range again after the change — still 246px everywhere on desktop, never off-screen anywhere including the once-broken mobile case.

## v65
- **Fixed the reflection's direction and made it much shorter.** It was 38% of the spine's own height and faded the wrong way (strongest far from the spine, weakest right next to it) — a second `scaleY(-1)`-and-mask gotcha: the flip reverses the mask's fade direction too, so a mask written "strong near the spine" before the transform lands "strong far from it" after. Rewrote the mask backwards to compensate, verified by rendering it at an exaggerated size/opacity first and confirming the fade direction directly in a screenshot, then dialing back to the requested size: 5px tall, strongest right at the spine's base.
- Spine height increased another ~2px (94.9% → 95.84%).
- **Fixed hover cards having shrunk since the recent background-image changes — a real regression, not intended.** Each time records moved up (v59 through v63, chasing the "still too low" floor-alignment feedback), the headroom available above them for the card shrank too, and the dynamic max-height calculation from v61 was doing exactly its job — just against a shrinking budget every time, until cards were only ~200px instead of their natural ~246px. Rather than continue shrinking the card to fit around the search controls, the controls now fade out of the way (down to 8% opacity, non-interactive) whenever a card is open, and the card always renders at full natural size. A counter tracks concurrently-open cards so the controls only fade back in once every card is actually closed, including through rapid hover changes between records. The remaining safety net (max-height, so a fixed-size card still can't push off the top of a very short window) now measures against the *scene's* own top edge instead of the search controls specifically — far more permissive, since the whole point of the fade is to remove them as a constraint. Confirmed full 246px card height across every viewport size tested, including the extreme 600px-tall case that previously forced the card down to its 120px floor.
- One genuine mistake caught and fixed *before* shipping this time: an early attempt at the reflection fix used a broad `sed` replace that accidentally changed 11 unrelated `opacity: 1` rules elsewhere in the file (hover states, panel-open states, an animation endpoint) to the new value too. Caught by diffing against the previous version before shipping, discarded, and redone with a properly scoped edit — worth mentioning since it's exactly the kind of silent, wide-reaching mistake that's easy to miss without checking.

## v64
- **New: a faint glossy-floor reflection beneath each spine.** A flipped, faded copy of the spine's own artwork/color (not a generic gradient), added as a `.spine::after`. This one took real debugging to get right — the first attempt was invisible even at 90% opacity for testing, which turned out to be `transform-origin: top` on the `scaleY(-1)` flip: that setting moves the *whole box* to sit above its position rather than mirroring content within it, so the "reflection" was actually rendering as a solid patch over the spine's own bottom, not beneath it. Also had to change `.spine`'s `overflow: hidden` to `visible`, since it was clipping anything positioned past the spine's own bottom edge (the 1px border-radius that was protecting turned out to be imperceptible either way, so no visual cost). Fixed by using the default (center) transform-origin instead, which keeps the box in place and only mirrors its content — verified with a guide line drawn at the exact known record-bottom pixel to confirm the reflection now starts exactly there, not before it.
- **New: a foreshortened top-face on each spine**, suggesting the slightly-from-above camera angle — the same reason you'd see a sliver of a book's top edge on a real shelf, not just its spine face-on. A `.spine::before`, using the spine's own color (so it reads as the same object) with a brightness lift that fades toward the back edge into the compartment's shadow, tilted back via a local `perspective()` + `rotateX()` transform rather than a flat decorative strip.
- Both effects are pseudo-elements of the spine/record themselves rather than separately tracked layers, so hover-lift, paging, and drop-in-on-add all move them automatically with zero extra JS — confirmed by hovering a record and watching its shadow, reflection, and top-face all shift together with it. Hover-card clearance re-checked after these additions (unaffected, still 16px on normal/short, 2.4px on the very-short extreme).

## v63
- **More fine-tuning: records up another couple of pixels, top gap halved again.** Floor moved to 17.05% inset (was 16.87%). Spine height increased to 95% (was 90%), halving the remaining top gap. Hover-card clearance re-checked — still positive everywhere, though the "very short" window case has gotten noticeably tighter (2.4px, was 10.9px) now that spines sit higher; the dynamic JS calculation from v61 is still handling it correctly, just with less margin to spare on that specific extreme.
- **New: a soft contact-shadow behind each record spine.** With the compartment now visually emptier around a small collection, the bare wood in the gaps between spines was reading a bit bright/exposed. Added a radial-gradient shadow as a `::before` on each `.record` — wider than the spine itself, so it darkens the gaps on either side, and positioned behind the real spine in paint order (no z-index needed, since generated content paints before an element's real children by default). Being part of `.record` itself rather than a separate tracked layer, it automatically follows every transform the spine gets — hover-lift, paging, drop-in on add — with no extra JS. Verified this specifically: hovering a record shows its shadow lifting and moving right along with it.

## v62
- **Fine-tuning per feedback: records nudged up a couple more pixels, and made taller.** Floor line moved from 16.61% to 16.87% inset (a small final adjustment on top of the door-bottom alignment from v61). Spine height increased from 85.1% to a flat 90% — a deliberate move away from the "match the old design's absolute ~205px height" target that's driven every previous height decision, since the request here was specifically for taller spines with less empty gap above them, not for matching a prior size. Hover-card clearance re-checked after both changes (it's computed dynamically by the v61 JS fix, so it adapted automatically) — still positive across normal, short, and very-short windows.

## v61
- **Moved records up once more, using a fundamentally better reference this time.** Rather than continuing to interpret the soft, ambiguous back-wall-to-floor gradient, switched to the door panels' bottom edge instead — a sharp, unambiguous shadow line, identical on both doors (y=939 either side), and the doors share the same interior floor as the compartment by construction. Records now align to this exactly (matched to within 0.02px). Records-zone bottom moved to 16.61% inset (was 15.28%), spine height re-derived to 85.1% for the same ~205px target.
- **Found and fixed a real bug this move surfaced: the hover-card could overlap the search controls on short/laptop-height windows.** Moving records up reduced their headroom, and a fixed CSS max-height couldn't adapt correctly — it either clipped the card on tall screens with room to spare, or didn't shrink enough on short ones. Replaced it with a JS calculation that measures the actual available gap each time a card opens and sets its max-height to fit exactly. Getting this right took two real bugs to track down: (1) a `scale(1.08)` on the open record was inflating the card's *painted* size beyond whatever max-height was set, and (2) measuring the record's position immediately after triggering its CSS transition was unreliable, sometimes reading its pre-animation position — fixed by measuring the resting position first and calculating the lifted position analytically from the known transform math, rather than reading it off a mid-transition DOM. Verified with real clearance measurements across normal, short, very-short, and an extreme 600px-tall window (which hits an intentional 120px minimum card size rather than shrinking to illegibility) — all render correctly, confirmed visually as well as numerically.

## v60
- Moved records up using the sharpest edge in the compartment-floor gradient (still not quite enough — see v61).

## v59
- Fixed records sitting in the shadow below the shelf's floor rather than on it.

## v58
- Fixed the scene sometimes requiring a scroll to see in full — it's now sized against both the window's width and height, whichever is tighter.

## v57
- New scene photo (V4), re-measured fresh. Cabinet size, spine height, and hover-card clearance all re-verified against this specific photo.

## v56
- Found and fixed the real "spines still way off" bug — the hover-triggered cover-art popup was floating disconnected near the search controls rather than positioned near its record. Reduced the popup's cover-art size so it fits the available headroom.
- New scene photo (V3, darker fade), same 60px top-crop reapplied.
- Background color set to `#ecd7c4`.

## v55
- Replaced scene photo, cropped 60px off the top.
- Fixed record spine height being stretched thin — changed from a percentage of the compartment's height to a fixed absolute height (~205px) matching the original design.

## v54
- New scene photo — a proper outpainted version with extended, pre-faded wall and floor, replacing the regenerated "empty cabinet" photo used in v49–v53.
- Background color set to the exact hex specified (`#f0e7df`), matching this photo's own built-in fade.
- Filename changed from `shelf-cabinet.png` to `shelf-cabinet.jpg`.

## v53
- Fixed matching the compartment's width instead of the cabinet's outer edges (wrong landmark on the "empty cabinet" photo — that photo replaced in v54 anyway).
- This was genuinely difficult to measure cleanly — the hanging plant vine overlaps the cabinet's right edge in both photos at almost every height, and produced a couple of false readings before finding a clean method.

## v52
- Corrected the scale factor's precision, but matched the compartment's width rather than the cabinet's outer edges (wrong landmark — corrected in v53).
- Flat solid-color background (`#f1e6dc`), replacing the blurred-photo backdrop.

## v51
- Grew the scene's container to match cabinet size, instead of cropping within the old container (right idea, imprecise scale factor — corrected in v52).
- Blurred full-viewport backdrop layer (replaced with a plain solid color in v52).

## v50
- First attempt at cabinet-size matching — cropped/zoomed the background within the old container size instead of growing the container (didn't actually match the size — corrected in v51).

## v49
- New scene photo (empty-cabinet version) with every photo-dependent position re-measured against it directly.
- Seamless full-bleed background — a blurred, scaled-up copy of the same photo fills the viewport behind the crisp scene.

## v48
- Save indicator recolored to match the interface's own palette.
- Backup button bigger, save indicator smaller and closer.
- Brought back the "Shelf is empty" message, redesigned.
- The app now opens on search when the shelf is genuinely empty (nothing to play yet), and on playback controls once there's an actual collection — rather than always defaulting to one or the other.

## v47
- Filter delete-× redesigned: hold time shortened to 0.6s, sits astride the pill's border, softer fill, fades in properly.
- Removed the empty-shelf message entirely (brought back, redesigned, in v48).
- Defaulted to showing playback controls on load (refined further in v48 to depend on whether the shelf has anything in it).
- **Added an unsaved-changes indicator** — a small icon next to the backup button, a filled green circle+check when everything's backed up, a hollow red-brown outline when it isn't. Tracks actual content changes only (adding/removing a record, creating/deleting/toggling a tag) — zoom, filter selection, and exclusions don't count, matching how you described caring about this. Turns clean on a successful export or import, and the state persists across reloads.
- Redesigned the import confirm popover: separate centered lines for the title, record count, and formatted date/time (e.g. "2026-09-07 @ 7:15am") instead of one dense sentence, plus noticeably more padding around the whole thing.

## v46
- Added backup/export/import.

## v45
- Softened the "add tag" input bar to blend into the interface.
- Fixed the filter delete-× buttons not working.
- Fixed tags deleting themselves when their last record was untagged.

## v44
- Reverted the "create tag" interface back to the original bar-above-the-grid design.

## v43
- Switched the create-tag field from `<input>` to `<textarea>` to sidestep a password manager extension (didn't fully resolve a separate focus bug — reverted to the original design in v44).

## v42
- Confirmed the dots were a third-party password manager extension; added opt-out attributes for the major ones.

## v42
- Confirmed the dots are a third-party password manager extension; added the specific opt-out attributes each major one respects (didn't fully resolve it — addressed differently in v43).

## v41
- The dots were a different bug than the sizing one — `autocomplete="new-password"` was itself triggering a password-generation suggestion.

## v40
- Found and fixed the actual create-pill sizing bug (confirmed against a real screenshot of the DOM).

## v41
- The dots were a different bug than the sizing one — `autocomplete="new-password"` was itself triggering a password-generation suggestion (didn't fully resolve it — the underlying cause was the extension itself, addressed in v42).

## v40
- Found and fixed the actual create-pill sizing bug (confirmed against a real screenshot of the DOM).

## v40
- **Found the actual create-pill sizing bug, via a screenshot of the real DOM.** The input element itself was always completely correct — right placeholder text, right attributes, right class, confirmed directly in the inspector. The problem was purely visual: the previous fix gave the pill a `min-height`, but `min-height` doesn't satisfy what a child's `height: 100%` needs per the CSS spec (only an explicit `height` does) — so the input was very likely still collapsing to near-zero height invisibly. Removed the percentage-height dependency entirely; the input now sizes itself naturally from its own padding and line-height, exactly like the regular tag pills already correctly do.

## v39
- Fade swap moved slightly earlier, reducing the moment where nothing's visible.
- Yellow box, round two.
- First (incomplete) attempt at the create-pill sizing fix — `min-height` looked right on paper but didn't actually satisfy what the input's `height: 100%` needed.

## v38
- Fade-in lengthened to 150%.
- Create-pill redesigned as a plain always-present text input instead of a button that toggles into one (broke visually in this round — fixed in v39).
- First attempt at the yellow-box fix (autofill CSS override, generic outline suppression) — didn't fully resolve it, strengthened in v39.

## v37
- Fade ratio adjusted to 30/70 (tuned further to fade-in length in v38).
- Create-pill click issue, attempt three — pointerdown + click together (still didn't work — redesigned entirely in v38).
- Hold-to-delete shortened to 0.8s; removed wobble; fixed × color and clipping.
- Found and fixed why cards were getting stuck open (`:focus-within` persisting independently of the `open` class).

## v36
- Fixed the create-pill CSS ordering bug (didn't fully resolve the click issue — see v37).
- Reverted pill sizing; added hover-scroll for long tag names.
- Fade transition re-tuned to 40/60 (adjusted again in v37).
- Long-press delete replacing right-click (styling/timing refined in v37).

## v35
- Tag panel and pills widened (superseded — reverted in v36 in favor of hover-scroll for long names).
- Fixed the "+ Create" pill sizing/click issue (first attempt — the real cause was found in v36).
- Filter selection reworked to support multiple tags at once: Cmd+click adds/removes from the selection, Option+click toggles exclusion.
- Changing the filter selection fades the shelf out and back in (tuned further in v36).
- Added tag deletion via right-click (replaced with long-press in v36, since right-click just opened the browser's own menu).

## v34
- Tag pills back to plain text again — no visible checkbox square. Safe to do now: the actual toggle logic lives on `pointerdown` against the pill itself, not on the checkbox being visibly clickable.
- "Create a tag" redesigned as its own pill (sizing/click issue found and fixed in v35).

## v33
- **Actually found and fixed the tag bug**, via forensic event-level logging with precise timestamps (turned out to have nothing to do with Brave Shields — same behavior in plain Chrome too). The evidence: on a single click, the browser correctly fires `pointerdown → mousedown → mouseup → click` on the label, then `focusin` on the checkbox — but never actually runs the "label activates its checkbox" step, and no `change` event ever fires. On a second, fast click right after, that step suddenly *does* run. Fixed by handling the toggle directly on `pointerdown` instead of depending on that native forwarding.

## v32
- First theory (Brave Shields blocking an invisible-overlay checkbox as a clickjacking precaution) — ruled out by testing with Shields off and in Chrome. Kept the visible-checkbox redesign since it's better UI regardless.

## v31
- Removed the playback button color-invert on press entirely — just a subtle scale now.
- Tag toggling rebuilt using checkboxes (the mechanism itself was sound — the real issue turned out to be the invisible-overlay styling, fixed in v32).

## v30
- Playback button "pressed" effect now fires from one unified source (a `pulseButton()` call) instead of relying on CSS `:active` alone. Best-effort Media Session hookup for Mac hardware media keys.
- Reworked the "pressed" color (superseded — removed entirely in v31).
- Found and fixed the actual cause of the filter panel closing on selection (a rebuild-orphaned click target confusing the "click outside" handler).
- Applied the same "don't rebuild inside the click handler" fix to the per-record tag panel too, for the same category of robustness.
- Corner icons (filter + search/playback toggle) made fainter again and locked to always match each other exactly; filter tag pills nudged slightly more visible than before (they carry text that needs to stay legible).

## v29
- Equalizer no longer snaps instantly on pause/resume — pausing now eases the bars smoothly down to rest (0.35s), and resuming fades them up first before the bounce animation takes over, rather than jumping straight to it.
- Playback button click effect softened (tuned further in v30).
- **Actually fixed the tag-click bug this time** — switched to a single delegated listener on the stable container (further hardened in v30).
- The search↔playback toggle now works from the very first launch — previously it stayed a plain magnifying glass (with no way to reach playback controls at all) until something had actually played once. Now clicking it always switches views, showing an inert-but-present playback panel if nothing's loaded yet.

## v28
- Fixed the tag-click bug (first attempt — the real fix landed in v29).
- Filter icon and search/playback toggle both made fainter.
- Playback buttons invert color and shrink slightly on click (tuned further in v29).
- Fixed the equalizer resetting on every pause (further refined in v29 — this version fixed the *reset*, v29 fixed the *snap*).
- The search/playback toggle is always visible (v29 also makes it always *functional*).
- Filter tag pills blend in more; removed the "All records" button.
- Filter panel stays open after selecting a tag.
- An excluded tag, when selected, displays fully normally.

## v27
- Fixed color consistency across the filter icon, toggle, and playback buttons.
- Redesigned the filter dropdown and per-record tag panel as borderless rounded-rectangle pill grids.
- Single-select filtering, shift-click exclusion.

## v26
- Added custom tagging and filtering (first version).

## v25
- **Critical fix**: v24 was completely broken for anyone with an existing saved shelf.

## v24
- Added a tiny equalizer next to the now-playing title and a slow "breathing" pulse on the currently-playing record's spine.

## v23
- Reworked keyboard model: Space always play/pause except typing, Enter opens search from idle, Tab always just toggles modes.

## v22
- Added a "now playing" display above the transport buttons.
- Moved the search↔playback toggle to a large corner icon.

## v21
- Playback control buttons roughly doubled in size, with circular outlines.
- Album cover is now explicitly the play button on the hover card.

## v20
- Added real in-page Spotify playback via the Web Playback SDK.
- The search bar now doubles as playback controls: once something's loaded, that same spot shows `‹ ▶/⏸ ›` instead of the search prompt. Press Space any time to pull search back up over it; reverts to controls once you're done.
- Added a proper user login (separate from the existing app-only search key) using the same secure PKCE flow real Spotify apps use, with a quiet background refresh so you only log in once. A small "connect spotify for in-page playback" link appears until you have.
- This requires running the page through a local server again (not double-clicking the file) and registering a Redirect URI in your Spotify app — see the README's setup section.
- Search and adding records still need no login at all — only playback does. The shelf itself remains fully independent of your real Spotify library, as decided earlier.

## v19
- Fixed: the outward glow was invisible because the page background and glow color were identical. Split them apart so the glow is actually visible.

## v18
- First attempt at the outward-glow approach (invisible due to a color-matching bug — fixed in v19).
- Page arrows nudged to sit level with the actual door handles.
- Reverted the v16 long-title font-scaling fix.

## v17
- First attempt at an edge blend (a mask fading the photo's own edges — superseded by v18/v19's outward-glow approach).

## v16
- Zoom slider max reduced to 1.0.
- Alphabetical sort now ignores a leading "The".
- Records made taller; removed the spine-top and spine-text drop shadows.
- Fixed the black recess's bottom edge to match the true floor line precisely.

## v15
- Reverted the hold-to-add ritual back to a plain click.
- Loading spinner given an asymmetric light streak so rotation is visible.
- Record bottoms and page arrow positions re-measured against the original photo.
- Zoom slider range reduced to 0.3–1.1.

## v14
- Records shortened with a top gap and (since removed) a top-edge shadow.

## v13
- Fixed results list row count and back-navigation selection memory.
- Zoom reflow moved to every animation frame instead of a fixed delay.
- Page arrows and the blackout recess re-measured against the original photo.

## v12
- Page arrows enlarged, first centering attempt.
- Added keyboard navigation throughout the search flow.

## v11
- Interactive record area tightened to the compartment.
- Added pagination with sliding page-change animation.
- Search results capped with scrolling; disappear animation changed to shrink-toward-center.

## v10
- Added a clear (✕) button next to the search text.
- Search has a loading animation with a spinning vinyl record.

## v9
- Added a minimal zoom slider on the floor beneath the cabinet, controlling spine width proportionally.

## v8
- Text position restricted to centered or top-anchored only.
- Hover motion changed to straight lift + slight scale, no tilt.

## v7
- Removed the per-spine lean; modern-era font changed to Space Grotesk.
- Spines blend ~80% extracted color with ~20% actual album art.

## v6
- Spines varied in width and leaned slightly; spine label font changed by release era.

## v5
- Spines switched to solid colors pulled from album artwork.

## v4
- Track list expands as a side panel instead of underneath.

## v3
- Real photo used as the shelf background, interactive spines drawn on top.
- Search bar redesigned as a minimal floating label on the wall.

- Zoom slider max reduced to 1.0.
- Alphabetical sort now ignores a leading "The".
- Records made taller (top gap halved); removed the spine-top and spine-text drop shadows.
- Fixed the black recess's bottom edge to match the true floor line precisely.
- Long-title font scaling fix attempted (reverted in v17).

## v15
- Reverted the hold-to-add ritual back to a plain click.
- Loading spinner given an asymmetric light streak so rotation is visible.
- Record bottoms and page arrow positions re-measured against the original photo.
- Zoom slider range reduced to 0.3–1.1.

## v14
- Records shortened with a top gap and (since removed) a top-edge shadow.

## v13
- Fixed results list row count and back-navigation selection memory.
- Zoom reflow moved to every animation frame instead of a fixed delay.
- Page arrows and the blackout recess re-measured against the original photo.

## v12
- Page arrows enlarged, first centering attempt.
- Added keyboard navigation throughout the search flow.

## v11
- Interactive record area tightened to the compartment.
- Added pagination with sliding page-change animation.
- Search results capped with scrolling; disappear animation changed to shrink-toward-center.

## v10
- Added a clear (✕) button next to the search text.
- Search has a loading animation with a spinning vinyl record.

## v9
- Added a minimal zoom slider on the floor beneath the cabinet, controlling spine width proportionally.

## v8
- Text position restricted to centered or top-anchored only.
- Hover motion changed to straight lift + slight scale, no tilt.

## v7
- Removed the per-spine lean; modern-era font changed to Space Grotesk.
- Spines blend ~80% extracted color with ~20% actual album art.

## v6
- Spines varied in width and leaned slightly; spine label font changed by release era.

## v5
- Spines switched to solid colors pulled from album artwork.

## v4
- Track list expands as a side panel instead of underneath.

## v3
- Real photo used as the shelf background, interactive spines drawn on top.
- Search bar redesigned as a minimal floating label on the wall.
