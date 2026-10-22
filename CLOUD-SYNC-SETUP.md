# Cloud sync setup (about 10 minutes, free)

You do this once. Afterwards you and your partner just open the app.

## 1. Make a free Cloudflare account
Go to https://dash.cloudflare.com/sign-up and sign up with an email and password. No card should be needed for the free plan; if it asks for one, stop and tell me.

## 2. Create the storage
In the dashboard left menu: **Storage & Databases → KV** (older dashboards: **Workers & Pages → KV**). Click **Create a namespace**, name it `lp-shelves`, and create it.

## 3. Create the Worker
**Workers & Pages → Create → Create Worker.** Name it `lp-sync` (any name works; it becomes part of the address), click **Deploy**, then **Edit code**. Delete everything in the editor, paste the whole contents of `lp-sync-worker.js`, and click **Deploy**.

## 4. Connect the storage to the Worker
Open the Worker → **Settings → Bindings → Add → KV namespace**. Set the variable name to exactly `SHELVES`, choose `lp-shelves`, save/deploy.

## 5. (Recommended) Limit it to the two of you
Worker → **Settings → Variables and Secrets → Add**: type *Text*, name `ALLOWED_IDS`, value your Spotify user id and your partner's, separated by a comma (e.g. `simon123,janedoe`). Your Spotify user id is the last part of your profile link (open.spotify.com/user/**THIS**). Deploy.

## 6. Copy the Worker address
It looks like `https://lp-sync.<yourname>.workers.dev` (shown on the Worker's overview page). Open it in a browser: seeing `{"error":"unauthorized"}` means it's running.

## 7. Tell the app
Upload the new app files to GitHub as usual. In the app: click your initials (bottom right) → the cloud bubble → paste the address → **Save & test**. You should see "Connected ✓" and a green dot.
Do the same on your partner's computer, signed in as her. (Send me the address and I'll put it into the next version so nobody has to paste it.)

## If something goes wrong
- Red dot: click the cloud bubble; the message says what the problem is. "Sync server answered 500" usually means step 4 (the `SHELVES` binding) was missed.
- "This Spotify account isn't allowed": her Spotify id isn't in `ALLOWED_IDS`.
- Your data is never at risk from a sync problem: the shelf on each computer is always kept, and Export still works.
