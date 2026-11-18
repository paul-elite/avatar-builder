/* =========================================================================
   The avatar's parts, as SVG fragments in one shared coordinate space
   (the 176.8 × 160.1 avatar frame in the Avatars Figma file). Paths marked
   "Figma" are exported from that file as-is; the rest are drawn to match its
   style (black, 4–6px round strokes). Colors that the builder can change are
   functions of the config.
   ========================================================================= */

const HEAD_D =
  'M38.7802 49.948C37.879 59.3212 37.7223 67.0156 37.8984 73.0222C38.1048 80.0604 38.7681 84.7811 39.2259 87.1698L37.2803 87.948C29.7803 92.448 34.2803 102.948 37.7803 110.948C39.4966 114.871 41.3332 115.788 43.1721 116.706V116.706C45.0831 117.661 46.9967 118.616 48.7803 122.948C51.5803 129.748 57.947 138.448 60.7803 141.948C70.9931 152.161 83.5431 157.58 96.1273 159.366C113.977 161.441 134.137 156.81 149.208 141.739C152.042 138.239 158.408 129.539 161.208 122.739C162.992 118.408 164.905 117.452 166.816 116.498C168.655 115.58 170.492 114.662 172.208 110.739C175.708 102.739 180.208 92.2394 172.708 87.7394L170.763 86.9612C171.209 84.631 171.851 80.0816 172.074 73.3266C172.275 67.2472 172.135 59.3816 171.208 49.7394C168.708 23.7394 144.208 10.7394 124.708 5.73937C110.2 2.01943 94.8566 3.777 87.6851 5.38189C86.8819 5.55459 86.0799 5.74294 85.2802 5.94799C65.7802 10.948 41.2802 23.948 38.7802 49.948Z';

/* The head silhouette alone, for skin swatches and masks. */
export const headPath = HEAD_D;

/* ---- Head shapes ----
   classic is the Figma head (ears built in). The drawn shapes have no ears of their own:
   ears are a separate part behind them. All keep the classic's width at the cap line
   (x 38–172 around y 73) so the cap, hair and glasses still sit right. */
/* ---- The boy (Downloads/Boy avatar.svg, scaled ×1.96 so its eyes sit on the builder's eye line) ----
   Face with its own ears, hair, dot eyes, curl nose and a lopsided smile. Outlines were 2px, now ~4px. */
const BOY = {
  FACE: 'M84.92 141.96C71.20 136.08 62.38 128.24 60.42 117.46C60.23 116.41 60.05 115.37 59.88 114.34C59.78 113.70 59.68 113.07 59.58 112.44C59.02 108.76 58.58 105.24 58.18 102.09L58.18 102.03C57.67 98.00 57.24 94.58 56.73 92.22C57.14 87.68 58.18 82.04 60.42 79.24C61.77 77.55 62.66 74.10 63.64 70.27C65.51 63.02 67.73 54.40 74.14 53.76C77.49 53.43 81.19 50.91 85.03 48.30C92.42 43.27 100.37 37.87 107.46 46.90C107.73 47.25 107.99 47.55 108.24 47.82L108.53 48.13C109.17 48.83 109.76 49.48 110.40 50.65C112.41 58.54 115.27 59.03 121.18 55.72C122.16 55.07 124.51 54.74 126.08 58.66C128.04 63.56 130.98 65.52 139.80 60.62C140.78 59.97 142.74 59.25 142.74 61.60C142.74 61.84 142.73 62.08 142.73 62.32L142.72 62.59C142.62 65.35 142.51 68.46 148.62 68.46C148.95 68.79 149.27 68.79 149.60 68.79C150.25 68.79 150.91 68.79 151.56 71.40C152.12 73.63 153.31 74.27 154.23 74.77C154.93 75.16 155.48 75.45 155.48 76.30C155.48 76.48 155.46 76.77 155.43 77.14C155.41 77.50 155.37 77.94 155.32 78.45C154.92 83.01 154.06 92.88 156.46 96.88L156.85 97.66C156.62 101.17 156.47 104.31 156.46 105.56L156.46 105.70C156.46 108.05 154.50 113.21 153.52 115.50C148.03 133.53 133.59 141.31 127.06 142.94C116.28 146.86 91.28 144.69 84.92 141.96Z',
  NOSE: 'M101.48 112.58C103.15 113.41 105.52 113.68 108.57 113.47C109.65 113.40 110.47 112.47 110.40 111.39C110.32 110.31 109.39 109.49 108.31 109.56C105.48 109.75 103.97 109.44 103.24 109.07C102.91 108.91 102.80 108.76 102.76 108.70C102.72 108.63 102.68 108.52 102.68 108.30C102.69 107.78 102.97 106.96 103.62 105.92C104.25 104.92 105.08 103.93 105.90 103.10L107.87 101.14C108.63 100.38 108.63 99.14 107.87 98.37C107.10 97.61 105.86 97.61 105.09 98.37L104.11 99.35L103.13 100.33C102.16 101.31 101.12 102.53 100.30 103.84C99.52 105.09 98.79 106.64 98.76 108.22C98.75 109.05 98.92 109.92 99.41 110.72C99.89 111.53 100.61 112.14 101.48 112.58Z',
  EAR_SEAMS: 'M52.58 86.10C52.55 86.11 52.51 86.11 52.48 86.12M59.58 112.44C59.93 112.52 60.21 112.56 60.42 112.56',
  EYE_L: 'M84.92 91.00C84.92 94.79 82.29 97.86 79.04 97.86C75.79 97.86 73.16 94.79 73.16 91.00C73.16 87.21 75.79 84.14 79.04 84.14C82.29 84.14 84.92 87.21 84.92 91.00Z',
  EYE_R: 'M137.84 91.00C137.84 94.79 135.21 97.86 131.96 97.86C128.71 97.86 126.08 94.79 126.08 91.00C126.08 87.21 128.71 84.14 131.96 84.14C135.21 84.14 137.84 87.21 137.84 91.00Z',
  MOUTH: 'M116.43 119.47C116.94 117.93 118.61 117.10 120.15 117.61C121.69 118.12 122.52 119.79 122.01 121.33C121.11 124.02 119.68 126.10 117.81 127.64C115.95 129.17 113.81 130.04 111.64 130.56C107.44 131.54 102.55 131.26 98.58 131.18C96.95 131.15 95.67 129.80 95.70 128.18C95.73 126.55 97.08 125.27 98.70 125.30C103.10 125.39 107.02 125.60 110.29 124.83C111.85 124.46 113.10 123.90 114.07 123.10C115.02 122.32 115.86 121.19 116.43 119.47Z',
  HAIR: 'M60.42 79.24C58.18 82.04 57.14 87.68 56.73 92.22C56.38 90.62 55.99 89.51 55.52 89.04C55.36 88.88 55.10 88.64 54.77 88.33C54.76 88.31 54.74 88.30 54.73 88.28C54.72 88.27 54.71 88.26 54.70 88.25C54.14 87.72 53.37 87.00 52.48 86.12C47.54 81.23 38.63 71.42 37.88 61.60C36.90 48.86 37.88 17.50 57.48 14.56C58.03 14.56 59.20 12.17 60.02 10.48C60.16 10.18 60.30 9.90 60.42 9.66C61.40 7.70 114.32 -45.22 167.24 23.38C172.79 28.93 180.96 46.90 169.20 74.34C168.63 76.29 168.11 77.37 167.27 78.29C166.98 78.62 166.65 78.92 166.26 79.24C165.75 79.49 165.26 79.74 164.78 79.97C161.57 81.56 159.10 82.77 158.42 84.14C157.82 85.33 157.23 91.98 156.85 97.66L156.46 96.88C154.06 92.88 154.92 83.01 155.32 78.45C155.41 77.42 155.48 76.66 155.48 76.30C155.48 75.45 154.93 75.16 154.23 74.77C153.31 74.27 152.12 73.63 151.56 71.40C150.91 68.79 150.25 68.79 149.60 68.79C149.27 68.79 148.95 68.79 148.62 68.46C142.51 68.46 142.62 65.35 142.72 62.59C142.72 62.50 142.72 62.41 142.73 62.32C142.73 62.08 142.74 61.84 142.74 61.60C142.74 59.25 140.78 59.97 139.80 60.62C130.98 65.52 128.04 63.56 126.08 58.66C124.51 54.74 122.16 55.07 121.18 55.72C115.27 59.03 112.41 58.54 110.40 50.65C109.76 49.48 109.17 48.83 108.53 48.13C108.43 48.03 108.34 47.93 108.24 47.82C107.99 47.55 107.73 47.25 107.46 46.90C100.37 37.87 92.42 43.27 85.03 48.30C81.19 50.91 77.49 53.43 74.14 53.76C67.73 54.40 65.51 63.02 63.64 70.27C62.66 74.10 61.77 77.55 60.42 79.24Z',
  EAR_L: 'M55.52 89.04C55.99 89.51 56.38 90.62 56.73 92.22C57.24 94.59 57.67 98.03 58.18 102.09C58.58 105.24 59.02 108.76 59.58 112.44C56.67 111.75 49.43 108.43 47.68 106.68C47.59 106.59 47.48 106.48 47.34 106.35C45.88 104.99 41.80 101.18 41.80 94.92C41.80 89.48 48.85 86.80 52.48 86.12C53.37 87.00 54.14 87.72 54.70 88.25L54.73 88.28L54.77 88.33L54.83 88.38C55.13 88.66 55.37 88.89 55.52 89.04Z',
  EAR_R: 'M156.46 105.56C156.47 104.31 156.62 101.17 156.85 97.66C157.23 91.98 157.82 85.33 158.42 84.14C159.10 82.77 161.57 81.56 164.78 79.97C165.26 79.74 165.75 79.49 166.26 79.24C166.65 78.92 166.98 78.62 167.27 78.29C170.54 81.90 174.87 89.65 170.18 95.90C166.64 100.61 164.17 101.79 160.63 103.46C159.40 104.04 158.04 104.69 156.46 105.56Z',
};

export const HEADS = {
  classic: HEAD_D,
  boy: BOY.FACE, // ears built in, like classic
  round: 'M38 84C38 40 66 6 105 6C144 6 172 40 172 84C172 128 144 160 105 160C66 160 38 128 38 84Z',
  square: 'M38 58C38 24 66 6 105 6C144 6 172 24 172 58V116C172 144 148 159 105 159C62 159 38 144 38 116Z',
};
export const headD = (c) => HEADS[(c && c.head) || 'classic'] || HEAD_D;
// Where each drawn shape's side sits at ear height (y 104)
const EAR_EDGE = { round: [39, 171], square: [38, 172] };

// The soft offset shadow: Figma's for the classic head, a shrunk offset copy for the others
export const shadow = (c) =>
  !c || !c.head || c.head === 'classic'
    ? FIGMA_SHADOW()
    : `<path d="${headD(c)}" transform="translate(-13 6) scale(0.88)" fill="#000" fill-opacity="0.1"/>`;

/* ---- Ears (drawn; behind the head, so only the outer half shows) ---- */
const EAR_SIZE = { small: [9, 11], regular: [12, 15], big: [16, 20] };
export function ears(c) {
  const size = EAR_SIZE[c.ears];
  const edge = EAR_EDGE[c.head];
  if (!size || !edge) return '';
  const [rx, ry] = size;
  const cy = 104;
  const one = (x, dir) => {
    const cx = x + dir * rx * 0.1; // centred just inside the head, so about 90% of the ear shows (dir 1 = left ear)
    const inner = x - dir * 1;
    const out = x - dir * rx * 0.62;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.skin}" stroke="#1A1A1A" stroke-width="4"/>` +
      `<path d="M${inner} ${cy - ry * 0.5}C${out} ${cy - ry * 0.45} ${out} ${cy + ry * 0.4} ${inner} ${cy + ry * 0.5}" fill="none" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>`;
  };
  return one(edge[0], 1) + one(edge[1], -1);
}

// Figma: Vector 3 (the soft offset shadow)
const FIGMA_SHADOW = () =>
  `<path fill-rule="evenodd" clip-rule="evenodd" d="M122.584 123.505C112.832 139.166 96.8838 146.803 81.6087 148.27C70.7792 149.027 59.2992 146.664 48.8722 139.765C45.8548 137.28 38.9184 130.979 35.3119 125.659C33.0145 122.269 31.24 121.798 29.4677 121.327C27.7624 120.875 26.0592 120.422 23.8943 117.371C19.4796 111.149 13.7636 102.965 19.1776 97.7433L20.6547 96.7223C19.1195 93.081 15.4977 82.6998 13.3247 64.8919C10.5492 42.1467 28.5526 26.5457 43.8814 18.7127C44.5099 18.3915 45.1436 18.0842 45.7812 17.79C51.4624 15.1099 63.931 10.8126 76.7263 11.3634C93.9246 12.1037 116.788 18.7934 123.734 40.6293C129.172 57.7253 130.201 68.6719 130.321 72.6218L132.089 72.9351C139.186 75.4291 137.395 85.2495 135.972 92.7447C135.274 96.4202 133.913 97.5405 132.551 98.6622C131.136 99.8278 129.719 100.995 129.041 105.033C127.977 111.372 124.293 119.989 122.584 123.505Z" fill="#000" fill-opacity="0.1"/>`;

// Figma: Vector 2 (head: skin fill + 4px outline)
export const head = (c) =>
  `<path fill-rule="evenodd" clip-rule="evenodd" d="${headD(c)}" fill="${c.skin}"/>` +
  (c.head === 'boy' ? `<path d="${BOY.EAR_SEAMS}" stroke="#000" stroke-width="2" fill="none"/>` : '') +
  `<path d="${headD(c)}" stroke="#1A1A1A" stroke-width="4" fill="none" stroke-linejoin="round"/>`;

// The boy's ears sit over his hair at the sides (as drawn), so they're layered after it
export const boyEars = (c) =>
  [BOY.EAR_L, BOY.EAR_R].map((d) => `<path fill-rule="evenodd" clip-rule="evenodd" d="${d}" fill="${c.skin}" stroke="#000" stroke-width="3.9" stroke-linejoin="round"/>`).join('');

// Figma: Mask group (tears, clipped to the head)
export const tears = (c, id) =>
  `<mask id="${id}-tears" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="33" y="3" width="144" height="157"><path d="${headD(c)}" fill="#fff"/></mask>` +
  `<g mask="url(#${id}-tears)">` +
  `<path d="M65.5 98.9996V89.9996C72.8333 88.333 87.5 85.9996 87.5 89.9996C87.5 94.9996 89 93.9996 89 109C89 119 92 116 92 120.5C92 125 93.5 128.5 93.5 135.5C93.5 142.5 94.5 146.5 94.5 148C94.5 149.2 93.8333 159.833 93.5 165L62 160.5C62.6667 158.166 64.3 152.6 65.5 149C67 144.5 65.5 147 65.5 142V129.5V124.5C65.5 121 68 118.5 68 116V107.5C68 101.5 65.5 103 65.5 98.9996Z" fill="${c.tears}"/>` +
  `<path d="M123.5 97.2086V88.2086C130.833 86.5419 145.5 84.2086 145.5 88.2086C145.5 93.2086 147 92.2086 147 107.209C147 117.209 150 114.209 150 118.709C150 123.209 151.5 126.709 151.5 133.709C151.5 140.709 152.5 144.709 152.5 146.209C152.5 147.409 151.833 158.042 151.5 163.209L120 158.709C120.667 156.375 122.3 150.809 123.5 147.209C125 142.709 123.5 145.209 123.5 140.209V127.709V122.709C123.5 119.209 126 116.709 126 114.209V105.709C126 99.7086 123.5 101.209 123.5 97.2086Z" fill="${c.tears}"/>` +
  `</g>`;

/* ---- Eyes ---- */
// Figma: eyes (open, a little sleepy)
const EYE_L = 'M76.5829 92H73C71.067 92 69.5 90.433 69.5 88.5C69.5 86.567 71.067 85 73 85H80C80.3763 85 80.7388 85.0594 81.0786 85.1694C81.5343 85.0587 82.0103 85 82.5 85C85.8137 85 88.5 87.6863 88.5 91C88.5 94.3137 85.8137 97 82.5 97C79.527 97 77.059 94.8377 76.5829 92Z';
const EYE_R = 'M129.583 92H126C124.067 92 122.5 90.433 122.5 88.5C122.5 86.567 124.067 85 126 85H133C133.376 85 133.739 85.0594 134.079 85.1694C134.534 85.0587 135.01 85 135.5 85C138.814 85 141.5 87.6863 141.5 91C141.5 94.3137 138.814 97 135.5 97C132.527 97 130.059 94.8377 129.583 92Z';
// Figma: Vector 12 / 13 (closed)
const SHUT_L = '<path d="M66 87.0002C68.3333 88.8336 75.8 91.4002 87 87.0002" stroke="#000" stroke-width="6" stroke-linecap="round" fill="none"/>';
const SHUT_R = '<path d="M142 85.5705C139.667 87.4039 132.2 89.9705 121 85.5705" stroke="#000" stroke-width="6" stroke-linecap="round" fill="none"/>';

/* The drawn eye set: whites with a black edge (so they read on any skin) and solid pupils.
   Each draws one eye at (x, y); `side` is -1 for the left eye, 1 for the right. */
const EL = [79, 91], ER = [132, 91];
const WHITE = 'fill="#fff" stroke="#000" stroke-width="3" stroke-linejoin="round"';
const INK = (w = 4.5) => `fill="none" stroke="#000" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const half = (x, y, r, up) => `M${x - r} ${y}A${r} ${r} 0 0 ${up ? 1 : 0} ${x + r} ${y}Z`; // a half disc, dome up or down
// Drawn at a base size, then enlarged a quarter about each eye's centre (big, readable eyes like the reference)
const grow = (x, y, svg) => `<g transform="translate(${x} ${y}) scale(1.25) translate(${-x} ${-y})">${svg}</g>`;
// `g` is the gaze: how far the pupils move sideways (left / center / right)
export const GAZE_X = { left: -3.5, center: 0, right: 3.5 };
const both = (f) => (c) => { const g = GAZE_X[c && c.gaze] || 0; return grow(...EL, f(...EL, -1, g)) + grow(...ER, f(...ER, 1, g)); };
const EYE_SET = {
  round: both((x, y, d, g) => `<circle cx="${x}" cy="${y}" r="10.5" ${WHITE}/><circle cx="${x + g}" cy="${y}" r="5" fill="#000"/>`),
  wide: both((x, y, d, g) => `<circle cx="${x}" cy="${y}" r="12" ${WHITE}/><circle cx="${x + g}" cy="${y}" r="3.6" fill="#000"/>`),
  big: both((x, y, d, g) => `<circle cx="${x}" cy="${y}" r="11" ${WHITE}/><circle cx="${x + g * 0.6}" cy="${y + 0.5}" r="7" fill="#000"/>`),
  side: both((x, y, d, g) => `<circle cx="${x}" cy="${y}" r="10.5" ${WHITE}/><circle cx="${x - 4.5}" cy="${y + 1}" r="5" fill="#000"/>`),
  up: both((x, y, d, g) => `<circle cx="${x}" cy="${y}" r="10.5" ${WHITE}/><circle cx="${x - 2.5 + g * 0.8}" cy="${y - 4}" r="5" fill="#000"/>`),
  // Heavy lids: the lower half, pupils pressed up under the lid
  sleepy: both((x, y, d, g) => `<path d="${half(x, y - 2, 11, false)}" ${WHITE}/><path d="${half(x + g, y - 2, 5, false)}" fill="#000"/>`),
  // Peeking: the upper half, pupils resting on the lower edge
  peek: both((x, y, d, g) => `<path d="${half(x, y + 3, 11, true)}" ${WHITE}/><path d="${half(x + (g || d * 3), y + 3, 5, true)}" fill="#000"/>`),
  // Cross: the lid slopes down toward the nose
  angry: both((x, y, d, g) => {
    const r = 10.5, a1 = d < 0 ? -150 : -30, a2 = d < 0 ? 10 : 170;
    const P = (a) => [x + r * Math.cos((a * Math.PI) / 180), y + r * Math.sin((a * Math.PI) / 180)].map((v) => v.toFixed(2)).join(' ');
    return `<path d="M${P(a1)}A${r} ${r} 0 1 ${d < 0 ? 0 : 1} ${P(a2)}Z" ${WHITE}/><circle cx="${x - d * 2 + g * 0.6}" cy="${y + 4}" r="4.5" fill="#000"/>`;
  }),
  // One lid down, the other eye glancing over
  skeptical: () =>
    grow(...EL, `<path d="${half(EL[0], EL[1] - 2, 11, false)}" ${WHITE}/><path d="${half(EL[0] - 2, EL[1] - 2, 5, false)}" fill="#000"/>`) +
    grow(...ER, `<circle cx="${ER[0]}" cy="${ER[1] - 2}" r="11" ${WHITE}/><circle cx="${ER[0] - 4}" cy="${ER[1] + 1}" r="5" fill="#000"/>`),
  bored: both((x, y, d, g) => `<rect x="${x - 12}" y="${y - 5}" width="24" height="10" rx="2.5" ${WHITE}/><circle cx="${x + g}" cy="${y}" r="3.6" fill="#000"/>`),
  happy: both((x, y, d, g) => `<path d="M${x - 9} ${y - 3}Q${x} ${y + 9} ${x + 9} ${y - 3}" ${INK()}/>`),
  sad: both((x, y, d, g) => `<path d="M${x - 9} ${y + 4}Q${x} ${y - 8} ${x + 9} ${y + 4}" ${INK()}/>`),
  flat: both((x, y, d, g) => `<path d="M${x - 10} ${y}H${x + 10}" ${INK()}/>`),
  squeeze: both((x, y, d, g) => `<path d="M${x + d * 8} ${y - 7}L${x - d * 7} ${y}L${x + d * 8} ${y + 7}" ${INK()}/>`),
  dead: both((x, y, d, g) => `<path d="M${x - 7} ${y - 7}L${x + 7} ${y + 7}M${x + 7} ${y - 7}L${x - 7} ${y + 7}" ${INK()}/>`),
};

export const eyes = {
  open: () => `<path d="${EYE_L}" fill="#000"/><path d="${EYE_R}" fill="#000"/>`,
  closed: () => SHUT_L + SHUT_R,
  // Drawn: one open, one shut
  wink: () => `<path d="${EYE_L}" fill="#000"/>` + SHUT_R,
  // Drawn: round dots
  boy: () => `<path d="${BOY.EYE_L}" fill="#000"/><path d="${BOY.EYE_R}" fill="#000"/>`,
  dots: () => '<circle cx="79" cy="90" r="6" fill="#000"/><circle cx="132" cy="90" r="6" fill="#000"/>',
  ...EYE_SET,
};

/* ---- Brows ---- */
export const brows = {
  none: () => '',
  // Figma: Vector 10 / 11
  raised: () =>
    '<path d="M66 68.9998C68.3333 67.1664 75.8 64.5998 87 68.9998" stroke="#000" stroke-width="4" stroke-linecap="round" fill="none"/>' +
    '<path d="M142 68.4295C139.667 66.5961 132.2 64.0295 121 68.4295" stroke="#000" stroke-width="4" stroke-linecap="round" fill="none"/>',
  // Drawn
  flat: () =>
    '<path d="M67 70.5H86" stroke="#000" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M122 70H141" stroke="#000" stroke-width="4" stroke-linecap="round"/>',
  // Drawn: inner ends raised
  worried: () =>
    '<path d="M67 71.5C73 71.5 81 69.5 86 65.5" stroke="#000" stroke-width="4" stroke-linecap="round" fill="none"/>' +
    '<path d="M141 71C135 71 127 69 122 65" stroke="#000" stroke-width="4" stroke-linecap="round" fill="none"/>',
};

/* ---- Nose ---- */
export const nose = {
  none: () => '',
  // Figma: Vector 9
  hook: () =>
    '<path d="M105.183 106.31C105.217 106.132 105.208 105.942 105.136 105.772C105.064 105.603 104.936 105.468 104.775 105.394C104.614 105.321 104.428 105.314 104.253 105.371C104.078 105.429 103.929 105.547 103.817 105.69C103.676 105.865 103.529 106.052 103.385 106.235C102.371 107.523 101.379 108.875 100.612 110.481C100.233 111.294 99.8972 112.153 99.7412 113.224C99.6006 114.226 99.617 115.791 100.782 117.051C102.175 118.444 103.775 118.223 104.798 117.724C105.066 117.592 105.302 117.433 105.553 117.248C105.685 117.136 105.811 117.018 105.901 116.884C105.99 116.749 106.035 116.606 106.025 116.462C106.015 116.319 105.95 116.184 105.842 116.063C105.734 115.943 105.593 115.844 105.446 115.752C105.207 115.602 105.006 115.458 104.811 115.324C104.003 114.806 103.614 114.294 103.703 114.318C103.71 114.322 103.691 114.334 103.65 114.208C103.612 114.088 103.583 113.863 103.587 113.594C103.594 113.043 103.711 112.351 103.87 111.635C104.188 110.195 104.655 108.646 105.031 107.017C105.084 106.784 105.138 106.543 105.183 106.31Z" fill="#000"/>',
  // Drawn
  boy: () => `<path d="${BOY.NOSE}" fill="#000"/>`, // a curl
  dot: () => '<ellipse cx="104" cy="113" rx="3.5" ry="2.8" fill="#000"/>',
  // Drawn: a short upright tick
  tick: () => '<path d="M104 104.5V114" stroke="#000" stroke-width="4" stroke-linecap="round"/>',
};

/* ---- Mouth ---- */
export const mouth = {
  none: () => '',
  // Figma: sorry tongue
  tongue: (c) =>
    '<path d="M118.252 124.03C104.332 126.91 94.8518 124.03 91.8518 122.23C91.0518 121.83 89.8118 121.63 91.2518 124.03C93.0518 127.03 93.6517 127.03 93.6517 130.03C92.4517 137.23 95.0518 139.43 96.0518 141.43C102.652 151.63 113.452 143.23 114.052 136.03C114.652 128.83 117.052 128.83 118.852 126.43C120.292 124.51 119.052 124.03 118.252 124.03Z" fill="#000"/>' +
    `<path d="M110.452 137.23C107.452 145.03 100.852 143.23 98.4518 140.23C96.5318 137.83 96.6517 133.83 97.2517 131.83C99.2317 125.23 103.252 128.83 103.252 131.83L103.252 134.23C103.732 137.59 105.052 137.23 105.652 134.83L106.252 131.83C108.052 126.43 111.652 130.03 111.052 134.83L110.452 137.23Z" fill="${c.tongue}"/>`,
  // Figma: Vector 14
  frown: () => '<path d="M111 134C109.778 132.491 105.867 130.378 100 134" stroke="#000" stroke-width="6" stroke-linecap="round" fill="none"/>',
  // Drawn: a wobbly, about-to-cry mouth
  wobble: () => '<path d="M93 135Q97.5 127.5 101.5 131.5Q105.5 135.5 109.5 130.5Q113.5 126.5 117 134" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  boy: () => `<path d="${BOY.MOUTH}" fill="#000"/>`, // a lopsided smile
  // Drawn: a tiny "o"
  o: () => '<ellipse cx="104.5" cy="131" rx="4.5" ry="5.5" stroke="#000" stroke-width="4" fill="none"/>',
  // Drawn: a one-sided smirk
  smirk: () => '<path d="M96 131.5C104 134.5 111.5 132.5 116.5 125.5" stroke="#000" stroke-width="5" stroke-linecap="round" fill="none"/>',
  // Drawn
  smile: () => '<path d="M94 128C99 134.5 109 134.5 115 127.5" stroke="#000" stroke-width="5" stroke-linecap="round" fill="none"/>',
  // Drawn
  open: (c) =>
    '<path d="M93 125.5C99.5 127.5 109.5 127.5 116 124.5C116 134 111 140 104.5 140C98 140 93 134.5 93 125.5Z" fill="#000" stroke="#000" stroke-width="3" stroke-linejoin="round"/>' +
    `<path d="M98.5 135.5C101 132.8 108 132.8 110.5 135.2C108.6 137.6 106.6 138.4 104.5 138.4C102.3 138.4 100.2 137.4 98.5 135.5Z" fill="${c.tongue}"/>`,
};

/* ---- Blush ---- */
// Figma: Ellipse 5 / 6
export const blush = (c) => `<circle cx="167" cy="109" r="2" fill="${c.blush}"/><circle cx="44" cy="110" r="2" fill="${c.blush}"/>`;

/* ---- Glasses ---- */
// Figma: glasses
export const glasses = (c) =>
  `<path fill-rule="evenodd" clip-rule="evenodd" d="M151.18 86.5114C151.39 87.6423 151.5 88.8083 151.5 90C151.5 100.493 142.993 109 132.5 109C122.007 109 113.5 100.493 113.5 90C113.5 88.7786 113.615 87.5841 113.835 86.4268C110.528 84.5048 107.939 83.6877 105.42 83.6452C102.98 83.6039 100.309 84.2824 96.811 85.9118C97.26 87.5312 97.5 89.2376 97.5 91C97.5 101.493 88.9934 110 78.5 110C68.0066 110 59.5 101.493 59.5 91C59.5 90.2357 59.5451 89.4819 59.6329 88.7412C54.6535 87.1966 51.793 86.5275 49.4326 86.2262C47.3367 85.9586 45.6155 85.9706 42.9824 85.9888L42.7936 85.9901C42.4738 85.9923 42.1404 85.9945 41.7914 85.9963C41.3834 85.9983 40.9541 85.9997 40.5 85.9997C38.8431 85.9996 37.5 84.6565 37.5 82.9997C37.5002 81.3429 38.8433 79.9997 40.5 79.9997C41.2897 79.9997 42.0305 79.994 42.7369 79.9887C45.4545 79.968 47.6636 79.9513 50.1924 80.2741C53.0308 80.6364 56.2523 81.4137 61.2759 82.9686C64.3022 76.4894 70.8768 72 78.5 72C85.0931 72 90.902 75.3582 94.3092 80.4575C98.2774 78.6123 101.878 77.5846 105.521 77.6461C109.084 77.7064 112.416 78.8008 115.92 80.7141C119.174 74.9171 125.379 71 132.5 71C139.678 71 145.927 74.9808 149.159 80.8552C153.935 79.3893 157.052 78.6464 159.808 78.2946C162.336 77.9718 164.545 77.9885 167.263 78.0092C167.969 78.0146 168.71 78.0202 169.5 78.0202C171.157 78.0202 172.5 79.3633 172.5 81.0202C172.5 82.6769 171.157 84.0201 169.5 84.0202C168.575 84.0202 167.753 84.0144 167.005 84.0091C164.379 83.9907 162.66 83.9786 160.567 84.2458C158.339 84.5303 155.664 85.1434 151.18 86.5114ZM145.5 90C145.5 88.5764 145.271 87.2062 144.848 85.9243C144.763 85.6651 144.669 85.4095 144.568 85.1578C142.648 80.3762 137.968 77 132.5 77C125.32 77 119.5 82.8203 119.5 90C119.5 97.1797 125.32 103 132.5 103C139.68 103 145.5 97.1797 145.5 90ZM91.5 91C91.5 83.8203 85.6797 78 78.5 78C71.3203 78 65.5 83.8203 65.5 91C65.5 98.1797 71.3203 104 78.5 104C85.6797 104 91.5 98.1797 91.5 91Z" fill="${c.glasses}"/>`;

/* ---- Cap ---- */
// Figma: cap (crown + brim, 4px outline). The brim is a lighter tint of the crown.
export const cap = (c, brim) =>
  `<path fill-rule="evenodd" clip-rule="evenodd" d="M37.8985 73.0222C37.7223 67.0156 37.879 59.3212 38.7803 49.948C41.2803 23.948 65.7803 10.948 85.2803 5.94799C86.0799 5.74294 86.8819 5.55459 87.6851 5.38189C94.8566 3.777 110.2 2.01943 124.708 5.73937C144.208 10.7394 168.708 23.7394 171.208 49.7394C172.135 59.3816 172.275 67.2472 172.074 73.3266C166.168 61.7592 154.341 52.1351 141.202 45.6973C128.254 39.3525 116.312 37.9172 104.708 37.5308L104.708 37.5492C93.1042 37.9356 81.1625 39.371 68.214 45.7158C55.2314 52.0773 42.5613 60.9031 37.8985 73.0222Z" fill="${c.cap}" stroke="#000" stroke-width="4" stroke-linejoin="round"/>` +
  `<path fill-rule="evenodd" clip-rule="evenodd" d="M104.708 37.5308L104.708 37.5492C93.1042 37.9356 81.1625 39.371 68.214 45.7158C55.2314 52.0773 42.5613 60.9031 37.8985 73.0222C37.8335 73.1911 37.7701 73.3606 37.7083 73.5308C40.8948 81.4379 54.2959 87.7537 66.1893 76.3816C75.6511 65.769 85.8085 57.8667 104.708 57.7089L104.708 57.6905C123.608 57.8483 133.765 65.7506 143.227 76.3631C155.121 87.7353 168.922 81.3007 172.108 73.3935C172.097 73.3712 172.085 73.3489 172.074 73.3266C166.168 61.7592 154.341 52.1351 141.202 45.6974C128.254 39.3526 116.312 37.9172 104.708 37.5308Z" fill="${brim}" stroke="#000" stroke-width="4" stroke-linejoin="round"/>`;

/* ---- More headwear (drawn to match the cap) ----
   All in the cap's colour, with the lighter tint for the brim or cuff. */
const HAT_OUT = 'stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
// The cap turned to the side: the crown on top, the brim sticking out to the right
const SIDE_CROWN = 'M38 74C35 30 62 4 105 4C148 4 175 30 172 74C150 63 128 58 105 58C82 58 60 63 38 74Z';
const SIDE_BRIM = 'M152 63C164 53 180 51 186 56C190 62 184 70 171 75C162 78 155 77 150 73Z';
// A knit beanie: a dome and a folded cuff with ribs
const BEANIE_DOME = 'M40 62C36 24 64 1 105 1C146 1 174 24 170 62Z';
const BEANIE_CUFF = 'M34 54C34 49 38 46 44 46H166C172 46 176 49 176 54V67C176 72 172 75 166 75H44C38 75 34 72 34 67Z';
export const hats = {
  cap: (c, brim) => cap(c, brim),
  side: (c, brim) =>
    `<path d="${SIDE_CROWN}" fill="${c.cap}" ${HAT_OUT}/>` +
    `<path d="${SIDE_BRIM}" fill="${brim}" ${HAT_OUT}/>` +
    `<path d="M106 5C98 20 95 38 97 58" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="105" cy="6" r="4" fill="${c.cap}" stroke="#000" stroke-width="3"/>`,
  beanie: (c, brim) =>
    `<path d="${BEANIE_DOME}" fill="${c.cap}" ${HAT_OUT}/>` +
    `<path d="${BEANIE_CUFF}" fill="${brim}" ${HAT_OUT}/>` +
    Array.from({ length: 11 }, (_, i) => `<path d="M${50 + i * 11} 52V69" stroke="#000" stroke-opacity="0.22" stroke-width="2.5" stroke-linecap="round"/>`).join(''),
};

/* ---- Hands (drawn; over the face, in the skin colour) ----
   Each is drawn pointing up in its own space, then placed and turned. */
const HAND = (c) => `fill="${c.skin}" stroke="#000" stroke-width="4" stroke-linejoin="round"`;
const knuckles = (x0, y0, n, gap, len) =>
  Array.from({ length: n }, (_, i) => `<path d="M${x0 + i * gap} ${y0}V${y0 + len}" stroke="#000" stroke-width="3" stroke-linecap="round"/>`).join('');
export const hands = {
  none: () => '',
  // A finger to the nose: a fist at the left cheek, the index finger reaching across to the nostril
  nose: (c) =>
    `<g transform="translate(60 128) rotate(64)">` +
    `<rect x="-17" y="34" width="26" height="46" ${HAND(c)}/>` +
    `<rect x="1" y="-38" width="12" height="46" rx="6" ${HAND(c)}/>` +
    `<rect x="-19" y="-4" width="36" height="40" rx="15" ${HAND(c)}/>` +
    `<path d="M-19 12C-27 12 -29 22 -19 24" ${HAND(c)}/>` +
    knuckles(-9, 3, 2, 9, 8) +
    `</g>`,
  // Thinking: a hand cupped under the chin on the right, thumb up the cheek
  chin: (c) =>
    `<g transform="translate(132 156) rotate(-12)">` +
    `<rect x="-12" y="18" width="28" height="48" ${HAND(c)}/>` +
    `<rect x="-26" y="-2" width="50" height="28" rx="13" ${HAND(c)}/>` +
    `<rect x="12" y="-26" width="13" height="34" rx="6.5" ${HAND(c)}/>` +
    `<path d="M-22 10H8" stroke="#000" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`,
};

/* =========================================================================
   Drawn to match (placeholders for Figma art): hair, torso, outfits.
   Same space and style: black 4px outlines, flat fills.
   ========================================================================= */

const OUT = 'stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

/* ---- Hair ---- */
// The fringe shape shared by the short, long and bun styles
const FRINGE = 'M37.5 73C35 40 60 6.5 105 5C150 6.5 175 40 172.5 73C166 58 151 47 134 50.5C123 40.5 112 44 105 52C96 43 84 43 76 52.5C61 47.5 46 57 37.5 73Z';

// Curly: a crown of curls, outlines drawn first and fills on top so only the outer edge shows
const CURLS = (() => {
  const out = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (1.02 + (i / 10) * 0.96);
    out.push([105 + 66 * Math.cos(a), 64 + 56 * Math.sin(a), i === 0 || i === 10 ? 13 : 17]);
  }
  out.push([105, 30, 22], [80, 36, 18], [130, 36, 18]);
  return out;
})();

// Short crop: a flatter top and a straight fringe across the forehead
const CROP = 'M36 80C33 34 52 2 105 2C158 2 177 34 174 80L166 57H44Z';
// Blunt bangs: one straight edge just above the brows, covering the temples
const BANGS = 'M35 84C31 34 58 0 105 0C152 0 179 34 175 84L171 60H39Z';
// A bob behind the head, ending at the jaw
const BOB = 'M31 80C27 32 60 -1 105 -1C150 -1 183 32 179 80L182 136C183 150 168 154 158 146H52C42 154 27 150 28 136Z';
// Side-swept: a heavy sweep from the crown over the left eye, down to the cheek
const SWEEP = 'M33 126C24 46 58 -1 110 -1C157 1 180 36 175 86C164 66 146 57 124 57C104 58 95 72 90 92C85 112 70 124 52 128C44 130 37 130 33 126Z';
// Sideburns, for wearing a hat: only the bits below the brim show
const BURNS = 'M37 70L54 72L50 99C46 101 41 101 38 98Z M173 70L156 72L160 99C164 101 169 101 172 98Z';

export const hairBack = {
  bangs: (c) => `<path d="${BOB}" fill="${c.hairColor}" ${OUT}/>`,
  sidebob: (c) => `<path d="${BOB}" fill="${c.hairColor}" ${OUT}/>`,
  long: (c) =>
    `<path d="M34 72C30 32 60 4 105 4C150 4 180 32 176 72L183 148C174 160 154 160 147 150L63 150C56 160 36 160 27 148Z" fill="${c.hairColor}" ${OUT}/>`,
  bun: (c) => `<circle cx="105" cy="-4" r="17" fill="${c.hairColor}" ${OUT}/>`,
};

export const hairFront = {
  none: () => '',
  boy: (c) => `<path fill-rule="evenodd" clip-rule="evenodd" d="${BOY.HAIR}" fill="${c.hairColor}"/>`,
  short: (c) => `<path d="${CROP}" fill="${c.hairColor}" ${OUT}/>`,
  bangs: (c) => `<path d="${BANGS}" fill="${c.hairColor}" ${OUT}/>`,
  sidebob: (c) => `<path d="${SWEEP}" fill="${c.hairColor}" ${OUT}/>`,
  underhat: (c) => `<path d="${BURNS}" fill="${c.hairColor}" ${OUT}/>`,
  long: (c) => `<path d="${FRINGE}" fill="${c.hairColor}" ${OUT}/>`,
  bun: (c) => `<path d="${FRINGE}" fill="${c.hairColor}" ${OUT}/>`,
  curly: (c) =>
    CURLS.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="none" ${OUT}/>`).join('') +
    CURLS.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r - 2}" fill="${c.hairColor}"/>`).join(''),
};

/* ---- Torso (drawn behind the head) ---- */
const WIDTH = { slim: 0.84, regular: 1, broad: 1.16 };
// Shoulders from the neck down past the bottom of the bust view
const BODY_D = 'M16 262C16 214 40 192 80 183C90 195 120 195 130 183C170 192 194 214 194 262Z';

export function torso(c, id) {
  const f = WIDTH[c.body] || 1;
  const sx = `transform="translate(105 0) scale(${f} 1) translate(-105 0)"`;
  const ns = 'vector-effect="non-scaling-stroke"';
  let s = '';
  // Hood sits behind the neck
  if (c.outfit === 'hoodie') s += `<g ${sx}><path d="M58 184C54 150 156 150 152 184Z" fill="${c.outfitColor}" ${OUT} ${ns}/></g>`;
  // Neck
  s += `<path d="M88 138V186H122V138" fill="${c.skin}" ${OUT}/>`;
  // Body / outfit
  s += `<g ${sx}>`;
  s += `<clipPath id="${id}-body"><path d="${BODY_D}"/></clipPath>`;
  s += `<path d="${BODY_D}" fill="${c.outfitColor}" ${OUT} ${ns}/>`;
  if (c.detail === 'stripe') s += `<g clip-path="url(#${id}-body)"><rect x="0" y="216" width="210" height="12" fill="#fff" fill-opacity="0.85"/></g>`;
  if (c.detail === 'pocket') s += `<rect x="132" y="210" width="20" height="18" rx="3" fill="none" stroke="#000" stroke-width="3" ${ns}/>`;
  s += '</g>';
  // Neckline by outfit
  if (c.outfit === 'tee') s += `<path d="M80 183C90 197 120 197 130 183" fill="none" ${OUT}/>`;
  if (c.outfit === 'hoodie') {
    s += `<path d="M80 183C90 197 120 197 130 183" fill="none" ${OUT}/>`;
    s += `<path d="M96 196V216M114 196V216" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (c.outfit === 'shirt') {
    s += `<path d="M80 183L96 202L105 189L114 202L130 183" fill="${c.outfitColor}" ${OUT}/>`;
    s += `<circle cx="105" cy="214" r="2.6" fill="#000"/><circle cx="105" cy="232" r="2.6" fill="#000"/>`;
  }
  return s;
}
