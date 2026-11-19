import { useId } from 'react';


/* =========================================================================
   Tab icons. Rules, from the set curated in Figma (Toolbar 23:638, 24:1019):

   1. The subject is the avatar itself. Every icon is the same little head
      (the toolbar's head outline, a 23×28 box), not an outside metaphor
      (no combs, wands or binoculars).
   2. One part is filled. The part the tab edits is filled light grey
      (#D5D7DD); everything else on the head is blank white. Never two filled parts.
   3. Context is quiet. Eyes appear as small grey dots only when a tab needs
      them for orientation (nose, mouth, brows…); nothing else is added.
   4. One line weight: a 1px #9FA3B1 outline with round caps and joins, on every shape.
   5. Height 28. Icons sit in the 28px frame; width follows the drawing.
   6. A colour you must have (skin, hair, outfit, background, tongue) is the colour
      wheel, filled with the current colour. A colour you can switch off
      (headwear, glasses, tears, blush) is drawn as that thing, and the tile
      fades while it's off.
   7. Abstract settings (tilt) use a simple filled form: the segmented ball.
   8. The torso tabs use the bust: a small head on the shoulders, the part
      being edited filled.
   ========================================================================= */

const PART = '#D5D7DD';
const BLANK = '#fff';
const INK = '#9FA3B1';
const K = { stroke: INK, strokeLinecap: 'round', strokeLinejoin: 'round' };
// The edited part's fill; a selected tab sets --ab-part to show the current colour there
const PF = { fill: 'var(--ab-part, #D5D7DD)' };

const Head = ({ fill = BLANK }) => <path d={FACE_D} fillRule="evenodd" clipRule="evenodd" fill={fill} {...K} />;
const EyeDots = () => <><circle cx="9.2" cy="15.9" r=".85" fill={INK} /><circle cx="14.4" cy="15.9" r=".85" fill={INK} /></>;
const MOUTH_D = 'M8.6 19.2h6.5a3.25 3.25 0 0 1-6.5 0Z';
const Drop = ({ x }) => <path d={`M${x} 17.6c.9 1.2 1.4 2 1.4 2.6a1.4 1.4 0 0 1-2.8 0c0-.6.5-1.4 1.4-2.6Z`} style={PF} {...K} />;

// Head icons, 23×28. Functions, because the shared paths are defined further down.
const HEAD_ICONS = {
  // Face bar
  'face:head': () => ({ w: 18.9985, art: <g {...K}><path d="M1.19784 9.93937C1.08485 11.1387 1.0652 12.1233 1.08728 12.8918C1.11316 13.7924 1.19631 14.3965 1.25371 14.7021L1.00979 14.8017C0.0694864 15.3775 0.633666 16.721 1.07247 17.7446C1.28765 18.2466 1.51791 18.364 1.74846 18.4815C1.98805 18.6037 2.22796 18.7258 2.45158 19.2802C2.80262 20.1503 3.60083 21.2634 3.95605 21.7113C5.23646 23.0181 6.80989 23.7115 8.38762 23.94C10.6255 24.2056 13.153 23.613 15.0424 21.6846C15.3978 21.2368 16.1959 20.1235 16.547 19.2534C16.7707 18.6993 17.0104 18.5769 17.2501 18.4548C17.4806 18.3374 17.7109 18.2199 17.9261 17.718C18.3649 16.6942 18.929 15.3508 17.9887 14.775L17.7449 14.6754C17.8008 14.3773 17.8813 13.7952 17.9092 12.9308C17.9344 12.1529 17.917 11.1465 17.8007 9.91269C17.4873 6.58582 14.4156 4.92239 11.9708 4.2826C10.1519 3.80661 8.22832 4.03151 7.32919 4.23687C7.22848 4.25896 7.12794 4.28306 7.02768 4.3093C4.5829 4.94908 1.51127 6.61251 1.19784 9.93937Z" style={PF} /></g> }),
  tilt: () => ({ w: 23, h: 23.0002, box: 23, art: <g {...K}><path d="M10.5112 0.543826C10.8369 0.514799 11.1667 0.5 11.5 0.5C14.0846 0.5 16.4611 1.39143 18.3386 2.88362C19.2832 3.63438 20.1016 4.53712 20.7567 5.555C21.8599 7.26929 22.5 9.30991 22.5 11.5C22.5 11.9615 22.4716 12.4162 22.4164 12.8628C22.1079 15.3594 20.9628 17.5969 19.2702 19.2861C17.2802 21.272 14.5335 22.5 11.5 22.5C10.3194 22.5 9.18226 22.314 8.11627 21.9697C4.46101 20.7892 1.64221 17.7478 0.776611 13.9621C0.595594 13.1705 0.5 12.3464 0.5 11.5C0.5 7.61019 2.51902 4.192 5.5662 2.23612C7.01708 1.30486 8.70109 0.705073 10.5112 0.543826Z" style={PF} /><path d="M6.94354 14.5072C7.00297 17.1851 7.41905 19.7138 8.11627 21.9698C4.46101 20.7893 1.64221 17.7478 0.776611 13.9621C2.68455 14.2452 4.76025 14.4332 6.94354 14.5072Z" fill={BLANK} /><path d="M8.11629 21.97C7.41908 19.714 7.00299 17.1853 6.94357 14.5074C7.30034 14.5195 7.66004 14.5286 8.0223 14.5345C8.36022 14.54 8.70037 14.5428 9.04258 14.5428C12.6886 14.5428 16.1014 14.226 19.0225 13.6742C19.0006 14.1512 18.9894 14.6362 18.9894 15.1279C18.9894 16.5856 19.0883 17.9852 19.2702 19.2863C17.2802 21.2723 14.5336 22.5002 11.5 22.5002C10.3195 22.5002 9.18228 22.3143 8.11629 21.97Z" fill={BLANK} /><path d="M18.9893 15.1275C18.9893 14.6358 19.0006 14.1508 19.0225 13.6739C20.2464 13.4427 21.3841 13.1702 22.4164 12.8626C22.1079 15.3593 20.9627 17.5968 19.2702 19.286C19.0882 17.9848 18.9893 16.5853 18.9893 15.1275Z" style={PF} /><path d="M22.4164 12.863C21.3841 13.1706 20.2465 13.4431 19.0225 13.6743C19.1716 10.4269 19.8142 7.55801 20.7567 5.55527C21.8599 7.26957 22.5 9.31018 22.5 11.5003C22.5 11.9617 22.4716 12.4165 22.4164 12.863Z" style={PF} /><path d="M10.5112 0.543826C10.1778 1.04391 9.86314 1.57719 9.56939 2.14053C7.92755 5.28884 6.93618 9.37493 6.93618 13.8404C6.93618 14.0637 6.93864 14.2859 6.94355 14.5072C7.30033 14.5193 7.66002 14.5283 8.02229 14.5342C8.36021 14.5398 8.70036 14.5426 9.04256 14.5426C12.6886 14.5426 16.1014 14.2257 19.0225 13.674C19.1716 10.4266 19.8142 7.55773 20.7567 5.555C20.1016 4.53712 19.2832 3.63438 18.3386 2.88362C16.4611 1.39143 14.0847 0.5 11.5 0.5C11.1667 0.5 10.8369 0.514799 10.5112 0.543826Z" fill={BLANK} /><path d="M9.56938 2.14074C9.86313 1.57741 10.1777 1.04413 10.5112 0.544043C8.70109 0.70529 7.01708 1.30508 5.5662 2.23634C2.51902 4.19222 0.5 7.6104 0.5 11.5002C0.5 12.3466 0.595594 13.1707 0.776611 13.9623C2.68455 14.2454 4.76025 14.4334 6.94354 14.5074C6.93863 14.2862 6.93617 14.0639 6.93617 13.8406C6.93617 9.37515 7.92754 5.28906 9.56938 2.14074Z" fill={BLANK} /></g> }),
  ears: () => <><ellipse cx="3.9" cy="17.3" rx="1.9" ry="2.6" style={PF} {...K} /><ellipse cx="19.6" cy="17.3" rx="1.9" ry="2.6" style={PF} {...K} /><Head /></>,
  features: () => <><Head /><ellipse cx="9.2" cy="16" rx="1.2" ry="1.5" style={PF} {...K} /><ellipse cx="14.4" cy="16" rx="1.2" ry="1.5" style={PF} {...K} /><path d="M9.6 19.6h4.5a2.25 2.25 0 0 1-4.5 0Z" style={PF} {...K} /></>,

  // Features: one organ each
  eyes: () => <><Head /><ellipse cx="9.1" cy="16" rx="1.6" ry="2" style={PF} {...K} /><ellipse cx="14.5" cy="16" rx="1.6" ry="2" style={PF} {...K} /></>,
  gaze: () => <><Head /><circle cx="9.1" cy="16" r="2.2" fill={BLANK} {...K} /><circle cx="14.5" cy="16" r="2.2" fill={BLANK} {...K} /><circle cx="10" cy="16.4" r="1.1" fill={INK} /><circle cx="15.4" cy="16.4" r="1.1" fill={INK} /></>,
  brows: () => <><Head /><EyeDots /><rect x="7.3" y="12.3" width="3.8" height="1.6" rx=".8" transform="rotate(-8 9.2 13.1)" style={PF} {...K} /><rect x="12.5" y="12.3" width="3.8" height="1.6" rx=".8" transform="rotate(8 14.4 13.1)" style={PF} {...K} /></>,
  glasses: () => <><Head /><path d="M4 15.3h2.4M17.3 15.3h2.4M11.3 15.6c.35-.4.75-.4 1.1 0" fill="none" {...K} /><circle cx="8.9" cy="16" r="2.5" style={PF} {...K} /><circle cx="14.8" cy="16" r="2.5" style={PF} {...K} /></>,
  tears: () => <><Head /><EyeDots /><Drop x={8.7} /><Drop x={15} /></>,
  mouth: () => <><Head /><EyeDots /><path d={MOUTH_D} style={PF} {...K} /></>,
  tongue: () => <><Head /><EyeDots /><path d={MOUTH_D} fill={BLANK} {...K} /><path d="M10.3 21.5a1.55 1.3 0 0 1 3.1 0c0 .5-.7.85-1.55.85s-1.55-.35-1.55-.85Z" style={PF} {...K} /></>,
  nose: () => <><Head /><EyeDots /><path d="M11.85 15.9c-.6 1.3-1.7 2.5-1.7 3.2 0 .6.7.9 1.7.9s1.7-.3 1.7-.9c0-.7-1.1-1.9-1.7-3.2Z" style={PF} {...K} /></>,
  blush: () => <><Head /><EyeDots /><ellipse cx="7.1" cy="19" rx="1.9" ry="1.2" style={PF} {...K} /><ellipse cx="16.6" cy="19" rx="1.9" ry="1.2" style={PF} {...K} /></>,
  gesture: () => <><Head /><EyeDots /><path d="M15.4 27.2v-4.6a1 1 0 0 1 2 0v-.9a1 1 0 0 1 2 0v.7a1 1 0 0 1 1.9.3V25c0 1.6-1.2 2.6-2.8 2.6h-.7c-1 0-1.7-.2-2.4-.4Z" style={PF} {...K} /></>,

  // Hair
  'hair:hair': () => <><Head /><path d={FRINGE_D} style={PF} {...K} /></>,
  cap: () => <><Head /><path d="M11.7027 8.54678L11.7027 8.54904C10.2786 8.59646 8.81299 8.77262 7.22388 9.5513C5.63057 10.332 4.07561 11.4152 3.50337 12.9025C3.49539 12.9232 3.48761 12.944 3.48002 12.9649C3.87109 13.9353 5.51576 14.7105 6.97539 13.3148C8.13661 12.0124 9.38319 11.0425 11.7027 11.0232L11.7027 11.0209C14.0222 11.0403 15.2688 12.0101 16.43 13.3125C17.8896 14.7082 19.5834 13.9185 19.9744 12.9481C19.973 12.9453 19.9716 12.9426 19.9702 12.9399C19.2454 11.5202 17.7939 10.3391 16.1815 9.54904C14.5924 8.77036 13.1268 8.5942 11.7027 8.54678Z" fill={BLANK} {...K} /><path d="M3.50362 12.9021C3.482 12.1649 3.50123 11.2206 3.61184 10.0703C3.91865 6.87941 6.92545 5.28397 9.31861 4.67034C9.41675 4.64517 9.51518 4.62206 9.61375 4.60086C10.4939 4.4039 12.377 4.1882 14.1575 4.64473C16.5506 5.25836 19.5574 6.85381 19.8642 10.0447C19.978 11.228 19.9951 12.1934 19.9705 12.9395C19.2457 11.5198 17.7941 10.3387 16.1817 9.54863C14.5926 8.76995 13.1271 8.59379 11.7029 8.54637L11.7029 8.54863C10.2788 8.59605 8.81325 8.77221 7.22413 9.55089C5.63082 10.3316 4.07587 11.4148 3.50362 12.9021Z" style={PF} {...K} /></>,
  hat: () => <><Head /><path d="M6.7 11.3c0-3.7 2.3-6.8 5.15-6.8s5.15 3.1 5.15 6.8Z" style={PF} {...K} /><path d="M2.7 11.7c0-.75 4.1-1.35 9.15-1.35S21 10.95 21 11.7s-4.1 1.35-9.15 1.35S2.7 12.45 2.7 11.7Z" style={PF} {...K} /></>,
};
// The Features organs share their item's drawing
Object.assign(HEAD_ICONS, {
  'features:eyes': HEAD_ICONS.eyes,
  'features:mouth': HEAD_ICONS.mouth,
  'features:nose': HEAD_ICONS.nose,
  'features:cheeks': HEAD_ICONS.blush,
  'features:hands': HEAD_ICONS.gesture,
});

// Bust icons, 26.47×28: a small head on the shoulders
const MiniHead = () => <g transform="translate(6.05 2.45) scale(.62)"><path d={FACE_D} fillRule="evenodd" fill={BLANK} {...K} strokeWidth={1 / 0.62} /></g>;
const BUST_ICONS = {
  torso: () => <><path d={BUST_D} style={PF} {...K} /><MiniHead /></>,
  'outfit:outfit': () => <><path d={BUST_D} style={PF} {...K} /><path d="M10.8 16.7c1.6 1.6 3.3 1.6 4.9 0l-2.45 4.2Z" fill={BLANK} {...K} /><MiniHead /></>,
  body: () => <><path d={BUST_D} fill={BLANK} {...K} /><path d="M6 23.2h14.5M7.4 21.8 6 23.2l1.4 1.4M19.1 21.8l1.4 1.4-1.4 1.4" fill="none" {...K} /><MiniHead /></>,
  detail: () => <><path d={BUST_D} fill={BLANK} {...K} /><rect x="16.2" y="21" width="3.8" height="3.4" rx=".7" style={PF} {...K} /><MiniHead /></>,
};

/* `name` is a category or item key; `group` disambiguates an item that shares its
   category's name. `wheel` marks a colour you must have (rule 6). */
export function NavIcon({ name, group, wheel, color, tint }) {
  if (wheel) return <ColourWheel size={26} color={color} />;
  const pick = (set) => (group && set[`${group}:${name}`]) || set[name];
  const st = tint ? { '--ab-part': tint } : undefined;
  const bust = pick(BUST_ICONS);
  if (bust) return <svg style={st} className="ab-fig-icon" width="26.4686" height="28" viewBox="0 0 26.4686 28" fill="none" overflow="visible" aria-hidden="true">{bust()}</svg>;
  const head = pick(HEAD_ICONS);
  if (!head) return null;
  const art = head();
  if (art && art.art) {
    const h = art.box ?? 28, w = art.box ?? art.w * (28 / (art.h ?? 28));
    return <svg style={st} className="ab-fig-icon" width={w} height={h} viewBox={`0 0 ${art.w} ${art.h ?? 28}`} overflow="visible" aria-hidden="true">{art.art}</svg>;
  }
  return <svg style={st} className="ab-fig-icon" width="23" height="28" viewBox="0 0 23 28" fill="none" overflow="visible" aria-hidden="true">{art}</svg>;
}


/* The colour wheel (Figma "UI/Colour wheel" 44:2), from its own layers: the exported
   spectrum image, the shine over it, and the white hub with its dark ring and soft shadow. */
const SPECTRUM = 'data:image/png;base64,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';
// Light colours (white, pale greys) get a faint grey ring so they stay visible on any bar
const isLight = (hex) => {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(h)) return false;
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 225;
};
const LightRing = () => <circle cx="14" cy="14" r="13.5" fill="none" stroke="#c4c6cc" strokeWidth="1" />;

// `color`: a colour that's always set (skin, background) shows as itself, not as the spectrum
export function ColourWheel({ size = 26, color }) {
  const id = 'ab-hub' + useId().replace(/:/g, '');
  return (
    <svg className="ab-wheel-icon" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id={id + 'g'} x1="14" y1="0" x2="14" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".28" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={id} x="3.5" y="4.5" width="21" height="21" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy=".5" stdDeviation=".75" floodColor="#000" floodOpacity=".18" />
        </filter>
      </defs>
      {color ? <circle cx="14" cy="14" r="14" fill={color} /> : <image href={SPECTRUM} width="28" height="28" />}
      {color && (isLight(color) ? <LightRing /> : <circle cx="14" cy="14" r="13.75" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth=".5" />)}
      <path d="M28 14C28 21.732 21.732 28 14 28C6.26801 28 0 21.732 0 14C0 6.26801 6.26801 0 14 0C21.732 0 28 6.26801 28 14ZM5.32 14C5.32 18.7938 9.20617 22.68 14 22.68C18.7938 22.68 22.68 18.7938 22.68 14C22.68 9.20617 18.7938 5.32 14 5.32C9.20617 5.32 5.32 9.20617 5.32 14Z" fill={`url(#${id}g)`} />
      <g filter={`url(#${id})`}>
        <circle cx="14" cy="14" r="9" fill="#fff" />
        <circle cx="14" cy="14" r="8.5" fill="none" stroke="#000" strokeOpacity=".8" />
      </g>
    </svg>
  );
}

/* A colour option: a plain round patch the size of the colour-wheel icon. The chosen one
   carries the wheel's white hub (the stopper) in its centre. `color` null = the "none" option. */
export function ColourDot({ color, on, size = 28 }) {
  const id = 'ab-dot' + useId().replace(/:/g, '');
  return (
    <svg className="ab-dot" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <filter id={id} x="3.5" y="4.5" width="21" height="21" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy=".5" stdDeviation=".75" floodColor="#000" floodOpacity=".18" />
        </filter>
      </defs>
      {color ? (
        <>
          <circle cx="14" cy="14" r="14" fill={color} />
          {isLight(color) ? <LightRing /> : <circle cx="14" cy="14" r="13.75" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth=".5" />}
        </>
      ) : (
        <>
          <circle cx="14" cy="14" r="13.25" fill="#fff" stroke={on ? '#0b0c0e' : '#d9d9d7'} strokeWidth="1.5" />
          <path d="M5 23 23 5" stroke={on ? '#0b0c0e' : '#d9d9d7'} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {on && color && (
        <g filter={`url(#${id})`}>
          <circle cx="14" cy="14" r="9" fill="#fff" />
          <circle cx="14" cy="14" r="8.5" fill="none" stroke="#000" strokeOpacity=".8" />
        </g>
      )}
    </svg>
  );
}

/* Figma 88:5720 (the updated bar): line heads in grey, the part a tile edits filled;
   the selected tile goes near-black. Paths are the Figma exports, untouched. */
const FACE_D = 'M3.91914 11.4844C3.81367 12.5813 3.79533 13.4818 3.81594 14.1847C3.8401 15.0084 3.91772 15.5609 3.9713 15.8404L3.74361 15.9315C2.86589 16.4581 3.39252 17.6869 3.80212 18.6231C4.00298 19.0822 4.21791 19.1896 4.43312 19.297C4.65676 19.4088 4.8807 19.5205 5.08944 20.0275C5.41712 20.8233 6.1622 21.8414 6.49378 22.251C7.68897 23.4462 9.15768 24.0804 10.6304 24.2894C12.7193 24.5323 15.0786 23.9903 16.8423 22.2266C17.174 21.817 17.919 20.7988 18.2467 20.003C18.4555 19.4962 18.6793 19.3843 18.903 19.2726C19.1182 19.1652 19.3332 19.0578 19.534 18.5987C19.9436 17.6624 20.4702 16.4337 19.5925 15.9071L19.3649 15.816C19.4171 15.5433 19.4922 15.0109 19.5183 14.2204C19.5418 13.5089 19.5255 12.5884 19.417 11.46C19.1244 8.41724 16.2572 6.89587 13.9751 6.31072C12.2773 5.87538 10.4817 6.08107 9.64241 6.26889C9.54841 6.2891 9.45456 6.31114 9.36097 6.33514C7.07891 6.92028 4.21171 8.44165 3.91914 11.4844Z';
const FRINGE_D = 'M3.84289 14.6466C2.98891 8.3841 7.09064 5.53753 11.0758 5.53753C13.3531 3.54493 16.769 3.54493 18.7616 4.96822C17.6229 5.25287 17.3383 5.82219 18.1923 6.67616C20.1849 8.3841 20.3468 11.7724 19.4928 14.619C18.6388 11.7724 17.3383 10.6614 15.6303 10.092C12.2145 11.2307 8.79858 10.6614 6.52133 9.52273C5.3827 11.2307 4.4122 12.9386 3.84289 14.6466Z';
const BUST_D = 'M1.10066 26.5579C1.10055 25.8482 0.873177 23.7499 2.18055 21.5282C2.65618 20.7199 3.26055 19.7091 4.88066 18.8282C6.75446 17.8094 10.0086 17.2333 10.8207 16.6682C12.4407 18.2882 14.0607 18.2882 15.6807 16.6682C16.1127 16.6682 18.8749 17.8768 20.0007 18.2882C24.2714 19.9175 25.4007 24.1305 25.4007 26.5579C17.1207 26.5374 1.64048 26.9282 1.10066 26.5579Z';
const LINE_GREY = '#D5D7DD';
const LIT_GREY = '#D5D7DD';
const BUST_GREY = '#F1F2F4';
const ON = '#0B0C0E';

// `dark`: the bar under an open category (Figma 92:7014), where unselected heads are drawn in slate
export function BarIcon({ name, on, dark, color }) {
  const d = dark && !on;
  const stroke = on ? ON : d ? '#777C88' : LINE_GREY;
  const lit = on ? ON : d ? '#3C3E44' : LIT_GREY;
  const blank = d ? '#202123' : '#fff';
  const k = { stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'frame') return <ColourWheel size={28} color={color} />;
  if (name === 'outfit') {
    const t = { ...k, stroke: on ? 'rgba(255,255,255,.35)' : stroke, strokeWidth: 1.08, fill: 'none' };
    return (
      <svg width="26.4686" height="28" viewBox="0 0 26.4686 28" fill="none" aria-hidden="true">
        <path d="M10.837 14.4253C10.8831 14.5941 10.9196 14.8563 10.9344 15.1536M10.769 16.6699C10.7493 16.7238 10.7276 16.7748 10.7039 16.8223" strokeWidth=".26633" stroke={stroke} />
        <path d="M15.8069 14.4253C15.7704 14.5592 15.7299 14.7419 15.6969 14.9498M15.7557 16.5716C15.771 16.6123 15.7881 16.6516 15.8069 16.6891" strokeWidth=".26633" stroke={stroke} />
        <path d="M15.6971 14.9491C15.6168 15.4544 15.5811 16.1083 15.7559 16.5709C14.6428 18.5586 11.9343 18.5914 10.7687 16.6692C10.9229 16.2487 10.9589 15.6515 10.9341 15.1529C11.4227 15.3963 11.9382 15.548 12.4543 15.6213C13.5159 15.7447 14.6822 15.5637 15.6971 14.9491Z" fillRule="evenodd" clipRule="evenodd" fill={blank} {...k} />
        <path d={BUST_D} fill={on ? ON : d ? '#3C3E44' : BUST_GREY} strokeWidth=".675" {...k} />
        <path d="M8.35838 5.86844C9.15318 4.00769 10.9523 3.13639 12.7514 3.13639C14.2676 1.80967 16.542 1.80967 17.8687 2.75732C17.1106 2.94686 16.9211 3.32592 17.4897 3.89452C18.707 4.93791 18.8074 6.93862 18.3765 8.72551C18.3754 8.79189 18.3738 8.85589 18.3718 8.91755C18.3544 9.4439 18.3044 9.79839 18.2696 9.97996L18.4212 10.0406C19.0056 10.3912 18.6549 11.2094 18.3822 11.8327C18.2485 12.1384 18.1054 12.21 17.9621 12.2815C17.8132 12.3558 17.6641 12.4303 17.5251 12.7678C17.3069 13.2977 16.8109 13.9756 16.59 14.2483C16.3119 14.5264 16.0116 14.7589 15.6967 14.9496C14.6818 15.5643 13.5154 15.7452 12.454 15.6218C11.9378 15.5485 11.4222 15.3968 10.9337 15.1534C10.4942 14.9345 10.0765 14.6414 9.6997 14.2646C9.47893 13.9918 8.98283 13.3139 8.76465 12.7841C8.62573 12.4467 8.47651 12.3721 8.32766 12.2977C8.18437 12.2262 8.04126 12.1547 7.90753 11.849C7.6348 11.2257 7.28416 10.4075 7.86857 10.0569L8.02017 9.99622C7.9845 9.81009 7.93281 9.44225 7.91673 8.89383C7.90301 8.42579 7.91522 7.82624 7.98544 7.09587C8.02965 6.63607 8.16216 6.22845 8.35838 5.86844Z" fill={blank} {...k} />
        <mask id="ab-bust-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="1" y="16" width="25" height="11">
          <path d={BUST_D} fill="#000" />
        </mask>
        <g mask="url(#ab-bust-mask)">
          <path d="M9.07758 17.2169C9.0893 17.2169 9.47938 17.2169 10.2046 17.2451C11.1895 17.2834 11.3527 17.4753 11.533 17.5015C11.6239 17.5147 12.223 17.5431 13.1166 17.5944C13.7383 17.6301 14.4779 17.6959 14.9909 17.6624C15.2084 17.6481 15.4412 17.5429 15.8915 17.4177C16.4724 17.1979 16.9026 17.0534 17.2306 16.9478C17.359 16.9059 17.4102 16.8876 17.4954 16.8285" {...t} />
          <path d="M26.9365 24.2896C26.9271 24.2896 26.9178 24.2896 24.394 24.2904C21.8703 24.2912 16.8324 24.2929 14.1695 24.3049C11.3709 24.3175 10.8255 24.3971 10.14 24.4602C9.72011 24.5089 9.2632 24.5928 7.33935 24.7191C5.72768 24.7824 2.82597 24.8442 -0.263657 24.9318" {...t} />
          <path d="M4.71974 18.7472C4.78383 18.7502 4.99361 18.7726 5.29211 18.8173C5.69507 18.8776 5.82879 18.9314 6.26698 19.0031C6.66269 19.0679 7.41218 19.1788 8.76085 19.2445C10.1095 19.3102 12.0351 19.3243 13.3401 19.3284C14.645 19.3325 15.2709 19.3262 15.7252 19.3164C16.777 19.2938 16.9766 19.2062 17.3109 19.1112C17.7635 18.9827 18.337 18.7341 19.0203 18.4996C20.3929 18.1722 20.5669 18.1074 20.7287 18.0546C20.7661 18.0367 20.7984 18.0105 20.8381 17.9402" {...t} />
          <path d="M2.1652 21.1312C2.25159 21.1918 2.79577 21.4343 3.97105 21.6777C4.63409 21.8151 5.7296 22.0047 7.1094 22.0768C8.42259 22.1455 10.2892 22.0837 10.8751 22.0574C11.1756 22.0439 12.1784 21.9864 13.87 21.8789C16.4826 21.7129 17.1404 21.3645 17.9023 21.2969C19.2216 21.1798 19.9019 21.1766 20.4446 21.1389C20.8897 21.1188 21.4118 21.0935 24.4042 20.7865C25.3488 20.7183 26.2576 20.705 27.2154 20.6432" {...t} />
          <path d="M5.95241 22.7069C5.99135 22.8002 6.20046 23.147 6.43607 23.4874C6.64793 23.7935 6.71847 24.1774 6.77984 24.9222C6.78875 26.0441 6.77987 26.9079 6.76196 27.1685C6.75293 27.295 6.74404 27.4097 6.70193 27.6403" {...t} />
          <path d="M21.2454 21.5852C21.1655 21.6823 20.8847 22.0915 20.7103 22.4901C20.5005 22.9694 20.3027 23.4689 20.2573 26.8688C20.2233 27.6926 20.1999 27.8973 20.191 28.0886C20.1822 28.1861 20.1644 28.2845 20.1149 28.4606" {...t} />
        </g>
        <path d={BUST_D} {...k} />
      </svg>
    );
  }
  // face and hair: one head, the part the tile edits filled
  return (
    <svg width="23" height="28" viewBox="0 0 23 28" fill="none" aria-hidden="true">
      <path d={FACE_D} fillRule="evenodd" clipRule="evenodd" fill={name === 'face' ? lit : blank} strokeWidth={on && name === 'face' ? 0.9 : 1} {...k} />
      <path d={FRINGE_D} fill={name === 'hair' ? lit : blank} {...k} />
    </svg>
  );
}
