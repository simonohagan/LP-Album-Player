// LP: Album Player — cloud sync worker (Cloudflare Workers + KV, free plan).
//
// What it does: keeps one copy of each person's shelf, keyed by their Spotify
// user id, so the same account on two computers shows the same shelf.
// Who you are is proven by your Spotify sign-in token — the worker asks
// Spotify "whose token is this?" and only ever hands you that person's shelf.
//
// Setup (once): create a Worker, paste this file in, create a KV namespace
// and bind it to the Worker with the variable name  SHELVES.
// Optional: add a plain-text variable  ALLOWED_IDS  = comma-separated Spotify
// user ids, to restrict storage to just you two.

const MAX_BYTES = 8 * 1024 * 1024;            // refuse absurdly large shelves
const SNAPSHOT_TTL = 60 * 60 * 24 * 30;       // daily snapshots are kept 30 days
const tokenCache = new Map();                 // token -> { id, until }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, If-Match",
  "Access-Control-Max-Age": "86400",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
  });
}

async function spotifyIdFor(token) {
  const hit = tokenCache.get(token);
  if (hit && hit.until > Date.now()) return hit.id;
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: "Bearer " + token },
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error("spotify_" + res.status);
  const me = await res.json();
  if (!me || !me.id) return null;
  if (tokenCache.size > 200) tokenCache.clear();
  tokenCache.set(token, { id: me.id, until: Date.now() + 5 * 60 * 1000 });
  return me.id;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    try {
      return await handle(request, env);
    } catch (e) {
      const m = String((e && e.message) || e);
      if (m.startsWith("spotify_")) return json({ error: "spotify_unavailable", message: m }, 502);
      return json({ error: "server", message: m }, 500);
    }
  },
};

async function handle(request, env) {
  if (!env.SHELVES) return json({ error: "not_configured", message: "KV binding SHELVES is missing" }, 500);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);
  const id = await spotifyIdFor(token);
  if (!id) return json({ error: "unauthorized" }, 401);
  if (env.ALLOWED_IDS) {
    const allowed = String(env.ALLOWED_IDS).split(",").map((s) => s.trim()).filter(Boolean);
    if (allowed.length && !allowed.includes(id)) return json({ error: "forbidden" }, 403);
  }
  const eid = encodeURIComponent(id);
  const shelfKey = "shelf:" + eid;

  if (path === "/ping" && request.method === "GET") return json({ ok: true, id });

  if (path === "/shelf" && request.method === "GET") {
    const cur = await env.SHELVES.get(shelfKey, "json");
    if (!cur) return json({ rev: 0, ver: "0", empty: true, records: [], tags: [] });
    if (url.searchParams.get("ver") === cur.ver) return json({ unchanged: true, rev: cur.rev, ver: cur.ver });
    return json(cur);
  }

  if (path === "/shelf" && request.method === "PUT") {
    const text = await request.text();
    if (text.length > MAX_BYTES) return json({ error: "too_large" }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: "bad_json" }, 400); }
    if (!body || !Array.isArray(body.records) || !Array.isArray(body.tags)) return json({ error: "bad_shape" }, 400);

    const cur = await env.SHELVES.get(shelfKey, "json");
    const curVer = cur ? cur.ver : "0";
    if ((request.headers.get("If-Match") || "0") !== curVer) {
      return json({ error: "conflict", rev: cur ? cur.rev : 0, ver: curVer }, 409);
    }
    // Once a day, keep the state as it was before that day's first change.
    if (cur) {
      const day = new Date().toISOString().slice(0, 10);
      const snapKey = "snap:" + eid + ":" + day;
      const exists = await env.SHELVES.list({ prefix: snapKey, limit: 1 });
      if (!exists.keys.length) {
        await env.SHELVES.put(snapKey, JSON.stringify(cur), { expirationTtl: SNAPSHOT_TTL });
      }
    }
    const next = {
      rev: (cur ? cur.rev : 0) + 1,
      ver: crypto.randomUUID(),
      updatedAt: Date.now(),
      records: body.records,
      tags: body.tags,
    };
    await env.SHELVES.put(shelfKey, JSON.stringify(next));
    return json({ ok: true, rev: next.rev, ver: next.ver });
  }

  if (path === "/snapshots" && request.method === "GET") {
    const list = await env.SHELVES.list({ prefix: "snap:" + eid + ":" });
    const days = list.keys.map((k) => k.name.split(":").pop()).sort().reverse();
    return json({ snapshots: days });
  }

  const m = path.match(/^\/snapshots\/(\d{4}-\d{2}-\d{2})$/);
  if (m && request.method === "GET") {
    const snap = await env.SHELVES.get("snap:" + eid + ":" + m[1], "json");
    if (!snap) return json({ error: "not_found" }, 404);
    return json(snap);
  }

  return json({ error: "not_found" }, 404);
}
