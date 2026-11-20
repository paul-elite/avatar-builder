import { defaultAvatar, SKIN, HAIR_COLOR, BG, CAP, HAT, GLASSES, BLUSH, HEAD, hashString } from './avatar.js';
import { normalizeAvatar, readAvatar } from './document.js';

/* =========================================================================
   Avatars on demand: the same seed always gives the same look, so a product
   can show every user an avatar before they've made one, and the user can
   later open it in the editor and make it theirs (it's an ordinary config).

     avatarFromSeed('user_42')                     → config
     avatarFromUser({ id: 42, email, name })       → { seed, config }

   The look is picked only from the seed. Profile fields such as name, gender
   or age are never used to guess how someone looks; a product that knows a
   user's choices passes them explicitly as `avatar` (a partial config, a saved
   document or SVG), and they win over the generated look.

   GENERATOR_VERSION is part of the contract: a given (seed, version) pair
   always draws the same avatar. Changing the pools below means a new version.
   ========================================================================= */

export const GENERATOR_VERSION = 1;

// mulberry32: a small, fast, seeded PRNG
function rng(seedString) {
  let a = parseInt(hashString(String(seedString)).slice(-8), 36) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pools for generated avatars: friendly, readable at small sizes
const POOL = {
  skin: SKIN,
  head: HEAD,
  hair: ['fade', 'fade', 'taper', 'taper', 'afro', 'locs', 'flattop', 'cornrows', 'curls', 'longhair', 'sponge', 'twists', 'none'],
  // Mostly natural shades; the bright ones now and then
  hairColor: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#5a3620', '#5a3620', '#5a3620', '#a8693f', '#a8693f', '#e8b04b', '#f2e3c6', ...HAIR_COLOR.slice(5)],
  eyes: ['boy', 'boy', 'open', 'round', 'wide', 'big', 'happy', 'dots', 'up', 'side', 'sleepy', 'wink'],
  brows: ['none', 'none', 'none', 'raised', 'flat'],
  nose: ['boy', 'boy', 'hook', 'dot', 'tick'],
  mouth: ['boy', 'boy', 'smile', 'smile', 'smirk', 'open', 'o', 'tongue'],
  bg: BG.filter((c) => c !== '#1a1a1a'),
};

export function avatarFromSeed(seed, overrides) {
  const r = rng(`${GENERATOR_VERSION}:${seed}`);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const c = { ...defaultAvatar };
  // Fixed draw order: every field consumes its random numbers whether or not it's used
  c.skin = pick(POOL.skin);
  c.head = pick(POOL.head);
  c.hair = pick(POOL.hair);
  c.hairColor = pick(POOL.hairColor);
  c.eyes = pick(POOL.eyes);
  c.brows = pick(POOL.brows);
  c.nose = pick(POOL.nose);
  c.mouth = pick(POOL.mouth);
  c.bg = pick(POOL.bg);
  const glasses = r() < 0.18, blush = r() < 0.22, cap = r() < 0.12;
  const gl = pick(GLASSES), bl = pick(BLUSH), cp = pick(CAP), ht = pick(HAT);
  c.glasses = glasses ? gl : null;
  c.blush = blush ? bl : null;
  c.cap = cap ? cp : null;
  c.hat = ht;
  if (c.head === 'round' || c.head === 'square') c.ears = 'regular';
  const extra = overrides == null ? null : partial(overrides);
  return normalizeAvatar({ ...c, ...(extra || {}) });
}

// The fields a partial override actually sets (a full document/SVG sets them all)
function partial(o) {
  if (o && typeof o === 'object' && !o.format && !(typeof Element !== 'undefined' && o instanceof Element)) return o;
  return readAvatar(o);
}

/* The seed for a user: a short, opaque hash of their id (or email, username,
   name — the first one present), so avatar URLs never contain the raw value. */
export function seedFromUser(user) {
  if (user == null) return 'anon';
  if (typeof user !== 'object') return 'u_' + hashString(String(user));
  if (user.seed != null) return String(user.seed);
  const key = user.id ?? user.userId ?? user.uid ?? user.sub
    ?? (user.email ? String(user.email).trim().toLowerCase() : undefined)
    ?? user.username ?? user.handle ?? user.name;
  return 'u_' + hashString(key != null ? String(key) : JSON.stringify(user));
}

/* { seed, config } for a user record. `user.avatar` (partial config, document or
   SVG the user saved) is applied over the generated look. */
export function avatarFromUser(user, overrides) {
  const seed = seedFromUser(user);
  const saved = user && typeof user === 'object' ? user.avatar : undefined;
  let config = avatarFromSeed(seed);
  if (saved != null) config = normalizeAvatar({ ...config, ...partial(saved) });
  if (overrides != null) config = normalizeAvatar({ ...config, ...partial(overrides) });
  return { seed, config };
}
