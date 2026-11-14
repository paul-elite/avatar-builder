/* =========================================================================
   Headless avatar renderer — no React, no DOM. A single source of truth that
   both the <AvatarBuilder> UI and avatarToSvg() draw from, so the preview and
   any saved/exported avatar always match.
   ========================================================================= */

export const SKIN = ['#f2d6c2', '#e8b98f', '#c88a5e', '#8d5524', '#5a3620'];
export const HAIR_COLOR = ['#2b2b2b', '#6b4226', '#b5651d', '#d9a441', '#9b9b9b', '#c0392b'];
export const BG = ['#e3f0ff', '#ffe8ec', '#eafbe7', '#fff4d6', '#f0e9ff', '#f3f3f3'];
export const HAIR = ['none', 'short', 'bun', 'long'];
export const EYES = ['dots', 'happy', 'glasses'];
export const MOUTH = ['smile', 'neutral', 'open'];

/* The option sets, keyed by config field — lets a host build its own UI. */
export const AVATAR_OPTIONS = { bg: BG, skin: SKIN, hairColor: HAIR_COLOR, hair: HAIR, eyes: EYES, mouth: MOUTH };

export const defaultAvatar = {
  bg: BG[0],
  skin: SKIN[1],
  hairColor: HAIR_COLOR[0],
  hair: 'short',
  eyes: 'dots',
  mouth: 'smile',
};

/* The inner SVG shapes (no wrapping <svg>), as a string. */
export function innerSvg(config) {
  const c = { ...defaultAvatar, ...config };
  let s = `<circle cx="100" cy="100" r="100" fill="${c.bg}"/>`;

  if (c.hair === 'long') s += `<path d="M44 90a56 56 0 0 1 112 0v70H44Z" fill="${c.hairColor}"/>`;

  s += `<rect x="88" y="128" width="24" height="30" fill="${c.skin}"/>`;
  s += `<circle cx="100" cy="96" r="50" fill="${c.skin}"/>`;

  if (c.hair === 'short' || c.hair === 'long') {
    s += `<path d="M50 92a50 50 0 0 1 100 0c0-14-20-30-50-30S50 78 50 92Z" fill="${c.hairColor}"/>`;
  } else if (c.hair === 'bun') {
    s += `<circle cx="100" cy="46" r="13" fill="${c.hairColor}"/>`;
    s += `<path d="M52 90a48 48 0 0 1 96 0c0-16-22-28-48-28S52 74 52 90Z" fill="${c.hairColor}"/>`;
  }

  if (c.eyes === 'dots') {
    s += `<circle cx="82" cy="95" r="5" fill="#2b2b2b"/><circle cx="118" cy="95" r="5" fill="#2b2b2b"/>`;
  } else if (c.eyes === 'happy') {
    s += `<path d="M75 97q7-9 14 0" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>`;
    s += `<path d="M111 97q7-9 14 0" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>`;
  } else if (c.eyes === 'glasses') {
    s += `<circle cx="82" cy="96" r="12" fill="none" stroke="#2b2b2b" stroke-width="3"/>`;
    s += `<circle cx="118" cy="96" r="12" fill="none" stroke="#2b2b2b" stroke-width="3"/>`;
    s += `<line x1="94" y1="96" x2="106" y2="96" stroke="#2b2b2b" stroke-width="3"/>`;
    s += `<circle cx="82" cy="96" r="4" fill="#2b2b2b"/><circle cx="118" cy="96" r="4" fill="#2b2b2b"/>`;
  }

  if (c.mouth === 'smile') {
    s += `<path d="M84 118q16 16 32 0" fill="none" stroke="#9a4b3b" stroke-width="3" stroke-linecap="round"/>`;
  } else if (c.mouth === 'neutral') {
    s += `<line x1="86" y1="120" x2="114" y2="120" stroke="#9a4b3b" stroke-width="3" stroke-linecap="round"/>`;
  } else if (c.mouth === 'open') {
    s += `<ellipse cx="100" cy="120" rx="10" ry="7" fill="#9a4b3b"/>`;
  }

  return s;
}

/* A complete, standalone SVG document string — drop into an <img src>, save,
   or render a saved avatar anywhere without the builder UI. */
export function avatarToSvg(config, { size = 220 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Avatar">${innerSvg(config)}</svg>`;
}

/* A base64 data URI, handy for <img src={avatarToDataUri(config)} />. */
export function avatarToDataUri(config, opts) {
  const svg = avatarToSvg(config, opts);
  const encoded = typeof window === 'undefined'
    ? Buffer.from(svg).toString('base64')
    : window.btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}
