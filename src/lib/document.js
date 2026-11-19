import { defaultAvatar, ITEMS, CATEGORIES, STYLES } from './avatar.js';

/* =========================================================================
   The portable avatar: one object structure that travels with every avatar.

   An avatar is described by an AvatarDocument:

     {
       format: 'avatar-builder',
       version: 1,
       config: { skin: '#d9d9d7', head: 'boy', hair: 'mop', ... },   // the look
       seed?:  'u_3f9a1c0b2d7e4',                                    // when it was generated
     }

   Every SVG the library or the API produces carries that document inside it
   (see avatarToSvg), so an avatar saved or embedded on any website can be
   opened again in the editor and edited from exactly where it was:

     <svg ... data-avatar-format="avatar-builder/1">
       <metadata><avatar-builder>{ ...the document as JSON... }</avatar-builder></metadata>
       <g data-layer="background">…</g>
       <g data-layer="avatar"><g data-part="skin">…</g><g data-part="eyes">…</g>…</g>
     </svg>

   readAvatar() turns any of those back into a config: an SVG string or
   element, a data URI, a document, JSON, or a plain (possibly partial) config.
   Everything read is validated against the option lists, because configs end
   up inside SVG markup: an unknown shape falls back to the default and a
   colour must be a plain hex value.
   ========================================================================= */

export const AVATAR_FORMAT = 'avatar-builder';
export const AVATAR_FORMAT_VERSION = 1;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const SHAPE_KEYS = { category: CATEGORIES, style: STYLES };

/* A complete, safe config from anything config-like. Unknown keys are dropped. */
export function normalizeAvatar(input, base = defaultAvatar) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  for (const key of Object.keys(defaultAvatar)) {
    const fallback = base[key] !== undefined ? base[key] : defaultAvatar[key];
    const v = src[key];
    if (v === undefined) { out[key] = fallback; continue; }
    const item = ITEMS[key];
    if (SHAPE_KEYS[key]) out[key] = SHAPE_KEYS[key].includes(v) ? v : fallback;
    else if (!item) out[key] = typeof v === typeof defaultAvatar[key] ? v : fallback;
    else if (item.kind === 'color') out[key] = v === null && item.optional ? null : typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fallback;
    else if (item.kind === 'toggle' || typeof defaultAvatar[key] === 'boolean') out[key] = typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : fallback;
    else out[key] = item.options.includes(v) ? v : fallback;
  }
  return out;
}

/* Only the fields that differ from the default: the smallest faithful description. */
export function compactAvatar(config) {
  const c = normalizeAvatar(config);
  return Object.fromEntries(Object.entries(c).filter(([k, v]) => v !== defaultAvatar[k]));
}

export function toAvatarDocument(config, extra = {}) {
  const doc = { format: AVATAR_FORMAT, version: AVATAR_FORMAT_VERSION, config: normalizeAvatar(config) };
  if (extra.seed) doc.seed = String(extra.seed);
  return doc;
}

const isDocument = (o) => o && typeof o === 'object' && o.format === AVATAR_FORMAT && o.config && typeof o.config === 'object';

function decodeDataUri(s) {
  const comma = s.indexOf(',');
  const head = s.slice(0, comma);
  const body = s.slice(comma + 1);
  if (/;base64/i.test(head)) {
    if (typeof atob === 'function') return decodeURIComponent(escape(atob(body)));
    return Buffer.from(body, 'base64').toString('utf8');
  }
  return decodeURIComponent(body);
}

/* The document embedded in an SVG string, or null. */
export function readAvatarDocument(input) {
  if (input == null) return null;
  if (isDocument(input)) return { ...input, config: normalizeAvatar(input.config) };
  let s = input;
  if (typeof Element !== 'undefined' && input instanceof Element) s = input.outerHTML;
  if (typeof s !== 'string') return null;
  s = s.trim();
  if (/^data:image\/svg\+xml/i.test(s)) s = decodeDataUri(s);
  if (s.startsWith('{')) {
    try { const o = JSON.parse(s); return isDocument(o) ? readAvatarDocument(o) : null; } catch { return null; }
  }
  const m = s.match(/<avatar-builder\b[^>]*>([\s\S]*?)<\/avatar-builder>/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    return isDocument(o) ? readAvatarDocument(o) : null;
  } catch { return null; }
}

/* A config from any avatar input: SVG (string, element or data URI), document,
   JSON, or a plain/partial config. Returns null when nothing usable is found. */
export function readAvatar(input) {
  const doc = readAvatarDocument(input);
  if (doc) return doc.config;
  if (typeof input === 'string') {
    const s = input.trim();
    if (s.startsWith('{')) { try { return normalizeAvatar(JSON.parse(s)); } catch { return null; } }
    return null;
  }
  if (input && typeof input === 'object' && !(typeof Element !== 'undefined' && input instanceof Element)) return normalizeAvatar(input);
  return null;
}

/* Fetch an avatar SVG (or JSON document) from a URL and read it. */
export async function loadAvatar(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Could not load avatar (${res.status})`);
  const config = readAvatar(await res.text());
  if (!config) throw new Error('No avatar found at that URL');
  return config;
}

/* The JSON that goes inside <metadata>, escaped for XML text. */
export function documentToXmlText(doc) {
  return JSON.stringify(doc).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/* URL-safe short form of a config, for links like ?avatar=… (only the fields that differ). */
export function encodeAvatar(config) {
  const json = JSON.stringify(compactAvatar(config));
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeAvatar(code) {
  try {
    const b64 = String(code).replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8');
    return normalizeAvatar(JSON.parse(json));
  } catch { return null; }
}
