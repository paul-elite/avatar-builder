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
export const SKIN = ['#d9d9d7', '#ffffff', '#ececea', '#444755', '#f3d2b9', '#d9a47e', '#a8693f', '#6b3f22'];
export const HAIR_COLOR = ['#1a1a1a', '#5a3620', '#a8693f', '#e8b04b', '#f2e3c6', '#f70492', '#1084fe', '#8b5cf6'];
export const CAP = ['#f70492', '#50c810', '#1084fe', '#ff7a00', '#8b5cf6', '#1a1a1a'];
export const GLASSES = ['#000000', '#f70492', '#1084fe', '#c8a24a'];
export const BLUSH = ['#fc5cb9', '#ff8a65', '#f70410'];
export const TEARS = ['#b2ebff', '#8fd3ff', '#c7f0d8'];
export const TONGUE = ['#f70410', '#ff6fa5', '#ff8a65'];
export const OUTFIT_COLOR = ['#1084fe', '#f70492', '#50c810', '#ff7a00', '#ffe401', '#8b5cf6', '#ffffff', '#1a1a1a'];

export const CATEGORIES = ['person'];
export const STYLES = ['outline'];
export const EYES = ['open', 'round', 'wide', 'big', 'side', 'up', 'sleepy', 'peek', 'angry', 'skeptical', 'bored', 'happy', 'sad', 'closed', 'wink', 'flat', 'squeeze', 'dead', 'dots'];
export const HEAD = ['classic', 'round', 'square'];
export const EARS = ['none', 'small', 'regular', 'big'];
export const TILT = ['straight', 'left', 'right'];
const TILT_DEG = { straight: 0, left: -10, right: 10 };
export const BROWS = ['none', 'raised', 'flat', 'worried'];
export const NOSE = ['hook', 'dot', 'none'];
export const MOUTH = ['tongue', 'smile', 'open', 'frown', 'none'];
export const HAIR = ['none', 'short', 'bangs', 'sidebob', 'curly', 'long', 'bun', 'underhat'];
export const BODY = ['slim', 'regular', 'broad'];
export const OUTFIT = ['tee', 'hoodie', 'shirt'];
export const DETAIL = ['none', 'pocket', 'stripe'];

/* The avatar in the Figma (Frame 4): pink cap, round glasses, tongue out. */
export const defaultAvatar = {
  category: 'person',
  style: 'outline',
  bg: '#ffffff',
  shadow: true,
  skin: '#ffffff',
  head: 'classic',
  ears: 'regular',
  tilt: 'straight',
  hair: 'none',
  hairColor: '#1a1a1a',
  eyes: 'open',
  brows: 'none',
  nose: 'hook',
  mouth: 'tongue',
  tongue: '#f70410',
  blush: null,
  tears: null,
  cap: '#f70492',
  glasses: '#000000',
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
  head: { label: 'Shape', kind: 'shape', options: HEAD },
  // The Figma (classic) head has its ears built in
  ears: { label: 'Ears', kind: 'shape', options: EARS, when: (c) => c.head && c.head !== 'classic' },
  tilt: { label: 'Tilt', kind: 'shape', options: TILT },
  hair: { label: 'Style', kind: 'shape', options: HAIR },
  hairColor: { label: 'Colour', kind: 'color', presets: HAIR_COLOR, when: (c) => c.hair !== 'none' },
  cap: { label: 'Headwear', kind: 'color', presets: CAP, optional: true },
  mouth: { label: 'Mouth', kind: 'shape', options: MOUTH },
  tongue: { label: 'Tongue', kind: 'color', presets: TONGUE, when: (c) => c.mouth === 'tongue' || c.mouth === 'open' },
  brows: { label: 'Brows', kind: 'shape', options: BROWS },
  eyes: { label: 'Shape', kind: 'shape', options: EYES },
  glasses: { label: 'Glasses', kind: 'color', presets: GLASSES, optional: true },
  tears: { label: 'Tears', kind: 'color', presets: TEARS, optional: true },
  nose: { label: 'Nose', kind: 'shape', options: NOSE },
  blush: { label: 'Blush', kind: 'color', presets: BLUSH, optional: true },
  torso: { label: 'Torso', kind: 'toggle', options: [false, true], names: { false: 'Head only', true: 'With torso' } },
  body: { label: 'Body', kind: 'shape', options: BODY, when: (c) => c.torso },
  outfit: { label: 'Outfit', kind: 'shape', options: OUTFIT, when: (c) => c.torso },
  outfitColor: { label: 'Outfit colour', kind: 'color', presets: OUTFIT_COLOR, when: (c) => c.torso },
  detail: { label: 'Details', kind: 'shape', options: DETAIL, when: (c) => c.torso },
  bg: { label: 'Colour', kind: 'color', presets: BG },
  shadow: { label: 'Shadow', kind: 'shape', options: [true, false] },
};

export const PRIMARY = [
  { key: 'skin', label: 'Skin', items: ['skin'] },
  { key: 'head', label: 'Head', items: ['head', 'ears', 'tilt'] },
  { key: 'hair', label: 'Hair', items: ['hair', 'hairColor', 'cap'] },
  { key: 'face', label: 'Face', items: ['mouth', 'tongue', 'brows'] },
  { key: 'eyes', label: 'Eyes', items: ['eyes', 'glasses', 'tears'] },
  { key: 'features', label: 'Features', items: ['nose', 'blush'] },
  { key: 'torso', label: 'Torso', items: ['torso', 'body', 'outfit', 'outfitColor', 'detail'] },
  // Reached by tapping the background, not shown in the category bar
  { key: 'background', label: 'Background', items: ['bg'], tapOnly: true },
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
  cap: '33 -27 144 144',
  glasses: '35 20 140 140',
  eyes: '58 46 94 94',
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
  if (c.cap) s += L('cap', P.cap(c, tint(c.cap)));
  return s;
}

/* Where a tap on each part of the preview leads: [category, item] */
export const PART_TARGETS = {
  torso: ['torso'],
  hair: ['hair', 'hair'],
  // The face itself opens every category (skin colour is already on the default bar)
  skin: [],
  tears: ['eyes', 'tears'],
  blush: ['features', 'blush'],
  brows: ['face', 'brows'],
  eyes: ['eyes', 'eyes'],
  glasses: ['eyes', 'glasses'],
  nose: ['features', 'nose'],
  mouth: ['face', 'mouth'],
  cap: ['hair', 'cap'],
  background: ['background'],
  ears: ['head', 'ears'],
};

/* One item on its own, for option tiles: the item, not the avatar wearing it. */
export function itemSvg(part, config, { id = 'item' + (++uid) } = {}) {
  const c = { ...defaultAvatar, ...config };
  switch (part) {
    case 'cap': return c.cap ? P.cap(c, tint(c.cap)) : '';
    case 'glasses': return c.glasses ? P.glasses(c) : '';
    case 'eyes': return (P.eyes[c.eyes] || P.eyes.open)(c);
    case 'brows': return (P.brows[c.brows] || P.brows.none)(c);
    case 'nose': return (P.nose[c.nose] || P.nose.none)(c);
    case 'mouth': return (P.mouth[c.mouth] || P.mouth.none)(c);
    case 'tongue': return P.mouth.tongue(c);
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
    case 'head': { const w = { ...c, skin: '#fff', ears: c.ears === 'none' ? 'none' : c.ears || 'regular' }; return P.ears(w) + P.head(w); }
    case 'ears': return c.ears === 'none' || !c.head || c.head === 'classic' ? '' : P.ears({ ...c, skin: '#fff' }) + P.head({ ...c, skin: '#fff' });
    case 'tilt': { const w = { ...c, skin: '#fff' }; const d = TILT_DEG[c.tilt] || 0; return `<g transform="rotate(${d} 105 150)">${P.ears(w)}${P.head(w)}</g>`; }
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
   or render a saved avatar anywhere without the builder UI. The background
   fills the square unless bg is 'transparent'. */
export function avatarToSvg(config, { size = 512 } = {}) {
  const c = { ...defaultAvatar, ...config };
  const view = viewFor(c);
  const [x, y, w, h] = view.split(' ').map(Number);
  const bg = c.bg && c.bg !== 'transparent' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" width="${size}" height="${size}" role="img" aria-label="Avatar">${bg}${innerSvg(c, { id: 'export' })}</svg>`;
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
    if (k === 'bg' || k === 'shadow') continue; // not editable for now
    if (k === 'torso') c.torso = Math.random() < 0.5;
    else if (p.kind === 'shape') c[k] = pick(p.options);
    else c[k] = p.optional && Math.random() < 0.45 ? null : pick(p.presets);
  }
  return c;
}
