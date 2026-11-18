import * as P from './parts.js';

/* =========================================================================
   Headless avatar model + renderer — no React, no DOM. The <AvatarBuilder>
   UI and avatarToSvg() both draw from here, so the preview and any saved or
   exported avatar always match.

   The look comes from the Avatars Figma file: one outlined head with a soft
   offset shadow, and parts layered on it in a shared 176.8 × 160.1 space.
   ========================================================================= */

/* ---- Palettes ---------------------------------------------------------- */
export const BG = ['#f2f2f2', '#ffffff', '#ffe4f1', '#e3f1ff', '#e9f9d9', '#fff3cf', '#ece6ff', '#1a1a1a'];
// The first four are the Figma toolbar's head fills
export const SKIN = ['#d9d9d7', '#ffffff', '#ececea', '#444755', '#f3d2b9', '#d9a47e', '#a8693f', '#6b3f22'];
export const CAP = ['#f70492', '#50c810', '#1084fe', '#ff7a00', '#8b5cf6', '#1a1a1a'];
export const GLASSES = ['#000000', '#f70492', '#1084fe', '#c8a24a'];
export const BLUSH = ['#fc5cb9', '#ff8a65', '#f70410'];
export const TEARS = ['#b2ebff', '#8fd3ff', '#c7f0d8'];
export const TONGUE = ['#f70410', '#ff6fa5'];

export const EYES = ['open', 'closed', 'wink', 'dots'];
export const BROWS = ['none', 'raised', 'flat', 'worried'];
export const NOSE = ['hook', 'dot', 'none'];
export const MOUTH = ['tongue', 'smile', 'open', 'frown', 'none'];

/* The avatar in the Figma (Frame 4): pink cap, round glasses, tongue out. */
export const defaultAvatar = {
  bg: '#f2f2f2',
  shadow: true,
  skin: '#ffffff',
  eyes: 'open',
  brows: 'none',
  nose: 'hook',
  mouth: 'tongue',
  tongue: '#f70410',
  blush: null,
  tears: null,
  cap: '#f70492',
  glasses: '#000000',
};

/* ---- The builder's structure: groups → parts → options ----------------
   kind 'color': presets are colors (null = off when `optional`), plus a
   custom color. kind 'shape': named variants. `view` is the square crop of
   the avatar a tile shows for that part. */
export const GROUPS = [
  { key: 'background', label: 'Background', parts: ['bg', 'shadow'], view: 'full' },
  { key: 'face', label: 'Face', parts: ['skin', 'eyes', 'brows', 'nose', 'mouth', 'blush', 'tears'], view: 'face' },
  { key: 'outfit', label: 'Outfit', parts: ['cap', 'glasses'], view: 'top' },
];

export const PARTS = {
  bg: { label: 'Color', kind: 'color', presets: BG, view: 'full' },
  shadow: { label: 'Shadow', kind: 'shape', options: [true, false], view: 'full' },
  skin: { label: 'Skin', kind: 'color', presets: SKIN, view: 'face', swatch: 'head' },
  eyes: { label: 'Eyes', kind: 'shape', options: EYES, view: 'eyes' },
  brows: { label: 'Brows', kind: 'shape', options: BROWS, view: 'brows' },
  nose: { label: 'Nose', kind: 'shape', options: NOSE, view: 'nose' },
  mouth: { label: 'Mouth', kind: 'shape', options: MOUTH, view: 'mouth' },
  blush: { label: 'Blush', kind: 'color', presets: BLUSH, optional: true, view: 'face' },
  tears: { label: 'Tears', kind: 'color', presets: TEARS, optional: true, view: 'face' },
  cap: { label: 'Cap', kind: 'color', presets: CAP, optional: true, view: 'top' },
  glasses: { label: 'Glasses', kind: 'color', presets: GLASSES, optional: true, view: 'eyes' },
};

/* Every field's choices, for a host building its own UI. */
export const AVATAR_OPTIONS = Object.fromEntries(
  Object.entries(PARTS).map(([k, p]) => [k, p.kind === 'color' ? (p.optional ? [null, ...p.presets] : p.presets) : p.options]),
);

/* Square crops of the avatar space, for the full avatar and for tiles. */
export const VIEWS = {
  full: '-6 -10 189 189',
  face: '20 -2 165 165',
  top: '26 -8 158 158',
  eyes: '52 46 108 108',
  brows: '56 30 96 96',
  nose: '79 89 52 52',
  mouth: '80 110 50 50',
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

/* The avatar's layers (no wrapping <svg>), as a string. `id` keeps the tears
   mask unique when several avatars share a page. */
export function innerSvg(config, { id = 'ab' + (++uid) } = {}) {
  const c = { ...defaultAvatar, ...config };
  let s = '';
  if (c.shadow) s += P.shadow();
  s += P.head(c);
  if (c.tears) s += P.tears(c, id);
  if (c.blush) s += P.blush(c);
  s += (P.brows[c.brows] || P.brows.none)(c);
  s += (P.eyes[c.eyes] || P.eyes.open)(c);
  if (c.glasses) s += P.glasses(c);
  s += (P.nose[c.nose] || P.nose.none)(c);
  s += (P.mouth[c.mouth] || P.mouth.none)(c);
  if (c.cap) s += P.cap(c, tint(c.cap));
  return s;
}

/* The head silhouette in a color, for skin swatches. */
export function headSwatchSvg(color) {
  // Light fills get a hairline edge so they still read on the white toolbar
  const h = String(color).replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  const edge = lum > 0.86 ? '#d9d9d7' : color;
  return `<path d="${P.headPath}" fill="${color}" stroke="${edge}" stroke-width="2.4"/>`;
}

/* A complete, standalone SVG document string — drop into an <img src>, save,
   or render a saved avatar anywhere without the builder UI. The background
   fills the square unless bg is 'transparent'. */
export function avatarToSvg(config, { size = 512 } = {}) {
  const c = { ...defaultAvatar, ...config };
  const [x, y, w, h] = VIEWS.full.split(' ').map(Number);
  const bg = c.bg && c.bg !== 'transparent' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWS.full}" width="${size}" height="${size}" role="img" aria-label="Avatar">${bg}${innerSvg(c, { id: 'export' })}</svg>`;
}

/* A base64 data URI, handy for <img src={avatarToDataUri(config)} />. */
export function avatarToDataUri(config, opts) {
  const svg = avatarToSvg(config, opts);
  const encoded = typeof window === 'undefined'
    ? Buffer.from(svg).toString('base64')
    : window.btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}

/* Pick a random look (used by the shuffle button). */
export function randomAvatar() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const c = {};
  for (const [k, p] of Object.entries(PARTS)) {
    if (p.kind === 'shape') c[k] = pick(p.options);
    else c[k] = p.optional && Math.random() < 0.45 ? null : pick(p.presets);
  }
  c.tongue = pick(TONGUE);
  return { ...defaultAvatar, ...c };
}
