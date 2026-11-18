/* =========================================================================
   Navigation icons: one metaphor per category and item, never the item itself
   (option tiles show the actual item). Line icons on a 24px grid, 1.5px
   strokes in the current colour, matching the toolbar's undo / shuffle icons.
   ========================================================================= */

const L = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Dot = ({ x, y }) => <circle cx={x} cy={y} r="1.1" fill="currentColor" />;

const ICONS = {
  /* Categories */
  head: <><circle {...L} cx="12" cy="8" r="4" /><path {...L} d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" /></>, // a bust
  hair: <><rect {...L} x="3" y="5" width="18" height="5" rx="1.5" /><path {...L} d="M5.5 10v8M9 10v8M12.5 10v8M16 10v8M19 10v6" /></>, // a comb
  face: <><path {...L} d="M5 4h14v7a7 7 0 0 1-14 0Z" /><path {...L} d="M8.5 8.5h1.5M14 8.5h1.5M9 13c1.6 1.6 4.4 1.6 6 0" /></>, // a mask
  eyes: <><circle {...L} cx="7" cy="16" r="3.5" /><circle {...L} cx="17" cy="16" r="3.5" /><path {...L} d="M5 13 8 5h2.5v8.5M19 13 16 5h-2.5v8.5M10.5 16h3" /></>, // binoculars
  features: <><path {...L} d="M4 20 15 9" /><path {...L} d="M17.5 3v3.5M15.75 4.75h3.5M20.5 9v2.5M19.25 10.25h2.5M11 3.5v2M10 4.5h2" /></>, // a magic wand
  outfit: <path {...L} d="M8.5 3.5 3.5 6.5l2 4 2-1V20.5h9V9.5l2 1 2-4-5-3c-.5 1.5-2 2.5-3.5 2.5S9 5 8.5 3.5Z" />, // a tee
  background: <><path {...L} d="m5 11.5 6.5-6.5 7 7-6.5 6.5a1.5 1.5 0 0 1-2.1 0L5 13.6a1.5 1.5 0 0 1 0-2.1Z" /><path {...L} d="M5 12h13.5M9 7.5 6.5 5M20 15.5s1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3Z" /></>, // a paint bucket
  frame: <path {...L} d="M7 3v14h14M3 7h14v14" />, // crop marks

  /* Head */
  ears: <><circle cx="5.5" cy="12" r="1.5" fill="currentColor" /><path {...L} d="M9.5 8.5a5 5 0 0 1 0 7M13 5.5a9 9 0 0 1 0 13M16.5 3a12.5 12.5 0 0 1 0 18" /></>, // listening
  tilt: <path {...L} d="M20 12a8 8 0 1 1-2.35-5.65M20 4v4.5h-4.5" />, // a turn
  // head shape: a circle and a square
  'face:head': <><circle {...L} cx="8.5" cy="8.5" r="5" /><rect {...L} x="12" y="12" width="8.5" height="8.5" rx="1.5" /></>,

  /* Hair */
  'hair:hair': <><circle {...L} cx="6" cy="6" r="2.5" /><circle {...L} cx="6" cy="18" r="2.5" /><path {...L} d="M8.2 7.3 20 18M8.2 16.7 20 6" /></>, // scissors
  hairColor: <><path {...L} d="m13 13.5 7-7.5a1.8 1.8 0 0 0-2.5-2.5L10 10.5" /><path {...L} d="M10 10.5c-2.2 0-3.7 1.6-3.7 3.6 0 1.6-1 2.6-2.8 3.1 3.2 1.3 7.3.6 8.9-2.4.6-1.6.4-2.8-2.4-4.3Z" /></>, // a brush
  cap: <path {...L} d="M4 18.5h16M4.5 18.5 3 7.5l5 4 4-6.5 4 6.5 5-4-1.5 11" />, // a crown
  hat: <><path {...L} d="M3 12a9 9 0 0 1 18 0Z" /><path {...L} d="M12 12v6.5a2 2 0 0 1-4 0" /></>, // an umbrella

  /* Face */
  mouth: <path {...L} d="M4 5h16v11H9.5L5 19.5V16H4Z" />, // a speech bubble
  tongue: <><circle {...L} cx="12" cy="8.5" r="5.5" /><path {...L} d="M12 8.5a2 2 0 1 1 2 2M12 14v7" /></>, // a lollipop
  brows: <><path {...L} d="M9 9a3 3 0 1 1 4.4 2.7c-.9.5-1.4 1.1-1.4 2.3" /><Dot x={12} y={18} /></>, // a question

  /* Features: one metaphor per organ */
  'features:eyes': <><circle {...L} cx="7" cy="16" r="3.5" /><circle {...L} cx="17" cy="16" r="3.5" /><path {...L} d="M5 13 8 5h2.5v8.5M19 13 16 5h-2.5v8.5M10.5 16h3" /></>, // binoculars
  'features:mouth': <><rect {...L} x="9" y="3" width="6" height="11" rx="3" /><path {...L} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" /></>, // a microphone
  'features:nose': <><path {...L} d="M8 4l2 2.5 2-3 2 3L16 4v4a4 4 0 0 1-8 0Z" /><path {...L} d="M12 12v9M12 17.5c-2.4 0-3.9-1.4-4.4-3.4 2.4 0 3.9 1.4 4.4 3.4Z" /></>, // a flower
  'features:cheeks': <path {...L} d="M12 19.5S4 14.8 4 9.3A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.3c0 5.5-8 10.2-8 10.2Z" />, // a heart
  'features:hands': <path {...L} d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4a1.5 1.5 0 0 1 3 0v7m0-.5V5.5a1.5 1.5 0 0 1 3 0V14c0 3.8-2.6 6.5-6.2 6.5-2.4 0-4-1.1-5.4-3.2l-2.2-3.5a1.5 1.5 0 0 1 2.5-1.6L8 14" />, // a wave

  /* Eyes */
  'eyes:eyes': <><path {...L} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle {...L} cx="12" cy="12" r="2.5" /></>, // an eye
  gaze: <><circle {...L} cx="12" cy="12" r="9" /><path {...L} d="m15.5 8.5-2 5-5 2 2-5Z" /></>, // a compass
  glasses: <path {...L} d="M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5ZM12 6.5V20" />, // a book
  tears: <><path {...L} d="M7 14.5a3.8 3.8 0 0 1-.4-7.6 5.5 5.5 0 0 1 10.6 1.6 3 3 0 0 1-.2 6Z" /><path {...L} d="m8.5 17.5-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5" /></>, // rain

  /* Features */
  nose: <><path {...L} d="M8 4l2 2.5 2-3 2 3L16 4v4a4 4 0 0 1-8 0Z" /><path {...L} d="M12 12v9M12 17.5c-2.4 0-3.9-1.4-4.4-3.4 2.4 0 3.9 1.4 4.4 3.4Z" /></>, // a flower (smell)
  blush: <path {...L} d="M12 19.5S4 14.8 4 9.3A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.3c0 5.5-8 10.2-8 10.2Z" />, // a heart
  gesture: <path {...L} d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4a1.5 1.5 0 0 1 3 0v7m0-.5V5.5a1.5 1.5 0 0 1 3 0V14c0 3.8-2.6 6.5-6.2 6.5-2.4 0-4-1.1-5.4-3.2l-2.2-3.5a1.5 1.5 0 0 1 2.5-1.6L8 14" />, // a wave

  /* Torso */
  body: <><path {...L} d="M3 15.5 15.5 3 21 8.5 8.5 21Z" /><path {...L} d="m7 11.5 1.5 1.5M10 8.5l1.5 1.5M13 5.5l1.5 1.5" /></>, // a ruler
  'outfit:outfit': <><path {...L} d="M12 7.5a2 2 0 1 1 2-2" /><path {...L} d="M12 7.5V9l-8.6 6.6A1.4 1.4 0 0 0 4.3 18h15.4a1.4 1.4 0 0 0 .9-2.4L12 9" /></>, // a hanger
  outfitColor: <><path {...L} d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.3-1.6-1.3-2.8 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z" /><Dot x={7.5} y={11} /><Dot x={9.5} y={7} /><Dot x={14.5} y={7} /></>, // a palette
  detail: <path {...L} d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />, // a star
};

/* `name` is a category or item key; `group` disambiguates an item that shares its category's name */
export function NavIcon({ name, group, size = 26 }) {
  if (name === 'skin' && !(group && ICONS[`${group}:skin`])) return <ColourWheel size={size} />;
  const art = (group && ICONS[`${group}:${name}`]) || ICONS[name];
  if (!art) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{art}</svg>;
}

/* The colour wheel (Figma "UI/Colour wheel" 44:2): a spectrum ring around a
   white hub. SVG has no conic gradient, so it's drawn with CSS. */
export function ColourWheel({ size = 26 }) {
  return <span className="ab-wheel-icon" style={{ width: size, height: size }} aria-hidden="true"><span /></span>;
}

/* =========================================================================
   Default-toolbar heads (Figma "Avatar builder UI" › 2 · Default toolbar).
   Each tile draws a small head and lights up the part it edits: the face,
   the hair, the hoodie, or the frame (filled with the current background).
   Selected tiles sit on a light tile, so the head turns dark there.
   ========================================================================= */
const HEAD_D = 'M3.058 11.188c-.117 1.219-.138 2.219-.115 3 .027.915.113 1.529.173 1.84l-.253.101c-.975.585-.39 1.95.065 2.991.223.51.462.629.701.748.249.124.497.249.73.812.364.884 1.192 2.016 1.56 2.471 1.328 1.328 2.96 2.032 4.596 2.265 2.321.27 4.942-.333 6.902-2.292.369-.456 1.196-1.587 1.56-2.471.232-.563.481-.688.73-.812.239-.119.478-.238.701-.749.455-1.04 1.04-2.405.065-2.99l-.253-.101c.058-.303.142-.895.17-1.773.027-.79.009-1.813-.112-3.067-.325-3.381-3.511-5.071-6.046-5.721-1.887-.484-3.882-.256-4.814-.047a9 9 0 0 0-.313.074C6.569 6.117 3.383 7.807 3.058 11.188Z';
const HAIR_D = 'M2.973 14.701C2.024 7.743 6.582 4.58 11.01 4.58c2.53-2.214 6.326-2.214 8.54-.632-1.265.316-1.582.949-.633 1.898 2.214 1.898 2.394 5.663 1.445 8.825-.949-3.162-2.394-4.397-4.292-5.03-3.795 1.266-7.59.633-10.121-.632-1.265 1.898-2.343 3.796-2.976 5.692Z';

export function BarIcon({ name, on, fill = '#ffffff' }) {
  // Selected (Figma 63:3599): the part this tile edits in slate, the rest in light grey
  const ink = on ? '#bbbec3' : '#494950'; // the head
  const lit = on ? '#4c525d' : '#a1acaf'; // the part this tile edits
  const dim = on ? '#bbbec3' : '#37373b'; // everything else
  const grad = (
    <defs>
      <linearGradient id="ab-bar-lit" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#444e63" />
        <stop offset="1" stopColor="#b5b5ca" />
      </linearGradient>
    </defs>
  );
  if (name === 'outfit') {
    // The Figma bust, as exported (its head pokes above the 32px box, like the tile)
    return (
      <svg width="30" height="32" viewBox="0 -5 34 37" aria-hidden="true">
        {grad}
        <path fillRule="evenodd" d="M9.393 2.955c-.097 1.015-.114 1.848-.095 2.498.022.761.094 1.272.143 1.531l-.21.084c-.812.487-.325 1.623.054 2.489.186.425.384.524.583.623.207.104.414.207.607.676.303.736.992 1.677 1.299 2.056.523.523 1.103.931 1.714 1.235.678.338 1.394.548 2.111.65 1.474.171 3.094-.08 4.504-.934.437-.265.854-.588 1.241-.974.306-.379.995-1.32 1.298-2.056.193-.469.401-.572.607-.675.199-.1.398-.199.584-.623.379-.866.866-2.002.054-2.489l-.21-.084c.048-.252.117-.745.141-1.476.022-.658.007-1.509-.093-2.553-.271-2.813-2.922-4.22-5.033-4.761-1.57-.403-3.23-.213-4.007-.039a7 7 0 0 0-.26.061C12.315-1.265 9.664.142 9.393 2.955Z" fill={dim} />
        <path d="M9.431 5.88C8.641.088 12.327-2.544 16.012-2.544c2.106-1.843 5.265-1.843 7.108-.527-1.053.264-1.317.79-.527 1.58 1.843 1.58 1.843 4.738 1.053 7.37-.79-2.632-1.843-3.685-3.422-4.211-3.159 1.053-6.318.526-8.424-.527-1.053 1.58-1.842 3.159-2.369 4.739Z" fill={dim} />
        <path fillRule="evenodd" d="M20.103 13.863c-.111.702-.161 1.61.082 2.253-1.546 2.76-5.308 2.806-6.927.136.214-.584.265-1.413.23-2.106.679.338 1.395.549 2.112.65 1.474.172 3.094-.08 4.503-.933Z" fill={on ? '#a3a7ae' : '#313135'} />
        <path d="M3.667 32C1.457 32-.396 30.186.073 28.028 1.53 21.33 6.727 17.6 12.983 15.724c.083.187.175.363.275.528 1.62 2.67 5.381 2.625 6.927-.136.07-.125.136-.256.196-.392 6.256 1.877 11.454 5.605 12.91 12.304.469 2.159-1.384 3.972-3.593 3.972H3.667Z" fill={lit} />
        <path d="M9.284 16.834c-.74 4.809 15.536 4.809 14.796 0-1.48-1.85-3.699-1.85-3.699-1.11-1.48 3.699-5.919 3.699-7.398 0 0-.74-2.22-.74-3.699 1.11Z" fill="#d6dadc" stroke="#151313" strokeWidth="1.295" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.902 21.163l.37 3.439M14.463 21.163l-.37 3.439M10.763 28.301l1.48-2.959h8.878l1.479 2.959" fill="none" stroke="#151313" strokeWidth="1.295" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'frame') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="16" fill={fill} />
        <rect width="32" height="32" rx="16" fill="none" stroke="#000" strokeOpacity=".12" />
        <g transform="translate(6.3 6.3) scale(.8)">
          <path d={HEAD_D} fill="#494950" />
          <path d={HAIR_D} fill="#37373b" />
        </g>
      </svg>
    );
  }
  // face and hair: one head, lit where the tile points
  return (
    <svg width="26" height="30" viewBox="0 0 23 27" aria-hidden="true">
      {grad}
      <path d={HEAD_D} fill={name === 'face' ? lit : ink} />
      <path d={HAIR_D} fill={name === 'hair' ? lit : dim} />
    </svg>
  );
}
