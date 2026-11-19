import * as P from './parts.js';

/* =========================================================================
   Headless avatar model + renderer — no React, no DOM. The <AvatarBuilder>
   editor and avatarToSvg() both draw from here, so the preview and any saved
   or exported avatar always match.

   The look comes from the Avatars Figma file: one outlined head with a soft
   offset shadow, and parts layered on it in a shared 176.8 × 160.1 space.
   Hair, the torso and outfits are drawn to match until there is Figma art.
   ========================================================================= */

/* ---- Palettes ---------------------------------------------------------- */
export const BG = ['#ffffff', '#f2f2f2', '#ffe4f1', '#e3f1ff', '#e9f9d9', '#fff3cf', '#ece6ff', '#1a1a1a'];
// The first four are the Figma toolbar's head fills
export const SKIN = ['#d9d9d7', '#ffffff', '#f3d2b9', '#444755', '#e8b98f', '#c68642', '#a8693f', '#6b3f22'];
export const HAIR_COLOR = ['#1a1a1a', '#5a3620', '#a8693f', '#e8b04b', '#f2e3c6', '#f70492', '#1084fe', '#8b5cf6'];
export const CAP = ['#f70492', '#50c810', '#1084fe', '#ff7a00', '#8b5cf6', '#ffffff', '#1a1a1a'];
export const HAT = ['cap', 'side', 'beanie'];
export const GLASSES = ['#000000', '#f70492', '#1084fe', '#c8a24a'];
export const BLUSH = ['#fc5cb9', '#ff8a65', '#f70410'];
export const TEARS = ['#b2ebff', '#8fd3ff', '#c7f0d8'];
export const TONGUE = ['#f70410', '#ff6fa5', '#ff8a65'];
export const OUTFIT_COLOR = ['#1084fe', '#f70492', '#50c810', '#ff7a00', '#ffe401', '#8b5cf6', '#ffffff', '#1a1a1a'];

export const CATEGORIES = ['person'];
export const STYLES = ['outline'];
export const EYES = ['boy', 'open', 'round', 'wide', 'big', 'side', 'up', 'sleepy', 'peek', 'angry', 'skeptical', 'bored', 'happy', 'sad', 'closed', 'wink', 'flat', 'squeeze', 'dead', 'dots'];
export const HEAD = ['boy', 'classic', 'round', 'square'];
export const EARS = ['none', 'small', 'regular', 'big'];
export const TILT = ['straight', 'left', 'right'];
const TILT_DEG = { straight: 0, left: -10, right: 10 };
export const BROWS = ['none', 'raised', 'flat', 'worried'];
export const NOSE = ['boy', 'hook', 'dot', 'tick', 'none'];
export const GAZE = ['left', 'center', 'right'];
export const GESTURE = ['none', 'nose', 'chin'];
// The backdrop's shape; 'full' fills the whole background (no frame, and the shadow shows)
export const FRAME = ['circle', 'rounded', 'square', 'full'];
// Eye styles whose pupils can look around
const GAZE_EYES = ['round', 'wide', 'big', 'up', 'sleepy', 'peek', 'angry', 'bored'];
export const MOUTH = ['boy', 'tongue', 'smile', 'smirk', 'open', 'o', 'frown', 'wobble', 'none'];
export const HAIR = ['none', 'boy', 'tufts', 'swept', 'spiky', 'mop', 'curlytop', 'buzz', 'short', 'bangs', 'sidebob', 'curly', 'long', 'bun', 'underhat'];
export const BODY = ['slim', 'regular', 'broad'];
export const OUTFIT = ['tee', 'hoodie', 'shirt'];
export const DETAIL = ['none', 'pocket', 'stripe'];

/* The default look: the boy (Downloads/Boy avatar.svg), grey skin, black hair. */
export const defaultAvatar = {
  category: 'person',
  style: 'outline',
  bg: '#ffffff',
  frame: 'circle',
  shadow: true,
  skin: '#d9d9d7',
  head: 'boy',
  ears: 'regular',
  tilt: 'straight',
  hair: 'boy',
  hairColor: '#1a1a1a',
  eyes: 'boy',
  gaze: 'center',
  brows: 'none',
  nose: 'boy',
  mouth: 'boy',
  tongue: '#f70410',
  blush: null,
  gesture: 'none',
  tears: null,
  cap: null,
  hat: 'cap',
  glasses: null,
  torso: false,
  body: 'regular',
  outfit: 'tee',
  outfitColor: '#1084fe',
  detail: 'none',
};

/* ---- The editor's tree: broad → detailed -------------------------------
   SETUP is the foundation (category, style). PRIMARY is the default stage.
   Each primary category holds items; a category with one item opens it
   directly. `when` hides an item until the look makes it relevant.
   Item kinds: 'shape' (named variants), 'color' (a color row + grid),
   'toggle' (two choices shown inline). `optional` color items have a "none". */
export const SETUP = [
  { key: 'category', label: 'Category', options: CATEGORIES, names: { person: 'Person' } },
  { key: 'style', label: 'Style', options: STYLES, names: { outline: 'Outline' } },
];

export const ITEMS = {
  skin: { label: 'Skin colour', kind: 'color', presets: SKIN },
  head: { label: 'Head shape', kind: 'shape', options: HEAD },
  // The Figma (classic) head has its ears built in
  ears: { label: 'Ears', kind: 'shape', options: EARS, when: (c) => c.head === 'round' || c.head === 'square' },
  tilt: { label: 'Tilt', kind: 'shape', options: TILT },
  hair: { label: 'Style', kind: 'shape', options: HAIR },
  hairColor: { label: 'Colour', kind: 'color', presets: HAIR_COLOR, when: (c) => c.hair !== 'none' },
  cap: { label: 'Headwear', kind: 'color', presets: CAP, optional: true },
  // Which hat; the colour item above also turns headwear off
  hat: { label: 'Hat', kind: 'shape', options: HAT, when: (c) => !!c.cap },
  mouth: { label: 'Shape', kind: 'shape', options: MOUTH },
  tongue: { label: 'Tongue', kind: 'color', presets: TONGUE, when: (c) => c.mouth === 'tongue' || c.mouth === 'open' },
  brows: { label: 'Brows', kind: 'shape', options: BROWS },
  eyes: { label: 'Shape', kind: 'shape', options: EYES },
  gaze: { label: 'Look', kind: 'shape', options: GAZE, when: (c) => GAZE_EYES.includes(c.eyes) },
  glasses: { label: 'Glasses', kind: 'color', presets: GLASSES, optional: true },
  tears: { label: 'Tears', kind: 'color', presets: TEARS, optional: true },
  nose: { label: 'Nose', kind: 'shape', options: NOSE },
  blush: { label: 'Blush', kind: 'color', presets: BLUSH, optional: true },
  gesture: { label: 'Hands', kind: 'shape', options: GESTURE },
  torso: { label: 'Torso', kind: 'toggle', options: [false, true], names: { false: 'Head only', true: 'With torso' } },
  body: { label: 'Body', kind: 'shape', options: BODY, when: (c) => c.torso },
  outfit: { label: 'Outfit', kind: 'shape', options: OUTFIT, when: (c) => c.torso },
  outfitColor: { label: 'Outfit colour', kind: 'color', presets: OUTFIT_COLOR, when: (c) => c.torso },
  detail: { label: 'Details', kind: 'shape', options: DETAIL, when: (c) => c.torso },
  bg: { label: 'Colour', kind: 'color', presets: BG },
  frame: { label: 'Frame', kind: 'shape', options: FRAME },
  shadow: { label: 'Shadow', kind: 'shape', options: [true, false] },
};

/* The default toolbar shows the categories with `bar` (Face · Hair · Outfit · Frame).
   Features opens from inside Face (and by tapping an eye, mouth…); the background
   colour lives under Frame, next to the frame shape. */
export const PRIMARY = [
  { key: 'face', label: 'Face', bar: true, items: ['skin', 'head', 'ears', 'tilt'] },
  // Features is organ by organ: pick an organ, then its items (tears live under Eyes, and so on)
  {
    key: 'features',
    label: 'Features',
    organs: [
      { key: 'eyes', label: 'Eyes', items: ['eyes', 'gaze', 'brows', 'glasses', 'tears'] },
      { key: 'mouth', label: 'Mouth', items: ['mouth', 'tongue'] },
      { key: 'nose', label: 'Nose', items: ['nose'] },
      { key: 'cheeks', label: 'Cheeks', items: ['blush'] },
      { key: 'hands', label: 'Hands', items: ['gesture'] },
    ],
  },
  { key: 'hair', label: 'Hair', bar: true, items: ['hair', 'hairColor', 'cap', 'hat'] },
  { key: 'outfit', label: 'Outfit', bar: true, items: ['torso', 'body', 'outfit', 'outfitColor', 'detail'] },
  // The avatar always sits in the round background; Frame picks its colour (one item, so it opens straight to it)
  { key: 'frame', label: 'Color', bar: true, items: ['bg'] },
];

export const visibleItems = (group, c) => group.items.filter((k) => !ITEMS[k].when || ITEMS[k].when(c));

/* Every field's choices, for a host building its own UI. */
export const AVATAR_OPTIONS = {
  category: CATEGORIES,
  style: STYLES,
  ...Object.fromEntries(
    Object.entries(ITEMS).map(([k, p]) => [k, p.kind === 'color' ? (p.optional ? [null, ...p.presets] : p.presets) : p.options]),
  ),
};

/* ---- Views ------------------------------------------------------------- */
export const VIEWS = {
  full: '-6 -16 195 195',
  bust: '-40 -16 257 257',
  face: '20 -2 165 165',
  top: '26 -8 158 158',
};
export const viewFor = (c) => (c && c.torso ? VIEWS.bust : VIEWS.full);

/* Crops for one item on its own, centered on where it sits */
export const ITEM_VIEWS = {
  cap: '30 -24 160 160',
  hat: '30 -24 160 160',
  glasses: '35 20 140 140',
  eyes: '58 46 94 94',
  gaze: '58 46 94 94',
  gesture: '22 92 150 150',
  head: '20 -2 165 165',
  ears: '10 70 68 68',
  tilt: '2 -18 206 206',
  brows: '62 25 84 84',
  nose: '87 95 32 32',
  mouth: '83 112 44 44',
  tongue: '83 112 44 44',
  tears: '57 75 100 100',
  hair: '15 -30 180 180',
  torso: '10 140 190 190',
  body: '10 140 190 190',
  outfit: '10 140 190 190',
  outfitColor: '10 140 190 190',
  detail: '10 140 190 190',
  shadow: '-6 -10 189 189',
};

/* ---- Rendering --------------------------------------------------------- */

// A lighter tint of a hex color (for the cap's brim)
function tint(hex, amount = 0.38) {
  const h = (hex || '#000000').replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

let uid = 0;

/* The avatar's layers (no wrapping <svg>), as a string. `id` keeps masks and
   clip paths unique when several avatars share a page. With `parts`, each layer
   is wrapped in <g data-part="…"> so a tap on the preview can tell what was hit. */
export function innerSvg(config, { id = 'ab' + (++uid), parts = false } = {}) {
  const c = { ...defaultAvatar, ...config };
  const L = (part, svg) => (!svg ? '' : parts ? `<g data-part="${part}">${svg}</g>` : svg);
  // The head and everything on it tilt together, about the top of the neck
  const deg = TILT_DEG[c.tilt] || 0;
  const rot = (svg) => (deg && svg ? `<g transform="rotate(${deg} 105 150)">${svg}</g>` : svg);
  let s = '';
  if (c.shadow) s += rot(P.shadow(c));
  if (c.torso) s += L('torso', P.torso(c, id));
  let h = '';
  h += L('ears', P.ears(c));
  if (P.hairBack[c.hair]) h += L('hair', P.hairBack[c.hair](c));
  h += L('skin', P.head(c));
  s += rot(headLayers(c, id, L, h));
  return s;
}

function headLayers(c, id, L, s) {
  if (c.tears) s += L('tears', P.tears(c, id));
  if (c.blush) s += L('blush', P.blush(c));
  s += L('brows', (P.brows[c.brows] || P.brows.none)(c));
  s += L('eyes', (P.eyes[c.eyes] || P.eyes.open)(c));
  if (c.glasses) s += L('glasses', P.glasses(c));
  s += L('nose', (P.nose[c.nose] || P.nose.none)(c));
  s += L('mouth', (P.mouth[c.mouth] || P.mouth.none)(c));
  // Hair sits over the head; a cap, when worn, covers its top
  s += L('hair', (P.hairFront[c.hair] || P.hairFront.none)(c));
  // Hands come up in front of the face and hair
  s += L('hand', (P.hands[c.gesture] || P.hands.none)(c));
  if (c.head === 'boy') s += L('skin', P.boyEars(c));
  if (c.cap) s += L('cap', (P.hats[c.hat] || P.hats.cap)(c, tint(c.cap)));
  return s;
}

/* Where a tap on each part of the preview leads: [category, item] */
export const PART_TARGETS = {
  skin: ['face'], // the face itself opens the Face category
  ears: ['face', 'ears'],
  eyes: ['features', 'eyes', 'eyes'],
  glasses: ['features', 'eyes', 'glasses'],
  tears: ['features', 'eyes', 'tears'],
  brows: ['features', 'eyes', 'brows'],
  mouth: ['features', 'mouth', 'mouth'],
  nose: ['features', 'nose'],
  blush: ['features', 'cheeks'],
  hand: ['features', 'hands'],
  hair: ['hair', 'hair'],
  cap: ['hair', 'cap'],
  torso: ['outfit'],
  background: ['frame'],
};

/* One item on its own, for option tiles: the item, not the avatar wearing it. */
export function itemSvg(part, config, { id = 'item' + (++uid) } = {}) {
  const c = { ...defaultAvatar, ...config };
  switch (part) {
    case 'cap':
    case 'hat': return c.cap ? (P.hats[c.hat] || P.hats.cap)(c, tint(c.cap)) : '';
    case 'glasses': return c.glasses ? P.glasses(c) : '';
    case 'eyes':
    case 'gaze': return (P.eyes[c.eyes] || P.eyes.open)(c);
    case 'brows': return (P.brows[c.brows] || P.brows.none)(c);
    case 'nose': return (P.nose[c.nose] || P.nose.none)(c);
    case 'mouth': return (P.mouth[c.mouth] || P.mouth.none)(c);
    case 'tongue': return P.mouth.tongue(c);
    case 'gesture': return (P.hands[c.gesture] || P.hands.none)({ ...c, skin: c.skin || '#fff' });
    case 'tears': return c.tears ? P.tears(c, id) : '';
    case 'hair':
      if (c.hair === 'none') return '';
      return (P.hairBack[c.hair] ? P.hairBack[c.hair](c) : '') + `<path d="${P.headD(c)}" fill="#fff" stroke="#1A1A1A" stroke-width="4"/>` + P.hairFront[c.hair](c);
    case 'body':
    case 'outfit':
    case 'outfitColor':
    case 'detail':
      return P.torso({ ...c, torso: true }, id);
    case 'shadow': return (c.shadow ? P.shadow(c) : '') + `<path d="${P.headD(c)}" fill="#fff" stroke="#1A1A1A" stroke-width="4"/>`;
    case 'head': { const w = { ...c, skin: '#fff', ears: c.ears === 'none' ? 'none' : c.ears || 'regular' }; return P.ears(w) + P.head(w) + (w.head === 'boy' ? P.boyEars(w) : ''); }
    case 'ears': return c.ears === 'none' || !(c.head === 'round' || c.head === 'square') ? '' : P.ears({ ...c, skin: '#fff' }) + P.head({ ...c, skin: '#fff' });
    case 'tilt': { const w = { ...c, skin: '#fff' }; const d = TILT_DEG[c.tilt] || 0; return `<g transform="rotate(${d} 105 150)">${P.ears(w)}${P.head(w)}${w.head === 'boy' ? P.boyEars(w) : ''}</g>`; }
    default: return '';
  }
}

/* The head silhouette in a color, for skin swatches. */
export function headSwatchSvg(color, shape) {
  // Light fills get a hairline edge so they still read on the white toolbar
  const h = String(color).replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  const edge = lum > 0.86 ? '#d9d9d7' : color;
  return `<path d="${P.headD({ head: shape })}" fill="${color}" stroke="${edge}" stroke-width="2.4"/>`;
}

/* A complete, standalone SVG document string — drop into an <img src>, save,
   or render a saved avatar anywhere without the builder UI.

   It's also the portable template (see document.js): the look travels inside it
   as <metadata><avatar-builder>{document JSON}</avatar-builder></metadata>, and the
   drawing is split into named layers and parts, so any copy of it can be opened
   in the editor again (readAvatar) and edited from where it was.
   `embed: false` leaves the metadata out; `seed` is recorded when it was generated. */
export function avatarToSvg(config, { size = 512, embed = true, seed, title = 'Avatar' } = {}) {
  const c = { ...defaultAvatar, ...config };
  const view = viewFor(c);
  const [x, y, w, h] = view.split(' ').map(Number);
  // The background is always round (older saved looks with another frame render round too)
  const fill = c.bg && c.bg !== 'transparent' ? c.bg : null;
  const bg = !fill ? '' : `<g data-layer="background"><circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w / 2}" fill="${fill}"/></g>`;
  // Ids unique to this look, so several avatars inlined on one page don't share masks
  const id = 'av' + hashString(JSON.stringify(c));
  let meta = '';
  if (embed) {
    const doc = { format: 'avatar-builder', version: 1, config: c, ...(seed ? { seed: String(seed) } : {}) };
    const json = JSON.stringify(doc).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    meta = `<metadata><avatar-builder xmlns="https://avatars.paulelite.com/ns/avatar/1">${json}</avatar-builder></metadata>`;
  }
  const label = String(title).replace(/[<>&"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" width="${size}" height="${size}" role="img" aria-label="${label}" data-avatar-format="avatar-builder/1"><title>${label}</title>${meta}${bg}<g data-layer="avatar">${innerSvg(c, { id, parts: true })}</g></svg>`;
}

/* A short, stable hash of a string (cyrb53), as base-36. Not for secrets. */
export function hashString(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/* A base64 data URI, handy for <img src={avatarToDataUri(config)} />. */
export function avatarToDataUri(config, opts) {
  const svg = avatarToSvg(config, opts);
  const encoded = typeof window === 'undefined'
    ? Buffer.from(svg).toString('base64')
    : window.btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}

/* Pick a random look (used by the shuffle button); keeps category and style. */
export function randomAvatar(base = defaultAvatar) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const c = { ...base };
  for (const [k, p] of Object.entries(ITEMS)) {
    if (k === 'bg' || k === 'shadow' || k === 'frame') continue; // the setting, not the look
    if (k === 'torso') c.torso = Math.random() < 0.5;
    else if (p.kind === 'shape') c[k] = pick(p.options);
    else c[k] = p.optional && Math.random() < 0.45 ? null : pick(p.presets);
  }
  return c;
}
