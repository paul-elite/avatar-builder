import { avatarToSvg } from '../src/lib/avatar.js';
import { toAvatarDocument, decodeAvatar, encodeAvatar, AVATAR_FORMAT_VERSION } from '../src/lib/document.js';
import { avatarFromUser, avatarFromSeed, GENERATOR_VERSION } from '../src/lib/seed.js';

/* =========================================================================
   Avatars on demand over HTTP.

   GET  /api/avatar?seed=…            → image/svg+xml (the SVG carries its own editable document)
        /a/<seed>.svg                 → the same, as a clean image URL
        /a/<seed>.json                → JSON (below)
        Query: seed | id | email | username | name   who it's for (hashed into the seed)
               size=16…2048 (256)     format=svg|json   download=1
               any config field to pin it, e.g. hair=mop&skin=%23f3d2b9
               avatar=<code>          a look from encodeAvatar() / an editor link

   POST /api/avatar   { user: {...}, overrides?, size? }  or  { users: [...] } (≤ 100)
        → { seed, url, editUrl, config, document, svg }  (or { avatars: [...] })

   Users' metadata only picks the seed; it's never used to guess appearance.
   ========================================================================= */

const SITE = 'https://avatars.paulelite.com';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};
const CONFIG_KEYS = new Set(['skin', 'head', 'ears', 'tilt', 'hair', 'hairColor', 'eyes', 'gaze', 'brows', 'nose', 'mouth', 'tongue', 'blush', 'gesture', 'tears', 'cap', 'hat', 'glasses', 'torso', 'body', 'outfit', 'outfitColor', 'detail', 'bg', 'shadow']);

const clampSize = (v) => Math.max(16, Math.min(2048, Math.round(Number(v) || 256)));
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extra } });

function build(user, overrides, size, origin) {
  const { seed, config } = avatarFromUser(user, overrides);
  // When the look isn't just the seed's (pinned fields, a saved avatar), the URL carries it
  const pinned = JSON.stringify(config) !== JSON.stringify(avatarFromSeed(seed));
  const qs = new URLSearchParams({ size: String(size) });
  if (pinned) qs.set('avatar', encodeAvatar(config));
  return {
    seed,
    generator: GENERATOR_VERSION,
    url: `${origin}/a/${encodeURIComponent(seed)}.svg${pinned || size !== 256 ? '?' + qs : ''}`,
    editUrl: `${origin}/?avatar=${encodeAvatar(config)}`,
    config,
    document: toAvatarDocument(config, { seed }),
    svg: avatarToSvg(config, { size, seed }),
  };
}

function fromQuery(q) {
  const user = {};
  for (const k of ['seed', 'id', 'email', 'username', 'name']) if (q.get(k)) user[k] = q.get(k);
  const overrides = {};
  // Colours may come without their # (it's awkward in a URL): hair=mop&skin=f3d2b9
  for (const [k, v] of q) if (CONFIG_KEYS.has(k)) overrides[k] = v === 'none' || v === 'null' ? null : /^[0-9a-f]{6}$|^[0-9a-f]{3}$/i.test(v) ? '#' + v : v;
  const code = q.get('avatar');
  const fromCode = code ? decodeAvatar(code) : null;
  return { user: Object.keys(user).length ? user : null, overrides: fromCode ? { ...fromCode, ...overrides } : overrides };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export function GET(request) {
  const url = new URL(request.url);
  const q = url.searchParams;
  const { user, overrides } = fromQuery(q);
  if (!user && !q.get('avatar')) return json({ error: 'Pass seed, id, email, username or name (or avatar=<code>).' }, 400);
  const size = clampSize(q.get('size'));
  const origin = url.origin.includes('localhost') ? url.origin : SITE;
  const a = build(user || { seed: 'custom' }, overrides, size, origin);
  const cache = { 'cache-control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800' };
  if (q.get('format') === 'json') return json(a, 200, cache);
  const headers = { 'content-type': 'image/svg+xml; charset=utf-8', 'x-avatar-seed': a.seed, 'x-avatar-format': `avatar-builder/${AVATAR_FORMAT_VERSION}`, ...CORS, ...cache };
  if (q.get('download')) headers['content-disposition'] = `attachment; filename="avatar-${a.seed.replace(/[^\w-]/g, '')}.svg"`;
  return new Response(a.svg, { status: 200, headers });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Send a JSON body.' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Send a JSON body.' }, 400);
  const origin = new URL(request.url).origin.includes('localhost') ? new URL(request.url).origin : SITE;
  const size = clampSize(body.size);
  const clean = (o) => (o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).filter(([k]) => CONFIG_KEYS.has(k))) : undefined);
  if (Array.isArray(body.users)) {
    if (body.users.length > 100) return json({ error: 'Up to 100 users per request.' }, 413);
    return json({ avatars: body.users.map((u) => build(u, clean(body.overrides), size, origin)) });
  }
  const user = body.user ?? (body.seed != null ? { seed: body.seed } : null);
  if (user == null) return json({ error: 'Pass user (an object or id) or seed.' }, 400);
  return json(build(user, clean(body.overrides), size, origin));
}
